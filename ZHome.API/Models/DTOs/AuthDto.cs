using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class RegisterRequest
    {
        [Required]
        [RegularExpression(@"^0[35789]\d{8}$", ErrorMessage = "Số điện thoại Việt Nam không hợp lệ (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)")]
        public string Phone { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string? Email { get; set; }

        [Required]
        [MinLength(6, ErrorMessage = "Mật khẩu phải từ 6 ký tự trở lên")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Họ tên chỉ được chứa chữ cái và khoảng trắng")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string RoleName { get; set; } = "Tenant"; // Tenant, Landlord

        public string? CccdNumber { get; set; }
        public string? CccdFrontBase64 { get; set; }
        public string? CccdBackBase64 { get; set; }
        public bool SendVerificationRequest { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public long UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? VerificationStatus { get; set; }
        public int? SubscriptionId { get; set; }
    }

    public class UserProfileDto
    {
        public long Id { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int? SubscriptionId { get; set; }
        public System.DateTime? SubscriptionEndDate { get; set; }
    }

    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "Họ và tên không được để trống")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [MaxLength(100)]
        public string? Email { get; set; }

        public string? AvatarBase64 { get; set; }
    }
}
