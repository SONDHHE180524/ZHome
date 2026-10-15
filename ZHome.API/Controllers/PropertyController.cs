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
using ZHome.API.Services;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertyController : ControllerBase
    {
        private readonly ZHomeDbContext _context;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _environment;
        private readonly IMediaStorageService _mediaStorage;

        public PropertyController(
            ZHomeDbContext context, 
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment,
            IMediaStorageService mediaStorage)
        {
            _context = context;
            _environment = environment;
            _mediaStorage = mediaStorage;
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
                var splitUrls = property.ImageUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var u in splitUrls)
                {
                    if (!allImages.Contains(u))
                    {
                        allImages.Add(u);
                    }
                }
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
                ImageUrls = (r.Images != null && r.Images.Any()) 
                    ? r.Images.Select(i => i.MediaUrl).ToList() 
                    : (!string.IsNullOrWhiteSpace(property.ImageUrl) ? new List<string> { property.ImageUrl } : new List<string>())
            }).OrderBy(r => r.RoomNumber).ToList();

            var totalRooms = property.Rooms.Count;
            var vacantRoomsCount = property.Rooms.Count(r => r.Status == "Available");
            var primaryImageUrl = property.ImageUrl?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? property.ImageUrl;

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
                PropertyImageUrl = primaryImageUrl,
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

            var savedUrls = new List<string>();
            if (request.ImageBase64s != null && request.ImageBase64s.Any())
            {
                foreach (var b64 in request.ImageBase64s)
                {
                    if (!string.IsNullOrEmpty(b64))
                    {
                        if (b64.StartsWith("data:image"))
                        {
                            try
                            {
                                var u = await _mediaStorage.SaveBase64ImageAsync(b64, "properties", landlord?.Phone ?? landlordId.ToString());
                                savedUrls.Add(u);
                            }
                            catch (Exception ex)
                            {
                                return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                            }
                        }
                        else
                        {
                            savedUrls.Add(b64);
                        }
                    }
                }
            }
            else if (!string.IsNullOrEmpty(request.ImageBase64))
            {
                if (request.ImageBase64.StartsWith("data:image"))
                {
                    try
                    {
                        var u = await _mediaStorage.SaveBase64ImageAsync(request.ImageBase64, "properties", landlord?.Phone ?? landlordId.ToString());
                        savedUrls.Add(u);
                    }
                    catch (Exception ex)
                    {
                        return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                    }
                }
                else
                {
                    savedUrls.Add(request.ImageBase64);
                }
            }

            string? propertyImageUrl = savedUrls.Any() ? string.Join(",", savedUrls) : null;

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

            if (request.IsVerifiedTick.HasValue && User.IsInRole("Administrator"))
            {
                property.IsVerifiedTick = request.IsVerifiedTick.Value;
            }

            var updatedUrls = new List<string>();
            if (request.ExistingImageUrls != null)
            {
                updatedUrls.AddRange(request.ExistingImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)));
            }

            var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == property.LandlordId);
            if (request.ImageBase64s != null && request.ImageBase64s.Any())
            {
                foreach (var b64 in request.ImageBase64s)
                {
                    if (!string.IsNullOrEmpty(b64) && b64.StartsWith("data:image"))
                    {
                        try
                        {
                            var u = await _mediaStorage.SaveBase64ImageAsync(b64, "properties", landlord?.Phone ?? property.LandlordId.ToString());
                            updatedUrls.Add(u);
                        }
                        catch (Exception ex)
                        {
                            return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                        }
                    }
                }
            }
            else if (!string.IsNullOrEmpty(request.ImageBase64) && request.ImageBase64.StartsWith("data:image"))
            {
                try
                {
                    var u = await _mediaStorage.SaveBase64ImageAsync(request.ImageBase64, "properties", landlord?.Phone ?? property.LandlordId.ToString());
                    updatedUrls.Add(u);
                }
                catch (Exception ex)
                {
                    return BadRequest("Không thể lưu ảnh nhà trọ: " + ex.Message);
                }
            }

            if (updatedUrls.Any())
            {
                property.ImageUrl = string.Join(",", updatedUrls);
            }

            await _context.SaveChangesAsync();
            return Ok(MapPropertyToDto(property));
        }

        // Delete property (Checks if any room is occupied before deleting)
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(long id)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null)
            {
                return NotFound(new { message = "Không tìm thấy nhà trọ." });
            }

            if (property.LandlordId != userId && !User.IsInRole("Administrator"))
            {
                return StatusCode(403, new { message = "Bạn không có quyền xóa nhà trọ này." });
            }

            // Kiểm tra xem có phòng nào đang có người ở hoặc có hợp đồng active không
            var roomIds = property.Rooms.Select(r => r.Id).ToList();
            var hasActiveContracts = await _context.Contracts
                .AnyAsync(c => roomIds.Contains(c.RoomId) && c.Status == "Active");

            var occupiedRooms = property.Rooms.Where(r => r.Status == "Occupied" || r.Status == "Rented").ToList();

            if (hasActiveContracts || occupiedRooms.Any())
            {
                var roomNumbers = occupiedRooms.Select(r => r.RoomNumber).Distinct().ToList();
                string details = roomNumbers.Any() ? $" (Phòng: {string.Join(", ", roomNumbers)})" : "";
                return BadRequest(new { message = $"Không thể xóa nhà trọ vì đang có phòng có khách thuê{details}. Vui lòng làm thủ tục trả phòng/kết thúc hợp đồng trước khi xóa!" });
            }

            // Xóa cascade an toàn
            foreach (var r in property.Rooms)
            {
                _context.RoomAmenities.RemoveRange(r.Amenities);
                _context.RoomImages.RemoveRange(r.Images);
            }
            _context.Rooms.RemoveRange(property.Rooms);

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa nhà trọ và các phòng liên quan thành công." });
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

            try
            {
                var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == landlordId);
                var savedUrls = new List<string>();
                if (request.ExistingImageUrls != null)
                {
                    savedUrls.AddRange(request.ExistingImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)));
                }

                if (request.ImageBase64s != null && request.ImageBase64s.Any())
                {
                    foreach (var b64 in request.ImageBase64s)
                    {
                        if (!string.IsNullOrEmpty(b64) && b64.StartsWith("data:image"))
                        {
                            var u = await _mediaStorage.SaveBase64ImageAsync(b64, "properties", landlord?.Phone ?? landlordId.ToString());
                            savedUrls.Add(u);
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(request.ImageBase64) && request.ImageBase64.StartsWith("data:image"))
                {
                    var u = await _mediaStorage.SaveBase64ImageAsync(request.ImageBase64, "properties", landlord?.Phone ?? landlordId.ToString());
                    savedUrls.Add(u);
                }

                string propertyImageUrl = savedUrls.Any() ? string.Join(",", savedUrls) : (property.ImageUrl ?? string.Empty);
                property.ImageUrl = propertyImageUrl;
                await _context.SaveChangesAsync();
                return Ok(new { 
                    ImageUrl = propertyImageUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? propertyImageUrl,
                    ImageUrls = savedUrls
                });
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
            if (User.IsInRole("Administrator")) maxRooms = 999999;

            if (totalRooms >= maxRooms)
            {
                return StatusCode(403, new { message = $"Gói cước hiện tại chỉ cho phép quản lý tối đa {maxRooms} phòng. Đang có {totalRooms} phòng. Vui lòng nâng cấp gói cước." });
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
                    if (!string.IsNullOrEmpty(base64) && base64.StartsWith("data:image"))
                    {
                        try
                        {
                            var imgUrl = await _mediaStorage.SaveBase64ImageAsync(base64, "rooms", room.Id.ToString());
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

        // Add multiple rooms in batch (e.g. auto-generated by floor)
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("{propertyId}/rooms/batch")]
        public async Task<IActionResult> AddRoomsBatch(long propertyId, [FromBody] BatchCreateRoomsDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == propertyId && (p.LandlordId == landlordId || User.IsInRole("Administrator")));
            if (property == null)
            {
                return NotFound("Không tìm thấy khu trọ hoặc bạn không có quyền.");
            }

            if (request.Rooms == null || !request.Rooms.Any())
            {
                return BadRequest("Danh sách phòng không được để trống.");
            }

            // Check room limits
            var landlord = await _context.Users.FirstOrDefaultAsync(u => u.Id == property.LandlordId);
            var currentPackageId = landlord?.SubscriptionId ?? 1;
            var currentTotalRooms = await _context.Rooms.CountAsync(r => r.Property != null && r.Property.LandlordId == property.LandlordId);

            int maxRooms = 10;
            if (currentPackageId == 2) maxRooms = 70;
            else if (currentPackageId == 3) maxRooms = 150;
            else if (currentPackageId > 3) maxRooms = 999999;
            if (User.IsInRole("Administrator")) maxRooms = 999999;

            if (currentTotalRooms + request.Rooms.Count > maxRooms)
            {
                return StatusCode(403, new { message = $"Gói cước hiện tại chỉ cho phép quản lý tối đa {maxRooms} phòng. Đang có {currentTotalRooms} phòng, không thể tạo thêm {request.Rooms.Count} phòng. Vui lòng nâng cấp gói cước." });
            }

            // Check existing room numbers
            var existingRoomNumbers = await _context.Rooms
                .Where(r => r.PropertyId == propertyId)
                .Select(r => r.RoomNumber.ToLower())
                .ToListAsync();

            var newRooms = new List<Room>();
            foreach (var rDto in request.Rooms)
            {
                if (string.IsNullOrWhiteSpace(rDto.RoomNumber)) continue;
                if (existingRoomNumbers.Contains(rDto.RoomNumber.Trim().ToLower()))
                {
                    continue; // Skip duplicate room numbers
                }
                existingRoomNumbers.Add(rDto.RoomNumber.Trim().ToLower());

                var room = new Room
                {
                    PropertyId = propertyId,
                    RoomNumber = rDto.RoomNumber.Trim(),
                    Price = rDto.Price,
                    Area = rDto.Area > 0 ? rDto.Area : 25,
                    MaxOccupants = rDto.MaxOccupants > 0 ? rDto.MaxOccupants : 2,
                    Status = "Available"
                };

                newRooms.Add(room);
            }

            if (!newRooms.Any())
            {
                return BadRequest("Không có phòng hợp lệ hoặc tất cả số phòng đều đã tồn tại trong khu trọ.");
            }

            await _context.Rooms.AddRangeAsync(newRooms);
            await _context.SaveChangesAsync();

            // Add amenities for each room if specified
            var allAmenities = new List<RoomAmenity>();
            for (int i = 0; i < newRooms.Count; i++)
            {
                var rDto = request.Rooms.FirstOrDefault(x => x.RoomNumber == newRooms[i].RoomNumber);
                if (rDto?.Amenities != null && rDto.Amenities.Any())
                {
                    foreach (var amName in rDto.Amenities)
                    {
                        allAmenities.Add(new RoomAmenity { RoomId = newRooms[i].Id, AmenityName = amName });
                    }
                }
            }
            if (allAmenities.Any())
            {
                await _context.RoomAmenities.AddRangeAsync(allAmenities);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = $"Đã tạo thành công {newRooms.Count} phòng cho khu trọ.",
                createdCount = newRooms.Count,
                rooms = newRooms.Select(r => new { r.Id, r.RoomNumber, r.Price, r.Area, r.Status })
            });
        }

        // Sync rooms to match floor configurations for property
        [Authorize(Roles = "Landlord,Administrator")]
        [HttpPost("{propertyId}/sync-floors")]
        public async Task<IActionResult> SyncPropertyFloors(long propertyId, [FromBody] SyncPropertyFloorsDto request)
        {
            var landlordIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(landlordIdStr, out long landlordId))
            {
                return Unauthorized();
            }

            var property = await _context.Properties
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Contracts)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Amenities)
                .Include(p => p.Rooms)
                    .ThenInclude(r => r.Images)
                .FirstOrDefaultAsync(p => p.Id == propertyId && (p.LandlordId == landlordId || User.IsInRole("Administrator")));

            if (property == null)
            {
                return NotFound("Không tìm thấy khu trọ hoặc bạn không có quyền.");
            }

            if (request.Floors == null || !request.Floors.Any())
            {
                return BadRequest("Danh sách tầng không được để trống.");
            }

            // Build list of target rooms from floor configuration
            var targetRooms = new List<RoomCreateDto>();
            foreach (var f in request.Floors)
            {
                var startStr = (f.StartRoom ?? string.Empty).Trim();
                var endStr = (f.EndRoom ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(startStr) || string.IsNullOrEmpty(endStr)) continue;

                var startMatch = System.Text.RegularExpressions.Regex.Match(startStr, @"^(.*?)(\d+)$");
                var endMatch = System.Text.RegularExpressions.Regex.Match(endStr, @"^(.*?)(\d+)$");

                if (startMatch.Success && endMatch.Success && startMatch.Groups[1].Value == endMatch.Groups[1].Value)
                {
                    string prefix = startMatch.Groups[1].Value;
                    int startNum = int.Parse(startMatch.Groups[2].Value);
                    int endNum = int.Parse(endMatch.Groups[2].Value);
                    if (endNum < startNum) continue;

                    bool hasLeadingZero = startMatch.Groups[2].Value.StartsWith("0") || 
                        (startMatch.Groups[2].Value.Length == endMatch.Groups[2].Value.Length && startMatch.Groups[2].Value.Length > 1 && startNum < 100);
                    int padLen = hasLeadingZero ? Math.Max(startMatch.Groups[2].Value.Length, endMatch.Groups[2].Value.Length) : 0;
                    int safeMax = Math.Min(endNum, startNum + 99);

                    for (int i = startNum; i <= safeMax; i++)
                    {
                        string numStr = padLen > 0 ? i.ToString().PadLeft(padLen, '0') : i.ToString();
                        targetRooms.Add(new RoomCreateDto
                        {
                            RoomNumber = prefix + numStr,
                            Price = f.Price > 0 ? f.Price : 2000000,
                            Area = f.Area > 0 ? f.Area : 25,
                            MaxOccupants = f.MaxOccupants > 0 ? f.MaxOccupants : 2
                        });
                    }
                }
                else
                {
                    targetRooms.Add(new RoomCreateDto
                    {
                        RoomNumber = startStr,
                        Price = f.Price > 0 ? f.Price : 2000000,
                        Area = f.Area > 0 ? f.Area : 25,
                        MaxOccupants = f.MaxOccupants > 0 ? f.MaxOccupants : 2
                    });
                    if (endStr != startStr)
                    {
                        targetRooms.Add(new RoomCreateDto
                        {
                            RoomNumber = endStr,
                            Price = f.Price > 0 ? f.Price : 2000000,
                            Area = f.Area > 0 ? f.Area : 25,
                            MaxOccupants = f.MaxOccupants > 0 ? f.MaxOccupants : 2
                        });
                    }
                }
            }

            if (!targetRooms.Any())
            {
                return BadRequest("Không có phòng hợp lệ nào từ cấu hình số tầng.");
            }

            var existingRooms = property.Rooms.OrderBy(r => r.Id).ToList();

            // Contracted rooms must be preserved
            var contractedRoomNumbers = existingRooms
                .Where(r => r.Contracts != null && r.Contracts.Any(c => c.Status == "Active"))
                .Select(r => r.RoomNumber.Trim().ToLower())
                .ToHashSet();

            // Pool of uncontracted/available rooms ready to be updated or renamed
            var availablePool = existingRooms
                .Where(r => !contractedRoomNumbers.Contains(r.RoomNumber.Trim().ToLower()))
                .ToList();

            var matchedRoomIds = new HashSet<long>();

            // Phase 1: Update existing rooms that already match target room numbers exactly
            foreach (var target in targetRooms)
            {
                var existingExact = existingRooms.FirstOrDefault(r => 
                    r.RoomNumber.Trim().Equals(target.RoomNumber.Trim(), StringComparison.OrdinalIgnoreCase) && 
                    !matchedRoomIds.Contains(r.Id));

                if (existingExact != null)
                {
                    existingExact.Price = target.Price;
                    existingExact.Area = target.Area;
                    existingExact.MaxOccupants = target.MaxOccupants;
                    matchedRoomIds.Add(existingExact.Id);
                    availablePool.Remove(existingExact);
                }
            }

            // Phase 2: For remaining target rooms, rename available rooms from availablePool
            var remainingTargets = targetRooms.Where(t => 
                !property.Rooms.Any(r => matchedRoomIds.Contains(r.Id) && r.RoomNumber.Trim().Equals(t.RoomNumber.Trim(), StringComparison.OrdinalIgnoreCase))
            ).ToList();

            foreach (var target in remainingTargets)
            {
                if (availablePool.Any())
                {
                    var roomToRename = availablePool[0];
                    availablePool.RemoveAt(0);

                    roomToRename.RoomNumber = target.RoomNumber.Trim();
                    roomToRename.Price = target.Price;
                    roomToRename.Area = target.Area;
                    roomToRename.MaxOccupants = target.MaxOccupants;
                    roomToRename.Status = "Available";
                    matchedRoomIds.Add(roomToRename.Id);
                }
                else
                {
                    // Create new room if pool exhausted
                    var newRoom = new Room
                    {
                        PropertyId = propertyId,
                        RoomNumber = target.RoomNumber.Trim(),
                        Price = target.Price,
                        Area = target.Area > 0 ? target.Area : 25,
                        MaxOccupants = target.MaxOccupants > 0 ? target.MaxOccupants : 2,
                        Status = "Available"
                    };
                    _context.Rooms.Add(newRoom);
                }
            }

            // Phase 3: Any leftover empty uncontracted rooms that don't belong to any floor
            // are safely removed so duplicate/dummy rooms are cleaned up!
            foreach (var leftover in availablePool)
            {
                _context.RoomAmenities.RemoveRange(leftover.Amenities);
                _context.RoomImages.RemoveRange(leftover.Images);
                _context.Rooms.Remove(leftover);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã cập nhật đồng bộ {targetRooms.Count} phòng theo cấu hình tầng thành công!",
                totalRooms = targetRooms.Count
            });
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

        // Update room details for Landlord and Administrator
        [Authorize(Roles = "Landlord,Administrator")]
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

            if (room.Property.LandlordId != landlordId && !User.IsInRole("Administrator"))
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
                    if (!string.IsNullOrEmpty(base64) && base64.StartsWith("data:image"))
                    {
                        try
                        {
                            var imgUrl = await _mediaStorage.SaveBase64ImageAsync(base64, "rooms", room.Id.ToString());
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
        [Authorize(Roles = "Landlord,Administrator")]
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

            if (room.Property.LandlordId != landlordId && !User.IsInRole("Administrator"))
            {
                return StatusCode(403, new { message = "Bạn không có quyền xóa phòng trọ này." });
            }

            var hasActiveContracts = await _context.Contracts.AnyAsync(c => c.RoomId == roomId && c.Status == "Active");
            var isOccupied = room.Status == "Occupied" || room.Status == "Rented";
            if (hasActiveContracts || isOccupied)
            {
                return BadRequest(new { message = "Không thể xóa phòng đang có khách thuê hoặc hợp đồng đang hoạt động. Vui lòng làm thủ tục trả phòng trước khi xóa." });
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
                try
                {
                    favoriteRoomIds = await _context.Favorites
                        .Where(f => f.UserId == loggedInUserId.Value)
                        .Select(f => f.RoomId)
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Favorites Load Warning] {ex.Message}");
                }
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
                ImageUrls = r.Images != null && r.Images.Any() 
                    ? r.Images.Select(i => i.MediaUrl).ToList() 
                    : (!string.IsNullOrWhiteSpace(r.Property?.ImageUrl) ? new List<string> { r.Property.ImageUrl } : new List<string>()),
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
            var splitImages = p.ImageUrl?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList() ?? new List<string>();
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
                ImageUrl = splitImages.FirstOrDefault() ?? p.ImageUrl,
                ImageUrls = splitImages,
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
                ImageUrls = (r.Images != null && r.Images.Any())
                    ? r.Images.Select(i => i.MediaUrl).ToList()
                    : (!string.IsNullOrWhiteSpace(r.Property?.ImageUrl) ? new List<string> { r.Property.ImageUrl } : new List<string>())
            };
        }
    }
}
