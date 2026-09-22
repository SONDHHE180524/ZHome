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
        public List<string> ImageBase64s { get; set; } = new();
    }

    public class RoomResponseDto
    {
        public long Id { get; set; }
        public long PropertyId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Area { get; set; }
        public int MaxOccupants { get; set; }
        public int BedsCount { get; set; } = 1;
        public int ActiveTenantsCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();
    }

    public class RoomUpdateDto
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

        public string Status { get; set; } = "Available";

        public List<string> Amenities { get; set; } = new();
        public List<string> ExistingImageUrls { get; set; } = new();
        public List<string> NewImageBase64s { get; set; } = new();
    }

    public class RoomContractTenantDto
    {
        public long ContractId { get; set; }
        public long TenantId { get; set; }
        public string TenantFullName { get; set; } = string.Empty;
        public string TenantPhone { get; set; } = string.Empty;
        public string TenantIdCardNumber { get; set; } = string.Empty;
        public System.DateTime StartDate { get; set; }
        public System.DateTime EndDate { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public string PaymentCycle { get; set; } = "Thanh toán hàng tháng";
        public string Status { get; set; } = "Active";
        public System.DateTime CreatedAt { get; set; }
    }

    public class RoomBillSummaryDto
    {
        public long BillId { get; set; }
        public int BillingMonth { get; set; }
        public int BillingYear { get; set; }
        public decimal ElectricityUsage { get; set; }
        public decimal WaterUsage { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public string Status { get; set; } = "Unpaid";
        public System.DateTime? PaidAt { get; set; }
    }

    public class RoomDetailLandlordDto
    {
        public long Id { get; set; }
        public long PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string PropertyAddress { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Area { get; set; }
        public int MaxOccupants { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();
        public List<string> ImageUrls { get; set; } = new();
        public List<RoomContractTenantDto> ActiveContracts { get; set; } = new();
        public List<RoomBillSummaryDto> RecentBills { get; set; } = new();
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
        public int VacantRoomsCount { get; set; }
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
