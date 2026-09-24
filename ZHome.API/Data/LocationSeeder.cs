using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.Entities;

namespace ZHome.API.Data
{
    public static class LocationSeeder
    {
        public static async Task SeedMissingLocationsAsync(ZHomeDbContext context)
        {
            try
            {
                var districts = await context.Locations.Where(l => l.Level == 2).ToListAsync();
                if (!districts.Any()) return;

                var existingWards = await context.Locations.Where(l => l.Level == 3).ToListAsync();
                var newLocations = new List<Location>();

                var districtMap = new Dictionary<string, (string Type, string[] Names)[]>
                {
                    ["Thạch Thất"] = new[]
                    {
                        ("Thị trấn", new[] { "Liên Quan" }),
                        ("Xã", new[] { "Tân Xã", "Thạch Hòa", "Bình Yên", "Hạ Bằng", "Đồng Trúc", "Cần Kiệm", "Tiến Xuân", "Yên Bình", "Yên Trung", "Chàng Sơn", "Dị Nậu", "Canh Nậu", "Hữu Bằng", "Kim Quan", "Lại Thượng", "Phú Kim", "Phùng Xá", "Hương Ngải", "Bình Phú", "Đại Đồng", "Cẩm Yên" })
                    },
                    ["Hoài Đức"] = new[]
                    {
                        ("Thị trấn", new[] { "Trạm Trôi" }),
                        ("Xã", new[] { "An Khánh", "An Thượng", "Vân Canh", "Di Trạch", "Kim Chung", "Đức Giang", "Đức Thượng", "Cát Quế", "Đắc Sở", "Đông La", "La Phù", "Lại Yên", "Minh Khai", "Song Phương", "Sơn Đồng", "Tiền Yên", "Vân Côn", "Yên Sở", "Dương Liễu" })
                    },
                    ["Đông Anh"] = new[]
                    {
                        ("Thị trấn", new[] { "Đông Anh" }),
                        ("Xã", new[] { "Kim Chung", "Hải Bối", "Vĩnh Ngọc", "Tiên Dương", "Uy Nỗ", "Cổ Loa", "Bắc Hồng", "Nam Hồng", "Vân Nội", "Võng La", "Đại Mạch", "Đông Hội", "Mai Lâm", "Tàm Xá", "Xuân Canh", "Dục Tú", "Liên Hà", "Thụy Lâm", "Vân Hà", "Việt Hùng", "Xuân Nộn", "Nguyên Khê" })
                    },
                    ["Gia Lâm"] = new[]
                    {
                        ("Thị trấn", new[] { "Trâu Quỳ", "Yên Viên" }),
                        ("Xã", new[] { "Đa Tốn", "Kiêu Kỵ", "Bát Tràng", "Cổ Bi", "Đặng Xá", "Đình Xuyên", "Dương Hà", "Dương Quang", "Dương Xá", "Kim Lan", "Kim Sơn", "Lệ Chi", "Ninh Hiệp", "Phù Đổng", "Phú Thị", "Văn Đức", "Yên Thường", "Đông Dư" })
                    },
                    ["Thanh Trì"] = new[]
                    {
                        ("Thị trấn", new[] { "Văn Điển" }),
                        ("Xã", new[] { "Tân Triều", "Thanh Liệt", "Tả Thanh Oai", "Hữu Hòa", "Tam Hiệp", "Tứ Hiệp", "Ngũ Hiệp", "Ngọc Hồi", "Vĩnh Quỳnh", "Đại Áng", "Duyên Hà", "Đông Mỹ", "Liên Ninh", "Vạn Phúc", "Yên Mỹ" })
                    },
                    ["Sơn Tây"] = new[]
                    {
                        ("Phường", new[] { "Lê Lợi", "Quang Trung", "Phú Thịnh", "Ngô Quyền", "Sơn Lộc", "Xuân Khanh", "Trung Hưng", "Trung Sơn Trầm", "Viên Sơn" }),
                        ("Xã", new[] { "Đường Lâm", "Sơn Đông", "Cổ Đông", "Kim Sơn", "Thanh Mỹ", "Xuân Sơn" })
                    },
                    ["Quốc Oai"] = new[]
                    {
                        ("Thị trấn", new[] { "Quốc Oai" }),
                        ("Xã", new[] { "Thạch Thán", "Sài Sơn", "Đồng Quang", "Cấn Hữu", "Cộng Hòa", "Đại Thành", "Đông Yên", "Hòa Thạch", "Liệp Tuyết", "Nghĩa Hương", "Ngọc Liệp", "Ngọc Mỹ", "Phú Cát", "Phú Mãn", "Phượng Cách", "Tân Hòa", "Tân Phú", "Tuyết Nghĩa", "Yên Sơn", "Đông Xuân" })
                    },
                    ["Chương Mỹ"] = new[]
                    {
                        ("Thị trấn", new[] { "Chúc Sơn", "Xuân Mai" }),
                        ("Xã", new[] { "Phụng Châu", "Tiên Phương", "Đông Phương Yên", "Đông Sơn", "Thủy Xuân Tiên", "Phú Nghĩa", "Tân Tiến", "Nam Phương Tiến", "Tốt Động", "Lam Điền", "Đại Yên", "Hợp Đồng", "Hoàng Văn Thụ", "Quảng Bị", "Mỹ Lương", "Trần Phú", "Thụy Hương", "Thanh Bình", "Thượng Vực", "Văn Võ", "Trung Hòa", "Hồng Phong", "Hữu Văn", "Hoàng Diệu", "Đồng Phú", "Đồng Lạc" })
                    },
                    ["Đan Phượng"] = new[]
                    {
                        ("Thị trấn", new[] { "Phùng" }),
                        ("Xã", new[] { "Đan Phượng", "Đồng Tháp", "Hạ Mỗ", "Hồng Hà", "Liên Hà", "Liên Hồng", "Liên Trung", "Phương Đình", "Song Phượng", "Tân Hội", "Tân Lập", "Thọ An", "Thọ Xuân", "Thượng Mỗ", "Trung Châu" })
                    },
                    ["Sóc Sơn"] = new[]
                    {
                        ("Thị trấn", new[] { "Sóc Sơn" }),
                        ("Xã", new[] { "Phù Linh", "Tiên Dược", "Mai Đình", "Quang Tiến", "Hiền Ninh", "Minh Phú", "Minh Trí", "Nam Sơn", "Bắc Sơn", "Hồng Kỳ", "Trung Giã", "Tân Hưng", "Tân Minh", "Xuân Giang", "Đức Hòa", "Đông Xuân", "Kim Lũ", "Phú Cường", "Phú Minh", "Phù Lỗ", "Tân Dân", "Thanh Xuân", "Việt Long", "Xuân Thu" })
                    },
                    ["Mê Linh"] = new[]
                    {
                        ("Thị trấn", new[] { "Chi Đông", "Quang Minh" }),
                        ("Xã", new[] { "Mê Linh", "Tiền Phong", "Tráng Việt", "Văn Khê", "Đại Thịnh", "Chu Phan", "Hoàng Kim", "Kim Hoa", "Liên Mạc", "Tam Đồng", "Thạch Đà", "Thanh Lâm", "Tự Lập", "Vạn Yên" })
                    },
                    ["Thường Tín"] = new[]
                    {
                        ("Thị trấn", new[] { "Thường Tín" }),
                        ("Xã", new[] { "Hà Hồi", "Quất Động", "Duyên Thái", "Ninh Sở", "Hồng Vân", "Văn Bình", "Liên Phương", "Vân Tảo", "Thắng Lợi", "Tô Hiệu", "Nguyễn Trãi", "Nghiêm Xuyên", "Dũng Tiến", "Nhị Khê", "Khánh Hà", "Hiền Giang", "Hòa Bình", "Tân Minh", "Tiền Phong", "Tự Nhiên", "Vạn Điểm", "Văn Phú", "Văn Tự", "Minh Cường", "Chương Dương", "An Mỹ", "Lê Lợi", "Thống Nhất" })
                    },
                    ["Thanh Oai"] = new[]
                    {
                        ("Thị trấn", new[] { "Kim Bài" }),
                        ("Xã", new[] { "Cự Khê", "Bích Hòa", "Bình Minh", "Cao Dương", "Cao Viên", "Dân Hòa", "Đỗ Động", "Hồng Dương", "Kim An", "Kim Thư", "Liên Châu", "Mỹ Hưng", "Phương Trung", "Tam Hưng", "Tân Ước", "Thanh Cao", "Thanh Mai", "Thanh Thùy", "Thanh Văn", "Xuân Dương" })
                    },
                    ["Ba Vì"] = new[]
                    {
                        ("Thị trấn", new[] { "Tây Đằng" }),
                        ("Xã", new[] { "Ba Trại", "Ba Vì", "Cẩm Lĩnh", "Cam Thượng", "Châu Sơn", "Chu Minh", "Cổ Đô", "Đông Quang", "Đồng Thái", "Khánh Thượng", "Minh Châu", "Minh Quang", "Phong Vân", "Phú Cường", "Phú Đông", "Phú Phương", "Phú Sơn", "Sơn Đà", "Tân Hồng", "Tân Lĩnh", "Thái Hòa", "Thuần Mỹ", "Thụy An", "Tiên Phong", "Tòng Bạt", "Vân Hòa", "Vạn Thắng", "Vật Lại", "Yên Bài", "Phú Châu" })
                    },
                    ["Phú Xuyên"] = new[]
                    {
                        ("Thị trấn", new[] { "Phú Xuyên", "Phú Minh" }),
                        ("Xã", new[] { "Bạch Hạ", "Châu Can", "Chuyên Mỹ", "Đại Thắng", "Đại Xuyên", "Hoàng Long", "Hồng Minh", "Hồng Thái", "Khai Thái", "Minh Tân", "Nam Phong", "Nam Tiến", "Nam Triều", "Phú Túc", "Phú Yên", "Phúc Tiến", "Phượng Dực", "Quang Lãng", "Quang Trung", "Sơn Hà", "Tân Dân", "Thụy Phú", "Tri Thủy", "Tri Trung", "Văn Hoàng", "Vân Từ" })
                    },
                    ["Phúc Thọ"] = new[]
                    {
                        ("Thị trấn", new[] { "Phúc Thọ" }),
                        ("Xã", new[] { "Hát Môn", "Hiệp Thuận", "Liên Hiệp", "Long Xuyên", "Ngọc Tảo", "Phúc Hòa", "Phụng Thượng", "Sen Phương", "Tam Hiệp", "Tam Thuấn", "Thanh Đa", "Thọ Lộc", "Thượng Cốc", "Tích Giang", "Trạch Mỹ Lộc", "Vân Hà", "Vân Nam", "Vân Phúc", "Võng Xuyên", "Xuân Đình" })
                    },
                    ["Mỹ Đức"] = new[]
                    {
                        ("Thị trấn", new[] { "Đại Nghĩa" }),
                        ("Xã", new[] { "An Mỹ", "An Phú", "An Tiến", "Bột Xuyên", "Đại Hưng", "Đốc Tín", "Đồng Tâm", "Hồng Sơn", "Hợp Thanh", "Hợp Tiến", "Hùng Tiến", "Hương Sơn", "Lê Thanh", "Mỹ Thành", "Phù Lưu Tế", "Phúc Lâm", "Phùng Xá", "Thượng Lâm", "Tuy Lai", "Vạn Kim", "Xuy Xá" })
                    },
                    ["Ứng Hòa"] = new[]
                    {
                        ("Thị trấn", new[] { "Vân Đình" }),
                        ("Xã", new[] { "Cao Thành", "Đại Cường", "Đại Hùng", "Đội Bình", "Đông Lỗ", "Đồng Tân", "Đồng Tiến", "Hoa Sơn", "Hòa Lâm", "Hòa Nam", "Hòa Phú", "Hòa Xá", "Hồng Quang", "Kim Đường", "Liên Bạt", "Lưu Hoàng", "Minh Đức", "Phù Lưu", "Phương Tú", "Quảng Phú Cầu", "Tảo Dương Văn", "Trầm Lộng", "Trung Tú", "Trường Thịnh", "Vạn Thái", "Viên An", "Viên Nội" })
                    }
                };

                foreach (var (districtName, groups) in districtMap)
                {
                    var districtObj = districts.FirstOrDefault(d => d.Name.Equals(districtName, StringComparison.OrdinalIgnoreCase));
                    if (districtObj == null) continue;

                    foreach (var (typeName, names) in groups)
                    {
                        foreach (var name in names)
                        {
                            bool exists = existingWards.Any(w => w.ParentId == districtObj.Id && w.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                                       || newLocations.Any(w => w.ParentId == districtObj.Id && w.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

                            if (!exists)
                            {
                                newLocations.Add(new Location
                                {
                                    Name = name,
                                    Type = typeName,
                                    ParentId = districtObj.Id,
                                    Level = 3
                                });
                            }
                        }
                    }
                }

                if (newLocations.Any())
                {
                    await context.Locations.AddRangeAsync(newLocations);
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LocationSeeder Warning] {ex.Message}");
            }
        }
    }
}
