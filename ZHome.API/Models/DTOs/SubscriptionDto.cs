using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class SubscriptionPackageDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int MaxRooms { get; set; }
        public string? Description { get; set; }
    }

    public class PurchaseRequestDto
    {
        [Required]
        public int PackageId { get; set; }
        public int Months { get; set; } = 1;
    }
}
