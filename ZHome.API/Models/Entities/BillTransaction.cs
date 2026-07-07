using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("bill_transactions")]
    public class BillTransaction
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("monthly_bill_id")]
        public long MonthlyBillId { get; set; }

        [Required]
        [Column("tenant_id")]
        public long TenantId { get; set; }

        [Required]
        [Column("amount", TypeName = "DECIMAL(12, 2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("note")]
        public string? Note { get; set; }

        [ForeignKey("MonthlyBillId")]
        public MonthlyBill? MonthlyBill { get; set; }

        [ForeignKey("TenantId")]
        public User? Tenant { get; set; }
    }
}
