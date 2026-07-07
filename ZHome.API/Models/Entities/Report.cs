using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("reports")]
    public class Report
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("tenant_id")]
        public long TenantId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("TenantId")]
        public User? Tenant { get; set; }

        [Column("contract_id")]
        public long? ContractId { get; set; }

        [ForeignKey("ContractId")]
        public Contract? Contract { get; set; }

        [Column("rating")]
        public int? Rating { get; set; }

        [Column("landlord_reply")]
        public string? LandlordReply { get; set; }

        [Column("replied_at")]
        public DateTime? RepliedAt { get; set; }
    }
}
