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
    public class PropertyController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _environment;

        public PropertyController(ZHomeDbContext context, Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // Get landlord properties
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet]
        public async Task<IActionResult> GetProperties()
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var properties = await _context.Properties
                .AsNoTracking()
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Contracts)
                .Where(p => p.LandlordId == landlordId)
                .ToListAsync();

            var response = properties.Select(p => MapPropertyToDto(p)).ToList();
            return Ok(response);
        }

        // Get single property public details for Detail View
        [AllowAnonymous]
        [HttpGet("public/{id}")]
        public async Task<IActionResult> GetPublicPropertyDetail(long id)
        {
            var property = await _context.Properties
                .AsNoTracking()
                .Include(p => p.Landlord)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null)
            {
                return NotFound(new { message = "Khu trọ không tồn tại." });
            }

            var allImages = new List<string>();
            if (!string.IsNullOrEmpty(property.ImageUrl))
            {
                allImages.Add(property.ImageUrl);
            }
            foreach (var room in property.Rooms)
            {
                foreach (var img in room.Images)
                {
                    if (!string.IsNullOrEmpty(img.MediaUrl) && !allImages.Contains(img.MediaUrl))
                    {
                        allImages.Add(img.MediaUrl);
                    }
                }
            }

            var roomsDto = property.Rooms.Select(r => new RoomResponseDto
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                RoomNumber = r.RoomNumber,
                Price = r.Price,
                Area = r.Area,
                MaxOccupants = r.MaxOccupants,
                Status = r.Status,
                Amenities = r.Amenities.Select(a => a.AmenityName).ToList(),
                ImageUrls = r.Images.Select(i => i.MediaUrl).ToList()
            }).OrderBy(r => r.RoomNumber).ToList();

            var totalRooms = property.Rooms.Count;
            var vacantRoomsCount = property.Rooms.Count(r => r.Status == "Available");

            return Ok(new
            {
                PropertyId = property.Id,
                PropertyTitle = property.Title,
                Description = property.Description,
                Address = property.Address,
                Latitude = property.Latitude,
                Longitude = property.Longitude,
                IsVerifiedTick = property.IsVerifiedTick,
                ViewCount = property.ViewCount,
                PropertyImageUrl = property.ImageUrl,
                LandlordId = property.LandlordId,
                LandlordName = property.Landlord?.FullName ?? "Chủ trọ ZHome",
                LandlordPhone = property.Landlord?.Phone ?? "1900 6868",
                TotalRooms = totalRooms,
                VacantRoomsCount = vacantRoomsCount,
                ImageUrls = allImages,
                Rooms = roomsDto
            });
        }

        // Get single property details for Landlord/Admin edit
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProperty(long id)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == landlordId);

            if (property == null)
            {
                return NotFound("Khu trọ không tồn tại hoặc bạn không có quyền truy cập.");
            }

            return Ok(MapPropertyToDto(property));
        }

        // Create property
        [Authorize(Roles = "Landlord")]
        [HttpPost]
        public async Task<IActionResult> CreateProperty([FromBody] PropertyCreateDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            // Check if landlord is verified
            var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == landlordId);
            bool isVerified = landlord?.VerificationStatus == "Approved";

            // Check Property limit for Free tier (PackageId = 1)
            var currentPackageId = landlord?.SubscriptionId ?? 1;
            if (currentPackageId == 1)
            {
                var propertyCount = await _context.Properties.CountAsync(p => p.LandlordId == landlordId);
                if (propertyCount >= 1)
                {
                    return StatusCode(403, new { message = "Gói Miễn Phí chỉ được tạo tối đa 1 khu trọ. Vui lòng nâng cấp gói cước." });
                }
            }

            string? propertyImageUrl = null;
            if (!string.IsNullOrEmpty(request.ImageBase64))
            {
                try
                {
                    propertyImageUrl = SaveBase64Image(request.ImageBase64, "property", landlord?.Phone ?? landlordId.ToString());
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                }
            }

            var property = new Property
            {
                LandlordId = landlordId,
                Title = request.Title,
                Description = request.Description,
                Address = request.Address,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                IsVerifiedTick = isVerified, // Inherit verification status from landlord
                ImageUrl = propertyImageUrl,
                CreatedAt = DateTime.UtcNow
            };

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProperty), new { id = property.Id }, MapPropertyToDto(property));
        }

        // Update property details
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(long id, [FromBody] PropertyCreateDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .FirstOrDefaultAsync(p => p.Id == id && (p.LandlordId == landlordId || User.IsInRole("Administrator")));

            if (property == null)
            {
                return NotFound("Không tìm thấy khu trọ hoặc bạn không có quyền chỉnh sửa.");
            }

            property.Title = request.Title;
            property.Description = request.Description;
            property.Address = request.Address;
            if (request.Latitude.HasValue) property.Latitude = request.Latitude;
            if (request.Longitude.HasValue) property.Longitude = request.Longitude;

            if (!string.IsNullOrEmpty(request.ImageBase64) && request.ImageBase64.StartsWith("data:image"))
            {
                try
                {
                    var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == property.LandlordId);
                    property.ImageUrl = SaveBase64Image(request.ImageBase64, "property", landlord?.Phone ?? property.LandlordId.ToString());
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(MapPropertyToDto(property));
        }

        // Update property image
        [Authorize(Roles = "Landlord")]
        [HttpPut("{id}/image")]
        public async Task<IActionResult> UpdatePropertyImage(long id, [FromBody] UpdatePropertyImageDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id && p.LandlordId == landlordId);
            if (property == null)
            {
                return NotFound("Không tìm thấy khu trọ hoặc bạn không có quyền.");
            }

            if (string.IsNullOrEmpty(request.ImageBase64))
            {
                return BadRequest("Không có dữ liệu ảnh.");
            }

            try
            {
                var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == landlordId);
                string propertyImageUrl = SaveBase64Image(request.ImageBase64, "property", landlord?.Phone ?? landlordId.ToString());
                property.ImageUrl = propertyImageUrl;
                await _context.SaveChangesAsync();
                return Ok(new { ImageUrl = propertyImageUrl });
            }
            catch (Exception ex)
            {
                return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
            }
        }

        // Create room under a property
        [Authorize(Roles = "Landlord")]
        [HttpPost("{propertyId}/room")]
        public async Task<IActionResult> AddRoom(long propertyId, [FromBody] RoomCreateDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == propertyId && p.LandlordId == landlordId);
            if (property == null)
            {
                return NotFound("Không tìm thấy khu trọ hoặc bạn không có quyền.");
            }

            // Check duplicate room number
            if (await _context.Rooms.AnyAsync(r => r.PropertyId == propertyId && r.RoomNumber == request.RoomNumber))
            {
                return BadRequest("Số phòng này đã tồn tại trong khu trọ.");
            }

            // Check room limits
            var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == landlordId);
            var currentPackageId = landlord?.SubscriptionId ?? 1;
            var totalRooms = await _context.Rooms.CountAsync(r => r.Property != null && r.Property.LandlordId == landlordId);

            int maxRooms = 10; // Default for Free
            if (currentPackageId == 2) maxRooms = 70; // Basic
            else if (currentPackageId == 3) maxRooms = 150; // Advanced
            else if (currentPackageId > 3) maxRooms = 999999; // Fallback for unexpected higher tiers

            if (totalRooms >= maxRooms)
            {
                return StatusCode(403, new { message = $"Gói cước hiện tại chỉ cho phép quản lý tối đa {maxRooms} phòng. Vui lòng nâng cấp gói cước." });
            }

            var room = new Room
            {
                PropertyId = propertyId,
                RoomNumber = request.RoomNumber,
                Price = request.Price,
                Area = request.Area,
                MaxOccupants = request.MaxOccupants,
                Status = "Available"
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            // Add amenities
            if (request.Amenities != null && request.Amenities.Any())
            {
                foreach (var amName in request.Amenities)
                {
                    _context.RoomAmenities.Add(new RoomAmenity { RoomId = room.Id, AmenityName = amName });
                }
            }

            // Add images
            if (request.ImageUrls != null && request.ImageUrls.Any())
            {
                foreach (var url in request.ImageUrls)
                {
                    _context.RoomImages.Add(new RoomImage { RoomId = room.Id, MediaUrl = url, MediaType = "Image" });
                }
            }

            if (request.ImageBase64s != null && request.ImageBase64s.Any())
            {
                foreach (var base64 in request.ImageBase64s)
                {
                    if (!string.IsNullOrEmpty(base64))
                    {
                        try
                        {
                            var imgUrl = SaveBase64Image(base64, "room", room.Id.ToString());
                            _context.RoomImages.Add(new RoomImage { RoomId = room.Id, MediaUrl = imgUrl, MediaType = "Image" });
                        }
                        catch { }
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Reload room with relationships
            var createdRoom = await _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.Images)
                .FirstAsync(r => r.Id == room.Id);

            return Ok(MapRoomToDto(createdRoom));
        }

        // Get single room detail for Landlord
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetRoomDetailForLandlord(long roomId)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var room = await _context.Rooms
                .Include(r => r.Property)
                .Include(r => r.Amenities)
                .Include(r => r.Images)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null || room.Property == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng trọ." });
            }

            if (room.Property.LandlordId != landlordId && !User.IsInRole("Administrator"))
            {
                return StatusCode(403, new { message = "Bạn không có quyền xem thông tin phòng trọ này." });
            }

            var activeContracts = await _context.Contracts
                .Include(c => c.Tenant)
                .Where(c => c.RoomId == roomId && c.Status == "Active")
                .Select(c => new RoomContractTenantDto
                {
                    ContractId = c.Id,
                    TenantId = c.TenantId,
                    TenantFullName = c.Tenant != null ? c.Tenant.FullName : string.Empty,
                    TenantPhone = c.Tenant != null ? c.Tenant.Phone : string.Empty,
                    TenantIdCardNumber = c.Tenant != null ? c.Tenant.CccdNumber ?? string.Empty : string.Empty,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    RoomPrice = c.RoomPrice,
                    DepositAmount = c.RoomPrice, // 1 month deposit default
                    PaymentCycle = "Thanh toán hàng tháng",
                    Status = c.Status,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            var recentBills = await _context.MonthlyBills
                .Where(b => b.RoomId == roomId)
                .OrderByDescending(b => b.BillingYear)
                .ThenByDescending(b => b.BillingMonth)
                .Take(12)
                .Select(b => new RoomBillSummaryDto
                {
                    BillId = b.Id,
                    BillingMonth = b.BillingMonth,
                    BillingYear = b.BillingYear,
                    ElectricityUsage = b.ElectricityNewReading - b.ElectricityOldReading,
                    WaterUsage = b.WaterNewReading - b.WaterOldReading,
                    TotalAmount = b.TotalAmount,
                    PaidAmount = b.PaidAmount,
                    Status = b.Status,
                    PaidAt = b.PaidAt
                })
                .ToListAsync();

            var dto = new RoomDetailLandlordDto
            {
                Id = room.Id,
                PropertyId = room.PropertyId,
                PropertyTitle = room.Property.Title,
                PropertyAddress = room.Property.Address,
                RoomNumber = room.RoomNumber,
                Price = room.Price,
                Area = room.Area,
                MaxOccupants = room.MaxOccupants,
                Status = room.Status,
                Amenities = room.Amenities.Select(a => a.AmenityName).ToList(),
                ImageUrls = room.Images.Select(i => i.MediaUrl).ToList(),
                ActiveContracts = activeContracts,
                RecentBills = recentBills
            };

            return Ok(dto);
        }

        // Update room details for Landlord
        [Authorize(Roles = "Landlord")]
        [HttpPut("room/{roomId}")]
        public async Task<IActionResult> UpdateRoom(long roomId, [FromBody] RoomUpdateDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var room = await _context.Rooms
                .Include(r => r.Property)
                .Include(r => r.Amenities)
                .Include(r => r.Images)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null || room.Property == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng trọ." });
            }

            if (room.Property.LandlordId != landlordId)
            {
                return StatusCode(403, new { message = "Bạn không có quyền chỉnh sửa phòng trọ này." });
            }

            if (room.RoomNumber != request.RoomNumber &&
                await _context.Rooms.AnyAsync(r => r.PropertyId == room.PropertyId && r.RoomNumber == request.RoomNumber))
            {
                return BadRequest(new { message = "Số phòng này đã tồn tại trong khu trọ." });
            }

            room.RoomNumber = request.RoomNumber;
            room.Price = request.Price;
            room.Area = request.Area;
            room.MaxOccupants = request.MaxOccupants;

            if (!string.IsNullOrEmpty(request.Status))
            {
                var hasActiveContracts = await _context.Contracts.AnyAsync(c => c.RoomId == roomId && c.Status == "Active");
                if (hasActiveContracts && request.Status == "Available")
                {
                    room.Status = "Rented";
                }
                else
                {
                    room.Status = request.Status;
                }
            }

            _context.RoomAmenities.RemoveRange(room.Amenities);
            if (request.Amenities != null && request.Amenities.Any())
            {
                foreach (var amName in request.Amenities.Distinct())
                {
                    _context.RoomAmenities.Add(new RoomAmenity { RoomId = room.Id, AmenityName = amName });
                }
            }

            if (request.ExistingImageUrls != null)
            {
                var toRemove = room.Images.Where(i => !request.ExistingImageUrls.Contains(i.MediaUrl)).ToList();
                _context.RoomImages.RemoveRange(toRemove);
            }

            if (request.NewImageBase64s != null && request.NewImageBase64s.Any())
            {
                foreach (var base64 in request.NewImageBase64s)
                {
                    if (!string.IsNullOrEmpty(base64))
                    {
                        try
                        {
                            var imgUrl = SaveBase64Image(base64, "room", room.Id.ToString());
                            _context.RoomImages.Add(new RoomImage { RoomId = room.Id, MediaUrl = imgUrl, MediaType = "Image" });
                        }
                        catch { }
                    }
                }
            }

            await _context.SaveChangesAsync();

            return await GetRoomDetailForLandlord(roomId);
        }

        // Delete room
        [Authorize(Roles = "Landlord")]
        [HttpDelete("room/{roomId}")]
        public async Task<IActionResult> DeleteRoom(long roomId)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var room = await _context.Rooms
                .Include(r => r.Property)
                .Include(r => r.Amenities)
                .Include(r => r.Images)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null || room.Property == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng trọ." });
            }

            if (room.Property.LandlordId != landlordId)
            {
                return StatusCode(403, new { message = "Bạn không có quyền xóa phòng trọ này." });
            }

            var hasActiveContracts = await _context.Contracts.AnyAsync(c => c.RoomId == roomId && c.Status == "Active");
            if (hasActiveContracts)
            {
                return BadRequest(new { message = "Không thể xóa phòng đang có hợp đồng thuê hoạt động. Vui lòng làm thủ tục trả phòng trước khi xóa." });
            }

            _context.RoomAmenities.RemoveRange(room.Amenities);
            _context.RoomImages.RemoveRange(room.Images);
            _context.Rooms.Remove(room);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa phòng trọ thành công." });
        }

        // Public marketplace search and filter listings
        [AllowAnonymous]
        [HttpGet("listings")]
        public async Task<IActionResult> SearchListings(
            [FromQuery] string? search,
            [FromQuery] string? district,
            [FromQuery] string? ward,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] double? minArea,
            [FromQuery] double? maxArea,
            [FromQuery] bool? verifiedHost)
        {
            long? loggedInUserId = null;
            var userClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(userClaim, out long parsedId))
            {
                loggedInUserId = parsedId;
            }

            var favoriteRoomIds = new List<long>();
            if (loggedInUserId.HasValue)
            {
                favoriteRoomIds = await _context.Favorites
                    .Where(f => f.UserId == loggedInUserId.Value)
                    .Select(f => f.RoomId)
                    .ToListAsync();
            }

            var query = _context.Rooms
                .AsNoTracking()
                .AsSplitQuery()
                .Include(r => r.Property)
                    .ThenInclude(p => p!.Landlord)
                .Include(r => r.Amenities)
                .Include(r => r.Images)
                .AsQueryable();

            // Removed filter: query = query.Where(r => r.Status == "Available");
            // To allow showing both available and full rooms on the homepage

            // Lọc thời hạn hiển thị tin đăng theo gói cước (nếu có cấu hình cụ thể):
            var now = DateTime.UtcNow;
            query = query.Where(r => 
                r.Property!.Landlord!.SubscriptionEndDate == null || 
                r.Property.Landlord.SubscriptionEndDate >= now ||
                r.Property.Landlord.SubscriptionId == null ||
                r.Property.Landlord.SubscriptionId >= 1
            );

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(r => r.Property!.Title.Contains(search) || 
                                         r.Property!.Address.Contains(search) || 
                                         r.Property!.Description!.Contains(search));
            }

            if (!string.IsNullOrEmpty(district))
            {
                query = query.Where(r => r.Property!.Address.Contains(district));
            }

            if (!string.IsNullOrEmpty(ward))
            {
                query = query.Where(r => r.Property!.Address.Contains(ward));
            }

            if (minPrice.HasValue && minPrice.Value >= 0)
            {
                decimal safeMin = Math.Min(minPrice.Value, 999999999.99m);
                query = query.Where(r => r.Price >= safeMin);
            }

            if (maxPrice.HasValue && maxPrice.Value >= 0)
            {
                decimal safeMax = Math.Min(maxPrice.Value, 999999999.99m);
                query = query.Where(r => r.Price <= safeMax);
            }

            if (minArea.HasValue && minArea.Value >= 0)
            {
                decimal safeMinArea = (decimal)minArea.Value;
                query = query.Where(r => r.Area >= safeMinArea);
            }

            if (maxArea.HasValue && maxArea.Value >= 0)
            {
                decimal safeMaxArea = (decimal)maxArea.Value;
                query = query.Where(r => r.Area <= safeMaxArea);
            }

            if (verifiedHost.HasValue && verifiedHost.Value)
            {
                query = query.Where(r => r.Property!.IsVerifiedTick == true || r.Property!.Landlord!.VerificationStatus == "Approved");
            }

            var rooms = await query.ToListAsync();

            var propertyIds = rooms.Select(r => r.PropertyId).Distinct().ToList();

            var propertyRoomStats = await _context.Rooms
                .AsNoTracking()
                .Where(rm => propertyIds.Contains(rm.PropertyId))
                .GroupBy(rm => rm.PropertyId)
                .Select(g => new
                {
                    PropertyId = g.Key,
                    TotalRooms = g.Count(),
                    VacantRooms = g.Count(rm => rm.Status == "Available")
                })
                .ToDictionaryAsync(x => x.PropertyId);
            
            var propertyRatings = await _context.Reports
                .AsNoTracking()
                .Where(r => r.Rating.HasValue && r.Contract != null && r.Contract.Room != null && propertyIds.Contains(r.Contract.Room.PropertyId))
                .GroupBy(r => r.Contract!.Room!.PropertyId)
                .Select(g => new
                {
                    PropertyId = g.Key,
                    AverageRating = g.Average(r => (double)r.Rating!.Value),
                    ReviewCount = g.Count()
                })
                .ToDictionaryAsync(x => x.PropertyId);

            var listings = rooms.Select(r => new PropertyListingDto
            {
                PropertyId = r.PropertyId,
                PropertyTitle = r.Property?.Title ?? string.Empty,
                Address = r.Property?.Address ?? string.Empty,
                IsVerifiedTick = r.Property?.IsVerifiedTick == true || r.Property?.Landlord?.VerificationStatus == "Approved",
                LandlordId = r.Property?.LandlordId ?? 0,
                LandlordName = r.Property?.Landlord?.FullName ?? "Chủ nhà ẩn danh",
                LandlordPhone = r.Property?.Landlord?.Phone ?? string.Empty,
                TotalRooms = propertyRoomStats.ContainsKey(r.PropertyId) ? propertyRoomStats[r.PropertyId].TotalRooms : 1,
                VacantRoomsCount = propertyRoomStats.ContainsKey(r.PropertyId) ? propertyRoomStats[r.PropertyId].VacantRooms : (r.Status == "Available" ? 1 : 0),
                RoomId = r.Id,
                RoomNumber = r.RoomNumber,
                Price = r.Price,
                Area = r.Area,
                MaxOccupants = r.MaxOccupants,
                Status = r.Status,
                Description = r.Property?.Description,
                Amenities = r.Amenities.Select(a => a.AmenityName).ToList(),
                ImageUrls = r.Images.Select(i => i.MediaUrl).ToList(),
                AverageRating = propertyRatings.ContainsKey(r.PropertyId) ? Math.Round(propertyRatings[r.PropertyId].AverageRating, 1) : 5.0,
                ReviewCount = propertyRatings.ContainsKey(r.PropertyId) ? propertyRatings[r.PropertyId].ReviewCount : 0,
                ViewCount = r.Property?.ViewCount ?? 0,
                IsFavorite = favoriteRoomIds.Contains(r.Id),
                SubscriptionId = r.Property?.Landlord?.SubscriptionId ?? 1,
                PropertyImageUrl = r.Property?.ImageUrl
            })
            .OrderByDescending(x => x.IsFavorite)
            .ThenByDescending(x => x.SubscriptionId)
            .ThenByDescending(x => x.ViewCount)
            .ThenByDescending(x => x.AverageRating)
            .ToList();

            return Ok(listings);
        }

        // Increment property view count
        [AllowAnonymous]
        [HttpPost("{id}/view")]
        public async Task<IActionResult> IncrementViewCount(long id)
        {
            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
            if (property == null)
            {
                return NotFound("Khu trọ không tồn tại.");
            }

            property.ViewCount += 1;
            await _context.SaveChangesAsync();

            return Ok(new { property.Id, property.ViewCount });
        }

        // Toggle Favorite for a room
        [Authorize]
        [HttpPost("favorites/{roomId}")]
        public async Task<IActionResult> ToggleFavorite(long roomId)
        {
            var userClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userClaim, out long userId))
            {
                return Unauthorized();
            }

            var favorite = await _context.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.RoomId == roomId);
            if (favorite != null)
            {
                _context.Favorites.Remove(favorite);
            }
            else
            {
                _context.Favorites.Add(new Favorite { UserId = userId, RoomId = roomId, CreatedAt = DateTime.UtcNow });
            }

            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = favorite == null });
        }

        private static PropertyResponseDto MapPropertyToDto(Property p)
        {
            return new PropertyResponseDto
            {
                Id = p.Id,
                LandlordId = p.LandlordId,
                Title = p.Title,
                Description = p.Description,
                Address = p.Address,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                IsVerifiedTick = p.IsVerifiedTick,
                ViewCount = p.ViewCount,
                ImageUrl = p.ImageUrl,
                Rooms = p.Rooms.Select(MapRoomToDto).ToList()
            };
        }

        private static RoomResponseDto MapRoomToDto(Room r)
        {
            var activeCount = r.Contracts != null
                ? r.Contracts.Count(c => c.Status == "Active")
                : (r.Status == "Rented" ? 1 : 0);

            return new RoomResponseDto
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                RoomNumber = r.RoomNumber,
                Price = r.Price,
                Area = r.Area,
                MaxOccupants = r.MaxOccupants,
                BedsCount = 1,
                ActiveTenantsCount = activeCount,
                Status = r.Status,
                Amenities = r.Amenities.Select(a => a.AmenityName).ToList(),
                ImageUrls = r.Images.Select(i => i.MediaUrl).ToList()
            };
        }

        private string SaveBase64Image(string base64String, string prefix, string identifier)
        {
            if (string.IsNullOrEmpty(base64String)) return string.Empty;

            var base64Data = base64String;
            string extension = ".png";

            if (base64String.Contains(","))
            {
                var parts = base64String.Split(',');
                var header = parts[0];
                base64Data = parts[1];

                if (header.Contains("image/jpeg")) extension = ".jpg";
                else if (header.Contains("image/webp")) extension = ".webp";
                else if (header.Contains("image/gif")) extension = ".gif";
            }

            byte[] imageBytes = Convert.FromBase64String(base64Data);
            
            var webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = System.IO.Path.Combine(_environment.ContentRootPath, "wwwroot");
            }
            var directoryPath = System.IO.Path.Combine(webRootPath, "media", "properties");
            if (!System.IO.Directory.Exists(directoryPath))
            {
                System.IO.Directory.CreateDirectory(directoryPath);
            }

            string fileName = $"{prefix}_{identifier}_{DateTime.UtcNow.Ticks}{extension}";
            var filePath = System.IO.Path.Combine(directoryPath, fileName);
            System.IO.File.WriteAllBytes(filePath, imageBytes);

            return $"/media/properties/{fileName}";
        }
    }
}
