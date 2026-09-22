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
        private readonly Services.INotificationService _notificationService;

        public AdminController(ZHomeDbContext context, Services.INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
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

            // Send notification to landlord
            await _notificationService.CreateNotificationAsync(
                userId: userId,
                title: "Hồ sơ xác minh đã được phê duyệt",
                message: "Chúc mừng! Hồ sơ xác thực CCCD và tích xanh chính chủ của bạn đã được Quản trị viên ZHome phê duyệt thành công.",
                type: "LandlordVerification",
                targetUrl: "/profile",
                referenceId: userId
            );

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

            // Send notification to landlord
            string reason = !string.IsNullOrWhiteSpace(request?.Reason) ? request.Reason : "Ảnh hoặc thông tin CCCD chưa hợp lệ.";
            await _notificationService.CreateNotificationAsync(
                userId: userId,
                title: "Yêu cầu xác minh bị từ chối",
                message: $"Hồ sơ xác thực CCCD của bạn đã bị từ chối. Lý do: {reason}. Vui lòng cập nhật lại hồ sơ.",
                type: "LandlordVerification",
                targetUrl: "/profile",
                referenceId: userId
            );

            return Ok(new { message = "Đã từ chối xác thực chủ trọ." });
        }

        // Get admin dashboard stats
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalProperties = await _context.Properties.CountAsync();
            var totalLandlords = await _context.Users.CountAsync(u => u.Role != null && u.Role.RoleName == "Landlord");
            var totalTenants = await _context.Users.CountAsync(u => u.Role != null && u.Role.RoleName == "Tenant");
            var totalRooms = await _context.Rooms.CountAsync();
            var vacantRooms = await _context.Rooms.CountAsync(r => r.Status == "Available");
            var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == "Occupied");
            var pendingVerifications = await _context.Users.CountAsync(u => u.Role != null && u.Role.RoleName == "Landlord" && (u.VerificationStatus == "Pending" || (u.VerificationStatus != "Approved" && !string.IsNullOrEmpty(u.CccdNumber))));
            var totalTransactionsRevenue = await _context.BillTransactions.SumAsync(t => (decimal?)t.Amount) ?? 0m;

            return Ok(new
            {
                TotalProperties = totalProperties,
                TotalLandlords = totalLandlords,
                TotalTenants = totalTenants,
                TotalRooms = totalRooms,
                VacantRooms = vacantRooms,
                OccupiedRooms = occupiedRooms,
                PendingVerifications = pendingVerifications,
                TotalTransactionsRevenue = totalTransactionsRevenue
            });
        }

        // Get all properties for Admin management (Filtering by landlord, room vacancy stats, ABSOLUTELY NO TENANT PII)
        [HttpGet("properties")]
        public async Task<IActionResult> GetProperties([FromQuery] long? landlordId)
        {
            var query = _context.Properties
                .Include(p => p.Landlord)
                .Include(p => p.Rooms)
                .AsQueryable();

            if (landlordId.HasValue && landlordId.Value > 0)
            {
                query = query.Where(p => p.LandlordId == landlordId.Value);
            }

            var properties = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    PropertyId = p.Id,
                    Title = p.Title,
                    Address = p.Address,
                    Description = p.Description,
                    ImageUrl = p.ImageUrl,
                    IsVerifiedTick = p.IsVerifiedTick,
                    CreatedAt = p.CreatedAt,
                    LandlordId = p.LandlordId,
                    LandlordName = p.Landlord != null ? p.Landlord.FullName : "N/A",
                    LandlordPhone = p.Landlord != null ? p.Landlord.Phone : "",
                    LandlordEmail = p.Landlord != null ? p.Landlord.Email : "",
                    LandlordVerificationStatus = p.Landlord != null ? (p.Landlord.VerificationStatus ?? "None") : "None",
                    TotalRooms = p.Rooms.Count,
                    VacantRooms = p.Rooms.Count(r => r.Status == "Available"),
                    OccupiedRooms = p.Rooms.Count(r => r.Status == "Occupied"),
                    // Room details - NOTE: Privacy strict compliance: NO tenant name, phone or identity card exposed to Admin
                    Rooms = p.Rooms.Select(r => new
                    {
                        RoomId = r.Id,
                        RoomNumber = r.RoomNumber,
                        Price = r.Price,
                        Area = r.Area,
                        MaxOccupants = r.MaxOccupants,
                        Status = r.Status
                    }).OrderBy(r => r.RoomNumber).ToList()
                })
                .ToListAsync();

            return Ok(properties);
        }

        // Get transaction history for Admin (filterable per property, or all properties)
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] long? propertyId, [FromQuery] long? landlordId)
        {
            var query = _context.BillTransactions
                .Include(t => t.MonthlyBill!)
                    .ThenInclude(mb => mb.Room!)
                        .ThenInclude(r => r.Property!)
                            .ThenInclude(p => p.Landlord)
                .AsQueryable();

            if (propertyId.HasValue && propertyId.Value > 0)
            {
                query = query.Where(t => t.MonthlyBill != null && t.MonthlyBill.Room != null && t.MonthlyBill.Room.PropertyId == propertyId.Value);
            }

            if (landlordId.HasValue && landlordId.Value > 0)
            {
                query = query.Where(t => t.MonthlyBill != null && t.MonthlyBill.Room != null && t.MonthlyBill.Room.Property != null && t.MonthlyBill.Room.Property.LandlordId == landlordId.Value);
            }

            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    TransactionId = t.Id,
                    Amount = t.Amount,
                    CreatedAt = t.CreatedAt,
                    Note = t.Note ?? "Thanh toán hóa đơn trọ",
                    MonthlyBillId = t.MonthlyBillId,
                    BillingMonth = t.MonthlyBill != null ? t.MonthlyBill.BillingMonth : 0,
                    BillingYear = t.MonthlyBill != null ? t.MonthlyBill.BillingYear : 0,
                    PropertyId = t.MonthlyBill != null && t.MonthlyBill.Room != null ? t.MonthlyBill.Room.PropertyId : (long?)null,
                    PropertyTitle = t.MonthlyBill != null && t.MonthlyBill.Room != null && t.MonthlyBill.Room.Property != null ? t.MonthlyBill.Room.Property.Title : "N/A",
                    RoomNumber = t.MonthlyBill != null && t.MonthlyBill.Room != null ? t.MonthlyBill.Room.RoomNumber : "N/A",
                    LandlordId = t.MonthlyBill != null && t.MonthlyBill.Room != null && t.MonthlyBill.Room.Property != null ? t.MonthlyBill.Room.Property.LandlordId : (long?)null,
                    LandlordName = t.MonthlyBill != null && t.MonthlyBill.Room != null && t.MonthlyBill.Room.Property != null && t.MonthlyBill.Room.Property.Landlord != null ? t.MonthlyBill.Room.Property.Landlord.FullName : "Chủ trọ",
                    TransactionType = "Thanh toán tiền trọ hàng tháng",
                    Status = "Thành công"
                })
                .ToListAsync();

            return Ok(transactions);
        }
    }

    public class RejectRequest
    {
        public string? Reason { get; set; }
    }
}
