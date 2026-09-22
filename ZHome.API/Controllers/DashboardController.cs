using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Landlord,Administrator")]
    public class DashboardController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public DashboardController(ZHomeDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview([FromQuery] int? year)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            int reportYear = year ?? DateTime.Now.Year;

            // 1. Get properties and room counts
            var landlordProperties = await _context.Properties
                .AsNoTracking()
                .Where(p => p.LandlordId == landlordId)
                .Select(p => new PropertyOptionDto { Id = p.Id, Title = p.Title })
                .ToListAsync();

            int totalProperties = landlordProperties.Count;

            int totalRooms = await _context.Rooms
                .AsNoTracking()
                .CountAsync(r => r.Property!.LandlordId == landlordId);

            int occupiedRooms = await _context.Rooms
                .AsNoTracking()
                .CountAsync(r => r.Property!.LandlordId == landlordId && r.Status == "Rented");

            int vacantRooms = totalRooms - occupiedRooms;

            int debtedRooms = await _context.MonthlyBills
                .AsNoTracking()
                .Where(b => b.Room!.Property!.LandlordId == landlordId && b.Status != "Paid")
                .Select(b => b.RoomId)
                .Distinct()
                .CountAsync();

            // 2. Query all bills for landlord in reportYear
            var yearBills = await _context.MonthlyBills
                .AsNoTracking()
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Where(b => b.Room!.Property!.LandlordId == landlordId && b.BillingYear == reportYear)
                .ToListAsync();

            // Total revenue (Paid amount) & Outstanding debt in reportYear
            decimal totalRevenue = yearBills.Sum(b => b.PaidAmount);
            decimal outstandingDebt = yearBills.Where(b => b.Status != "Paid").Sum(b => b.TotalAmount - b.PaidAmount);
            decimal totalExpenses = yearBills.Sum(b => b.ElectricityFee + b.WaterFee + b.ServiceFee);
            decimal netProfit = totalRevenue > totalExpenses ? (totalRevenue - totalExpenses) : 0m;

            // If no bills found for reportYear specifically, fallback to all-time revenue if user has bills in system
            if (yearBills.Count == 0)
            {
                var allBills = await _context.MonthlyBills
                    .AsNoTracking()
                    .Include(b => b.Room)
                        .ThenInclude(r => r!.Property)
                    .Where(b => b.Room!.Property!.LandlordId == landlordId)
                    .ToListAsync();

                if (allBills.Count > 0)
                {
                    totalRevenue = allBills.Sum(b => b.PaidAmount);
                    outstandingDebt = allBills.Where(b => b.Status != "Paid").Sum(b => b.TotalAmount - b.PaidAmount);
                    totalExpenses = allBills.Sum(b => b.ElectricityFee + b.WaterFee + b.ServiceFee);
                    netProfit = totalRevenue > totalExpenses ? (totalRevenue - totalExpenses) : 0m;
                }
            }

            // 3. Post statistics
            int totalPostsCount = totalProperties;
            int hotPostsCount = await _context.Properties
                .AsNoTracking()
                .CountAsync(p => p.LandlordId == landlordId && p.IsVerifiedTick);
            int activePostsCount = totalProperties;

            // 4. Build monthly revenue list for all 12 months
            var monthlyRevenues = new List<MonthlyRevenueItemDto>();
            for (int m = 1; m <= 12; m++)
            {
                var monthBills = yearBills.Where(b => b.BillingMonth == m).ToList();
                decimal paid = monthBills.Sum(b => b.PaidAmount);
                decimal unpaid = monthBills.Where(b => b.Status != "Paid").Sum(b => b.TotalAmount - b.PaidAmount);
                decimal exp = monthBills.Sum(b => b.ElectricityFee + b.WaterFee + b.ServiceFee);
                decimal totalBilled = monthBills.Sum(b => b.TotalAmount);

                monthlyRevenues.Add(new MonthlyRevenueItemDto
                {
                    Month = m,
                    PaidRevenue = paid,
                    UnpaidRevenue = unpaid,
                    TotalExpenses = exp,
                    TotalBilledAmount = totalBilled
                });
            }

            // 5. Tax Forecast Calculation (100M VND threshold per year)
            decimal taxThreshold = 100000000m;
            bool isTaxable = totalRevenue > taxThreshold;
            decimal vat = isTaxable ? totalRevenue * 0.05m : 0m;
            decimal pit = isTaxable ? totalRevenue * 0.05m : 0m;

            var summary = new FinancialSummaryDto
            {
                TotalPropertiesCount = totalProperties,
                TotalRoomsCount = totalRooms,
                OccupiedRoomsCount = occupiedRooms,
                VacantRoomsCount = vacantRooms,
                DebtedRoomsCount = debtedRooms,
                TotalRevenue = totalRevenue,
                OutstandingDebt = outstandingDebt,
                TotalExpenses = totalExpenses,
                NetProfit = netProfit,
                TotalPostsCount = totalPostsCount,
                HotPostsCount = hotPostsCount,
                ActivePostsCount = activePostsCount,
                PropertyList = landlordProperties,
                MonthlyRevenues = monthlyRevenues,
                TaxForecast = new TaxForecastDto
                {
                    TotalAnnualRevenue = totalRevenue,
                    TaxThreshold = taxThreshold,
                    IsTaxable = isTaxable,
                    EstimatedVat = vat,
                    EstimatedPit = pit,
                    TotalEstimatedTax = vat + pit,
                    Description = isTaxable ? "Đã vượt ngưỡng miễn thuế (100 triệu VNĐ/năm)." : "Chưa đạt ngưỡng đóng thuế (< 100 triệu VNĐ/năm)."
                }
            };

            return Ok(summary);
        }

        [HttpGet("export-financial-csv")]
        public async Task<IActionResult> ExportFinancialCsv([FromQuery] int? year)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            int reportYear = year ?? DateTime.Now.Year;

            var bills = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Room)
                .Where(b => b.Room!.Property!.LandlordId == landlordId && b.BillingYear == reportYear)
                .OrderBy(b => b.BillingMonth)
                .ThenBy(b => b.Room!.RoomNumber)
                .ToListAsync();

            var csvBuilder = new System.Text.StringBuilder();
            // UTF-8 BOM for Excel Vietnamese text compatibility
            csvBuilder.AppendLine("\uFEFFMã Hóa Đơn,Tên Nhà Trọ,Số Phòng,Tháng/Năm,Tiền Phòng,Tiền Điện,Tiền Nước,Phí Dịch Vụ,Giảm Sửa Chữa,Tổng Tiền,Đã Thanh Toán,Còn Nợ,Trạng Thái");

            foreach (var b in bills)
            {
                var remaining = b.TotalAmount - b.PaidAmount;
                var statusText = b.Status == "Paid" ? "Đã thanh toán" : (b.PaidAmount > 0 ? "Thanh toán 1 phần" : "Chưa thanh toán");
                var propTitle = b.Room?.Property?.Title?.Replace(",", " ") ?? "";
                var roomNum = b.Room?.RoomNumber?.Replace(",", " ") ?? "";

                csvBuilder.AppendLine($"{b.Id},{propTitle},{roomNum},{b.BillingMonth}/{b.BillingYear},{b.RoomFee},{b.ElectricityFee},{b.WaterFee},{b.ServiceFee},{b.RepairDeduction},{b.TotalAmount},{b.PaidAmount},{remaining},{statusText}");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv; charset=utf-8", $"ZHome_BaoCaoTaiChinh_{reportYear}.csv");
        }

        private static decimal ConvertToDecimal(object obj)
        {
            if (obj == null || obj == DBNull.Value) return 0;
            return Convert.ToDecimal(obj);
        }
    }
}

