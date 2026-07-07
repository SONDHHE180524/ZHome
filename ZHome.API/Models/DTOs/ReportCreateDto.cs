using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class ReportCreateDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public long? ContractId { get; set; }
        
        [Range(1, 5)]
        public int? Rating { get; set; }
    }
}
