using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("service_providers")]
    public class ServiceProvider
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("provider_name")]
        public string ProviderName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("service_type")]
        public string ServiceType { get; set; } = string.Empty; // Moving, Water, Maintenance

        [Required]
        [MaxLength(15)]
        [Column("phone")]
        public string Phone { get; set; } = string.Empty;

        [Column("rating", TypeName = "DECIMAL(3, 2)")]
        public decimal? Rating { get; set; } = 5.0m;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }
}
