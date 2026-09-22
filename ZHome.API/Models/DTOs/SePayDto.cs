using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZHome.API.Models.DTOs
{
    public class CreateSePayPaymentRequestDto
    {
        [Required]
        public int PackageId { get; set; }

        public int Months { get; set; } = 1;
    }

    public class CreateBillSePayPaymentRequestDto
    {
        [Required]
        public long BillId { get; set; }

        [Required]
        public decimal Amount { get; set; }
    }

    public class SePayPaymentResponseDto
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

    public class SePayWebhookDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("gateway")]
        public string? Gateway { get; set; }

        [JsonPropertyName("transactionDate")]
        public string? TransactionDate { get; set; }

        [JsonPropertyName("accountNumber")]
        public string? AccountNumber { get; set; }

        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("transferType")]
        public string? TransferType { get; set; } // in / out

        [JsonPropertyName("transferAmount")]
        public decimal TransferAmount { get; set; }

        [JsonPropertyName("accumulated")]
        public decimal Accumulated { get; set; }

        [JsonPropertyName("subAccount")]
        public string? SubAccount { get; set; }

        [JsonPropertyName("referenceCode")]
        public string? ReferenceCode { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }
}
