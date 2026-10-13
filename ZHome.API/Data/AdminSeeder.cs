using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Models.Entities;

namespace ZHome.API.Data
{
    public static class AdminSeeder
    {
        public static async Task SeedAdminUserAsync(ZHomeDbContext dbContext)
        {
            try
            {
                // 1. Đảm bảo Role "Administrator" tồn tại trong DB
                var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == "Administrator");
                if (adminRole == null)
                {
                    adminRole = new Role
                    {
                        RoleName = "Administrator"
                    };
                    dbContext.Roles.Add(adminRole);
                    await dbContext.SaveChangesAsync();
                }

                // 2. Thông tin tài khoản Admin cấu hình
                const string adminPhone = "0375457065";
                const string adminEmail = "anhtungng2004@gmail.com";
                const string adminName = "Tung";
                const string adminPassword = "01082004";

                var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(u => u.Phone == adminPhone);
                if (existingAdmin == null)
                {
                    var newAdmin = new User
                    {
                        Phone = adminPhone,
                        Email = adminEmail,
                        FullName = adminName,
                        RoleId = adminRole.Id,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                        VerificationStatus = "Approved",
                        SubscriptionId = 3, // VIP Package
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    dbContext.Users.Add(newAdmin);
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"[AdminSeeder] Đã khởi tạo thành công tài khoản Admin ({adminPhone})");
                }
                else
                {
                    existingAdmin.FullName = adminName;
                    existingAdmin.Email = adminEmail;
                    existingAdmin.RoleId = adminRole.Id;
                    existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
                    existingAdmin.VerificationStatus = "Approved";
                    existingAdmin.UpdatedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine($"[AdminSeeder] Đã cập nhật quyền Administrator cho tài khoản ({adminPhone})");
                }

                // 3. Đảm bảo tài khoản Chủ trọ mẫu (Landlord) được duyệt để test gói cước
                var landlordRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == "Landlord");
                if (landlordRole != null)
                {
                    const string landlordPhone = "0912345678";
                    const string landlordPassword = "123456";
                    var testLandlord = await dbContext.Users.FirstOrDefaultAsync(u => u.Phone == landlordPhone);
                    if (testLandlord == null)
                    {
                        testLandlord = new User
                        {
                            Phone = landlordPhone,
                            Email = "landlord.test@zhome.vn",
                            FullName = "Chủ Trọ Nguyễn Văn Hùng",
                            RoleId = landlordRole.Id,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(landlordPassword),
                            VerificationStatus = "Approved",
                            SubscriptionId = 1, // Gói Miễn Phí để có thể thử dùng thử gói 99k
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        dbContext.Users.Add(testLandlord);
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine($"[AdminSeeder] Đã tạo tài khoản Chủ trọ test ({landlordPhone})");
                    }
                    else
                    {
                        testLandlord.RoleId = landlordRole.Id;
                        testLandlord.PasswordHash = BCrypt.Net.BCrypt.HashPassword(landlordPassword);
                        testLandlord.VerificationStatus = "Approved";
                        testLandlord.SubscriptionId = 1;
                        testLandlord.SubscriptionEndDate = null;
                        testLandlord.UpdatedAt = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine($"[AdminSeeder] Đã cập nhật tài khoản Chủ trọ test ({landlordPhone})");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminSeeder Error] {ex.Message}");
            }
        }
    }
}
