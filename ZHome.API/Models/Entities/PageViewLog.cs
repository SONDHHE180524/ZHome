using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("page_view_logs")]
    public class PageViewLog
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

        [Required]
        [MaxLength(255)]
        [Column("page_url")]
        public string PageUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("page_title")]
        public string PageTitle { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("page_category")]
        public string PageCategory { get; set; } = "Other";

        [MaxLength(500)]
        [Column("referrer_url")]
        public string? ReferrerUrl { get; set; }

        [Column("viewed_at")]
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

        [Column("duration_seconds")]
        public int DurationSeconds { get; set; } = 0;
    }
}
