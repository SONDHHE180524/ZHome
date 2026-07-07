using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class PropertyCreateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [MaxLength(255)]
        public string Address { get; set; } = string.Empty;

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? ImageBase64 { get; set; }
    }

    public class UpdatePropertyImageDto
    {
        public string ImageBase64 { get; set; } = string.Empty;
    }

    public class PropertyResponseDto
    {
        public long Id { get; set; }
        public long LandlordId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Address { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsVerifiedTick { get; set; }
        public int ViewCount { get; set; }
        public string? ImageUrl { get; set; }
        public List<RoomResponseDto> Rooms { get; set; } = new();
    }

    public class RoomCreateDto
    {
        [Required]
        [MaxLength(50)]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá phòng phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Diện tích phòng phải lớn hơn 0")]
        public decimal Area { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng khách tối đa phải lớn hơn hoặc bằng 1")]
        public int MaxOccupants { get; set; }

        public List<string> Amenities { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();
    }

    public class RoomResponseDto
    {
        public long Id { get; set; }
        public long PropertyId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Area { get; set; }
        public int MaxOccupants { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();
    }

    public class PropertyListingDto
    {
        public long PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsVerifiedTick { get; set; }
        public string? PropertyImageUrl { get; set; }
        public long LandlordId { get; set; }
        public string LandlordName { get; set; } = string.Empty;
        public string LandlordPhone { get; set; } = string.Empty;
        public int TotalRooms { get; set; }
        public int ViewCount { get; set; }
        
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Area { get; set; }
        public int MaxOccupants { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Amenities { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();

        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsFavorite { get; set; }
        public int SubscriptionId { get; set; }
    }
}
