using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class MatchingSurveyDto
    {
        public string? Title { get; set; }
        public string? University { get; set; }
        public bool HasRoom { get; set; } = false;
        public string? Address { get; set; }
        public string? ContactPhone { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageBase64 { get; set; }
        public List<string>? ImagesBase64 { get; set; }

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
        public long Id { get; set; }
        public long StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? AvatarUrl { get; set; }
        
        public string? Title { get; set; }
        public string? University { get; set; }
        public bool HasRoom { get; set; }
        public string? Address { get; set; }
        public string? ContactPhone { get; set; }
        public string? ImageUrl { get; set; }

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
        public System.DateTime CreatedAt { get; set; }
    }
}
