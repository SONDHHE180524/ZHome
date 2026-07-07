using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class MatchingSurveyDto
    {
        [Required]
        public string Gender { get; set; } = "Male";

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Ngân sách tối thiểu không hợp lệ")]
        public decimal BudgetMin { get; set; } = 0;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Ngân sách tối đa không hợp lệ")]
        public decimal BudgetMax { get; set; }

        public bool Smoke { get; set; } = false;
        public bool SleepLate { get; set; } = false;
        public bool HasPet { get; set; } = false;

        public string? Hometown { get; set; }
        public string? Description { get; set; }

        public string RoommateGenderPreference { get; set; } = "Any"; // Male, Female, Other, Any
    }

    public class MatchResponseDto
    {
        public long StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? AvatarUrl { get; set; }
        
        public string Gender { get; set; } = string.Empty;
        public decimal BudgetMin { get; set; }
        public decimal BudgetMax { get; set; }
        public bool Smoke { get; set; }
        public bool SleepLate { get; set; }
        public bool HasPet { get; set; }
        public string? Hometown { get; set; }
        public string? Description { get; set; }
        public string RoommateGenderPreference { get; set; } = string.Empty;

        public int MatchPercentage { get; set; } // Compatibility percentage
    }
}
