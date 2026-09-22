using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ZHome.API.Data;
using ZHome.API.Models.DTOs;
using ZHome.API.Services;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly ISePayService _sePayService;
        private readonly PaymentOrderStore _orderStore;
        private readonly ILogger<SubscriptionController> _logger;

        public SubscriptionController(
            ZHomeDbContext context,
            ISePayService sePayService,
            PaymentOrderStore orderStore,
            ILogger<SubscriptionController> logger)
        {
            _context = context;
            _sePayService = sePayService;
            _orderStore = orderStore;
            _logger = logger;
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

            // Grant subscription directly
            user.SubscriptionId = package.Id;

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

        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("create-sepay-payment")]
        [HttpPost("create-payos-payment")] // Backwards compatibility alias
        public async Task<IActionResult> CreateSePayPayment([FromBody] CreateSePayPaymentRequestDto request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Người dùng không tồn tại." });
            }

            var package = await _context.SubscriptionPackages.FindAsync(request.PackageId);
            if (package == null)
            {
                return NotFound(new { message = "Gói cước không tồn tại." });
            }

            int months = request.Months > 0 ? request.Months : 1;
            decimal totalAmount = package.Price * months;

            // Generate unique numeric OrderCode (yyMMddHHmmss + random 2 digits)
            long orderCode = long.Parse(DateTime.UtcNow.ToString("yyMMddHHmmss") + Random.Shared.Next(10, 99));

            // Create payment details & SePay VietQR link
            var paymentResult = _sePayService.CreatePaymentInfo(
                orderCode,
                totalAmount,
                package.Name,
                package.Id,
                months,
                user.Email ?? ""
            );

            // Store order details in order store
            _orderStore.AddOrder(new PendingPaymentOrder
            {
                OrderCode = orderCode,
                OrderType = "SUBSCRIPTION",
                UserId = userId,
                PackageId = package.Id,
                PackageName = package.Name,
                Months = months,
                Amount = totalAmount,
                Status = "PENDING"
            });

            return Ok(paymentResult);
        }

        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("check-order-status/{orderCode}")]
        public async Task<IActionResult> CheckOrderStatus(long orderCode)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            long.TryParse(userIdStr, out long currentUserId);

            var order = _orderStore.GetOrder(orderCode);
            if (order == null)
            {
                return NotFound(new { message = "Mã đơn hàng không tồn tại hoặc đã hết hạn." });
            }

            long userId = order.UserId > 0 ? order.UserId : currentUserId;
            int packageId = order.PackageId;
            int months = order.Months > 0 ? order.Months : 1;

            bool isPaid = order.Status == "PAID";

            if (!isPaid)
            {
                // Check SePay API if configured
                bool isPaidOnSePay = await _sePayService.CheckTransactionFromSePayAsync($"ZH{orderCode}", order.Amount);
                if (isPaidOnSePay)
                {
                    isPaid = true;
                    _orderStore.MarkPaid(orderCode, out _);

                    if (userId > 0)
                    {
                        var user = await _context.Users.FindAsync(userId);
                        if (user != null)
                        {
                            user.SubscriptionId = packageId;
                            if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow)
                            {
                                user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(months);
                            }
                            else
                            {
                                user.SubscriptionEndDate = DateTime.UtcNow.AddMonths(months);
                            }
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Order {OrderCode} verified via SePay API. User {UserId} upgraded to package {PackageId} until {EndDate}", 
                                orderCode, userId, packageId, user.SubscriptionEndDate);
                        }
                    }
                }
            }

            var updatedUser = userId > 0 ? await _context.Users.FindAsync(userId) : null;

            return Ok(new
            {
                orderCode = orderCode,
                status = isPaid ? "PAID" : order.Status,
                isPaid = isPaid,
                packageId = isPaid ? (updatedUser?.SubscriptionId ?? packageId) : packageId,
                packageName = order.PackageName,
                amount = order.Amount,
                paidAt = order.PaidAt,
                subscriptionId = updatedUser?.SubscriptionId ?? 1,
                subscriptionEndDate = updatedUser?.SubscriptionEndDate
            });
        }

        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("verify-my-payments")]
        public async Task<IActionResult> VerifyMyPayments()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            var pendingOrders = _orderStore.GetUserPendingOrders(userId);
            bool updated = false;

            foreach (var order in pendingOrders)
            {
                bool isPaidOnSePay = await _sePayService.CheckTransactionFromSePayAsync($"ZH{order.OrderCode}", order.Amount);
                if (isPaidOnSePay)
                {
                    _orderStore.MarkPaid(order.OrderCode, out _);
                    user.SubscriptionId = order.PackageId;
                    if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow)
                    {
                        user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(order.Months);
                    }
                    else
                    {
                        user.SubscriptionEndDate = DateTime.UtcNow.AddMonths(order.Months);
                    }
                    updated = true;
                    _logger.LogInformation("Order {OrderCode} verified in verify-my-payments. User {UserId} upgraded to package {PackageId}", 
                        order.OrderCode, userId, order.PackageId);
                }
            }

            if (updated)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                updated = updated,
                subscriptionId = user.SubscriptionId ?? 1,
                subscriptionEndDate = user.SubscriptionEndDate,
                hasActiveSubscription = user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow
            });
        }

        /// <summary>
        /// SePay Webhook endpoint - Automatically triggers when money is transferred
        /// </summary>
        [HttpPost("sepay-webhook")]
        [HttpPost("payos-webhook")] // Backwards compatibility alias
        public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookDto webhookData)
        {
            _logger.LogInformation("Received SePay Webhook: {Data}", JsonSerializer.Serialize(webhookData));

            if (webhookData == null)
            {
                return BadRequest(new { success = false, message = "Invalid webhook payload" });
            }

            // Verify SePay API Key / Token in Authorization header
            string? authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (!_sePayService.VerifyWebhookToken(authHeader))
            {
                _logger.LogWarning("SePay Webhook authentication failed.");
                return Unauthorized(new { success = false, message = "Invalid SePay authorization token" });
            }

            string content = webhookData.Content ?? "";
            decimal transferAmount = webhookData.TransferAmount;

            // Check if it's a Subscription payment (ZH{orderCode})
            var zhMatch = Regex.Match(content, @"ZH\s*(\d+)", RegexOptions.IgnoreCase);
            long orderCode = 0;
            if (zhMatch.Success && long.TryParse(zhMatch.Groups[1].Value, out long parsedOrderCode))
            {
                orderCode = parsedOrderCode;
            }
            else
            {
                var digitsMatch = Regex.Match(content, @"\b(\d{12,18})\b");
                if (digitsMatch.Success && long.TryParse(digitsMatch.Value, out long parsedDigits))
                {
                    if (_orderStore.GetOrder(parsedDigits) != null)
                    {
                        orderCode = parsedDigits;
                    }
                }
            }

            if (orderCode > 0)
            {
                var order = _orderStore.GetOrder(orderCode);
                if (order != null && order.Status != "PAID")
                {
                    // Check amount
                    if (order.Amount > 0 && transferAmount < (order.Amount - 100))
                    {
                        _logger.LogWarning("Webhook transfer amount {TransferAmount} is less than required {OrderAmount} for order {OrderCode}", 
                            transferAmount, order.Amount, orderCode);
                        return Ok(new { success = false, message = "Số tiền thanh toán không đủ." });
                    }

                    _orderStore.MarkPaid(orderCode, out _);

                    var user = await _context.Users.FindAsync(order.UserId);
                    if (user != null)
                    {
                        user.SubscriptionId = order.PackageId;
                        if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow)
                        {
                            user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(order.Months);
                        }
                        else
                        {
                            user.SubscriptionEndDate = DateTime.UtcNow.AddMonths(order.Months);
                        }
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Order {OrderCode} verified via SePay Webhook. User {UserId} upgraded to package {PackageId}", 
                            orderCode, user.Id, order.PackageId);
                    }
                }
            }

            // Check if it's a Bill payment (HD{billId})
            var hdMatch = Regex.Match(content, @"HD(\d+)", RegexOptions.IgnoreCase);
            if (hdMatch.Success && long.TryParse(hdMatch.Groups[1].Value, out long extractedBillId))
            {
                var bill = await _context.MonthlyBills.FindAsync(extractedBillId);
                if (bill != null)
                {
                    decimal paidAmount = transferAmount > 0 ? transferAmount : (bill.TotalAmount - bill.PaidAmount);
                    bill.PaidAmount += paidAmount;
                    if (bill.PaidAmount >= bill.TotalAmount)
                    {
                        bill.Status = "Paid";
                        bill.PaidAt = DateTime.UtcNow;
                    }
                    else
                    {
                        bill.Status = "PartialPaid";
                    }

                    _context.BillTransactions.Add(new ZHome.API.Models.Entities.BillTransaction
                    {
                        MonthlyBillId = bill.Id,
                        TenantId = 0,
                        Amount = paidAmount,
                        Note = $"Thanh toán QR qua SePay Webhook (Giao dịch: {webhookData.ReferenceCode ?? webhookData.Id.ToString()}, Nội dung: {content})",
                        CreatedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { success = true, message = "Processed successfully" });
        }

        [HttpPost("simulate-sepay-success/{orderCode}")]
        [HttpPost("simulate-payos-success/{orderCode}")] // Backwards compatibility alias
        public async Task<IActionResult> SimulateSePaySuccess(long orderCode, [FromQuery] int? packageId, [FromQuery] int months = 1)
        {
            var order = _orderStore.GetOrder(orderCode);
            long userId = order?.UserId ?? 0;

            if (userId == 0)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim))
                {
                    long.TryParse(userIdClaim, out userId);
                }
            }

            if (order != null)
            {
                _orderStore.MarkPaid(orderCode, out _);
            }

            int targetPackageId = order?.PackageId ?? (packageId ?? 2);
            int targetMonths = order?.Months ?? (months > 0 ? months : 1);

            if (userId > 0)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.SubscriptionId = targetPackageId;
                    if (user.SubscriptionEndDate.HasValue && user.SubscriptionEndDate.Value > DateTime.UtcNow)
                    {
                        user.SubscriptionEndDate = user.SubscriptionEndDate.Value.AddMonths(targetMonths);
                    }
                    else
                    {
                        user.SubscriptionEndDate = DateTime.UtcNow.AddMonths(targetMonths);
                    }

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        message = "Mô phỏng thanh toán SePay thành công! Gói cước đã được cập nhật.",
                        orderCode = orderCode,
                        subscriptionId = user.SubscriptionId,
                        subscriptionEndDate = user.SubscriptionEndDate
                    });
                }
            }

            if (order == null)
            {
                return NotFound(new { message = "Mã đơn hàng không tồn tại." });
            }

            return Ok(new
            {
                message = "Mô phỏng thanh toán SePay thành công!",
                orderCode = order.OrderCode
            });
        }
    }
}
