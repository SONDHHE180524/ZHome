using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Models.Entities;

namespace ZHome.API.Data
{
    public static class AnalyticsSeeder
    {
        public static async Task SeedAnalyticsDataAsync(ZHomeDbContext dbContext)
        {
            try
            {
                var realUsers = await dbContext.Users.Include(u => u.Role).ToListAsync();

                // Đảm bảo các phiên có liên kết với người dùng thực tế trong hệ thống
                var registeredUserSessionsCount = await dbContext.UserSessions.CountAsync(s => s.UserId != null);
                if (registeredUserSessionsCount < 10 && realUsers.Any())
                {
                    var rand = new Random(42);
                    var candidateSessions = await dbContext.UserSessions
                        .OrderByDescending(s => s.StartedAt)
                        .Take(200)
                        .ToListAsync();

                    var tokenUserMap = new Dictionary<string, User>();
                    for (int i = 0; i < candidateSessions.Count; i++)
                    {
                        // 70% các phiên gần đây gán cho người dùng hệ thống thực tế
                        if (i % 3 != 0)
                        {
                            var u = realUsers[rand.Next(realUsers.Count)];
                            candidateSessions[i].UserId = u.Id;
                            candidateSessions[i].UserRole = u.Role?.RoleName ?? "Tenant";
                            tokenUserMap[candidateSessions[i].SessionToken] = u;
                        }
                    }

                    var tokensList = tokenUserMap.Keys.ToList();
                    var candidateLogs = await dbContext.PageViewLogs
                        .Where(p => tokensList.Contains(p.SessionToken))
                        .ToListAsync();

                    foreach (var log in candidateLogs)
                    {
                        if (tokenUserMap.TryGetValue(log.SessionToken, out var u))
                        {
                            log.UserId = u.Id;
                            log.UserRole = u.Role?.RoleName ?? "Tenant";
                        }
                    }

                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"[AnalyticsSeeder] Đã đồng bộ {tokenUserMap.Count} phiên truy cập với người dùng thực tế.");
                }

                // Nếu đã có dữ liệu dồi dào (>= 50 bản ghi) thì không seed đè mới
                if (await dbContext.PageViewLogs.CountAsync() >= 50)
                {
                    return;
                }

                Console.WriteLine("[AnalyticsSeeder] Khởi tạo dữ liệu mẫu thống kê truy cập hệ thống ZHome...");

                var landlords = realUsers.Where(u => u.Role?.RoleName == "Landlord" || u.RoleId == 2).ToList();
                var tenants = realUsers.Where(u => u.Role?.RoleName == "Tenant" || u.RoleId == 3).ToList();
                var admins = realUsers.Where(u => u.Role?.RoleName == "Administrator" || u.RoleId == 1).ToList();

                var random = new Random(42);
                var now = DateTime.UtcNow;
                var sessions = new List<UserSession>();
                var pageViews = new List<PageViewLog>();

                var pages = new[]
                {
                    new { Title = "Trang chủ ZHome", Url = "/", Category = "Homepage", Weight = 38 },
                    new { Title = "Xem chi tiết phòng trọ", Url = "/phong-tro/1", Category = "ViewTro", Weight = 26 },
                    new { Title = "Sàn ghép trọ sinh viên", Url = "/ghep-tro", Category = "GhepTro", Weight = 16 },
                    new { Title = "Quản lý nhà trọ & phòng", Url = "/landlord/properties", Category = "LandlordArea", Weight = 7 },
                    new { Title = "Hóa đơn & điện nước chủ trọ", Url = "/landlord/bills", Category = "LandlordArea", Weight = 5 },
                    new { Title = "Thông tin phòng trọ của tôi", Url = "/tenant/my-rental", Category = "TenantArea", Weight = 4 },
                    new { Title = "Hóa đơn thanh toán sinh viên", Url = "/tenant/bills", Category = "TenantArea", Weight = 3 },
                    new { Title = "Đăng nhập tài khoản", Url = "/login", Category = "Auth", Weight = 1 }
                };

                var devices = new[] { "Desktop", "Mobile", "Tablet" };

                // Seed lịch sử 30 ngày gần đây
                for (int dayOffset = 30; dayOffset >= 0; dayOffset--)
                {
                    var date = now.Date.AddDays(-dayOffset);
                    // Số lượng phiên mỗi ngày: dao động từ 25 đến 80 phiên tùy ngày
                    int isWeekend = (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) ? 15 : 0;
                    int dailySessionsCount = random.Next(28, 65) + isWeekend;

                    for (int s = 0; s < dailySessionsCount; s++)
                    {
                        var sessionToken = "zh_sess_" + Guid.NewGuid().ToString("N")[..12];
                        int startHour = random.Next(7, 23);
                        int startMin = random.Next(0, 59);
                        int startSec = random.Next(0, 59);
                        var sessionStart = date.AddHours(startHour).AddMinutes(startMin).AddSeconds(startSec);

                        // Thời lượng mỗi phiên: từ 45 giây đến 28 phút
                        int sessionDuration = random.Next(45, 1680);
                        var sessionEnd = sessionStart.AddSeconds(sessionDuration);

                        string device = devices[random.Next(0, 10) < 6 ? 0 : (random.Next(0, 10) < 8 ? 1 : 2)];
                        
                        // Phân bố vai trò người dùng: đa số là sinh viên & khách vãng lai, sau đó đến chủ trọ
                        string role;
                        long? matchedUserId = null;
                        int roleDice = random.Next(1, 100);
                        if (roleDice <= 45) 
                        {
                            role = "Tenant";
                            if (tenants.Any()) matchedUserId = tenants[random.Next(tenants.Count)].Id;
                            else if (realUsers.Any()) matchedUserId = realUsers[random.Next(realUsers.Count)].Id;
                        }
                        else if (roleDice <= 75) 
                        {
                            role = "Guest";
                            matchedUserId = null;
                        }
                        else if (roleDice <= 95) 
                        {
                            role = "Landlord";
                            if (landlords.Any()) matchedUserId = landlords[random.Next(landlords.Count)].Id;
                            else if (realUsers.Any()) matchedUserId = realUsers[random.Next(realUsers.Count)].Id;
                        }
                        else 
                        {
                            role = "Administrator";
                            if (admins.Any()) matchedUserId = admins[random.Next(admins.Count)].Id;
                        }

                        int pagesInSession = random.Next(1, 6);

                        sessions.Add(new UserSession
                        {
                            SessionToken = sessionToken,
                            UserId = matchedUserId,
                            UserRole = role,
                            DeviceType = device,
                            IpAddress = $"14.241.{random.Next(10, 250)}.{random.Next(10, 250)}",
                            UserAgent = device == "Desktop" 
                                ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
                                : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
                            StartedAt = sessionStart,
                            LastActivityAt = sessionEnd,
                            DurationSeconds = sessionDuration,
                            PageCount = pagesInSession
                        });

                        // Tạo các trang được xem trong phiên
                        var pageTime = sessionStart;
                        for (int p = 0; p < pagesInSession; p++)
                        {
                            // Chọn trang dựa theo trọng số và vai trò
                            var pageChoice = SelectPageForRole(role, pages, random);
                            int pageDuration = Math.Max(15, sessionDuration / pagesInSession);

                            pageViews.Add(new PageViewLog
                            {
                                SessionToken = sessionToken,
                                UserId = matchedUserId,
                                UserRole = role,
                                PageUrl = pageChoice.Url,
                                PageTitle = pageChoice.Title,
                                PageCategory = pageChoice.Category,
                                ViewedAt = pageTime,
                                DurationSeconds = pageDuration,
                                ReferrerUrl = p == 0 ? "https://google.com" : pages[0].Url
                            });

                            pageTime = pageTime.AddSeconds(pageDuration);
                        }
                    }
                }

                // Batch insert để tối ưu hiệu năng
                const int batchSize = 500;
                for (int i = 0; i < sessions.Count; i += batchSize)
                {
                    var chunk = sessions.Skip(i).Take(batchSize);
                    dbContext.UserSessions.AddRange(chunk);
                    await dbContext.SaveChangesAsync();
                }

                for (int i = 0; i < pageViews.Count; i += batchSize)
                {
                    var chunk = pageViews.Skip(i).Take(batchSize);
                    dbContext.PageViewLogs.AddRange(chunk);
                    await dbContext.SaveChangesAsync();
                }

                Console.WriteLine($"[AnalyticsSeeder] Đã khởi tạo thành công {sessions.Count} phiên và {pageViews.Count} lượt truy cập!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AnalyticsSeeder Error] {ex.Message}");
            }
        }

        private static dynamic SelectPageForRole(string role, dynamic[] pages, Random random)
        {
            if (role == "Landlord" && random.Next(1, 100) <= 60)
            {
                // Ưu tiên trang chủ trọ
                var landlordPages = pages.Where(p => (string)p.Category == "LandlordArea").ToArray();
                if (landlordPages.Length > 0) return landlordPages[random.Next(0, landlordPages.Length)];
            }
            else if (role == "Tenant" && random.Next(1, 100) <= 45)
            {
                // Ưu tiên trang sinh viên / ghép trọ
                var tenantPages = pages.Where(p => (string)p.Category == "TenantArea" || (string)p.Category == "GhepTro").ToArray();
                if (tenantPages.Length > 0) return tenantPages[random.Next(0, tenantPages.Length)];
            }

            int totalWeight = pages.Sum(p => (int)p.Weight);
            int roll = random.Next(1, totalWeight + 1);
            int current = 0;
            foreach (var page in pages)
            {
                current += (int)page.Weight;
                if (roll <= current) return page;
            }
            return pages[0];
        }
    }
}
