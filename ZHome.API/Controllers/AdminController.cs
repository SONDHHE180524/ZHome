using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.Entities;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator")]
    public class AdminController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public AdminController(ZHomeDbContext context)
        {
            _context = context;
        }

        // Get all landlord verification requests
        [HttpGet("verifications")]
        public async Task<IActionResult> GetVerifications()
        {
            var verifications = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Landlord" && !string.IsNullOrEmpty(u.CccdNumber))
                .OrderByDescending(u => u.Id)
                .Select(u => new
                {
                    UserId = u.Id,
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Email = u.Email,
                    CccdNumber = u.CccdNumber,
                    CccdFrontUrl = u.CccdFrontUrl,
                    CccdBackUrl = u.CccdBackUrl,
                    Status = u.VerificationStatus ?? "None",
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(verifications);
        }

        // Approve landlord verification
        [HttpPost("verifications/{userId}/approve")]
        public async Task<IActionResult> ApproveVerification(long userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            user.VerificationStatus = "Approved";
            user.UpdatedAt = DateTime.UtcNow;

            // Mark all properties belonging to this landlord as verified tick
            var properties = await _context.Properties
                .Where(p => p.LandlordId == userId)
                .ToListAsync();

            foreach (var prop in properties)
            {
                prop.IsVerifiedTick = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã duyệt xác thực chủ trọ thành công!" });
        }

        // Reject landlord verification
        [HttpPost("verifications/{userId}/reject")]
        public async Task<IActionResult> RejectVerification(long userId, [FromBody] RejectRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            user.VerificationStatus = "Rejected";
            user.UpdatedAt = DateTime.UtcNow;

            // Remove verification tick from properties
            var properties = await _context.Properties
                .Where(p => p.LandlordId == userId)
                .ToListAsync();

            foreach (var prop in properties)
            {
                prop.IsVerifiedTick = false;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã từ chối xác thực chủ trọ." });
        }
    }

    public class RejectRequest
    {
        public string? Reason { get; set; }
    }
}
