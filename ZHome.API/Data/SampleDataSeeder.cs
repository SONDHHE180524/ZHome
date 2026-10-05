using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Models.Entities;

namespace ZHome.API.Data
{
    public static class SampleDataSeeder
    {
        public static async Task SeedAsync(ZHomeDbContext context)
        {
            try
            {
                // 1. Cập nhật giá các gói dịch vụ (Gói Cơ Bản: 99.000đ, Gói Nâng Cao: 199.000đ)
                try
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                        UPDATE subscription_packages SET price = 99000 WHERE id = 2;
                        UPDATE subscription_packages SET price = 199000 WHERE id = 3;
                    ");
                }
                catch
                {
                    var p2 = await context.SubscriptionPackages.FindAsync(2);
                    if (p2 != null) p2.Price = 99000;
                    var p3 = await context.SubscriptionPackages.FindAsync(3);
                    if (p3 != null) p3.Price = 199000;
                    await context.SaveChangesAsync();
                }

                // 2. Kiểm tra nếu chưa có Properties thì tự động seed dữ liệu mẫu
                if (!await context.Properties.AnyAsync())
                {
                    // Lấy hoặc tạo Landlord
                    var landlord = await context.Users.FirstOrDefaultAsync(u => u.RoleId == 2);
                    if (landlord == null)
                    {
                        var role = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Landlord");
                        int roleId = role?.Id ?? 2;
                        landlord = new User
                        {
                            Phone = "0912345678",
                            Email = "landlord.zhome@gmail.com",
                            FullName = "Nguyễn Văn Hùng",
                            RoleId = roleId,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                            VerificationStatus = "Approved",
                            SubscriptionId = 3,
                            SubscriptionEndDate = DateTime.UtcNow.AddYears(1),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        context.Users.Add(landlord);
                        await context.SaveChangesAsync();
                    }
                    else
                    {
                        landlord.SubscriptionId = 3;
                        landlord.SubscriptionEndDate = DateTime.UtcNow.AddYears(1);
                        await context.SaveChangesAsync();
                    }

                    var properties = new List<Property>
                    {
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Nhà trọ ZHome Premium Cầu Giấy - Full nội thất cao cấp",
                            Description = "Khu trọ hiện đại, an ninh bảo vệ 24/7, khóa vân tay, thang máy tốc độ cao, camera an ninh từng tầng. Giờ giấc tự do, không chung chủ.",
                            Address = "Số 18, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 125,
                            ImageUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-10)
                        },
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Chung cư mini ZHome Nam Từ Liêm - Gần SVĐ Mỹ Đình & Keangnam",
                            Description = "Phòng khép kín đầy đủ tiện nghi: Điều hòa Inverter, nóng lạnh, ban công thoáng mát đón ánh sáng tự nhiên. Có máy giặt chung và bãi đỗ xe rộng rãi.",
                            Address = "Số 25, Ngõ 39 Đình Thôn, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 98,
                            ImageUrl = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-8)
                        },
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Khu trọ sinh viên ZHome Thạch Hòa - Sát Đại học FPT Hòa Lạc",
                            Description = "Vị trí đắc địa cách cổng ĐH FPT chỉ 300m, đường nhựa ô tô đỗ cửa. Đầy đủ điều hòa, nóng lạnh, giường tủ, mạng cáp quang tốc độ cao chuyên học tập online.",
                            Address = "Thôn 2, Xã Thạch Hòa, Huyện Thạch Thất, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 310,
                            ImageUrl = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-5)
                        },
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Khu nhà trọ Tân Xã - Gần hồ điều hòa & ĐHQG Hòa Lạc",
                            Description = "Không gian yên tĩnh, trong lành gần hồ Tân Xã. Phòng sạch sẽ, bếp riêng, vệ sinh khép kín, có chỗ sạc xe điện an toàn.",
                            Address = "Thôn Mục Uyên, Xã Tân Xã, Huyện Thạch Thất, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 142,
                            ImageUrl = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-3)
                        },
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Nhà trọ cao cấp Đống Đa - Trung tâm gần ĐH Y, Bách Khoa, Xây Dựng",
                            Description = "Vị trí trung tâm thuận tiện đi lại, phòng mới 100% có gác xép, kệ bếp nấu ăn, máy hút mùi, cửa khóa từ thông minh.",
                            Address = "Số 42, Ngõ 10 Tôn Thất Tùng, Phường Khương Thượng, Quận Đống Đa, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 215,
                            ImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-2)
                        },
                        new Property
                        {
                            LandlordId = landlord.Id,
                            Title = "Nhà trọ Thanh Xuân - Gần ga tàu điện Cát Linh - Hà Đông",
                            Description = "Phòng trọ ban công view đẹp, thang máy, bảo vệ 24/24, cách trạm Metro chỉ 200m. Tiện đi lại các trường Khoa học Tự nhiên, Nhân văn, Kiến trúc.",
                            Address = "Số 88, Ngõ 336 Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội",
                            IsVerifiedTick = true,
                            ViewCount = 180,
                            ImageUrl = "https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=800&q=80",
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        }
                    };

                    await context.Properties.AddRangeAsync(properties);
                    await context.SaveChangesAsync();

                    // Seed Rooms cho từng Property
                    var sampleAmenities = new[] { "Điều hòa", "Nóng lạnh", "Khép kín", "Thang máy", "Tủ lạnh", "Máy giặt", "Ban công", "Giường nệm", "Tủ quần áo", "Kệ bếp" };
                    var sampleImages = new[]
                    {
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80"
                    };

                    int roomCounter = 1;
                    foreach (var prop in properties)
                    {
                        var rooms = new List<Room>
                        {
                            new Room
                            {
                                PropertyId = prop.Id,
                                RoomNumber = "P.10" + (roomCounter % 3 + 1),
                                Price = 2500000 + (roomCounter % 4) * 500000,
                                Area = 22 + (roomCounter % 3) * 5,
                                MaxOccupants = 2,
                                Status = "Available"
                            },
                            new Room
                            {
                                PropertyId = prop.Id,
                                RoomNumber = "P.20" + (roomCounter % 3 + 1),
                                Price = 3000000 + (roomCounter % 4) * 500000,
                                Area = 26 + (roomCounter % 3) * 4,
                                MaxOccupants = 2,
                                Status = "Available"
                            },
                            new Room
                            {
                                PropertyId = prop.Id,
                                RoomNumber = "P.30" + (roomCounter % 3 + 1),
                                Price = 3500000 + (roomCounter % 3) * 500000,
                                Area = 30 + (roomCounter % 2) * 5,
                                MaxOccupants = 3,
                                Status = "Available"
                            }
                        };
                        await context.Rooms.AddRangeAsync(rooms);
                        await context.SaveChangesAsync();

                        foreach (var rm in rooms)
                        {
                            // Amenities
                            var chosenAmenities = sampleAmenities.Take(6 + (int)(rm.Id % 4)).Select(a => new RoomAmenity
                            {
                                RoomId = rm.Id,
                                AmenityName = a
                            }).ToList();
                            await context.RoomAmenities.AddRangeAsync(chosenAmenities);

                            // Images
                            var chosenImages = sampleImages.Select(img => new RoomImage
                            {
                                RoomId = rm.Id,
                                MediaUrl = img,
                                MediaType = "Image"
                            }).ToList();
                            await context.RoomImages.AddRangeAsync(chosenImages);
                        }
                        await context.SaveChangesAsync();
                        roomCounter++;
                    }
                }

                // 3. Seed matching profiles nếu chưa có
                if (!await context.MatchingProfiles.AnyAsync())
                {
                    var student = await context.Users.FirstOrDefaultAsync(u => u.RoleId == 3);
                    if (student == null)
                    {
                        var role = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Tenant");
                        int roleId = role?.Id ?? 3;
                        student = new User
                        {
                            Phone = "0812345678",
                            Email = "student.fpt@gmail.com",
                            FullName = "Lê Văn An",
                            RoleId = roleId,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        context.Users.Add(student);
                        await context.SaveChangesAsync();
                    }

                    var profiles = new List<MatchingProfile>
                    {
                        new MatchingProfile
                        {
                            StudentId = student.Id,
                            Title = "Tìm 1 bạn nam ở ghép phòng khép kín Cầu Giấy, đầy đủ điều hòa nóng lạnh",
                            Gender = "Male",
                            BudgetMin = 1500000,
                            BudgetMax = 2500000,
                            Smoke = false,
                            SleepLate = false,
                            HasPet = false,
                            Hometown = "Thanh Hóa",
                            University = "Đại học Bách Khoa",
                            HasRoom = true,
                            Address = "Ngõ 165 Cầu Giấy, Hà Nội",
                            ContactPhone = "0812345678",
                            Description = "Mình là sinh viên năm 3, tính tình hòa đồng, gọn gàng ngăn nắp. Cần tìm bạn nam cùng chia sẻ tiền phòng, không hút thuốc và tôn trọng không gian chung.",
                            RoommateGenderPreference = "Male",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-2)
                        },
                        new MatchingProfile
                        {
                            StudentId = student.Id,
                            Title = "Tìm bạn nữ ở ghép khu vực Mỹ Đình / Nam Từ Liêm",
                            Gender = "Female",
                            BudgetMin = 1800000,
                            BudgetMax = 2800000,
                            Smoke = false,
                            SleepLate = true,
                            HasPet = true,
                            Hometown = "Nam Định",
                            University = "Đại học Thương Mại",
                            HasRoom = false,
                            Address = "Khu vực Mỹ Đình, Nam Từ Liêm",
                            ContactPhone = "0983746574",
                            Description = "Mình thích nuôi mèo, hay thức khuya học bài và vẽ. Cần tìm bạn nữ cùng tìm phòng trọ sạch sẽ, thoải mái.",
                            RoommateGenderPreference = "Female",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new MatchingProfile
                        {
                            StudentId = student.Id,
                            Title = "Sinh viên FPT Hòa Lạc tìm bạn ở cùng trọ Thạch Hòa",
                            Gender = "Male",
                            BudgetMin = 1200000,
                            BudgetMax = 2000000,
                            Smoke = false,
                            SleepLate = false,
                            HasPet = false,
                            Hometown = "Hà Nội",
                            University = "Đại học FPT",
                            HasRoom = true,
                            Address = "Thôn 2, Thạch Hòa, Thạch Thất",
                            ContactPhone = "0928374659",
                            Description = "Phòng đã có sẵn điều hòa, nóng lạnh, tủ lạnh, chỉ việc xách vali vào ở. Ưu tiên sinh viên FPT hoặc ĐHQG.",
                            RoommateGenderPreference = "Male",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    };

                    await context.MatchingProfiles.AddRangeAsync(profiles);
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SampleDataSeeder Warning] {ex.Message}");
            }
        }
    }
}
