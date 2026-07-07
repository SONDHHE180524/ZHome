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
        [RegularExpression(@"^0[35789]\d{8}$", ErrorMessage = "Số điện thoại không hợp lệ")]
        public string TenantPhone { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^(\d{9}|\d{12})$", ErrorMessage = "CCCD/CMND không hợp lệ (phải gồm 9 hoặc 12 chữ số)")]
        public string TenantIdCardNumber { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá thuê phòng phải lớn hơn hoặc bằng 0")]
        public decimal RoomPrice { get; set; }
    }

    public class ContractResponseDto
    {
        public long Id { get; set; }
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        public long TenantId { get; set; }
        public string TenantFullName { get; set; } = string.Empty;
        public string TenantPhone { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RoomPrice { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
