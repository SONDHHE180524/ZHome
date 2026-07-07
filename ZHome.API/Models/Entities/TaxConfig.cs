using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("tax_configs")]
    public class TaxConfig
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("effective_date")]
        public DateTime EffectiveDate { get; set; }

        [Required]
        [Column("revenue_threshold", TypeName = "DECIMAL(12, 2)")]
        public decimal RevenueThreshold { get; set; }

        [Required]
        [Column("vat_rate", TypeName = "DECIMAL(5, 4)")]
        public decimal VatRate { get; set; }

        [Required]
        [Column("pit_rate", TypeName = "DECIMAL(5, 4)")]
        public decimal PitRate { get; set; }

        [MaxLength(255)]
        [Column("description")]
        public string? Description { get; set; }
    }
}
