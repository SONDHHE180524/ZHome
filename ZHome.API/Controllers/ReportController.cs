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

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly Services.IEmailService _emailService;

        public ReportController(ZHomeDbContext context, Services.IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // Submit report (Tenant only)
        [Authorize(Roles = "Tenant")]
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] ReportCreateDto request)
        {
            var tenantIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(tenantIdStr, out long tenantId))
            {
                return Unauthorized();
            }

            // Validation: Feedback limits (Rating has value)
            if (request.Rating.HasValue)
            {
                var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var hasFeedbackThisMonth = await _context.Reports
                    .AnyAsync(r => r.TenantId == tenantId && r.Rating.HasValue && r.CreatedAt >= currentMonthStart);
                
                if (hasFeedbackThisMonth)
                {
                    return BadRequest(new { message = "Mỗi tháng bạn chỉ được gửi đánh giá 1 lần." });
                }
            }
            else // Validation: Report limits (Rating is null)
            {
                var hasUnresolvedReport = await _context.Reports
                    .AnyAsync(r => r.TenantId == tenantId && !r.Rating.HasValue && (r.Status == "Pending" || r.Status == "Processing"));

                if (hasUnresolvedReport)
                {
                    return BadRequest(new { message = "Bạn đang có một báo cáo sự cố chưa được xử lý xong. Vui lòng chờ giải quyết trước khi tạo báo cáo mới." });
                }
            }

            var report = new Report
            {
                TenantId = tenantId,
                Title = request.Title,
                Content = request.Content,
                Status = "Pending",
                ContractId = request.ContractId,
                Rating = request.Rating,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            // Nếu đánh giá dưới 5 sao, gửi thông báo bắt buộc phản hồi cho chủ trọ
            if (report.Rating.HasValue && report.Rating.Value < 5 && report.ContractId.HasValue)
            {
                var contract = await _context.Contracts
                    .Include(c => c.Room)
                        .ThenInclude(r => r!.Property)
                            .ThenInclude(p => p!.Landlord)
                    .Include(c => c.Tenant)
                    .FirstOrDefaultAsync(c => c.Id == report.ContractId.Value);

                if (contract?.Room?.Property?.Landlord != null && !string.IsNullOrWhiteSpace(contract.Room.Property.Landlord.Email))
                {
                    var landlord = contract.Room.Property.Landlord;
                    var landlordEmail = landlord.Email;
                    var subject = $"[ZHome - QUAN TRỌNG] Yêu cầu phản hồi báo cáo từ phòng {contract.Room.RoomNumber}";
                    var emailBodyHtml = $@"
                        <div style=""font-family: Arial, sans-serif; padding: 20px;"">
                            <h2 style=""color: #e11d48;"">CẢNH BÁO: PHẢN ÁNH DƯỚI 5 SAO</h2>
                            <p>Xin chào <strong>{landlord.FullName}</strong>,</p>
                            <p>Bạn vừa nhận được một đánh giá/phản ánh <strong>{report.Rating} sao</strong> từ khách thuê <strong>{contract.Tenant?.FullName}</strong> ở phòng <strong>{contract.Room.RoomNumber}</strong> (Khu trọ: {contract.Room.Property.Title}).</p>
                            <div style=""background: #f8fafc; padding: 15px; border-left: 4px solid #e11d48; margin: 15px 0;"">
                                <strong>Tiêu đề:</strong> {report.Title}<br/>
                                <strong>Nội dung:</strong> {report.Content}
                            </div>
                            <p style=""color: #b91c1c; font-weight: bold;"">Yêu cầu bắt buộc:</p>
                            <p>Theo quy định của hệ thống, bạn cần truy cập ngay vào hệ thống ZHome để gửi phản hồi/cam kết khắc phục cho phản ánh này.</p>
                            <p>Vui lòng đăng nhập ZHome, vào mục <strong>Quản lý Phản ánh</strong> để thực hiện.</p>
                        </div>
                    ";
                    
                    _emailService.SendEmail(landlordEmail, subject, emailBodyHtml, out _);
                }
            }

            return Ok(new { message = "Gửi phản ánh sự cố thành công!" });
        }

        // Get tenant's reports
        [Authorize(Roles = "Tenant")]
        [HttpGet("my-reports")]
        public async Task<IActionResult> GetMyReports()
        {
            var tenantIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(tenantIdStr, out long tenantId))
            {
                return Unauthorized();
            }

            var reports = await _context.Reports
                .Where(r => r.TenantId == tenantId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reports);
        }

        // Get all reports (Landlord only, to view tenant reports)
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllReports()
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            // Find all contracts belonging to this landlord's properties
            var reports = await _context.Reports
                .Include(r => r.Tenant)
                .Include(r => r.Contract)
                    .ThenInclude(c => c!.Room)
                .Where(r => r.Contract != null && r.Contract.Room != null && r.Contract.Room.Property != null && r.Contract.Room.Property.LandlordId == landlordId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.Title,
                    r.Content,
                    r.Status,
                    r.Rating,
                    r.LandlordReply,
                    r.RepliedAt,
                    r.CreatedAt,
                    TenantName = r.Tenant!.FullName,
                    TenantPhone = r.Tenant.Phone,
                    RoomNumber = r.Contract!.Room!.RoomNumber
                })
                .ToListAsync();

            return Ok(reports);
        }

        // Get reports for a property (Public)
        [AllowAnonymous]
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetPropertyReports(long propertyId)
        {
            var reports = await _context.Reports
                .Include(r => r.Tenant)
                .Include(r => r.Contract)
                    .ThenInclude(c => c!.Room)
                .Where(r => r.Contract!.Room!.PropertyId == propertyId && r.Status != "Draft")
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.Title,
                    r.Content,
                    r.Status,
                    r.Rating,
                    r.LandlordReply,
                    r.RepliedAt,
                    r.CreatedAt,
                    TenantName = r.Tenant!.FullName,
                    RoomNumber = r.Contract!.Room!.RoomNumber
                })
                .ToListAsync();

            // Mask tenant name for privacy (e.g., "Nguyễn Văn A" -> "Nguyễn *** A")
            var maskedReports = reports.Select(r => {
                var nameParts = r.TenantName.Split(' ');
                var maskedName = nameParts.Length > 1 
                    ? $"{nameParts[0]} *** {nameParts[^1]}" 
                    : r.TenantName;

                return new {
                    r.Id,
                    r.Title,
                    r.Content,
                    r.Status,
                    r.Rating,
                    r.LandlordReply,
                    r.RepliedAt,
                    r.CreatedAt,
                    TenantName = maskedName,
                    r.RoomNumber
                };
            });

            return Ok(maskedReports);
        }

        // Update report status (Landlord only)
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] string status)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null)
            {
                return NotFound("Không tìm thấy phản ánh.");
            }

            report.Status = status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái phản ánh thành công!" });
        }

        // Landlord reply to a report
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPut("{id}/reply")]
        public async Task<IActionResult> ReplyToReport(long id, [FromBody] ReportReplyDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var report = await _context.Reports
                .Include(r => r.Tenant)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
            {
                return NotFound("Không tìm thấy phản ánh.");
            }

            // Verify the landlord owns the property the report belongs to
            bool isOwner = await _context.Contracts
                .AnyAsync(c => c.TenantId == report.TenantId && c.Room!.Property!.LandlordId == landlordId && c.Status == "Active");

            if (!isOwner)
            {
                return Forbid();
            }

            report.LandlordReply = request.ReplyContent;
            report.RepliedAt = DateTime.UtcNow;
            report.Status = "Replied";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Phản hồi báo cáo thành công!" });
        }
    }
}
