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
    [Authorize(Roles = "Administrator")]
    public class AdminController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly Services.INotificationService _notificationService;
        private readonly Services.IMediaStorageService _mediaStorage;

        public AdminController(
            ZHomeDbContext context, 
            Services.INotificationService notificationService,
            Services.IMediaStorageService mediaStorage)
        {
            _context = context;
            _notificationService = notificationService;
            _mediaStorage = mediaStorage;
        }

        // Tạo tài khoản Quản trị viên mới (CHỈ ADMIN ĐANG ĐĂNG NHẬP MỚI CÓ QUYỀN GỌI)
        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdminAccount([FromBody] CreateAdminRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(request.Phone, @"^0[35789]\d{8}$"))
            {
                return BadRequest("Số điện thoại không hợp lệ. Phải gồm 10 chữ số, bắt đầu bằng 0 và chữ số tiếp theo là 3, 5, 7, 8 hoặc 9.");
            }

            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone))
            {
                return BadRequest("Số điện thoại này đã tồn tại trên hệ thống.");
            }

            if (!string.IsNullOrEmpty(request.Email) && await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email này đã được sử dụng.");
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return BadRequest("Mật khẩu cho Quản trị viên phải từ 8 ký tự trở lên để đảm bảo an toàn.");
            }

            // Tìm Role Administrator
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Administrator");
            if (adminRole == null)
            {
                adminRole = new Role
                {
                    RoleName = "Administrator"
                };
                _context.Roles.Add(adminRole);
                await _context.SaveChangesAsync();
            }

            var newAdmin = new User
            {
                Phone = request.Phone,
                Email = request.Email,
                FullName = request.FullName,
                RoleId = adminRole.Id,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                VerificationStatus = "Approved",
                SubscriptionId = 3, // Premium package
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newAdmin);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo tài khoản Quản trị viên thành công!",
                admin = new
                {
                    UserId = newAdmin.Id,
                    FullName = newAdmin.FullName,
                    Phone = newAdmin.Phone,
                    Email = newAdmin.Email,
                    Role = "Administrator"
                }
            });
        }

        // Get all landlord verification requests
        [HttpGet("verifications")]
        public async Task<IActionResult> GetVerifications()
        {
            var verifications = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Landlord")
                .OrderByDescending(u => u.VerificationStatus == "Pending" ? 1 : 0)
                .ThenByDescending(u => u.Id)
                .Select(u => new
                {
                    UserId = u.Id,
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Email = u.Email,
                    CccdNumber = u.CccdNumber ?? "Chưa cập nhật",
                    CccdFrontUrl = u.CccdFrontUrl,
                    CccdBackUrl = u.CccdBackUrl,
                    Status = u.VerificationStatus ?? "Pending",
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
                title: "Tài khoản Chủ trọ đã được phê duyệt",
                message: "Chúc mừng! Tài khoản Chủ trọ và hồ sơ xác thực của bạn đã được Quản trị viên ZHome phê duyệt thành công. Bạn đã có thể đăng nhập và quản lý nhà trọ!",
                type: "LandlordVerification",
                targetUrl: "/landlord/overview",
                referenceId: userId
            );

            return Ok(new { message = "Đã phê duyệt tài khoản chủ trọ thành công!" });
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
            string reason = !string.IsNullOrWhiteSpace(request?.Reason) ? request.Reason : "Ảnh hoặc thông tin đăng ký chưa hợp lệ.";
            await _notificationService.CreateNotificationAsync(
                userId: userId,
                title: "Yêu cầu xét duyệt chủ trọ bị từ chối",
                message: $"Hồ sơ đăng ký chủ trọ của bạn đã bị từ chối. Lý do: {reason}. Vui lòng liên hệ Quản trị viên ZHome để được hỗ trợ.",
                type: "LandlordVerification",
                targetUrl: "/login",
                referenceId: userId
            );

            return Ok(new { message = "Đã từ chối xét duyệt chủ trọ." });
        }

        // Cập nhật/thay thế ảnh CCCD của chủ trọ trực tiếp bởi Admin
        [HttpPut("verifications/{userId}/cccd")]
        public async Task<IActionResult> UpdateLandlordCccd(long userId, [FromBody] UpdateLandlordCccdRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            if (!string.IsNullOrWhiteSpace(request.CccdNumber))
            {
                user.CccdNumber = request.CccdNumber;
            }

            if (!string.IsNullOrEmpty(request.CccdFrontBase64) && request.CccdFrontBase64.StartsWith("data:image"))
            {
                try
                {
                    user.CccdFrontUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdFrontBase64, "cards", "cccd_front", user.Phone);
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh mặt trước CCCD: " + ex.Message);
                }
            }

            if (!string.IsNullOrEmpty(request.CccdBackBase64) && request.CccdBackBase64.StartsWith("data:image"))
            {
                try
                {
                    user.CccdBackUrl = await _mediaStorage.SaveBase64ImageAsync(request.CccdBackBase64, "cards", "cccd_back", user.Phone);
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh mặt sau CCCD: " + ex.Message);
                }
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã cập nhật ảnh CCCD thành công!",
                cccdNumber = user.CccdNumber,
                cccdFrontUrl = user.CccdFrontUrl,
                cccdBackUrl = user.CccdBackUrl
            });
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
            var pendingVerifications = await _context.Users.CountAsync(u => u.Role != null && u.Role.RoleName == "Landlord" && (u.VerificationStatus == "Pending" || string.IsNullOrEmpty(u.VerificationStatus) || u.VerificationStatus == "None"));
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
                    .ThenInclude(r => r.Images)
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
                    ImageUrl = !string.IsNullOrEmpty(p.ImageUrl)
                        ? p.ImageUrl
                        : (p.Rooms.SelectMany(r => r.Images).Select(i => i.MediaUrl).FirstOrDefault() ?? ""),
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

        // ==========================================
        // USER MANAGEMENT (CRUD & PHÂN QUYỀN TÀI KHOẢN)
        // ==========================================

        // Lấy danh sách tất cả các Role trong hệ thống
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles.OrderBy(r => r.Id).ToListAsync();
            return Ok(roles);
        }

        // Lấy danh sách tài khoản (hỗ trợ tìm kiếm, lọc theo vai trò và trạng thái)
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? keyword, [FromQuery] int? roleId, [FromQuery] string? verificationStatus)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .Include(u => u.SubscriptionPackage)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(kw) || 
                                         u.Phone.Contains(kw) || 
                                         (u.Email != null && u.Email.ToLower().Contains(kw)) ||
                                         (u.CccdNumber != null && u.CccdNumber.Contains(kw)));
            }

            if (roleId.HasValue && roleId.Value > 0)
            {
                query = query.Where(u => u.RoleId == roleId.Value);
            }

            if (!string.IsNullOrWhiteSpace(verificationStatus))
            {
                query = query.Where(u => u.VerificationStatus == verificationStatus);
            }

            var users = await query
                .OrderByDescending(u => u.Id)
                .Select(u => new
                {
                    u.Id,
                    u.Phone,
                    u.Email,
                    u.FullName,
                    u.RoleId,
                    RoleName = u.Role != null ? u.Role.RoleName : "N/A",
                    u.AvatarUrl,
                    u.CccdNumber,
                    u.VerificationStatus,
                    u.SubscriptionId,
                    SubscriptionName = u.SubscriptionPackage != null ? u.SubscriptionPackage.Name : "Gói Tiêu Chuẩn",
                    u.SubscriptionEndDate,
                    u.CreatedAt,
                    u.UpdatedAt,
                    LastActiveAt = u.LastActiveAt ?? u.UpdatedAt,
                    LastLoginAt = u.LastLoginAt ?? u.CreatedAt,
                    TotalActivities = _context.ActivityLogs.Count(al => al.UserId == u.Id)
                })
                .ToListAsync();

            return Ok(users);
        }

        // Lấy chi tiết một tài khoản
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserById(long id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.SubscriptionPackage)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản người dùng.");
            }

            return Ok(new
            {
                user.Id,
                user.Phone,
                user.Email,
                user.FullName,
                user.RoleId,
                RoleName = user.Role != null ? user.Role.RoleName : "N/A",
                user.AvatarUrl,
                user.CccdNumber,
                user.CccdFrontUrl,
                user.CccdBackUrl,
                user.VerificationStatus,
                user.SubscriptionId,
                SubscriptionName = user.SubscriptionPackage != null ? user.SubscriptionPackage.Name : "Gói Tiêu Chuẩn",
                user.SubscriptionEndDate,
                user.CreatedAt,
                user.UpdatedAt,
                LastActiveAt = user.LastActiveAt ?? user.UpdatedAt,
                LastLoginAt = user.LastLoginAt ?? user.CreatedAt,
                TotalActivities = await _context.ActivityLogs.CountAsync(al => al.UserId == user.Id)
            });
        }

        // Lấy danh sách nhật ký hoạt động toàn hệ thống (Audit Logs)
        [HttpGet("activity-logs")]
        public async Task<IActionResult> GetActivityLogs(
            [FromQuery] long? userId,
            [FromQuery] string? role,
            [FromQuery] string? action,
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            await EnsureInitialActivityLogsSeededAsync();

            var query = _context.ActivityLogs.AsNoTracking().AsQueryable();

            if (userId.HasValue && userId.Value > 0)
            {
                query = query.Where(a => a.UserId == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(role) && !role.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a => a.UserRole.ToLower() == role.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(action) && !action.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a => a.Action.ToLower() == action.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(a => (a.UserName != null && a.UserName.ToLower().Contains(kw)) ||
                                         (a.Action != null && a.Action.ToLower().Contains(kw)) ||
                                         (a.Description != null && a.Description.ToLower().Contains(kw)) ||
                                         (a.IpAddress != null && a.IpAddress.Contains(kw)));
            }

            var totalItems = await query.CountAsync();
            if (page < 1) page = 1;
            if (pageSize < 5) pageSize = 5;
            if (pageSize > 100) pageSize = 100;

            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    a.UserName,
                    a.UserRole,
                    a.Action,
                    a.Description,
                    a.IpAddress,
                    a.UserAgent,
                    a.CreatedAt
                })
                .ToListAsync();

            // Statistics for header dashboard
            var today = DateTime.UtcNow.Date;
            var todayActivities = await _context.ActivityLogs.CountAsync(a => a.CreatedAt >= today);
            var activeUsersToday = await _context.ActivityLogs
                .Where(a => a.CreatedAt >= today && a.UserId != null)
                .Select(a => a.UserId)
                .Distinct()
                .CountAsync();
            var totalLogins = await _context.ActivityLogs.CountAsync(a => a.Action == "Đăng nhập");

            return Ok(new
            {
                items,
                totalItems,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalItems / pageSize),
                stats = new
                {
                    totalActivities = await _context.ActivityLogs.CountAsync(),
                    todayActivities,
                    activeUsersToday,
                    totalLogins
                }
            });
        }

        // Lấy lịch sử thời gian hoạt động chi tiết của một tài khoản cụ thể
        [HttpGet("users/{id}/activity-logs")]
        public async Task<IActionResult> GetUserActivityLogs(long id)
        {
            await EnsureInitialActivityLogsSeededAsync();

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound("Không tìm thấy tài khoản người dùng.");
            }

            var logs = await _context.ActivityLogs
                .AsNoTracking()
                .Where(a => a.UserId == id)
                .OrderByDescending(a => a.CreatedAt)
                .Take(100)
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    a.UserName,
                    a.UserRole,
                    a.Action,
                    a.Description,
                    a.IpAddress,
                    a.UserAgent,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Phone,
                    user.Email,
                    RoleName = user.Role != null ? user.Role.RoleName : "N/A",
                    user.CreatedAt,
                    user.UpdatedAt,
                    LastActiveAt = user.LastActiveAt ?? user.UpdatedAt,
                    LastLoginAt = user.LastLoginAt ?? user.CreatedAt,
                    TotalActivities = logs.Count
                },
                logs
            });
        }

        private async Task EnsureInitialActivityLogsSeededAsync()
        {
            if (await _context.ActivityLogs.AnyAsync()) return;

            try
            {
                var users = await _context.Users.Include(u => u.Role).ToListAsync();
                var logs = new List<ActivityLog>();

                foreach (var u in users)
                {
                    var roleName = u.Role?.RoleName ?? "Tenant";
                    var regTime = u.CreatedAt;
                    var lastAct = u.LastActiveAt ?? u.UpdatedAt;

                    // Log đăng ký tài khoản
                    logs.Add(new ActivityLog
                    {
                        UserId = u.Id,
                        UserName = u.FullName,
                        UserRole = roleName,
                        Action = "Đăng ký tài khoản",
                        Description = $"Đăng ký tài khoản thành công với vai trò {roleName}",
                        IpAddress = "127.0.0.1",
                        UserAgent = "Chrome / Windows 11",
                        CreatedAt = regTime
                    });

                    // Log đăng nhập
                    logs.Add(new ActivityLog
                    {
                        UserId = u.Id,
                        UserName = u.FullName,
                        UserRole = roleName,
                        Action = "Đăng nhập",
                        Description = $"Đăng nhập thành công vào hệ thống ZHome",
                        IpAddress = "127.0.0.1",
                        UserAgent = "Chrome / Windows 11",
                        CreatedAt = lastAct.AddMinutes(-15)
                    });

                    if (roleName == "Landlord")
                    {
                        logs.Add(new ActivityLog
                        {
                            UserId = u.Id,
                            UserName = u.FullName,
                            UserRole = roleName,
                            Action = "Quản lý nhà trọ",
                            Description = $"Truy cập quản lý danh sách nhà trọ và cấu hình tầng phòng",
                            IpAddress = "127.0.0.1",
                            UserAgent = "Chrome / Windows 11",
                            CreatedAt = lastAct
                        });
                    }
                    else if (roleName == "Administrator")
                    {
                        logs.Add(new ActivityLog
                        {
                            UserId = u.Id,
                            UserName = u.FullName,
                            UserRole = roleName,
                            Action = "Quản trị hệ thống",
                            Description = $"Kiểm tra quản trị hệ thống, dữ liệu tài khoản và nhà trọ",
                            IpAddress = "127.0.0.1",
                            UserAgent = "Chrome / Windows 11",
                            CreatedAt = lastAct
                        });
                    }
                    else
                    {
                        logs.Add(new ActivityLog
                        {
                            UserId = u.Id,
                            UserName = u.FullName,
                            UserRole = roleName,
                            Action = "Tìm kiếm phòng",
                            Description = $"Tìm kiếm và xem thông tin chi tiết phòng trọ",
                            IpAddress = "127.0.0.1",
                            UserAgent = "Chrome / Windows 11",
                            CreatedAt = lastAct
                        });
                    }
                }

                _context.ActivityLogs.AddRange(logs);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Seed Activity Logs Warning] {ex.Message}");
            }
        }

        // Tạo tài khoản mới bởi Quản trị viên
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(request.Phone, @"^0[35789]\d{8}$"))
            {
                return BadRequest("Số điện thoại không hợp lệ. Phải gồm 10 chữ số, bắt đầu bằng 0 và chữ số tiếp theo là 3, 5, 7, 8 hoặc 9.");
            }

            if (await _context.Users.AnyAsync(u => u.Phone == request.Phone))
            {
                return BadRequest("Số điện thoại này đã tồn tại trên hệ thống.");
            }

            if (!string.IsNullOrEmpty(request.Email) && await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email này đã được sử dụng bởi tài khoản khác.");
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            {
                return BadRequest("Mật khẩu phải từ 6 ký tự trở lên.");
            }

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
            if (role == null)
            {
                return BadRequest("Vai trò (Role) không hợp lệ.");
            }

            var newUser = new User
            {
                Phone = request.Phone,
                Email = request.Email,
                FullName = request.FullName,
                RoleId = request.RoleId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                VerificationStatus = string.IsNullOrWhiteSpace(request.VerificationStatus) ? "None" : request.VerificationStatus,
                SubscriptionId = request.SubscriptionId ?? 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo tài khoản thành công!",
                userId = newUser.Id
            });
        }

        // Cập nhật thông tin & phân quyền tài khoản
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(long id, [FromBody] AdminUpdateUserRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound("Không tìm thấy người dùng.");
            }

            // Kiểm tra trùng SĐT nếu thay đổi
            if (!string.IsNullOrWhiteSpace(request.Phone) && request.Phone != user.Phone)
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.Phone, @"^0[35789]\d{8}$"))
                {
                    return BadRequest("Số điện thoại không hợp lệ.");
                }
                if (await _context.Users.AnyAsync(u => u.Phone == request.Phone && u.Id != id))
                {
                    return BadRequest("Số điện thoại này đã được tài khoản khác sử dụng.");
                }
                user.Phone = request.Phone;
            }

            // Kiểm tra trùng Email nếu thay đổi
            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                {
                    return BadRequest("Email này đã được tài khoản khác sử dụng.");
                }
                user.Email = request.Email;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName;
            }

            // Cập nhật vai trò / phân quyền
            if (request.RoleId > 0 && request.RoleId != user.RoleId)
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
                if (role != null)
                {
                    user.RoleId = request.RoleId;
                }
            }

            if (!string.IsNullOrEmpty(request.VerificationStatus))
            {
                user.VerificationStatus = request.VerificationStatus;
            }

            if (request.SubscriptionId.HasValue && request.SubscriptionId.Value > 0)
            {
                user.SubscriptionId = request.SubscriptionId.Value;
            }

            // Nếu Admin đổi mật khẩu mới cho user
            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                if (request.NewPassword.Length < 6)
                {
                    return BadRequest("Mật khẩu mới phải từ 6 ký tự trở lên.");
                }
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật tài khoản thành công!" });
        }

        // Phân quyền nhanh cho tài khoản (Chỉ đổi Role)
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> AssignRole(long id, [FromBody] AssignRoleRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound("Không tìm thấy người dùng.");
            }

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId);
            if (role == null)
            {
                return BadRequest("Vai trò không hợp lệ.");
            }

            user.RoleId = request.RoleId;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã cập nhật vai trò tài khoản thành '{role.RoleName}' thành công!" });
        }

        // Xóa tài khoản người dùng
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            // Lấy ID admin đang đăng nhập từ claim để chống tự xóa chính mình
            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(currentUserIdStr, out var currentUserId) && currentUserId == id)
            {
                return BadRequest("Bạn không thể tự xóa tài khoản của chính mình khi đang đăng nhập.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
            {
                return NotFound("Không tìm thấy người dùng.");
            }

            // Xóa người dùng
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tài khoản người dùng thành công!" });
        }
    }

    public class AdminCreateUserRequest
    {
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string? VerificationStatus { get; set; }
        public int? SubscriptionId { get; set; }
    }

    public class AdminUpdateUserRequest
    {
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? NewPassword { get; set; }
        public int RoleId { get; set; }
        public string? VerificationStatus { get; set; }
        public int? SubscriptionId { get; set; }
    }

    public class AssignRoleRequest
    {
        public int RoleId { get; set; }
    }

    public class RejectRequest
    {
        public string? Reason { get; set; }
    }

    public class UpdateLandlordCccdRequest
    {
        public string? CccdNumber { get; set; }
        public string? CccdFrontBase64 { get; set; }
        public string? CccdBackBase64 { get; set; }
    }
}
