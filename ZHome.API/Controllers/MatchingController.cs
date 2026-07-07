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
    [Authorize(Roles = "Tenant")]
    public class MatchingController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly MatchingService _matchingService;

        public MatchingController(ZHomeDbContext context, MatchingService matchingService)
        {
            _context = context;
            _matchingService = matchingService;
        }

        // Get student's matching profile
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
                return NotFound("Chưa tạo hồ sơ tìm ở ghép.");
            }

            return Ok(new MatchingSurveyDto
            {
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

        // Save or update student's matching profile (Survey submission)
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

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật hồ sơ khảo sát ở ghép thành công!" });
        }

        // Find roommate matches
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
                return BadRequest(new { message = "Vui lòng hoàn thành khảo sát tìm ở ghép trước." });
            }

            // Get all other active profiles
            var candidateProfiles = await _context.MatchingProfiles
                .Include(p => p.Student)
                .Where(p => p.StudentId != studentId && p.IsActive == true)
                .ToListAsync();

            var matches = _matchingService.FindMatches(targetProfile, candidateProfiles);

            return Ok(matches);
        }
    }
}
