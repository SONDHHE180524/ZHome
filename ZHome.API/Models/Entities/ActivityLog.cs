using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("activity_logs")]
    public class ActivityLog
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long? UserId { get; set; }

        [MaxLength(150)]
        [Column("user_name")]
        public string UserName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("user_role")]
        public string UserRole { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("action")]
        public string Action { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [MaxLength(50)]
        [Column("ip_address")]
        public string? IpAddress { get; set; }

        [MaxLength(255)]
        [Column("user_agent")]
        public string? UserAgent { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
