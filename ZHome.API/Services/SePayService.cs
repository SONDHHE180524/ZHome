using System;
using System.Collections.Generic;
using System.Globalization;
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
            string bankCode = !string.IsNullOrWhiteSpace(_settings.BankCode) ? _settings.BankCode.Trim() : "VietinBank";
            if (bankCode.Equals("VietTinBank", StringComparison.OrdinalIgnoreCase)) bankCode = "VietinBank";
            if (bankCode.Equals("VietComBank", StringComparison.OrdinalIgnoreCase)) bankCode = "Vietcombank";
            if (bankCode.Equals("Techcom", StringComparison.OrdinalIgnoreCase)) bankCode = "Techcombank";
            if (bankCode.Equals("MB", StringComparison.OrdinalIgnoreCase)) bankCode = "MBBank";

            string accNo = !string.IsNullOrWhiteSpace(_settings.AccountNumber) ? _settings.AccountNumber.Trim() : "888819661666";
            string accName = !string.IsNullOrWhiteSpace(_settings.AccountName) ? _settings.AccountName.Trim() : "NGUYEN THANH TUNG";

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
                                decimal.TryParse(aProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out amount);
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

        public async Task<List<SystemSubscriptionTransactionDto>> GetSystemSubscriptionTransactionsAsync(bool currentMonthOnly = true)
        {
            var list = new List<SystemSubscriptionTransactionDto>();
            if (!IsConfigured())
            {
                return list;
            }

            try
            {
                string url = $"https://my.sepay.vn/userapi/transactions/list?account_number={_settings.AccountNumber}&limit=100";
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
                httpRequest.Headers.Add("Authorization", $"Bearer {_settings.ApiKey}");

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode)
                {
                    var fallbackReq = new HttpRequestMessage(HttpMethod.Get, url);
                    fallbackReq.Headers.Add("Authorization", $"Apikey {_settings.ApiKey}");
                    response = await _httpClient.SendAsync(fallbackReq);
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SePay API returned status code {StatusCode} when getting system transactions", response.StatusCode);
                    return list;
                }

                string json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.TryGetProperty("transactions", out var txArray) && txArray.ValueKind == JsonValueKind.Array)
                {
                    var now = DateTime.Now;
                    var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0);

                    foreach (var tx in txArray.EnumerateArray())
                    {
                        decimal amountIn = 0;
                        if (tx.TryGetProperty("amount_in", out var aProp))
                        {
                            if (aProp.ValueKind == JsonValueKind.Number)
                            {
                                amountIn = aProp.GetDecimal();
                            }
                            else if (aProp.ValueKind == JsonValueKind.String)
                            {
                                decimal.TryParse(aProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out amountIn);
                            }
                        }

                        if (amountIn <= 0) continue;

                        string content = tx.TryGetProperty("transaction_content", out var cProp) ? cProp.GetString() ?? "" : "";
                        string refNo = tx.TryGetProperty("reference_number", out var rProp) ? rProp.GetString() ?? "" : "";
                        string txId = tx.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                        string bank = tx.TryGetProperty("bank_brand_name", out var bProp) ? bProp.GetString() ?? "VietinBank" : "VietinBank";
                        string accNo = tx.TryGetProperty("account_number", out var accProp) ? accProp.GetString() ?? _settings.AccountNumber ?? "888819661666" : _settings.AccountNumber ?? "888819661666";

                        DateTime txDate = DateTime.Now;
                        if (tx.TryGetProperty("transaction_date", out var dProp) && DateTime.TryParse(dProp.GetString(), out var parsedDate))
                        {
                            txDate = parsedDate;
                        }

                        // Check if it's a subscription transaction (ZH prefix or SEVQR)
                        bool isSubscription = content.Contains("ZH", StringComparison.OrdinalIgnoreCase) || content.Contains("SEVQR", StringComparison.OrdinalIgnoreCase);
                        if (!isSubscription) continue;

                        // Bỏ qua giao dịch chuyển nhầm theo yêu cầu của Admin (chỉ giữ đúng 2 giao dịch 199k)
                        if (txId == "95852409" || refNo == "106T26B043KBE6WY")
                        {
                            continue;
                        }

                        // "chỉ tính từ đầu tháng này thôi"
                        if (currentMonthOnly && txDate < startOfMonth)
                        {
                            continue;
                        }

                        // Extract OrderCode
                        var match = Regex.Match(content, @"ZH\s*(\d+)", RegexOptions.IgnoreCase);
                        string orderCode = match.Success ? $"ZH{match.Groups[1].Value}" : "";

                        // Determine Package
                        string packageName = "Gói Nâng Cao";
                        if (amountIn == 99000m) packageName = "Gói Cơ Bản (50 phòng)";
                        else if (amountIn == 199000m) packageName = "Gói Nâng Cao (150 phòng)";
                        else packageName = $"Gói Dịch Vụ Nền Tảng ({amountIn:N0} đ)";

                        list.Add(new SystemSubscriptionTransactionDto
                        {
                            TransactionId = txId,
                            ReferenceNumber = refNo,
                            OrderCode = orderCode,
                            PayerName = "Chủ trọ hệ thống",
                            PayerPhone = "Chuyển khoản SePay",
                            PackageName = packageName,
                            Amount = amountIn,
                            BankBrandName = bank,
                            AccountNumber = accNo,
                            TransactionContent = content,
                            TransactionDate = txDate,
                            Status = "Thành công",
                            TransactionType = "Gia hạn gói dịch vụ chủ trọ"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách giao dịch từ SePay API");
            }

            return list;
        }
    }
}
