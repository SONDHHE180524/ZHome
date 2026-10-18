using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.Entities;
using ZHome.API.Services;
using Microsoft.Extensions.Caching.Memory;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly TokenService _tokenService;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _environment;
        private readonly Services.INotificationService _notificationService;
        private readonly Services.IMediaStorageService _mediaStorage;
        private readonly Services.IEmailService _emailService;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _memoryCache;

        public AuthController(
            ZHomeDbContext context, 
            TokenService tokenService, 
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment,
            Services.INotificationService notificationService,
            Services.IMediaStorageService mediaStorage,
            Services.IEmailService emailService,
            Microsoft.Extensions.Caching.Memory.IMemoryCache memoryCache)
        {
            _context = context;
            _tokenService = tokenService;
            _environment = environment;
            _notificationService = notificationService;
            _mediaStorage = mediaStorage;
            _emailService = emailService;
            _memoryCache = memoryCache;
        }

        [HttpPost("send-otp")]
        [EnableRateLimiting("RegisterRateLimit")]
        public async Task<IActionResult> SendRegistrationOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email))
            {
                return BadRequest("Địa chỉ email không đúng định dạng. Vui lòng nhập email thật chính xác.");
            }

            var cleanEmail = request.Email.Trim().ToLower();

            // Kiểm tra trùng email
            if (await _context.Users.AnyAsync(u => u.Email != null && u.Email.ToLower() == cleanEmail))
            {
                return BadRequest("Địa chỉ email này đã được sử dụng bởi một tài khoản khác.");
            }

            // Kiểm tra trước số điện thoại nếu có
            if (!string.IsNullOrWhiteSpace(request.Phone))
            {
                var cleanPhone = request.Phone.Trim();
                if (await _context.Users.AnyAsync(u => u.Phone == cleanPhone))
                {
                    return BadRequest("Số điện thoại này đã được sử dụng bởi tài khoản khác.");
                }
            }

            // Sinh mã OTP 6 chữ số
            string otpCode = Random.Shared.Next(100000, 999999).ToString();

            // Lưu vào cache 5 phút
            var cacheKey = $"reg_otp_{cleanEmail}";
            _memoryCache.Set(cacheKey, otpCode, TimeSpan.FromMinutes(5));

            // Template Email HTML ZHome chuyên nghiệp
            string subject = $"ZHome - Mã xác thực đăng ký tài khoản: {otpCode}";
            string bodyHtml = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;"">
                <div style=""background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #3b82f6;"">
                    <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;"">ZHome</h1>
                    <p style=""color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;"">Nền tảng Quản lý Nhà trọ & Tìm ở ghép Thông minh</p>
                </div>
                <div style=""padding: 32px 28px; color: #334155; line-height: 1.6;"">
                    <h2 style=""color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 12px;"">Xác nhận đăng ký tài khoản</h2>
                    <p style=""font-size: 15px; margin-bottom: 20px;"">Xin chào,<br/>Bạn đang thực hiện đăng ký tài khoản mới trên hệ thống ZHome. Dưới đây là mã xác thực (OTP) dành cho bạn:</p>
                    
                    <div style=""background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 22px; text-align: center; margin: 26px 0;"">
                        <span style=""display: block; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 8px;"">MÃ XÁC THỰC EMAIL CỦA BẠN</span>
                        <span style=""font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8;"">{otpCode}</span>
                        <span style=""display: block; font-size: 13px; color: #e11d48; margin-top: 10px; font-weight: 500;"">⏱️ Mã có hiệu lực trong vòng 5 phút</span>
                    </div>

                    <p style=""font-size: 14px; color: #64748b; margin-bottom: 6px;""><strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã xác thực này cho người khác. ZHome không bao giờ yêu cầu bạn cung cấp mã xác nhận qua điện thoại hoặc tin nhắn.</p>
                    <p style=""font-size: 14px; color: #64748b; margin-top: 0;"">Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email này.</p>
                </div>
                <div style=""background: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;"">
                    <p style=""margin: 0;"">© {DateTime.Now.Year} ZHome Platform. Mọi quyền được bảo lưu.</p>
                    <p style=""margin: 4px 0 0 0;"">Email tự động, vui lòng không phản hồi thư này.</p>
                </div>
            </div>";

            var (sent, errorMsg) = await _emailService.SendEmailAsync(cleanEmail, subject, bodyHtml);
            if (!sent)
            {
                return BadRequest($"Không thể gửi mã xác nhận đến email {cleanEmail}: {errorMsg}. Vui lòng kiểm tra lại email hoặc thử lại sau!");
            }

            return Ok(new
            {
                message = $"Mã xác thực 6 chữ số đã được gửi tới email {cleanEmail}. Vui lòng mở hộp thư đến (hoặc hòm thư Spam/Rác) để lấy mã xác nhận!",
                email = cleanEmail
            });
        }

        [HttpPost("register")]
        [EnableRateLimiting("RegisterRateLimit")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(request.Phone, @"^0[35789]\d{8}$"))
            {
                return BadRequest("Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số, bắt đầu bằng số 0 và chữ số tiếp theo là 3, 5, 7, 8 hoặc 9.");
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email))
            {
                return BadRequest("Vui lòng cung cấp địa chỉ email thật và hợp lệ để kích hoạt tài khoản.");
            }

            if (string.IsNullOrWhiteSpace(request.OtpCode))
            {
                return BadRequest("Vui lòng nhập mã xác thực email 6 chữ số.");
            }

            var cleanEmail = request.Email.Trim().ToLower();

            // Xác thực mã OTP trong Cache
            var cacheKey = $"reg_otp_{cleanEmail}";
            if (!_memoryCache.TryGetValue(cacheKey, out string? cachedOtp) || string.IsNullOrEmpty(cachedOtp))
            {
                return BadRequest("Mã xác thực email đã hết hạn hoặc chưa được gửi. Vui lòng nhấn 'Gửi lại mã' để nhận mã mới.");
            }

            if (!string.Equals(cachedOtp.Trim(), request.OtpCode.Trim(), StringComparison.Ordinal))
            {
                return BadRequest("Mã xác thực email không chính xác. Vui lòng kiểm tra lại email của bạn.");
            }

            // BẢO MẬT: Tuyệt đối cấm người dùng tự cấp quyền Administrator qua cổng đăng ký công khai!
            var requestedRole = request.RoleName?.Trim() ?? "Tenant";
            if (requestedRole.Equals("Administrator", StringComparison.OrdinalIgnoreCase) || 
                requestedRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                requestedRole.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Không được phép đăng ký vai trò Quản trị viên qua cổng đăng ký công khai.");
            }

            // Chỉ cho phép đăng ký 2 vai trò: Landlord (Chủ trọ) hoặc Tenant (Người thuê)
            string targetRoleName = requestedRole.Equals("Landlord", StringComparison.OrdinalIgnoreCase) ? "Landlord" : "Tenant";

            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone))
            {
                return BadRequest("Số điện thoại này đã được sử dụng.");
            }

            if (await _context.Users.AnyAsync(u => u.Email != null && u.Email.ToLower() == cleanEmail))
            {
                return BadRequest("Email này đã được đăng ký.");
            }

            // Xóa mã OTP sau khi kiểm tra hợp lệ
            _memoryCache.Remove(cacheKey);

            // Find matching role in db
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName.ToLower() == targetRoleName.ToLower());
            if (role == null)
            {
                return BadRequest($"Vai trò '{targetRoleName}' không hợp lệ trên hệ thống.");
            }

            bool isLandlord = targetRoleName.Equals("Landlord", StringComparison.OrdinalIgnoreCase);

            if (isLandlord)
            {
                if (string.IsNullOrWhiteSpace(request.CccdNumber))
                {
                    return BadRequest("Số CCCD bắt buộc phải điền.");
                }
                if (string.IsNullOrWhiteSpace(request.CccdFrontBase64))
                {
                    return BadRequest("Ảnh mặt trước CCCD bắt buộc phải tải lên.");
                }
                if (string.IsNullOrWhiteSpace(request.CccdBackBase64))
                {
                    return BadRequest("Ảnh mặt sau CCCD bắt buộc phải tải lên.");
                }

                // Chống DoS: Giới hạn dung lượng ảnh Base64 (tối đa ~5MB mỗi ảnh, ~7 triệu ký tự)
                if (request.CccdFrontBase64.Length > 7_000_000 || request.CccdBackBase64.Length > 7_000_000)
                {
                    return BadRequest("Dung lượng ảnh CCCD vượt quá giới hạn cho phép (tối đa 5MB mỗi ảnh).");
                }
            }

            string? frontUrl = null;
            string? backUrl = null;

            if (isLandlord)
            {
                try
                {
                    frontUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdFrontBase64!, "cards", "cccd_front", request.Phone);
                    backUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdBackBase64!, "cards", "cccd_back", request.Phone);
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu hình ảnh CCCD: " + ex.Message);
                }
            }

            var user = new User
            {
                Phone = request.Phone,
                Email = request.Email,
                FullName = request.FullName,
                RoleId = role.Id,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CccdNumber = isLandlord ? request.CccdNumber : null,
                CccdFrontUrl = frontUrl,
                CccdBackUrl = backUrl,
                VerificationStatus = isLandlord ? "Pending" : "Approved",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Gửi thông báo ngay cho Admin khi có Chủ trọ mới đăng ký chờ duyệt
            if (isLandlord)
            {
                await _notificationService.NotifyAdminsAsync(
                    title: "Yêu cầu xét duyệt chủ trọ mới",
                    message: $"Chủ trọ {user.FullName} ({user.Phone}) vừa đăng ký tài khoản. Vui lòng kiểm tra và phê duyệt hồ sơ!",
                    type: "LandlordVerification",
                    targetUrl: "/admin/verifications",
                    referenceId: user.Id
                );
            }

            return Ok(new 
            { 
                message = isLandlord 
                    ? "Đăng ký tài khoản Chủ trọ thành công! Tài khoản của bạn đang chờ Quản trị viên xét duyệt trước khi có thể đăng nhập." 
                    : "Đăng ký tài khoản người thuê thành công!" 
            });
        }

        private string SaveBase64Image(string base64String, string prefix, string phone)
        {
            if (string.IsNullOrEmpty(base64String)) return string.Empty;

            var base64Data = base64String;
            string extension = ".png";

            if (base64String.Contains(","))
            {
                var parts = base64String.Split(',');
                var header = parts[0];
                base64Data = parts[1];

                if (header.Contains("image/jpeg") || header.Contains("image/jpg")) extension = ".jpg";
                else if (header.Contains("image/webp")) extension = ".webp";
                else if (header.Contains("image/gif")) extension = ".gif";
                else if (header.Contains("image/png")) extension = ".png";
            }

            byte[] imageBytes = Convert.FromBase64String(base64Data);
            
            var webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = System.IO.Path.Combine(_environment.ContentRootPath, "wwwroot");
            }
            var directoryPath = System.IO.Path.Combine(webRootPath, "media", "cards");
            if (!System.IO.Directory.Exists(directoryPath))
            {
                System.IO.Directory.CreateDirectory(directoryPath);
            }

            string fileName = $"{prefix}_{phone}_{DateTime.UtcNow.Ticks}{extension}";
            var filePath = System.IO.Path.Combine(directoryPath, fileName);
            System.IO.File.WriteAllBytes(filePath, imageBytes);

            return $"/media/cards/{fileName}";
        }

        [HttpPost("login")]
        [EnableRateLimiting("LoginRateLimit")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var identifier = request.Phone?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return BadRequest("Vui lòng nhập Số điện thoại hoặc Email để đăng nhập.");
            }

            bool isEmail = identifier.Contains("@");
            if (isEmail)
            {
                if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(identifier))
                {
                    return BadRequest("Địa chỉ email không đúng định dạng.");
                }
            }
            else
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(identifier, @"^0[35789]\d{8}$"))
                {
                    return BadRequest("Số điện thoại không hợp lệ. Phải gồm 10 chữ số, bắt đầu bằng số 0 và chữ số tiếp theo là 3, 5, 7, 8 hoặc 9.");
                }
            }

            var cleanIdentifier = identifier.ToLower();
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => isEmail 
                    ? (u.Email != null && u.Email.ToLower() == cleanIdentifier)
                    : u.Phone == identifier);

            if (user == null)
            {
                return Unauthorized("Số điện thoại / Email hoặc mật khẩu không chính xác.");
            }

            // Kiểm tra mật khẩu
            bool isPasswordCorrect = false;
            try
            {
                isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            }
            catch (Exception)
            {
                isPasswordCorrect = false;
            }

            if (!isPasswordCorrect)
            {
                return Unauthorized("Số điện thoại hoặc mật khẩu không chính xác.");
            }

            // KIỂM TRA DUYỆT CHỦ TRỌ: Chủ trọ bắt buộc phải được Admin duyệt mới được vào hệ thống
            if (user.Role != null && user.Role.RoleName.Equals("Landlord", StringComparison.OrdinalIgnoreCase))
            {
                if (user.VerificationStatus == "Pending" || string.IsNullOrEmpty(user.VerificationStatus) || user.VerificationStatus == "None")
                {
                    return BadRequest("Tài khoản của bạn đang chờ xét duyệt. Quản trị viên ZHome đang kiểm tra hồ sơ của bạn, vui lòng quay lại sau!");
                }

                if (user.VerificationStatus == "Rejected")
                {
                    return BadRequest("Tài khoản Chủ trọ của bạn đã bị từ chối xét duyệt. Vui lòng liên hệ Quản trị viên ZHome để được hỗ trợ.");
                }
            }

            // Cập nhật thời gian hoạt động và ghi nhận lịch sử đăng nhập
            user.LastLoginAt = DateTime.UtcNow;
            user.LastActiveAt = DateTime.UtcNow;

            try
            {
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var userAgent = Request.Headers["User-Agent"].ToString();
                if (userAgent.Length > 250) userAgent = userAgent.Substring(0, 250);

                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = user.Id,
                    UserName = user.FullName,
                    UserRole = user.Role?.RoleName ?? "Tenant",
                    Action = "Đăng nhập",
                    Description = $"Đăng nhập thành công vào hệ thống ZHome",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    CreatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ActivityLog Warning] {ex.Message}");
            }

            await _context.SaveChangesAsync();

            var token = _tokenService.CreateToken(user);

            return Ok(new LoginResponse
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Role = user.Role?.RoleName ?? "Tenant",
                Phone = user.Phone,
                Email = user.Email,
                VerificationStatus = user.VerificationStatus,
                SubscriptionId = user.SubscriptionId
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.SubscriptionPackage)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            // Check if subscription has expired and reset to Free plan
            if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value < DateTime.UtcNow)
            {
                user.SubscriptionId = 1;
                user.SubscriptionEndDate = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Phone = user.Phone,
                Email = user.Email,
                FullName = user.FullName,
                RoleName = user.Role?.RoleName ?? "Tenant",
                AvatarUrl = user.AvatarUrl,
                CccdNumber = user.CccdNumber,
                VerificationStatus = user.VerificationStatus ?? "Unverified",
                CreatedAt = user.CreatedAt,
                SubscriptionId = user.SubscriptionId,
                SubscriptionName = user.SubscriptionPackage?.Name ?? (user.SubscriptionId == 2 ? "Gói Cơ Bản" : (user.SubscriptionId == 3 ? "Gói Nâng Cao" : "Gói Miễn Phí")),
                SubscriptionEndDate = user.SubscriptionEndDate,
                BankName = user.BankName,
                BankAccountNumber = user.BankAccountNumber,
                BankAccountName = user.BankAccountName,
                BankQrUrl = user.BankQrUrl,
                CccdFrontUrl = user.CccdFrontUrl,
                CccdBackUrl = user.CccdBackUrl
            });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.SubscriptionPackage)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId))
                {
                    return BadRequest("Email này đã được sử dụng bởi người dùng khác.");
                }
            }

            user.FullName = request.FullName;
            user.Email = request.Email;
            if (!string.IsNullOrWhiteSpace(request.CccdNumber))
            {
                user.CccdNumber = request.CccdNumber;
            }

            // Cập nhật CCCD mặt trước & mặt sau
            bool cccdUpdated = false;
            if (!string.IsNullOrEmpty(request.CccdFrontBase64) && request.CccdFrontBase64.StartsWith("data:image"))
            {
                try
                {
                    user.CccdFrontUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdFrontBase64, "cards", "cccd_front", user.Phone);
                    cccdUpdated = true;
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh mặt trước CCCD: " + ex.Message);
                }
            }

            if (!string.IsNullOrEmpty(request.CccdBackBase64) && request.CccdBackBase64.StartsWith("data:image"))
            {
                try
                {
                    user.CccdBackUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdBackBase64, "cards", "cccd_back", user.Phone);
                    cccdUpdated = true;
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh mặt sau CCCD: " + ex.Message);
                }
            }

            if (cccdUpdated && user.Role?.RoleName == "Landlord" && user.VerificationStatus != "Approved")
            {
                user.VerificationStatus = "Pending";
            }

            user.BankName = request.BankName;
            user.BankAccountNumber = request.BankAccountNumber;
            user.BankAccountName = request.BankAccountName;

            if (!string.IsNullOrEmpty(request.BankQrBase64))
            {
                if (request.BankQrBase64.StartsWith("data:image"))
                {
                    try
                    {
                        var qrUrl = await _mediaStorage.SaveBase64ImageAsync(request.BankQrBase64, "cards", "bank_qr", user.Phone);
                        user.BankQrUrl = qrUrl;
                    }
                    catch (Exception ex)
                    {
                        return BadRequest("Không thể lưu ảnh mã QR ngân hàng: " + ex.Message);
                    }
                }
                else
                {
                    user.BankQrUrl = request.BankQrBase64;
                }
            }

            user.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(request.AvatarBase64) && request.AvatarBase64.StartsWith("data:image"))
            {
                try
                {
                    var avatarUrl = await _mediaStorage.SaveBase64ImageAsync(request.AvatarBase64, "cards", "avatar", user.Phone);
                    user.AvatarUrl = avatarUrl;
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh đại diện: " + ex.Message);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Phone = user.Phone,
                Email = user.Email,
                FullName = user.FullName,
                RoleName = user.Role?.RoleName ?? "Tenant",
                AvatarUrl = user.AvatarUrl,
                CccdNumber = user.CccdNumber,
                VerificationStatus = user.VerificationStatus ?? "Unverified",
                CreatedAt = user.CreatedAt,
                SubscriptionId = user.SubscriptionId,
                SubscriptionName = user.SubscriptionPackage?.Name ?? (user.SubscriptionId == 2 ? "Gói Cơ Bản" : (user.SubscriptionId == 3 ? "Gói Nâng Cao" : "Gói Miễn Phí")),
                SubscriptionEndDate = user.SubscriptionEndDate,
                BankName = user.BankName,
                BankAccountNumber = user.BankAccountNumber,
                BankAccountName = user.BankAccountName,
                BankQrUrl = user.BankQrUrl,
                CccdFrontUrl = user.CccdFrontUrl,
                CccdBackUrl = user.CccdBackUrl
            });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("Người dùng không tồn tại.");

            bool isOldCorrect = false;
            if (user.PasswordHash == request.OldPassword) isOldCorrect = true;
            else
            {
                try { isOldCorrect = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash); }
                catch { isOldCorrect = false; }
            }

            if (!isOldCorrect) return BadRequest("Mật khẩu hiện tại không chính xác.");

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest("Mật khẩu mới phải có ít nhất 6 ký tự.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thay đổi mật khẩu thành công!" });
        }
    }
}
