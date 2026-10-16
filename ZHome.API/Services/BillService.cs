using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.Entities;

namespace ZHome.API.Services
{
    public class BillService : IBillService
    {
        private readonly ZHomeDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BillService> _logger;

        public BillService(
            ZHomeDbContext context,
            INotificationService notificationService,
            ILogger<BillService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<(bool Success, string Message)> SubmitUtilityGridAsync(long landlordId, UtilityGridSubmitDto request)
        {
            try
            {
                var landlord = await _context.Users.FindAsync(landlordId);
                if (landlord == null)
                {
                    return (false, "Không tìm thấy thông tin chủ trọ.");
                }

                if (string.IsNullOrWhiteSpace(landlord.BankName) || string.IsNullOrWhiteSpace(landlord.BankAccountNumber))
                {
                    return (false, "MISSING_BANK_ACCOUNT: Bạn chưa cập nhật số tài khoản ngân hàng. Vui lòng thiết lập thông tin ngân hàng thụ hưởng trước khi lập hóa đơn cho người thuê.");
                }

                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    foreach (var reading in request.Readings)
                    {
                        var room = await _context.Rooms
                            .Include(r => r.Property)
                            .FirstOrDefaultAsync(r => r.Id == reading.RoomId && r.Property!.LandlordId == landlordId);

                        if (room == null) continue;

                        var activeContract = await _context.Contracts
                            .Where(c => c.RoomId == room.Id && c.Status == "Active")
                            .FirstOrDefaultAsync();
                        var actualRoomPrice = activeContract != null ? activeContract.RoomPrice : room.Price;

                        // Calculate water fee based on method
                        decimal calculatedWaterFee;
                        if (reading.WaterCalculationMethod == "PerPerson")
                        {
                            var count = reading.OccupantsCount > 0 ? reading.OccupantsCount : 1;
                            calculatedWaterFee = count * reading.WaterPerPersonRate;
                        }
                        else
                        {
                            calculatedWaterFee = (reading.NewWaterReading - reading.OldWaterReading) * reading.WaterRate;
                        }

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
                            existingBill.WaterFee = calculatedWaterFee;
                            existingBill.ServiceFee = reading.ServiceFee;
                            existingBill.RepairDeduction = reading.RepairDeduction;
                            existingBill.TotalAmount = actualRoomPrice + existingBill.ElectricityFee + existingBill.WaterFee + reading.ServiceFee - reading.RepairDeduction;

                            if (existingBill.PaidAmount >= existingBill.TotalAmount) existingBill.Status = "Paid";
                            else if (existingBill.PaidAmount > 0) existingBill.Status = "Partial";
                            else existingBill.Status = "Unpaid";
                        }
                        else
                        {
                            var electricityFee = (reading.NewElectricityReading - reading.OldElectricityReading) * reading.ElectricityRate;
                            var waterFee = calculatedWaterFee;
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
                    return (true, "Ghi chỉ số và tạo hóa đơn thành công!");
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during SubmitUtilityGridAsync for landlord {LandlordId}", landlordId);
                return (false, "Lỗi xảy ra trong quá trình cập nhật hóa đơn: " + ex.Message);
            }
        }

        public async Task<(bool Success, string Message, MonthlyBill? Bill)> ConfirmPaymentAsync(
            long billId,
            long landlordId,
            bool isAdmin,
            decimal? amount,
            string? note)
        {
            var bill = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Contracts)
                        .ThenInclude(c => c.Tenant)
                .FirstOrDefaultAsync(b => b.Id == billId);

            if (bill == null)
            {
                return (false, "Không tìm thấy hóa đơn.", null);
            }

            if (!isAdmin && bill.Room?.Property?.LandlordId != landlordId)
            {
                return (false, "Bạn không có quyền xác nhận hóa đơn này.", null);
            }

            try
            {
                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    decimal confirmAmount = amount ?? (bill.TotalAmount - bill.PaidAmount);
                    if (confirmAmount <= 0) confirmAmount = bill.TotalAmount;

                    bill.PaidAmount += confirmAmount;
                    if (bill.PaidAmount >= bill.TotalAmount)
                    {
                        bill.Status = "Paid";
                        bill.PaidAt = DateTime.UtcNow;
                    }
                    else
                    {
                        bill.Status = "Partial";
                    }

                    var activeContracts = bill.Room?.Contracts?.Where(c => c.Status == "Active").ToList() ?? new List<Contract>();
                    long tenantId = activeContracts.FirstOrDefault()?.TenantId ?? 0;

                    var transaction = new BillTransaction
                    {
                        MonthlyBillId = bill.Id,
                        TenantId = tenantId > 0 ? tenantId : landlordId,
                        Amount = confirmAmount,
                        CreatedAt = DateTime.UtcNow,
                        Note = !string.IsNullOrWhiteSpace(note) ? note : "Chủ trọ xác nhận đã nhận chuyển khoản"
                    };

                    _context.BillTransactions.Add(transaction);
                    await _context.SaveChangesAsync();

                    // Send real-time notification to tenant(s)
                    foreach (var contract in activeContracts)
                    {
                        await _notificationService.CreateNotificationAsync(
                            userId: contract.TenantId,
                            title: "Chủ trọ đã xác nhận thanh toán tiền phòng",
                            message: $"Hóa đơn tiền phòng tháng {bill.BillingMonth}/{bill.BillingYear} (Phòng {bill.Room?.RoomNumber}, {bill.Room?.Property?.Title}) số tiền {confirmAmount:N0}đ đã được chủ trọ xác nhận thành công!",
                            type: "PaymentConfirmed",
                            targetUrl: "/tenant/bills",
                            referenceId: bill.Id
                        );
                    }

                    return (true, "Đã xác nhận nhận tiền thành công!", bill);
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment for bill {BillId}", billId);
                return (false, "Lỗi xảy ra trong quá trình xác nhận thanh toán: " + ex.Message, null);
            }
        }

        public async Task<(bool Success, string Message, MonthlyBill? Bill)> RejectPaymentAsync(
            long billId,
            long landlordId,
            bool isAdmin,
            string? reason)
        {
            var bill = await _context.MonthlyBills
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Property)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Contracts)
                        .ThenInclude(c => c.Tenant)
                .FirstOrDefaultAsync(b => b.Id == billId);

