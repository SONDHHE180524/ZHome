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

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ZHomeDbContext _context;

        public AnalyticsController(ZHomeDbContext context)
        {
            _context = context;
        }

        // 1. Ghi nhận lượt xem trang (Tracking PageView & Session)
        [HttpPost("track")]
        [AllowAnonymous]
        public async Task<IActionResult> TrackPageView([FromBody] TrackPageViewRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PageUrl))
            {
                return BadRequest("PageUrl is required.");
            }

            try
            {
                // Trích xuất thông tin người dùng nếu đang có JWT token
                long? userId = null;
                string userRole = "Guest";
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (long.TryParse(userIdStr, out long parsedId))
                {
                    userId = parsedId;
                }

                var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(roleClaim))
                {
                    userRole = roleClaim;
                }

                // Lấy IP & UserAgent
                string ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                if (Request.Headers.ContainsKey("X-Forwarded-For"))
                {
                    var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(forwarded))
                    {
                        ipAddress = forwarded.Split(',')[0].Trim();
                    }
                }

                string userAgent = Request.Headers["User-Agent"].ToString();
                string deviceType = request.DeviceType ?? DetectDeviceType(userAgent);

                // Kiểm tra hoặc tạo mới Session
                string sessionToken = request.SessionToken;
                if (string.IsNullOrWhiteSpace(sessionToken))
                {
                    sessionToken = "zh_sess_" + Guid.NewGuid().ToString("N")[..12];
                }

                var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
                if (session == null)
                {
                    session = new UserSession
                    {
                        SessionToken = sessionToken,
                        UserId = userId,
                        UserRole = userRole,
                        IpAddress = ipAddress,
                        UserAgent = userAgent.Length > 500 ? userAgent[..500] : userAgent,
                        DeviceType = deviceType,
                        StartedAt = DateTime.UtcNow,
                        LastActivityAt = DateTime.UtcNow,
                        DurationSeconds = 0,
                        PageCount = 1
                    };
                    _context.UserSessions.Add(session);
                }
                else
                {
                    session.LastActivityAt = DateTime.UtcNow;
                    session.PageCount += 1;
                    if (userId.HasValue && session.UserId == null)
                    {
                        session.UserId = userId;
                        session.UserRole = userRole;
                    }
                }

                // Ghi nhận nhật ký lượt xem trang
                var pageLog = new PageViewLog
                {
                    SessionToken = sessionToken,
                    UserId = userId,
                    UserRole = userRole,
                    PageUrl = request.PageUrl.Length > 255 ? request.PageUrl[..255] : request.PageUrl,
                    PageTitle = string.IsNullOrWhiteSpace(request.PageTitle) ? request.PageUrl : (request.PageTitle.Length > 255 ? request.PageTitle[..255] : request.PageTitle),
                    PageCategory = string.IsNullOrWhiteSpace(request.PageCategory) ? "Other" : request.PageCategory,
                    ReferrerUrl = string.IsNullOrWhiteSpace(request.ReferrerUrl) ? null : (request.ReferrerUrl.Length > 500 ? request.ReferrerUrl[..500] : request.ReferrerUrl),
                    ViewedAt = DateTime.UtcNow,
                    DurationSeconds = request.DurationSeconds > 0 ? request.DurationSeconds : 0
                };
                _context.PageViewLogs.Add(pageLog);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    sessionToken = session.SessionToken,
                    success = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Analytics Track Warning] {ex.Message}");
                return Ok(new
                {
                    sessionToken = request.SessionToken,
                    success = false
                });
            }
        }

        // 2. Cập nhật thời lượng phiên (Ping / Heartbeat khi người dùng đang trên trang)
        [HttpPost("ping")]
        [AllowAnonymous]
        public async Task<IActionResult> PingSession([FromBody] PingSessionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SessionToken))
            {
                return Ok(new { success = false });
            }

            try
            {
                var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.SessionToken == request.SessionToken);
                if (session != null)
                {
                    int increment = request.DurationIncrementSeconds > 0 && request.DurationIncrementSeconds <= 60 
                        ? request.DurationIncrementSeconds 
                        : 15;

                    session.LastActivityAt = DateTime.UtcNow;
                    session.DurationSeconds += increment;

                    // Cập nhật lượt xem trang gần nhất trong phiên
                    var latestPage = await _context.PageViewLogs
                        .Where(p => p.SessionToken == request.SessionToken)
                        .OrderByDescending(p => p.ViewedAt)
                        .FirstOrDefaultAsync();

                    if (latestPage != null)
                    {
                        latestPage.DurationSeconds += increment;
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Analytics Ping Warning] {ex.Message}");
                return Ok(new { success = false });
            }
        }

        // 3. API Báo cáo tổng quan thống kê truy cập cho Admin
        [HttpGet("admin/overview")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetAnalyticsOverview([FromQuery] int? days)
        {
            try
            {
                // Tự động seed dữ liệu mẫu 30 ngày nếu hệ thống chưa có đủ lịch sử (dưới 50 bản ghi)
                if (await _context.PageViewLogs.CountAsync() < 50)
                {
                    await AnalyticsSeeder.SeedAnalyticsDataAsync(_context);
                }

                int filterDays = days.HasValue && days.Value > 0 ? days.Value : 14;
                var cutoffDate = DateTime.UtcNow.Date.AddDays(-filterDays);
                var todayUtc = DateTime.UtcNow.Date;

                // Tải danh bạ người dùng hệ thống để hiển thị họ tên thực tế thay vì mã phiên
                var allUsers = await _context.Users.ToListAsync();
                var userDict = allUsers.ToDictionary(u => u.Id, u => u);

                // 1. Tổng số người truy cập hệ thống TỔNG TỪ LÚC LẬP HỆ THỐNG (All-Time)
                long allTimeTotalVisits = await _context.PageViewLogs.CountAsync();
                long allTimeTotalSessions = await _context.UserSessions.CountAsync();
                long allTimeTotalUniqueVisitors = await _context.UserSessions
                    .Select(s => s.IpAddress ?? s.SessionToken)
                    .Distinct()
                    .CountAsync();

                // Thống kê hôm nay
                long todayVisits = await _context.PageViewLogs
                    .Where(p => p.ViewedAt >= todayUtc)
                    .CountAsync();

                long todaySessions = await _context.UserSessions
                    .Where(s => s.StartedAt >= todayUtc)
                    .CountAsync();

                long todayUniqueVisitors = await _context.UserSessions
                    .Where(s => s.StartedAt >= todayUtc)
                    .Select(s => s.IpAddress ?? s.SessionToken)
                    .Distinct()
                    .CountAsync();

                // Lấy toàn bộ log trong dải ngày để xử lý bộ nhớ chính xác 100% không bị lệch múi giờ
                var rangePageLogs = await _context.PageViewLogs
                    .Where(p => p.ViewedAt >= cutoffDate)
                    .Select(p => new
                    {
                        p.SessionToken,
                        p.UserId,
                        p.UserRole,
                        p.PageUrl,
                        p.PageTitle,
                        p.PageCategory,
                        p.ViewedAt,
                        p.DurationSeconds
                    })
                    .ToListAsync();

                var rangeSessions = await _context.UserSessions
                    .Where(s => s.StartedAt >= cutoffDate)
                    .ToListAsync();

                // 4. Thời lượng trung bình mỗi phiên
                double avgDurationSeconds = rangeSessions.Any()
                    ? rangeSessions.Average(s => (double)s.DurationSeconds)
                    : (await _context.UserSessions.AnyAsync() ? await _context.UserSessions.AverageAsync(s => (double)s.DurationSeconds) : 0);

                string avgDurationFormatted = FormatDuration((int)avgDurationSeconds);

                // 3. Người dùng truy cập trang nào nhiều nhất, nhiều thứ 2, thứ 3 (Top Pages)
                long totalRangeVisits = rangePageLogs.Count > 0 ? rangePageLogs.Count : 1;

                var topPagesList = rangePageLogs
                    .GroupBy(p => new { p.PageUrl, p.PageTitle, p.PageCategory })
                    .Select(g => new
                    {
                        g.Key.PageUrl,
                        g.Key.PageTitle,
                        g.Key.PageCategory,
                        VisitsCount = g.Count(),
                        UniqueVisitorsCount = g.Select(x => x.SessionToken).Distinct().Count(),
                        AvgDurationSeconds = g.Average(x => (double)x.DurationSeconds)
                    })
                    .OrderByDescending(x => x.VisitsCount)
                    .Take(10)
                    .Select((item, idx) => new TopPageDto
                    {
                        Rank = idx + 1,
                        PageTitle = item.PageTitle,
                        PageUrl = item.PageUrl,
                        PageCategory = item.PageCategory,
                        VisitsCount = item.VisitsCount,
                        UniqueVisitorsCount = item.UniqueVisitorsCount,
                        Percentage = Math.Round((double)item.VisitsCount * 100.0 / totalRangeVisits, 1),
                        AvgDurationSeconds = Math.Round(item.AvgDurationSeconds, 0),
                        AvgDurationFormatted = FormatDuration((int)item.AvgDurationSeconds)
                    })
                    .ToList();

                // 2. Tổng số lượng người truy cập web theo ngày (Daily Traffic)
                var dailyTrafficList = new List<DailyTrafficDto>();
                for (int i = filterDays - 1; i >= 0; i--)
                {
                    var d = DateTime.UtcNow.Date.AddDays(-i);
                    var dStr = d.ToString("yyyy-MM-dd");

                    var dayLogs = rangePageLogs.Where(x => x.ViewedAt.ToString("yyyy-MM-dd") == dStr).ToList();
                    var daySessions = rangeSessions.Where(x => x.StartedAt.ToString("yyyy-MM-dd") == dStr).ToList();

                    dailyTrafficList.Add(new DailyTrafficDto
                    {
                        Date = dStr,
                        FormattedDate = d.ToString("dd/MM"),
                        DayOfWeek = GetVietnameseDayOfWeek(d.DayOfWeek),
                        VisitsCount = dayLogs.Count,
                        UniqueVisitorsCount = dayLogs.Select(x => x.SessionToken).Distinct().Count(),
                        SessionsCount = daySessions.Count,
                        AvgDurationSeconds = daySessions.Any()
                            ? Math.Round(daySessions.Average(x => (double)x.DurationSeconds), 0)
                            : (dayLogs.Any() ? Math.Round(dayLogs.Average(x => (double)x.DurationSeconds), 0) : 0)
                    });
                }

                // 5. Tỉ lệ người dùng truy cập từng ngày tính hết các trang mà chủ trọ vs sinh viên truy cập được
                var dailyPageRatiosList = new List<DailyPageRatioDto>();
                for (int i = filterDays - 1; i >= 0; i--)
                {
                    var d = DateTime.UtcNow.Date.AddDays(-i);
                    var dStr = d.ToString("yyyy-MM-dd");

                    var dayLogs = rangePageLogs.Where(x => x.ViewedAt.ToString("yyyy-MM-dd") == dStr).ToList();
                    long totalDayVisits = dayLogs.Count;

                    long home = dayLogs.Count(x => x.PageCategory == "Homepage");
                    long viewTro = dayLogs.Count(x => x.PageCategory == "ViewTro");
                    long ghepTro = dayLogs.Count(x => x.PageCategory == "GhepTro");
                    long landlord = dayLogs.Count(x => x.PageCategory == "LandlordArea");
                    long tenant = dayLogs.Count(x => x.PageCategory == "TenantArea");
                    long other = totalDayVisits - (home + viewTro + ghepTro + landlord + tenant);
                    if (other < 0) other = 0;

                    double safeTotal = totalDayVisits > 0 ? (double)totalDayVisits : 1.0;

                    dailyPageRatiosList.Add(new DailyPageRatioDto
                    {
                        Date = dStr,
                        FormattedDate = d.ToString("dd/MM"),
                        TotalVisits = totalDayVisits,
                        HomepageVisits = home,
                        HomepageRatio = totalDayVisits > 0 ? Math.Round((double)home * 100.0 / safeTotal, 1) : 0,
                        ViewTroVisits = viewTro,
                        ViewTroRatio = totalDayVisits > 0 ? Math.Round((double)viewTro * 100.0 / safeTotal, 1) : 0,
                        GhepTroVisits = ghepTro,
                        GhepTroRatio = totalDayVisits > 0 ? Math.Round((double)ghepTro * 100.0 / safeTotal, 1) : 0,
                        LandlordVisits = landlord,
                        LandlordRatio = totalDayVisits > 0 ? Math.Round((double)landlord * 100.0 / safeTotal, 1) : 0,
                        TenantVisits = tenant,
                        TenantRatio = totalDayVisits > 0 ? Math.Round((double)tenant * 100.0 / safeTotal, 1) : 0,
                        OtherVisits = other,
                        OtherRatio = totalDayVisits > 0 ? Math.Round((double)other * 100.0 / safeTotal, 1) : 0
                    });
                }

                // Phân bố vai trò người dùng (Sinh viên vs Chủ trọ vs Khách vãng lai vs Admin)
                var roleDistList = rangePageLogs
                    .GroupBy(p => p.UserRole)
                    .Select(g => new RoleDistributionDto
                    {
                        RoleKey = g.Key,
                        RoleName = g.Key switch
                        {
                            "Tenant" => "Sinh viên / Khách thuê",
                            "Landlord" => "Chủ nhà trọ",
                            "Administrator" => "Quản trị viên (Admin)",
                            _ => "Khách vãng lai (Chưa đăng nhập)"
                        },
                        VisitsCount = g.Count(),
                        Percentage = Math.Round((double)g.Count() * 100.0 / totalRangeVisits, 1)
                    })
                    .ToList();

                // 6. THỐNG KÊ AI TRUY CẬP NHIỀU NHẤT & THỜI GIAN HOẠT ĐỘNG BAO NHIÊU
                var topActiveUsers = rangeSessions
                    .Where(s => s.UserId.HasValue)
                    .GroupBy(s => s.UserId!.Value)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        TotalDuration = g.Sum(x => x.DurationSeconds),
                        SessionsCount = g.Count(),
                        TotalVisits = g.Sum(x => x.PageCount),
                        LastActive = g.Max(x => x.LastActivityAt),
                        Device = g.OrderByDescending(x => x.LastActivityAt).First().DeviceType ?? "Desktop",
                        Role = g.OrderByDescending(x => x.LastActivityAt).First().UserRole
                    })
                    .OrderByDescending(x => x.TotalDuration)
                    .Take(10)
                    .Select((ug, idx) =>
                    {
                        userDict.TryGetValue(ug.UserId, out var uInfo);
                        return new TopActiveUserDto
                        {
                            Rank = idx + 1,
                            UserId = ug.UserId,
                            FullName = uInfo?.FullName ?? $"Tài khoản #{ug.UserId}",
                            Phone = uInfo?.Phone ?? string.Empty,
                            UserRole = ug.Role,
                            RoleDisplay = GetRoleDisplayName(ug.Role),
                            TotalVisits = ug.TotalVisits,
                            TotalSessions = ug.SessionsCount,
                            TotalDurationSeconds = ug.TotalDuration,
                            TotalDurationFormatted = FormatDuration(ug.TotalDuration),
                            LastActivityAt = ug.LastActive,
                            DeviceType = ug.Device
                        };
                    })
                    .ToList();

                // Nhật ký 25 phiên gần nhất với TÊN NGƯỜI DÙNG rõ ràng (thay vì mã phiên)
                var rawRecentSessions = await _context.UserSessions
                    .OrderByDescending(s => s.StartedAt)
                    .Take(25)
                    .ToListAsync();

                var recentSessionsList = rawRecentSessions.Select(s =>
                {
                    string name;
                    string? phone = null;
                    if (s.UserId.HasValue && userDict.TryGetValue(s.UserId.Value, out var uInfo))
                    {
                        name = uInfo.FullName;
                        phone = uInfo.Phone;
                    }
                    else
                    {
                        name = $"Khách vãng lai ({s.DeviceType ?? "Web"})";
                    }

                    return new RecentSessionDto
                    {
                        SessionToken = s.SessionToken,
                        UserId = s.UserId,
                        UserName = name,
                        Phone = phone,
                        UserRole = s.UserRole,
                        RoleDisplay = GetRoleDisplayName(s.UserRole),
                        DeviceType = s.DeviceType ?? "Desktop",
                        StartedAt = s.StartedAt,
                        LastActivityAt = s.LastActivityAt,
                        DurationSeconds = s.DurationSeconds,
                        DurationFormatted = FormatDuration(s.DurationSeconds),
                        PageCount = s.PageCount
                    };
                }).ToList();

                var response = new AnalyticsOverviewDto
                {
                    AllTimeTotalVisits = allTimeTotalVisits,
                    AllTimeTotalUniqueVisitors = allTimeTotalUniqueVisitors,
                    AllTimeTotalSessions = allTimeTotalSessions,
                    TodayVisits = todayVisits,
                    TodayUniqueVisitors = todayUniqueVisitors,
                    TodaySessions = todaySessions,
                    AverageSessionDurationSeconds = Math.Round(avgDurationSeconds, 1),
                    AverageSessionDurationFormatted = avgDurationFormatted,
                    TopPages = topPagesList,
                    DailyTraffic = dailyTrafficList,
                    DailyPageRatios = dailyPageRatiosList,
                    RoleDistributions = roleDistList,
                    TopActiveUsers = topActiveUsers,
                    RecentSessions = recentSessionsList
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Analytics Overview Warning] {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private static string DetectDeviceType(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent)) return "Desktop";
            string ua = userAgent.ToLowerInvariant();
            if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone")) return "Mobile";
            if (ua.Contains("ipad") || ua.Contains("tablet")) return "Tablet";
            return "Desktop";
        }

        private static string FormatDuration(int seconds)
        {
            if (seconds <= 0) return "0s";
            if (seconds < 60) return $"{seconds}s";
            int minutes = seconds / 60;
            int remSec = seconds % 60;
            if (minutes < 60)
            {
                return remSec > 0 ? $"{minutes}m {remSec}s" : $"{minutes}m";
            }
            int hours = minutes / 60;
            int remMin = minutes % 60;
            return $"{hours}h {remMin}m";
        }

        private static string GetVietnameseDayOfWeek(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => "Thứ Hai",
                DayOfWeek.Tuesday => "Thứ Ba",
                DayOfWeek.Wednesday => "Thứ Tư",
                DayOfWeek.Thursday => "Thứ Năm",
                DayOfWeek.Friday => "Thứ Sáu",
                DayOfWeek.Saturday => "Thứ Bảy",
                DayOfWeek.Sunday => "Chủ Nhật",
                _ => ""
            };
        }

        private static string GetRoleDisplayName(string role)
        {
            return role switch
            {
                "Tenant" => "Sinh viên / Khách thuê",
                "Landlord" => "Chủ nhà trọ",
                "Administrator" => "Quản trị viên (Admin)",
                _ => "Khách vãng lai"
            };
        }
    }
}
