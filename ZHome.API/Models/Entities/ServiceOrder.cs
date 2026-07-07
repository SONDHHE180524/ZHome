using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("service_orders")]
    public class ServiceOrder
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("provider_id")]
        public long ProviderId { get; set; }

        [Required]
        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [Column("order_details")]
        public string OrderDetails { get; set; } = string.Empty;

        [Required]
        [Column("total_price", TypeName = "DECIMAL(12, 2)")]
        public decimal TotalPrice { get; set; }

        [Required]
        [Column("commission_amount", TypeName = "DECIMAL(12, 2)")]
        public decimal CommissionAmount { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProviderId")]
        public ServiceProvider? Provider { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