            if (bill == null)
            {
                return (false, "Không tìm thấy hóa đơn.", null);
            }

            if (!isAdmin && bill.Room?.Property?.LandlordId != landlordId)
            {
                return (false, "Bạn không có quyền từ chối hóa đơn này.", null);
            }

            try
            {
                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    // Revert status back based on paid amount
                    if (bill.PaidAmount > 0)
                    {
                        bill.Status = "Partial";
                    }
                    else
                    {
                        bill.Status = "Unpaid";
                    }

                    var rejectReason = !string.IsNullOrWhiteSpace(reason) ? reason : "Chưa nhận được khoản chuyển vào tài khoản";
                    bill.Note = $"[Từ chối lúc {DateTime.UtcNow:dd/MM/yyyy HH:mm}]: {rejectReason}";
                    bill.ProofImageUrl = null;

                    await _context.SaveChangesAsync();

                    // Send notification to tenant(s)
                    var activeContracts = bill.Room?.Contracts?.Where(c => c.Status == "Active").ToList() ?? new List<Contract>();
                    foreach (var contract in activeContracts)
                    {
                        await _notificationService.CreateNotificationAsync(
                            userId: contract.TenantId,
                            title: "Báo cáo chuyển tiền bị từ chối",
                            message: $"Chủ trọ từ chối xác nhận thanh toán hóa đơn tháng {bill.BillingMonth}/{bill.BillingYear} (Phòng {bill.Room?.RoomNumber}). Lý do: {rejectReason}. Vui lòng kiểm tra lại!",
                            type: "PaymentRejected",
                            targetUrl: "/tenant/bills",
                            referenceId: bill.Id
                        );
                    }

                    return (true, "Đã từ chối báo cáo chuyển tiền và thông báo tới khách thuê.", bill);
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting payment for bill {BillId}", billId);
                return (false, "Lỗi xảy ra trong quá trình từ chối thanh toán: " + ex.Message, null);
            }
        }
    }
}
