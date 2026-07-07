using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.Entities;
using ZHome.API.Services;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly TokenService _tokenService;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _environment;

        public AuthController(ZHomeDbContext context, TokenService tokenService, Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment)
        {
            _context = context;
            _tokenService = tokenService;
            _environment = environment;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone))
            {
                return BadRequest("Số điện thoại này đã được sử dụng.");
            }

            if (!string.IsNullOrEmpty(request.Email) && await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email này đã được đăng ký.");
            }

            // Find matching role in db
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName.ToLower() == request.RoleName.ToLower());
            if (role == null)
            {
                return BadRequest($"Vai trò '{request.RoleName}' không hợp lệ.");
            }

            bool isLandlord = request.RoleName.Equals("Landlord", StringComparison.OrdinalIgnoreCase);

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
            }

            string? frontUrl = null;
            string? backUrl = null;

            if (isLandlord)
            {
                try
                {
                    frontUrl = SaveBase64Image(request.CccdFrontBase64!, "cccd_front", request.Phone);
                    backUrl = SaveBase64Image(request.CccdBackBase64!, "cccd_back", request.Phone);
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
                VerificationStatus = isLandlord && request.SendVerificationRequest ? "Pending" : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký tài khoản thành công!" });
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

                if (header.Contains("image/jpeg")) extension = ".jpg";
                else if (header.Contains("image/webp")) extension = ".webp";
                else if (header.Contains("image/gif")) extension = ".gif";
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
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Phone == request.Phone);

            if (user == null)
            {
                return Unauthorized("Số điện thoại hoặc mật khẩu không chính xác.");
            }

            // Check if subscription has expired and reset to Free plan
            if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value < DateTime.UtcNow)
            {
                user.SubscriptionId = 1; // Free package ID
                user.SubscriptionEndDate = null;
                await _context.SaveChangesAsync();
            }

            bool isPasswordCorrect = false;
            if (user.PasswordHash == request.Password)
            {
                isPasswordCorrect = true;
            }
            else
            {
                try
                {
                    isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                }
                catch (BCrypt.Net.SaltParseException)
                {
                    isPasswordCorrect = false;
                }
            }

            if (!isPasswordCorrect)
            {
                return Unauthorized("Số điện thoại hoặc mật khẩu không chính xác.");
            }

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
                SubscriptionId = user.SubscriptionId,
                SubscriptionEndDate = user.SubscriptionEndDate
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
            user.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(request.AvatarBase64))
            {
                try
                {
                    var avatarUrl = SaveBase64Image(request.AvatarBase64, "avatar", user.Phone);
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
                AvatarUrl = user.AvatarUrl
            });
        }
    }
}
