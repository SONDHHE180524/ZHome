using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [RegularExpression(@"^0[35789]\d{8}$", ErrorMessage = "Số điện thoại di động không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng số 0 và chữ số thứ 2 là 3, 5, 7, 8 hoặc 9)")]
        public string Phone { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải từ 6 ký tự trở lên")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ và tên không được để trống")]
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
        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [RegularExpression(@"^0[35789]\d{8}$", ErrorMessage = "Số điện thoại di động không hợp lệ (phải gồm 10 chữ số, bắt đầu bằng số 0 và chữ số thứ 2 là 3, 5, 7, 8 hoặc 9)")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
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
        public string? CccdNumber { get; set; }
        public string? VerificationStatus { get; set; }
        public System.DateTime CreatedAt { get; set; }
        public int? SubscriptionId { get; set; }
        public string? SubscriptionName { get; set; }
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

        public string? CccdNumber { get; set; }
        public string? AvatarBase64 { get; set; }
    }

    public class ChangePasswordRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại")]
        public string OldPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
