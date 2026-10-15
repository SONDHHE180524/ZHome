using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("user_sessions")]
    public class UserSession
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("session_token")]
        public string SessionToken { get; set; } = string.Empty;

        [Column("user_id")]
        public long? UserId { get; set; }

        [MaxLength(50)]
        [Column("user_role")]
        public string UserRole { get; set; } = "Guest";

        [MaxLength(100)]
        [Column("ip_address")]
        public string? IpAddress { get; set; }

        [MaxLength(500)]
        [Column("user_agent")]
        public string? UserAgent { get; set; }

        [MaxLength(50)]
        [Column("device_type")]
        public string? DeviceType { get; set; }

        [Column("started_at")]
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        [Column("last_activity_at")]
        public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

        [Column("duration_seconds")]
        public int DurationSeconds { get; set; } = 0;

        [Column("page_count")]
        public int PageCount { get; set; } = 1;
    }
}
