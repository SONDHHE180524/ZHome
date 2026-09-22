using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZHome.API.Models.DTOs
{
    public class CreatePayOSPaymentRequestDto
    {
        [Required]
        public int PackageId { get; set; }

        public int Months { get; set; } = 1;
    }

    public class CreateBillPayOSPaymentRequestDto
    {
        [Required]
        public long BillId { get; set; }

        [Required]
        public decimal Amount { get; set; }
    }

    public class PayOSPaymentResponseDto
    {
        public long OrderCode { get; set; }
        public string CheckoutUrl { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string BankName { get; set; } = "MBBank";
        public string AccountNo { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string Status { get; set; } = "PENDING";
        public string PackageName { get; set; } = string.Empty;
        public int Months { get; set; } = 1;
        public bool IsMock { get; set; } = false;
    }

    public class PayOSWebhookDataDto
    {
        [JsonPropertyName("orderCode")]
        public long OrderCode { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("accountNumber")]
        public string? AccountNumber { get; set; }

        [JsonPropertyName("reference")]
        public string? Reference { get; set; }

        [JsonPropertyName("transactionDateTime")]
        public string? TransactionDateTime { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "VND";

        [JsonPropertyName("paymentLinkId")]
        public string? PaymentLinkId { get; set; }

        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("desc")]
        public string? Desc { get; set; }

        [JsonPropertyName("counterAccountBankId")]
        public string? CounterAccountBankId { get; set; }

        [JsonPropertyName("counterAccountBankName")]
        public string? CounterAccountBankName { get; set; }

        [JsonPropertyName("counterAccountName")]
        public string? CounterAccountName { get; set; }

        [JsonPropertyName("counterAccountNumber")]
        public string? CounterAccountNumber { get; set; }

        [JsonPropertyName("virtualAccountName")]
        public string? VirtualAccountName { get; set; }

        [JsonPropertyName("virtualAccountNumber")]
        public string? VirtualAccountNumber { get; set; }
    }

    public class PayOSWebhookRequestDto
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("desc")]
        public string Desc { get; set; } = string.Empty;

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public PayOSWebhookDataDto? Data { get; set; }

        [JsonPropertyName("signature")]
        public string Signature { get; set; } = string.Empty;
    }

    public class OrderStatusResponseDto
    {
        public long OrderCode { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING, PAID, CANCELLED
        public bool IsPaid { get; set; }
        public int PackageId { get; set; }
        public string PackageName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
