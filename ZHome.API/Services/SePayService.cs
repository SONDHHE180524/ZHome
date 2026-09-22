using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZHome.API.Models;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Services
{
    public class SePayService : ISePayService
    {
        private readonly SePaySettings _settings;
        private readonly HttpClient _httpClient;
        private readonly ILogger<SePayService> _logger;

        public SePayService(IOptions<SePaySettings> settings, ILogger<SePayService> logger)
        {
            _settings = settings.Value;
            _httpClient = new HttpClient();
            _logger = logger;
        }

        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(_settings.ApiKey)
                && _settings.ApiKey != "YOUR_SEPAY_API_KEY"
                && !string.IsNullOrWhiteSpace(_settings.AccountNumber);
        }

        public SePayPaymentResponseDto CreatePaymentInfo(long orderCode, decimal amount, string packageName, int packageId, int months, string userEmail)
        {
            string prefix = _settings.BankCode?.Contains("Vietin", StringComparison.OrdinalIgnoreCase) == true ? "SEVQR " : "";
            string description = $"{prefix}ZH{orderCode}";
            var response = BuildPaymentResponse(orderCode, amount, description);
            response.PackageName = packageName;
            response.Months = months;
            return response;
        }

        public SePayPaymentResponseDto CreateBillPaymentInfo(long orderCode, decimal amount, long billId, string customDescription, string userEmail)
        {
            string prefix = _settings.BankCode?.Contains("Vietin", StringComparison.OrdinalIgnoreCase) == true ? "SEVQR " : "";
            string description = !string.IsNullOrWhiteSpace(customDescription) ? customDescription : $"{prefix}HD{billId}";
            return BuildPaymentResponse(orderCode, amount, description);
        }

        private SePayPaymentResponseDto BuildPaymentResponse(long orderCode, decimal amount, string description)
        {
            int amountInt = (int)Math.Round(amount);
            string encodedDes = Uri.EscapeDataString(description);
            string template = !string.IsNullOrWhiteSpace(_settings.QrTemplate) ? _settings.QrTemplate : "compact2";
            string bankCode = !string.IsNullOrWhiteSpace(_settings.BankCode) ? _settings.BankCode.Trim() : "MBBank";
            if (bankCode.Equals("VietTinBank", StringComparison.OrdinalIgnoreCase)) bankCode = "VietinBank";
            if (bankCode.Equals("VietComBank", StringComparison.OrdinalIgnoreCase)) bankCode = "Vietcombank";
            if (bankCode.Equals("Techcom", StringComparison.OrdinalIgnoreCase)) bankCode = "Techcombank";
            if (bankCode.Equals("MB", StringComparison.OrdinalIgnoreCase)) bankCode = "MBBank";

            string accNo = !string.IsNullOrWhiteSpace(_settings.AccountNumber) ? _settings.AccountNumber.Trim() : "0987654321";
            string accName = !string.IsNullOrWhiteSpace(_settings.AccountName) ? _settings.AccountName.Trim() : "DANG HOANG SON";

            // SePay official QR format
            string qrUrl = $"https://qr.sepay.vn/img?acc={accNo}&bank={bankCode}&amount={amountInt}&des={encodedDes}&template={template}";

            return new SePayPaymentResponseDto
            {
                OrderCode = orderCode,
                Amount = amount,
                Description = description,
                BankName = bankCode,
                AccountNo = accNo,
                AccountName = accName,
                QrCodeUrl = qrUrl,
                CheckoutUrl = qrUrl,
                Status = "PENDING",
                IsMock = !IsConfigured()
            };
        }

        public bool VerifyWebhookToken(string? authHeader)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey) || _settings.ApiKey == "YOUR_SEPAY_API_KEY")
            {
                // In sandbox / unconfigured mode, allow testing
                return true;
            }

            if (string.IsNullOrWhiteSpace(authHeader))
            {
                return false;
            }

            string expectedApiKey = _settings.ApiKey.Trim();

            // SePay sends "Apikey <api_key>" or "Bearer <api_key>" or raw token
            string token = authHeader.Replace("Apikey", "", StringComparison.OrdinalIgnoreCase)
                                     .Replace("Bearer", "", StringComparison.OrdinalIgnoreCase)
                                     .Trim();

            return string.Equals(token, expectedApiKey, StringComparison.Ordinal);
        }

        public async Task<bool> CheckTransactionFromSePayAsync(string descriptionPattern, decimal expectedAmount)
        {
            if (!IsConfigured())
            {
                return false;
            }

            try
            {
                string url = $"https://my.sepay.vn/userapi/transactions/list?account_number={_settings.AccountNumber}&limit=50";
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
                // SePay standard auth header
                httpRequest.Headers.Add("Authorization", $"Bearer {_settings.ApiKey}");

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    // Fallback to Apikey header if Bearer failed
                    var fallbackReq = new HttpRequestMessage(HttpMethod.Get, url);
                    fallbackReq.Headers.Add("Authorization", $"Apikey {_settings.ApiKey}");
                    response = await _httpClient.SendAsync(fallbackReq);
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SePay API returned status code {StatusCode}", response.StatusCode);
                    return false;
                }

                string json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                JsonElement txArray;
                if (root.TryGetProperty("transactions", out txArray) && txArray.ValueKind == JsonValueKind.Array)
                {
                    string cleanPattern = (descriptionPattern ?? "").Replace(" ", "").Trim().ToLower();
                    string digitsOnly = Regex.Replace(cleanPattern, @"[^\d]", "");

                    foreach (var tx in txArray.EnumerateArray())
                    {
                        string content = "";
                        if (tx.TryGetProperty("transaction_content", out var cProp) && cProp.ValueKind == JsonValueKind.String)
                        {
                            content += " " + cProp.GetString();
                        }
                        if (tx.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == JsonValueKind.String)
                        {
                            content += " " + codeProp.GetString();
                        }
                        if (tx.TryGetProperty("description", out var dProp) && dProp.ValueKind == JsonValueKind.String)
                        {
                            content += " " + dProp.GetString();
                        }

                        decimal amount = 0;
                        if (tx.TryGetProperty("amount_in", out var aProp))
                        {
                            if (aProp.ValueKind == JsonValueKind.Number)
                            {
                                amount = aProp.GetDecimal();
                            }
                            else if (aProp.ValueKind == JsonValueKind.String)
                            {
                                decimal.TryParse(aProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out amount);
                            }
                        }

                        string cleanContent = content.Replace(" ", "").Trim().ToLower();

                        // Match either clean pattern (e.g. "zh26092208263440" or "hd5") OR long numeric orderCode digits
                        bool patternMatched = false;
                        if (!string.IsNullOrEmpty(cleanPattern) && cleanContent.Contains(cleanPattern))
                        {
                            patternMatched = true;
                        }
                        else if (!string.IsNullOrEmpty(digitsOnly) && digitsOnly.Length >= 8 && cleanContent.Contains(digitsOnly))
                        {
                            patternMatched = true;
                        }

                        if (patternMatched)
                        {
                            // Must pay at least the required amount
                            if (expectedAmount <= 0 || amount >= (expectedAmount - 100))
                            {
                                _logger.LogInformation("Found matching SePay transaction: {Content}, Amount: {Amount}, Expected: {Expected} for pattern {Pattern}", 
                                    content, amount, expectedAmount, descriptionPattern);
                                return true;
                            }
                            else
                            {
                                _logger.LogWarning("Found matching pattern {Pattern} in SePay, but amount {Amount} is less than expected {Expected}", 
                                    descriptionPattern, amount, expectedAmount);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking transactions from SePay API for pattern {Pattern}", descriptionPattern);
            }

            return false;
        }
    }
}
