using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("room_amenities")]
    public class RoomAmenity
    {
        [Column("room_id")]
        public long RoomId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("amenity_name")]
        public string AmenityName { get; set; } = string.Empty;

        [ForeignKey("RoomId")]
        public Room? Room { get; set; }
    }
}
