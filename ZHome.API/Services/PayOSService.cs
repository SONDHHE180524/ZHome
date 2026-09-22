using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZHome.API.Models;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Services
{
    public class PayOSService : IPayOSService
    {
        private readonly PayOSSettings _settings;
        private readonly HttpClient _httpClient;
        private readonly ILogger<PayOSService> _logger;

        public PayOSService(IOptions<PayOSSettings> settings, ILogger<PayOSService> logger)
        {
            _settings = settings.Value;
            _httpClient = new HttpClient();
            _logger = logger;
        }

        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(_settings.ClientId)
                && _settings.ClientId != "YOUR_PAYOS_CLIENT_ID"
                && !string.IsNullOrWhiteSpace(_settings.ApiKey)
                && _settings.ApiKey != "YOUR_PAYOS_API_KEY"
                && !string.IsNullOrWhiteSpace(_settings.ChecksumKey)
                && _settings.ChecksumKey != "YOUR_PAYOS_CHECKSUM_KEY";
        }

        public async Task<PayOSPaymentResponseDto> CreatePaymentLinkAsync(long orderCode, decimal amount, string packageName, int packageId, int months, string userEmail)
        {
            string description = $"ZH{orderCode}";
            string title = $"ZHome {packageName}".Trim();
            if (title.Length > 25) title = title.Substring(0, 25);

            var result = await CreateGenericPayOSPaymentLinkAsync(orderCode, amount, description, title);
            result.PackageName = packageName;
            result.Months = months;
            return result;
        }

        public async Task<PayOSPaymentResponseDto> CreateBillPaymentLinkAsync(long orderCode, decimal amount, long billId, string customDescription, string userEmail)
        {
            string description = !string.IsNullOrWhiteSpace(customDescription) ? customDescription : $"HD{billId}";
            string title = $"Hoa don tro #{billId}";
            if (title.Length > 25) title = title.Substring(0, 25);

            var result = await CreateGenericPayOSPaymentLinkAsync(orderCode, amount, description, title);
            return result;
        }

        private async Task<PayOSPaymentResponseDto> CreateGenericPayOSPaymentLinkAsync(long orderCode, decimal amount, string transferContent, string title)
        {
            int amountInt = (int)Math.Round(amount);

            // If PayOS API credentials are fully configured, call PayOS official API
            if (IsConfigured())
            {
                try
                {
                    string desc = !string.IsNullOrWhiteSpace(transferContent) ? transferContent.Trim() : title.Trim();
                    if (desc.Length > 25) desc = desc.Substring(0, 25);

                    var requestBody = new Dictionary<string, object>
                    {
                        { "orderCode", orderCode },
                        { "amount", amountInt },
                        { "description", desc },
                        { "cancelUrl", _settings.CancelUrl },
                        { "returnUrl", _settings.ReturnUrl }
                    };

                    // Compute signature for PayOS request
                    string signatureDataStr = $"amount={amountInt}&cancelUrl={_settings.CancelUrl}&description={desc}&orderCode={orderCode}&returnUrl={_settings.ReturnUrl}";
                    string signature = CreateHmacSha256Signature(signatureDataStr, _settings.ChecksumKey);
                    requestBody["signature"] = signature;

                    var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests");
                    httpRequest.Headers.Add("x-client-id", _settings.ClientId);
                    httpRequest.Headers.Add("x-api-key", _settings.ApiKey);
                    httpRequest.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(httpRequest);
                    string jsonResponse = await response.Content.ReadAsStringAsync();

                    _logger.LogInformation("PayOS API Response: {Response}", jsonResponse);

                    using var doc = JsonDocument.Parse(jsonResponse);
                    var root = doc.RootElement;
                    string code = root.GetProperty("code").GetString() ?? "";

                    if (code == "00" && root.TryGetProperty("data", out var data))
                    {
                        string checkoutUrl = data.TryGetProperty("checkoutUrl", out var cUrl) ? cUrl.GetString() ?? "" : "";
                        string qrCode = data.TryGetProperty("qrCode", out var qr) ? qr.GetString() ?? "" : "";
                        string accountNo = data.TryGetProperty("accountNumber", out var accNo) ? accNo.GetString() ?? "" : _settings.FallbackAccountNo;
                        string accountName = data.TryGetProperty("accountName", out var accName) ? accName.GetString() ?? "" : _settings.FallbackAccountName;
                        string bin = data.TryGetProperty("bin", out var b) ? b.GetString() ?? "" : "970422";

                        // Check if qrCode is an HTTP or Data URL. If it's a raw EMVCo string payload or empty, build VietQR image URL
                        string qrUrl;
                        if (!string.IsNullOrEmpty(qrCode) && (qrCode.StartsWith("http", StringComparison.OrdinalIgnoreCase) || qrCode.StartsWith("data:", StringComparison.OrdinalIgnoreCase)))
                        {
                            qrUrl = qrCode;
                        }
                        else
                        {
                            qrUrl = GenerateVietQrUrl(_settings.FallbackBankName, accountNo, amountInt, transferContent, accountName);
                        }

                        return new PayOSPaymentResponseDto
                        {
                            OrderCode = orderCode,
                            CheckoutUrl = checkoutUrl,
                            QrCodeUrl = qrUrl,
                            Amount = amount,
                            Description = transferContent,
                            BankName = _settings.FallbackBankName,
                            AccountNo = accountNo,
                            AccountName = accountName,
                            Status = "PENDING",
                            IsMock = false
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error calling PayOS API. Falling back to VietQR Sandbox Mode.");
                }
            }

            // Fallback / Sandbox mode when API keys are not yet configured or on network fallback
            string vietQrUrl = GenerateVietQrUrl(_settings.FallbackBankName, _settings.FallbackAccountNo, amountInt, transferContent, _settings.FallbackAccountName);

            return new PayOSPaymentResponseDto
            {
                OrderCode = orderCode,
                CheckoutUrl = $"{_settings.ReturnUrl}&orderCode={orderCode}",
                QrCodeUrl = vietQrUrl,
                Amount = amount,
                Description = transferContent,
                BankName = _settings.FallbackBankName,
                AccountNo = _settings.FallbackAccountNo,
                AccountName = _settings.FallbackAccountName,
                Status = "PENDING",
                IsMock = true
            };
        }

        public async Task<bool> GetPaymentStatusFromPayOSAsync(long orderCode)
        {
            if (!IsConfigured()) return false;

            try
            {
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"https://api-merchant.payos.vn/v2/payment-requests/{orderCode}");
                httpRequest.Headers.Add("x-client-id", _settings.ClientId);
                httpRequest.Headers.Add("x-api-key", _settings.ApiKey);

                var response = await _httpClient.SendAsync(httpRequest);
                if (!response.IsSuccessStatusCode) return false;

                string jsonResponse = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("PayOS Check Order Response for {OrderCode}: {Response}", orderCode, jsonResponse);

                using var doc = JsonDocument.Parse(jsonResponse);
                var root = doc.RootElement;
                string code = root.GetProperty("code").GetString() ?? "";

                if (code == "00" && root.TryGetProperty("data", out var data))
                {
                    string status = data.TryGetProperty("status", out var st) ? st.GetString() ?? "" : "";
                    decimal amountPaid = data.TryGetProperty("amountPaid", out var ap) ? ap.GetDecimal() : 0;
                    decimal amount = data.TryGetProperty("amount", out var am) ? am.GetDecimal() : 0;

                    if (status.Equals("PAID", StringComparison.OrdinalIgnoreCase) || (amountPaid > 0 && amountPaid >= amount))
                    {
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking PayOS payment status for order {OrderCode}", orderCode);
            }

            return false;
        }

        public bool VerifyWebhookSignature(PayOSWebhookRequestDto webhookData)
        {
            if (webhookData?.Data == null || string.IsNullOrEmpty(webhookData.Signature))
            {
                return false;
            }

            if (!IsConfigured())
            {
                // In sandbox / test mode without keys, consider signature valid for testing
                return true;
            }

            try
            {
                // Sort data keys alphabetically according to PayOS specification
                var data = webhookData.Data;
                var sortedParams = new SortedDictionary<string, string>();

                if (data.Amount > 0) sortedParams["amount"] = ((int)Math.Round(data.Amount)).ToString();
                if (!string.IsNullOrEmpty(data.AccountNumber)) sortedParams["accountNumber"] = data.AccountNumber;
                if (!string.IsNullOrEmpty(data.Description)) sortedParams["description"] = data.Description;
                if (data.OrderCode > 0) sortedParams["orderCode"] = data.OrderCode.ToString();
                if (!string.IsNullOrEmpty(data.PaymentLinkId)) sortedParams["paymentLinkId"] = data.PaymentLinkId;
                if (!string.IsNullOrEmpty(data.Reference)) sortedParams["reference"] = data.Reference;
                if (!string.IsNullOrEmpty(data.Code)) sortedParams["responseCode"] = data.Code;

                string signData = string.Join("&", sortedParams.Select(p => $"{p.Key}={p.Value}"));
                string calculatedSig = CreateHmacSha256Signature(signData, _settings.ChecksumKey);

                return string.Equals(calculatedSig, webhookData.Signature, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying PayOS webhook signature.");
                return false;
            }
        }

        private string GenerateVietQrUrl(string bankName, string accountNo, int amount, string content, string accountName)
        {
            string bankId = bankName;
            if (string.Equals(bankId, "MBBank", StringComparison.OrdinalIgnoreCase) || string.Equals(bankId, "MB Bank", StringComparison.OrdinalIgnoreCase))
            {
                bankId = "MB";
            }
            string encodedContent = Uri.EscapeDataString(content);
            string encodedAccountName = Uri.EscapeDataString(accountName);
            return $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={amount}&addInfo={encodedContent}&accountName={encodedAccountName}";
        }

        private string CreateHmacSha256Signature(string rawData, string secretKey)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(secretKey);
            byte[] rawBytes = Encoding.UTF8.GetBytes(rawData);

            using var hmac = new HMACSHA256(keyBytes);
            byte[] hashBytes = hmac.ComputeHash(rawBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
