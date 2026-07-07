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

            // 1. Get room counts
            int totalRooms = await _context.Rooms
                .CountAsync(r => r.Property!.LandlordId == landlordId);

            int occupiedRooms = await _context.Rooms
                .CountAsync(r => r.Property!.LandlordId == landlordId && r.Status == "Rented");

            int vacantRooms = totalRooms - occupiedRooms;

            // 2. Get outstanding debt
            decimal outstandingDebt = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Where(b => b.Room!.Property!.LandlordId == landlordId && b.Status != "Paid")
                .SumAsync(b => b.TotalAmount - b.PaidAmount);

            // 3. Get total revenue (Paid bills)
            decimal totalRevenue = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Where(b => b.Room!.Property!.LandlordId == landlordId)
                .SumAsync(b => b.PaidAmount);

            // 4. Load stored procedure report
            var summary = new FinancialSummaryDto
            {
                TotalRoomsCount = totalRooms,
                OccupiedRoomsCount = occupiedRooms,
                VacantRoomsCount = vacantRooms,
                TotalRevenue = totalRevenue,
                OutstandingDebt = outstandingDebt
            };

            try
            {
                var connection = _context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "sp_GetLandlordRevenueAndTaxReport";
                    command.CommandType = CommandType.StoredProcedure;

                    // Add LandlordId param
                    var paramLandlord = command.CreateParameter();
                    paramLandlord.ParameterName = "@LandlordId";
                    paramLandlord.Value = landlordId;
                    command.Parameters.Add(paramLandlord);

                    // Add Year param
                    var paramYear = command.CreateParameter();
                    paramYear.ParameterName = "@Year";
                    paramYear.Value = reportYear;
                    command.Parameters.Add(paramYear);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        // First Result Set: Tax Forecast
                        if (await reader.ReadAsync())
                        {
                            summary.TaxForecast = new TaxForecastDto
                            {
                                TotalAnnualRevenue = ConvertToDecimal(reader["total_annual_revenue"]),
                                TaxThreshold = ConvertToDecimal(reader["tax_threshold"]),
                                IsTaxable = Convert.ToInt32(reader["is_taxable"]) == 1,
                                EstimatedVat = ConvertToDecimal(reader["annual_vat_due"]),
                                EstimatedPit = ConvertToDecimal(reader["annual_pit_due"]),
                                TotalEstimatedTax = ConvertToDecimal(reader["total_annual_tax"]),
                                Description = reader["tax_note"]?.ToString() ?? string.Empty
                            };
                        }

                        // Second Result Set: Monthly details
                        if (await reader.NextResultAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                summary.MonthlyRevenues.Add(new MonthlyRevenueItemDto
                                {
                                    Month = Convert.ToInt32(reader["Month"]),
                                    PaidRevenue = ConvertToDecimal(reader["paid_revenue"]),
                                    UnpaidRevenue = ConvertToDecimal(reader["unpaid_revenue"]),
                                    TotalBilledAmount = ConvertToDecimal(reader["total_billed_amount"])
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Fallback details if SP fails or returns different output structure in SQLEXPRESS
                summary.TaxForecast = new TaxForecastDto
                {
                    TotalAnnualRevenue = totalRevenue,
                    TaxThreshold = 100000000m,
                    IsTaxable = totalRevenue > 100000000m,
                    EstimatedVat = totalRevenue > 100000000m ? totalRevenue * 0.05m : 0,
                    EstimatedPit = totalRevenue > 100000000m ? totalRevenue * 0.05m : 0,
                    TotalEstimatedTax = totalRevenue > 100000000m ? totalRevenue * 0.10m : 0,
                    Description = "Fallback calculation. Error calling Stored Procedure: " + ex.Message
                };
            }

            return Ok(summary);
        }

        private static decimal ConvertToDecimal(object obj)
        {
            if (obj == null || obj == DBNull.Value) return 0;
            return Convert.ToDecimal(obj);
        }
    }
}
