using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("rooms")]
    public class Room
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("property_id")]
        public long PropertyId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("room_number")]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        [Column("price", TypeName = "DECIMAL(12, 2)")]
        public decimal Price { get; set; }

        [Required]
        [Column("area", TypeName = "DECIMAL(5, 2)")]
        public decimal Area { get; set; }

        [Column("max_occupants")]
        public int MaxOccupants { get; set; } = 1;

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Available";

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }

        public ICollection<RoomAmenity> Amenities { get; set; } = new List<RoomAmenity>();
        public ICollection<RoomImage> Images { get; set; } = new List<RoomImage>();
        public ICollection<MonthlyBill> MonthlyBills { get; set; } = new List<MonthlyBill>();
    }
}
