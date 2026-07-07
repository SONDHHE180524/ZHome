using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("contracts")]
    public class Contract
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("room_id")]
        public long RoomId { get; set; }

        [Required]
        [Column("tenant_id")]
        public long TenantId { get; set; }

        [Required]
        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Required]
        [Column("room_price", TypeName = "DECIMAL(12, 2)")]
        public decimal RoomPrice { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Active";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        [ForeignKey("TenantId")]
        public User? Tenant { get; set; }
    }
}
