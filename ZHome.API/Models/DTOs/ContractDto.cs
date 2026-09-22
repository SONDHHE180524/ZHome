using System;
using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class CheckInRequestDto
    {
        [Required]
        public long RoomId { get; set; }

        [Required]
        [MaxLength(100)]
        public string TenantFullName { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^0[35789]\d{8}$", ErrorMessage = "Số điện thoại di động không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng số 0 và chữ số thứ 2 là 3, 5, 7, 8 hoặc 9)")]
        public string TenantPhone { get; set; } = string.Empty;

        public string? TenantIdCardNumber { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá thuê phòng phải lớn hơn hoặc bằng 0")]
        public decimal RoomPrice { get; set; }

        public decimal? DepositAmount { get; set; }
        public int? BedsCount { get; set; }
        public string? PaymentCycle { get; set; }
        public decimal? ElectricityUnitPrice { get; set; }
        public string? WaterPricingType { get; set; }
        public decimal? WaterUnitPrice { get; set; }
    }

    public class ContractResponseDto
    {
        public long Id { get; set; }
        public long PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string PropertyAddress { get; set; } = string.Empty;
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public long TenantId { get; set; }
        public string TenantFullName { get; set; } = string.Empty;
        public string TenantPhone { get; set; } = string.Empty;
        public string TenantCccd { get; set; } = string.Empty;
        public string? TenantEmail { get; set; }
        public string? TenantAvatarUrl { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal? DepositAmount { get; set; }
        public decimal? ElectricityUnitPrice { get; set; }
        public string? WaterPricingType { get; set; }
        public decimal? WaterUnitPrice { get; set; }
        public string? PaymentCycle { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class LegalContractDocumentDto
    {
        public long ContractId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public string Status { get; set; } = string.Empty;

        // Party A - Landlord
        public string LandlordFullName { get; set; } = string.Empty;
        public string LandlordPhone { get; set; } = string.Empty;
        public string LandlordCccd { get; set; } = string.Empty;
        public string LandlordEmail { get; set; } = string.Empty;

        // Party B - Tenant
        public string TenantFullName { get; set; } = string.Empty;
        public string TenantPhone { get; set; } = string.Empty;
        public string TenantCccd { get; set; } = string.Empty;

        // Property & Room Info
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string PropertyAddress { get; set; } = string.Empty;
    }
}

