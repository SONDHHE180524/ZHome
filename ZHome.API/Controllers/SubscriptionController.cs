using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public SubscriptionController(ZHomeDbContext context)
        {
            _context = context;
        }

        [HttpGet("packages")]
        public async Task<IActionResult> GetPackages()
        {
            var packages = await _context.SubscriptionPackages.ToListAsync();
            var response = packages.Select(p => new SubscriptionPackageDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                MaxRooms = p.MaxRooms,
                Description = p.Description
            }).ToList();

            return Ok(response);
        }

        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("purchase")]
        public async Task<IActionResult> PurchasePackage([FromBody] PurchaseRequestDto request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            var package = await _context.SubscriptionPackages.FindAsync(request.PackageId);
            if (package == null)
            {
                return NotFound("Gói cước không tồn tại.");
            }

            // Simulate payment processing...
            
            // Grant subscription
            user.SubscriptionId = package.Id;
            
            // If they are extending current subscription, add to current end date. Otherwise start from today.
            if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow)
            {
                user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(request.Months);
            }
            else
            {
                user.SubscriptionEndDate = DateTime.UtcNow.AddMonths(request.Months);
            }

            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Thanh toán và nâng cấp gói cước thành công!",
                subscriptionId = user.SubscriptionId,
                subscriptionEndDate = user.SubscriptionEndDate
            });
        }
    }
}
