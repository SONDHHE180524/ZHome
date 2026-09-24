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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminSeeder Error] {ex.Message}");
            }
        }
    }
}
