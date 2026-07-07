using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("matching_profiles")]
    public class MatchingProfile
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("student_id")]
        public long StudentId { get; set; }

        [Required]
        [MaxLength(10)]
        [Column("gender")]
        public string Gender { get; set; } = string.Empty;

        [Column("budget_min", TypeName = "DECIMAL(12, 2)")]
        public decimal BudgetMin { get; set; } = 0;

        [Required]
        [Column("budget_max", TypeName = "DECIMAL(12, 2)")]
        public decimal BudgetMax { get; set; }

        [Column("smoke")]
        public bool Smoke { get; set; } = false;

        [Column("sleep_late")]
        public bool SleepLate { get; set; } = false;

        [Column("has_pet")]
        public bool HasPet { get; set; } = false;

        [MaxLength(100)]
        [Column("hometown")]
        public string? Hometown { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [MaxLength(10)]
        [Column("roommate_gender_preference")]
        public string RoommateGenderPreference { get; set; } = "Any";

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }
    }
}
