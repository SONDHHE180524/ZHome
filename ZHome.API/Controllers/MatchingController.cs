using System;
using System.Collections.Generic;
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
    public class MatchingController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly MatchingService _matchingService;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _environment;

        public MatchingController(ZHomeDbContext context, MatchingService matchingService, Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment)
        {
            _context = context;
            _matchingService = matchingService;
            _environment = environment;
        }

        // Public endpoint to list all active roommate listings (Sàn Đăng Bài Tìm Ở Ghép)
        [AllowAnonymous]
        [HttpGet("posts")]
        public async Task<IActionResult> GetPublicPosts([FromQuery] string? university, [FromQuery] bool? hasRoom, [FromQuery] string? gender, [FromQuery] decimal? maxPrice, [FromQuery] string? search)
        {
            IQueryable<MatchingProfile> query = _context.MatchingProfiles
                .AsNoTracking()
                .Include(p => p.Student)
                .Where(p => p.IsActive == true);

            if (!string.IsNullOrWhiteSpace(university))
            {
                query = query.Where(p => p.University != null && p.University.Contains(university));
            }

            if (hasRoom.HasValue)
            {
                query = query.Where(p => p.HasRoom == hasRoom.Value);
            }

            if (!string.IsNullOrWhiteSpace(gender) && gender != "Any")
            {
                query = query.Where(p => p.Gender == gender || p.RoommateGenderPreference == gender);
            }

            if (maxPrice.HasValue && maxPrice.Value > 0)
            {
                query = query.Where(p => p.BudgetMax <= maxPrice.Value || p.BudgetMin <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(p => (p.Title != null && p.Title.ToLower().Contains(term)) ||
                                         (p.Description != null && p.Description.ToLower().Contains(term)) ||
                                         (p.Address != null && p.Address.ToLower().Contains(term)) ||
                                         (p.Student != null && p.Student.FullName.ToLower().Contains(term)));
            }

            var posts = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

            var response = posts.Select(p => new MatchResponseDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                FullName = p.Student?.FullName ?? "Sinh viên ẩn danh",
                Phone = !string.IsNullOrEmpty(p.ContactPhone) ? p.ContactPhone : (p.Student?.Phone ?? string.Empty),
                Email = p.Student?.Email,
                AvatarUrl = p.Student?.AvatarUrl,
                Title = p.Title ?? $"Tìm bạn ở ghép khu vực {p.University ?? p.Hometown ?? "Hà Nội"}",
                University = p.University,
                HasRoom = p.HasRoom,
                Address = p.Address,
                ContactPhone = p.ContactPhone,
                ImageUrl = p.ImageUrl,
                Gender = p.Gender,
                BudgetMin = p.BudgetMin,
                BudgetMax = p.BudgetMax,
                Smoke = p.Smoke,
                SleepLate = p.SleepLate,
                HasPet = p.HasPet,
                Hometown = p.Hometown,
                Description = p.Description,
                RoommateGenderPreference = p.RoommateGenderPreference,
                MatchPercentage = 100,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Ok(response);
        }

        // Get student's matching profile & post
        [Authorize(Roles = "Tenant,Landlord,Administrator")]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(studentIdStr, out long studentId))
            {
                return Unauthorized();
            }

            var profile = await _context.MatchingProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId);
            if (profile == null)
            {
                return NotFound("Chưa tạo hồ sơ bài đăng tìm ở ghép.");
            }

            return Ok(new MatchingSurveyDto
            {
                Title = profile.Title,
                University = profile.University,
                HasRoom = profile.HasRoom,
                Address = profile.Address,
                ContactPhone = profile.ContactPhone,
                ImageUrl = profile.ImageUrl,
                Gender = profile.Gender,
                BudgetMin = profile.BudgetMin,
                BudgetMax = profile.BudgetMax,
                Smoke = profile.Smoke,
                SleepLate = profile.SleepLate,
                HasPet = profile.HasPet,
                Hometown = profile.Hometown,
                Description = profile.Description,
                RoommateGenderPreference = profile.RoommateGenderPreference
            });
        }

        // Save or update student's matching profile & post
        [Authorize(Roles = "Tenant,Landlord,Administrator")]
        [HttpPost("profile")]
        public async Task<IActionResult> SaveProfile([FromBody] MatchingSurveyDto request)
        {
            var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(studentIdStr, out long studentId))
            {
                return Unauthorized();
            }

            var profile = await _context.MatchingProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId);

            if (profile == null)
            {
                profile = new MatchingProfile
                {
                    StudentId = studentId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.MatchingProfiles.Add(profile);
            }

            profile.Title = request.Title;
            profile.University = request.University;
            profile.HasRoom = request.HasRoom;
            profile.Address = request.Address;
            profile.ContactPhone = request.ContactPhone;
            profile.Gender = request.Gender;
            profile.BudgetMin = request.BudgetMin;
            profile.BudgetMax = request.BudgetMax;
            profile.Smoke = request.Smoke;
            profile.SleepLate = request.SleepLate;
            profile.HasPet = request.HasPet;
            profile.Hometown = request.Hometown;
            profile.Description = request.Description;
            profile.RoommateGenderPreference = request.RoommateGenderPreference;
            profile.IsActive = true;

            // Handle base64 image upload for post image
            if (!string.IsNullOrEmpty(request.ImageBase64))
            {
                var uploadedUrl = await SaveBase64ImageAsync(request.ImageBase64);
                if (!string.IsNullOrEmpty(uploadedUrl))
                {
                    profile.ImageUrl = uploadedUrl;
                }
            }
            else if (!string.IsNullOrEmpty(request.ImageUrl))
            {
                profile.ImageUrl = request.ImageUrl;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đăng bài tìm người ở ghép thành công!", imageUrl = profile.ImageUrl });
        }

        // Find roommate matches using AI algorithm
        [Authorize(Roles = "Tenant,Landlord,Administrator")]
        [HttpGet("suggested-roommates")]
        public async Task<IActionResult> GetSuggestedRoommates()
        {
            var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(studentIdStr, out long studentId))
            {
                return Unauthorized();
            }

            // Get target student's profile
            var targetProfile = await _context.MatchingProfiles
                .Include(p => p.Student)
                .FirstOrDefaultAsync(p => p.StudentId == studentId);

            if (targetProfile == null)
            {
                return BadRequest(new { message = "Vui lòng đăng bài hoặc điền khảo sát trước khi xem gợi ý." });
            }

            // Get all other active profiles
            var candidateProfiles = await _context.MatchingProfiles
                .Include(p => p.Student)
                .Where(p => p.StudentId != studentId && p.IsActive == true)
                .ToListAsync();

            var matches = _matchingService.FindMatches(targetProfile, candidateProfiles);

            return Ok(matches);
        }

        // Toggle active status (Ẩn / Hiện bài đăng)
        [Authorize(Roles = "Tenant,Landlord,Administrator")]
        [HttpPost("toggle-active")]
        public async Task<IActionResult> ToggleActive()
        {
            var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(studentIdStr, out long studentId))
            {
                return Unauthorized();
            }

            var profile = await _context.MatchingProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId);
            if (profile == null) return NotFound();

            profile.IsActive = !profile.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { isActive = profile.IsActive, message = profile.IsActive ? "Đã bật bài đăng ở ghép!" : "Đã tạm ẩn bài đăng ở ghép!" });
        }

        private async Task<string?> SaveBase64ImageAsync(string base64String)
        {
            try {
                if (string.IsNullOrWhiteSpace(base64String)) return null;
                var base64Data = base64String.Contains(",") ? base64String.Split(',')[1] : base64String;
                var imageBytes = Convert.FromBase64String(base64Data);

                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "match");
                if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                var fileName = $"match_{Guid.NewGuid():N}.jpg";
                var filePath = Path.Combine(uploadsFolder, fileName);
                await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

                return $"/uploads/match/{fileName}";
            }
            catch {
                return null;
            }
        }
    }
}
