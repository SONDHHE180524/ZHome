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
using System.ComponentModel.DataAnnotations;
using ZHome.API.Filters;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly Services.IEmailService _emailService;

        public BillController(ZHomeDbContext context, Services.IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // Get landlord bills
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("landlord")]
        public async Task<IActionResult> GetLandlordBills()
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var bills = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Transactions)
                    .ThenInclude(t => t.Tenant)
                .Where(b => b.Room!.Property!.LandlordId == landlordId)
                .OrderByDescending(b => b.BillingYear)
                .ThenByDescending(b => b.BillingMonth)
                .ThenBy(b => b.Room!.RoomNumber)
                .ToListAsync();

            var response = bills.Select(b => MapBillToDto(b)).ToList();
            return Ok(response);
        }

        // Get tenant bills
        [Authorize(Roles = "Tenant,Administrator")]
        [HttpGet("tenant")]
        public async Task<IActionResult> GetTenantBills()
        {
            var tenantIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(tenantIdStr, out long tenantId))
            {
                return Unauthorized();
            }

            var bills = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Transactions)
                    .ThenInclude(t => t.Tenant)
                .Where(b => _context.Contracts.Any(c => c.TenantId == tenantId && c.RoomId == b.RoomId))
                .OrderByDescending(b => b.BillingYear)
                .ThenByDescending(b => b.BillingMonth)
                .ToListAsync();

            var response = bills.Select(b => MapBillToDto(b)).ToList();
            return Ok(response);
        }

        // Get utility grid for entering readings
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("utility-grid/{propertyId}")]
        public async Task<IActionResult> GetUtilityGrid(long propertyId, [FromQuery] int month, [FromQuery] int year)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            // Verify property belongs to landlord
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == propertyId && p.LandlordId == landlordId);
            if (property == null)
            {
                return NotFound("Khu trọ không tồn tại hoặc bạn không có quyền.");
            }

            var activeContracts = await _context.Contracts
                .Include(c => c.Room)
                .Include(c => c.Tenant)
                .Where(c => c.Room!.PropertyId == propertyId && c.Status == "Active")
                .ToListAsync();

            var groupedRooms = activeContracts.GroupBy(c => c.Room).ToList();

            var gridItems = new List<UtilityGridItemDto>();

            foreach (var group in groupedRooms)
            {
                var room = group.Key;
                if (room == null) continue;
                
                var tenantNames = string.Join(", ", group.Select(c => c.Tenant!.FullName));

                // Find bill for the current period to get status
                var existingBill = await _context.MonthlyBills
                    .FirstOrDefaultAsync(b => b.RoomId == room.Id && b.BillingMonth == month && b.BillingYear == year);

                string status = "None";
                bool isChecked = true;
                long? existingId = null;

                if (existingBill != null)
                {
                    status = existingBill.Status; // Unpaid, Partial, Paid
                    existingId = existingBill.Id;
                    if (status == "Paid") isChecked = false; // Cannot overwrite paid bills
                    else isChecked = false; // Default unchecked for created bills, user can check to overwrite
                }

                // Find latest bill for previous readings
                var latestBill = await _context.MonthlyBills
                    .Where(b => b.RoomId == room.Id)
                    .OrderByDescending(b => b.BillingYear)
                    .ThenByDescending(b => b.BillingMonth)
                    .FirstOrDefaultAsync();

                gridItems.Add(new UtilityGridItemDto
                {
                    RoomId = room.Id,
                    RoomNumber = room.RoomNumber,
                    TenantName = tenantNames,
                    RoomPrice = group.First().RoomPrice,
                    PreviousElectricityReading = latestBill?.ElectricityNewReading ?? 0,
                    PreviousWaterReading = latestBill?.WaterNewReading ?? 0,
                    CurrentElectricityReading = latestBill?.ElectricityNewReading ?? 0,
                    CurrentWaterReading = latestBill?.WaterNewReading ?? 0,
                    ElectricityRate = 3000,
                    WaterRate = 10000,
                    ServiceFee = 50000,
                    RepairDeduction = 0,
                    ExistingBillStatus = status,
                    ExistingBillId = existingId,
                    IsChecked = isChecked
                });
            }

            return Ok(gridItems);
        }

        // Submit utility grid readings and create monthly bills
        [Authorize(Roles = "Landlord")]
        [RequirePremium(99000)]
        [HttpPost("utility-grid/submit")]
        public async Task<IActionResult> SubmitUtilityGrid([FromBody] UtilityGridSubmitDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            // Verify property belongs to landlord
            var property = await _context.Properties
                .AnyAsync(p => p.Id == request.PropertyId && p.LandlordId == landlordId);
            if (!property)
            {
                return NotFound("Khu trọ không tồn tại hoặc bạn không có quyền.");
            }

            foreach (var reading in request.Readings)
            {
                var room = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.Id == reading.RoomId && r.PropertyId == request.PropertyId);

                if (room == null) continue;

                var activeContract = await _context.Contracts
                    .Where(c => c.RoomId == room.Id && c.Status == "Active")
                    .FirstOrDefaultAsync();
                var actualRoomPrice = activeContract != null ? activeContract.RoomPrice : room.Price;

                // Check if bill already exists for this room and billing period
                var existingBill = await _context.MonthlyBills
                    .FirstOrDefaultAsync(b => b.RoomId == room.Id && 
                                              b.BillingMonth == request.Month && 
                                              b.BillingYear == request.Year);
                if (existingBill != null)
                {
                    // Skip if bill is already paid
                    if (existingBill.Status == "Paid")
                    {
                        continue;
                    }
                    
                    // Update existing bill
                    existingBill.RoomFee = actualRoomPrice;
                    existingBill.ElectricityOldReading = reading.OldElectricityReading;
                    existingBill.ElectricityNewReading = reading.NewElectricityReading;
                    existingBill.ElectricityFee = (reading.NewElectricityReading - reading.OldElectricityReading) * reading.ElectricityRate;
                    existingBill.WaterOldReading = reading.OldWaterReading;
                    existingBill.WaterNewReading = reading.NewWaterReading;
                    existingBill.WaterFee = (reading.NewWaterReading - reading.OldWaterReading) * reading.WaterRate;
                    existingBill.ServiceFee = reading.ServiceFee;
                    existingBill.RepairDeduction = reading.RepairDeduction;
                    existingBill.TotalAmount = actualRoomPrice + existingBill.ElectricityFee + existingBill.WaterFee + reading.ServiceFee - reading.RepairDeduction;
                    // Keep existing PaidAmount, update Status based on new TotalAmount
                    if (existingBill.PaidAmount >= existingBill.TotalAmount) existingBill.Status = "Paid";
                    else if (existingBill.PaidAmount > 0) existingBill.Status = "Partial";
                    else existingBill.Status = "Unpaid";
                }
                else
                {
                    var electricityFee = (reading.NewElectricityReading - reading.OldElectricityReading) * reading.ElectricityRate;
                    var waterFee = (reading.NewWaterReading - reading.OldWaterReading) * reading.WaterRate;
                    var totalAmount = actualRoomPrice + electricityFee + waterFee + reading.ServiceFee - reading.RepairDeduction;

                    var newBill = new MonthlyBill
                    {
                        RoomId = room.Id,
                        BillingMonth = request.Month,
                        BillingYear = request.Year,
                        RoomFee = actualRoomPrice,
                        ElectricityOldReading = reading.OldElectricityReading,
                        ElectricityNewReading = reading.NewElectricityReading,
                        ElectricityFee = electricityFee,
                        WaterOldReading = reading.OldWaterReading,
                        WaterNewReading = reading.NewWaterReading,
                        WaterFee = waterFee,
                        ServiceFee = reading.ServiceFee,
                        RepairDeduction = reading.RepairDeduction,
                        TotalAmount = totalAmount,
                        PaidAmount = 0,
                        Status = "Unpaid"
                    };
                    _context.MonthlyBills.Add(newBill);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Ghi chỉ số và tạo hóa đơn thành công!" });
        }

        public class CreateSupplementaryBillDto
        {
            [Required]
            public long RoomId { get; set; }
            [Required]
            public int Month { get; set; }
            [Required]
            public int Year { get; set; }
            [Required]
            public decimal Amount { get; set; }
            public string Note { get; set; } = string.Empty;
        }

        [Authorize(Roles = "Landlord")]
        [HttpPost("supplementary")]
        public async Task<IActionResult> CreateSupplementaryBill([FromBody] CreateSupplementaryBillDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var room = await _context.Rooms.Include(r => r.Property).FirstOrDefaultAsync(r => r.Id == request.RoomId);
            if (room == null || room.Property?.LandlordId != landlordId)
            {
                return NotFound("Phòng không tồn tại hoặc bạn không có quyền truy cập.");
            }

            var newBill = new MonthlyBill
            {
                RoomId = room.Id,
                BillingMonth = request.Month,
                BillingYear = request.Year,
                RoomFee = request.Amount,
                TotalAmount = request.Amount,
                Note = request.Note,
                ElectricityFee = 0,
                WaterFee = 0,
                ServiceFee = 0,
                RepairDeduction = 0,
                PaidAmount = 0,
                Status = "Unpaid"
            };

            _context.MonthlyBills.Add(newBill);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo hóa đơn bổ sung thành công!" });
        }

        // Pay a bill
        [Authorize(Roles = "Landlord,Administrator,Tenant")]
        [HttpPost("{billId}/pay")]
        public async Task<IActionResult> PayBill(long billId, [FromBody] PayBillDto request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var bill = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .FirstOrDefaultAsync(b => b.Id == billId);

            if (bill == null)
            {
                return NotFound("Không tìm thấy hóa đơn.");
            }

            var isTenant = User.IsInRole("Tenant");
            var isLandlord = User.IsInRole("Landlord");

            if (isLandlord && bill.Room!.Property!.LandlordId != userId)
            {
                return Forbid();
            }
            if (isTenant && !_context.Contracts.Any(c => c.RoomId == bill.RoomId && c.TenantId == userId))
            {
                return Forbid();
            }

            bill.PaidAmount += request.Amount;
            
            if (bill.PaidAmount >= bill.TotalAmount)
            {
                bill.Status = "Paid";
                bill.PaidAt = DateTime.UtcNow;
            }
            else
            {
                bill.Status = "Partial";
            }

            var transaction = new BillTransaction
            {
                MonthlyBillId = bill.Id,
                TenantId = userId,
                Amount = request.Amount,
                CreatedAt = DateTime.UtcNow,
                Note = isTenant ? "Tenant paid" : "Landlord logged payment"
            };

            _context.BillTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác nhận thanh toán thành công!" });
        }

        // Send email notification for a bill
        [Authorize(Roles = "Landlord,Administrator")]
        [RequirePremium(199000)]
        [HttpPost("{billId}/send-email")]
        public async Task<IActionResult> SendEmailNotification(long billId)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var bill = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .FirstOrDefaultAsync(b => b.Id == billId);

            if (bill == null)
            {
                return NotFound("Không tìm thấy hóa đơn.");
            }

            // Verify landlord owns the property
            if (bill.Room!.Property!.LandlordId != landlordId)
            {
                return Forbid();
            }

            var room = bill.Room;
            var property = room?.Property;

            if (room == null)
            {
                return BadRequest("Dữ liệu phòng không hợp lệ.");
            }

            var activeContracts = await _context.Contracts
                .Include(c => c.Tenant)
                .Where(c => c.RoomId == room.Id && c.Status == "Active")
                .ToListAsync();

            if (activeContracts.Count == 0)
            {
                return BadRequest("Phòng không có khách thuê đang hoạt động.");
            }

            var tenant = activeContracts.First().Tenant;
            var recipientName = tenant!.FullName;
            var recipientEmail = tenant.Email;
            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                // Fallback to a mock email if tenant has no email
                recipientEmail = $"{tenant.Phone}@zhome.vn";
            }

            var billPeriod = $"Tháng {bill.BillingMonth}/{bill.BillingYear}";
            
            var roomFeeFormatted = bill.RoomFee.ToString("N0") + "đ";
            var elecUsage = bill.ElectricityNewReading - bill.ElectricityOldReading;
            var elecUsageFormatted = elecUsage.ToString("F1") + " kWh";
            var elecFeeFormatted = bill.ElectricityFee.ToString("N0") + "đ";
            var waterUsage = bill.WaterNewReading - bill.WaterOldReading;
            var waterUsageFormatted = waterUsage.ToString("F1") + " m³";
            var waterFeeFormatted = bill.WaterFee.ToString("N0") + "đ";
            var serviceFeeFormatted = bill.ServiceFee.ToString("N0") + "đ";
            var repairDeductionFormatted = bill.RepairDeduction.ToString("N0") + "đ";
            var totalAmountFormatted = bill.TotalAmount.ToString("N0") + "đ";

            var invoiceUrl = $"http://localhost:4200/bill-print/{billId}";
            var appBillsUrl = "http://localhost:4200/tenant/bills";

            // Subject of the email (append timestamp to prevent threading/grouping in Gmail)
            var subject = $"[ZHome] Thông báo hóa đơn {billPeriod} - Phòng {room.RoomNumber} (Lúc {DateTime.Now:HH:mm:ss})";

            // Construct HTML email body
            var emailBodyHtml = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #334155;"">
                <div style=""text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;"">
                    <span style=""background: #6366f1; color: #ffffff; padding: 6px 12px; font-weight: bold; border-radius: 6px; font-size: 20px; display: inline-block;"">Z</span>
                    <span style=""font-size: 24px; font-weight: bold; color: #0f172a; margin-left: 8px; vertical-align: middle;"">ZHome</span>
                    <p style=""font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;"">Hệ thống Quản lý nhà trọ Thông minh</p>
                </div>

                <div style=""margin-top: 24px;"">
                    <p>Kính gửi khách thuê: <strong>{recipientName}</strong> (Phòng {room.RoomNumber} - {property?.Title}),</p>
                    <p>ZHome xin thông báo chi tiết hóa đơn tiền nhà & phí tiện ích của bạn trong kỳ <strong>{billPeriod}</strong> như sau:</p>

                    <table style=""width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px;"">
                        <thead>
                            <tr style=""background: #f8fafc; border-bottom: 2px solid #cbd5e1;"">
                                <th style=""text-align: left; padding: 8px; font-size: 13px; color: #64748b;"">Khoản Mục / Chỉ Số</th>
                                <th style=""text-align: right; padding: 8px; font-size: 13px; color: #64748b;"">Số Lượng</th>
                                <th style=""text-align: right; padding: 8px; font-size: 13px; color: #64748b;"">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style=""border-bottom: 1px solid #f1f5f9;"">
                                <td style=""padding: 10px 8px; font-size: 14px;"">Tiền thuê phòng cố định</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">1 tháng</td>
                                <td style=""text-align: right; padding: 10px 8px; font-weight: bold; font-size: 14px;"">{roomFeeFormatted}</td>
                            </tr>
                            <tr style=""border-bottom: 1px solid #f1f5f9;"">
                                <td style=""padding: 10px 8px; font-size: 14px;"">
                                    Tiền điện tiêu thụ<br>
                                    <span style=""font-size: 11px; color: #64748b;"">(Số điện cũ: {bill.ElectricityOldReading} - Mới: {bill.ElectricityNewReading})</span>
                                </td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">{elecUsageFormatted}</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">{elecFeeFormatted}</td>
                            </tr>
                            <tr style=""border-bottom: 1px solid #f1f5f9;"">
                                <td style=""padding: 10px 8px; font-size: 14px;"">
                                    Tiền nước tiêu thụ<br>
                                    <span style=""font-size: 11px; color: #64748b;"">(Số nước cũ: {bill.WaterOldReading} - Mới: {bill.WaterNewReading})</span>
                                </td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">{waterUsageFormatted}</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">{waterFeeFormatted}</td>
                            </tr>
                            <tr style=""border-bottom: 1px solid #f1f5f9;"">
                                <td style=""padding: 10px 8px; font-size: 14px;"">Phí dịch vụ chung</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">Cố định</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px;"">{serviceFeeFormatted}</td>
                            </tr>";

            if (bill.RepairDeduction > 0)
            {
                emailBodyHtml += $@"
                            <tr style=""border-bottom: 1px solid #f1f5f9; background: #fff5f5;"">
                                <td style=""padding: 10px 8px; font-size: 14px; color: #e11d48;"">Khấu trừ chủ trọ chịu</td>
                                <td style=""text-align: right; padding: 10px 8px; font-size: 14px; color: #e11d48;"">1</td>
                                <td style=""text-align: right; padding: 10px 8px; font-weight: bold; font-size: 14px; color: #e11d48;"">-{repairDeductionFormatted}</td>
                            </tr>";
            }

            emailBodyHtml += $@"
                            <tr style=""border-top: 2px solid #cbd5e1;"">
                                <td colspan=""2"" style=""padding: 12px 8px; font-size: 15px; font-weight: bold; color: #0f172a;"">TỔNG CỘNG CẦN THANH TOÁN:</td>
                                <td style=""text-align: right; padding: 12px 8px; font-size: 18px; font-weight: bold; color: #4f46e5;"">{totalAmountFormatted}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style=""background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center;"">
                        <h4 style=""margin: 0 0 8px 0; color: #0f172a;"">CHỨNG THỰC ĐIỆN TỬ ZHOME</h4>
                        <p style=""font-size: 12px; color: #475569; margin: 0 0 12px 0;"">Hóa đơn đã được chứng nhận và số hóa trực tiếp trên ZHome bởi danghoangson2752k4@gmail.com.</p>
                        
                        <div style=""margin: 16px 0;"">
                            <a href=""{invoiceUrl}"" target=""_blank"" style=""background: #4f46e5; color: #ffffff; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);"">
                                📄 Xem & In Hóa Đơn Siêu Thị
                            </a>
                        </div>
                        
                        <p style=""font-size: 11px; color: #64748b; margin: 0;"">
                            Bạn cũng có thể xem và đóng tiền trực tuyến tại trang web ZHome: <br>
                            <a href=""{appBillsUrl}"" target=""_blank"" style=""color: #4f46e5; text-decoration: underline;"">{appBillsUrl}</a>
                        </p>
                    </div>

                    <p style=""font-size: 13px; line-height: 1.5; color: #475569;"">
                        Vui lòng hoàn tất thanh toán hóa đơn sớm để tránh phát sinh nợ đọng. <br>
                        Mọi thắc mắc về các chỉ số hoặc hóa đơn, vui lòng phản hồi qua email này hoặc liên hệ hotline chủ nhà.
                    </p>
                </div>

                <div style=""text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 32px; font-size: 11px; color: #94a3b8;"">
                    <p>Thư này được gửi tự động bởi hệ thống ZHome Boarding Management System.</p>
                    <p>Liên hệ hỗ trợ: danghoangson2752k4@gmail.com | Hotline: 0964.339.980</p>
                </div>
            </div>";

            string details;
            bool smtpSuccess = _emailService.SendEmail(recipientEmail, subject, emailBodyHtml, out details);

            var response = new
            {
                recipient = recipientName,
                email = recipientEmail,
                message = smtpSuccess ? $"Đã gửi email thông báo hóa đơn đến hòm thư {recipientEmail} thành công!" : $"Gửi email thất bại: {details}",
                smtpSuccess = smtpSuccess,
                smtpDetails = details,
                sentPayload = new
                {
                    senderEmail = "danghoangson2752k4@gmail.com",
                    recipientEmail = recipientEmail,
                    subject = subject,
                    message = $"Tiền phòng: {roomFeeFormatted}, Điện: {elecFeeFormatted}, Nước: {waterFeeFormatted}. Tổng cộng: {totalAmountFormatted}. Vui lòng truy cập để xem hóa đơn siêu thị: {invoiceUrl}",
                    invoiceUrl = invoiceUrl,
                    appBillsUrl = appBillsUrl,
                    body = emailBodyHtml,
                    timestamp = DateTime.UtcNow
                }
            };

            return Ok(response);
        }

        // Get single bill details (public/shared route)
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBill(long id)
        {
            var bill = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Transactions)
                    .ThenInclude(t => t.Tenant)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bill == null)
            {
                return NotFound("Hóa đơn không tồn tại.");
            }

            return Ok(MapBillToDto(bill));
        }

        private static BillResponseDto MapBillToDto(MonthlyBill b)
        {
            var tenantName = "Phòng " + (b.Room?.RoomNumber ?? string.Empty);
            // If we have transactions or if there's a better way to find the tenants, we could put it here.
            
            return new BillResponseDto
            {
                Id = b.Id,
                RoomId = b.RoomId,
                TenantName = tenantName,
                TenantPhone = string.Empty,
                RoomNumber = b.Room?.RoomNumber ?? string.Empty,
                PropertyTitle = b.Room?.Property?.Title ?? string.Empty,
                BillingMonth = b.BillingMonth,
                BillingYear = b.BillingYear,
                RoomFee = b.RoomFee,
                ElectricityOldReading = b.ElectricityOldReading,
                ElectricityNewReading = b.ElectricityNewReading,
                ElectricityFee = b.ElectricityFee,
                WaterOldReading = b.WaterOldReading,
                WaterNewReading = b.WaterNewReading,
                WaterFee = b.WaterFee,
                ServiceFee = b.ServiceFee,
                RepairDeduction = b.RepairDeduction,
                TotalAmount = b.TotalAmount,
                PaidAmount = b.PaidAmount,
                Status = b.Status,
                PaidAt = b.PaidAt,
                Transactions = b.Transactions?.Select(t => new BillTransactionDto
                {
                    Id = t.Id,
                    TenantName = t.Tenant?.FullName ?? "Khách thuê",
                    Amount = t.Amount,
                    CreatedAt = t.CreatedAt,
                    Note = t.Note
                }).ToList() ?? new List<BillTransactionDto>()
            };
        }
    }
}