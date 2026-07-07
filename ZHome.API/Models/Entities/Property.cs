using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("properties")]
    public class Property
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("landlord_id")]
        public long LandlordId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [Column("latitude", TypeName = "DECIMAL(10, 8)")]
        public decimal? Latitude { get; set; }

        [Column("longitude", TypeName = "DECIMAL(11, 8)")]
        public decimal? Longitude { get; set; }

        [Column("is_verified_tick")]
        public bool IsVerifiedTick { get; set; } = false;

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("LandlordId")]
        public User? Landlord { get; set; }

        public ICollection<Room> Rooms { get; set; } = new List<Room>();
    }
}
