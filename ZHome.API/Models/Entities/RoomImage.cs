using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("room_images")]
    public class RoomImage
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("room_id")]
        public long RoomId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("media_url")]
        public string MediaUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("media_type")]
        public string MediaType { get; set; } = "Image";

        [ForeignKey("RoomId")]
        public Room? Room { get; set; }
    }
}
