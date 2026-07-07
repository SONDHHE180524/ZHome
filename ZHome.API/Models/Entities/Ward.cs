using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("wards")]
    public class Ward
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("district_id")]
        public int DistrictId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [ForeignKey("DistrictId")]
        public District? District { get; set; }
    }
}
