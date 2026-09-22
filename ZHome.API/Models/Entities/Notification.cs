using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("type")]
        public string Type { get; set; } = "System"; // LandlordVerification, BillPayment, PaymentConfirmed, IncidentReport, System

        [MaxLength(255)]
        [Column("target_url")]
        public string? TargetUrl { get; set; }

        [Column("reference_id")]
        public long? ReferenceId { get; set; }

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
