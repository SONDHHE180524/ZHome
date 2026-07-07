using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("role_id")]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(15)]
        [Column("phone")]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("email")]
        public string? Email { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("full_name")]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("avatar_url")]
        public string? AvatarUrl { get; set; }

        [MaxLength(20)]
        [Column("cccd_number")]
        public string? CccdNumber { get; set; }

        [MaxLength(255)]
        [Column("cccd_front_url")]
        public string? CccdFrontUrl { get; set; }

        [MaxLength(255)]
        [Column("cccd_back_url")]
        public string? CccdBackUrl { get; set; }

        [MaxLength(20)]
        [Column("verification_status")]
        public string? VerificationStatus { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("subscription_id")]
        public int? SubscriptionId { get; set; }

        [Column("subscription_end_date")]
        public DateTime? SubscriptionEndDate { get; set; }

        [ForeignKey("RoleId")]
        public Role? Role { get; set; }

        [ForeignKey("SubscriptionId")]
        public SubscriptionPackage? SubscriptionPackage { get; set; }
    }
}
