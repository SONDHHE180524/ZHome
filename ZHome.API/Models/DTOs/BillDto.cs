using System;
using System.Collections.Generic;

namespace ZHome.API.Models.DTOs
{
    public class BillResponseDto
    {
        public long Id { get; set; }
        public long RoomId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public string TenantPhone { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        
        public int BillingMonth { get; set; }
        public int BillingYear { get; set; }
        public decimal RoomFee { get; set; }
        
        public decimal ElectricityOldReading { get; set; }
        public decimal ElectricityNewReading { get; set; }
        public decimal ElectricityFee { get; set; }
        
        public decimal WaterOldReading { get; set; }
        public decimal WaterNewReading { get; set; }
        public decimal WaterFee { get; set; }
        
        public decimal ServiceFee { get; set; }
        public decimal RepairDeduction { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount => TotalAmount - PaidAmount;
        public string Status { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }

        public List<BillTransactionDto> Transactions { get; set; } = new();
    }

    public class BillTransactionDto
    {
        public long Id { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Note { get; set; }
    }

    public class BillPayDto
    {
        public long BillId { get; set; }
    }
}
