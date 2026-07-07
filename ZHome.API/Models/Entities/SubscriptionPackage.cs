using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("subscription_packages")]
    public class SubscriptionPackage
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("price")]
        public decimal Price { get; set; }

        [Required]
        [Column("max_rooms")]
        public int MaxRooms { get; set; }

        [Column("description")]
        public string? Description { get; set; }
    }
}
