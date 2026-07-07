using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZHome.API.Models.Entities
{
    [Table("monthly_bills")]
    public class MonthlyBill
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("room_id")]
        public long RoomId { get; set; }

        [Required]
        [Column("billing_month")]
        public int BillingMonth { get; set; }

        [Required]
        [Column("billing_year")]
        public int BillingYear { get; set; }

        [Required]
        [Column("room_fee", TypeName = "DECIMAL(12, 2)")]
        public decimal RoomFee { get; set; }

        [Column("electricity_old_reading", TypeName = "DECIMAL(10, 2)")]
        public decimal ElectricityOldReading { get; set; } = 0;

        [Column("electricity_new_reading", TypeName = "DECIMAL(10, 2)")]
        public decimal ElectricityNewReading { get; set; } = 0;

        [Column("electricity_fee", TypeName = "DECIMAL(12, 2)")]
        public decimal ElectricityFee { get; set; } = 0;

        [Column("water_old_reading", TypeName = "DECIMAL(10, 2)")]
        public decimal WaterOldReading { get; set; } = 0;

        [Column("water_new_reading", TypeName = "DECIMAL(10, 2)")]
        public decimal WaterNewReading { get; set; } = 0;

        [Column("water_fee", TypeName = "DECIMAL(12, 2)")]
        public decimal WaterFee { get; set; } = 0;

        [Column("service_fee", TypeName = "DECIMAL(12, 2)")]
        public decimal ServiceFee { get; set; } = 0;

        [Column("repair_deduction", TypeName = "DECIMAL(12, 2)")]
        public decimal RepairDeduction { get; set; } = 0;

        [Required]
        [Column("total_amount", TypeName = "DECIMAL(12, 2)")]
        public decimal TotalAmount { get; set; }

        [Column("paid_amount", TypeName = "DECIMAL(12, 2)")]
        public decimal PaidAmount { get; set; } = 0;

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Unpaid";

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [MaxLength(255)]
        [Column("note")]
        public string? Note { get; set; }

        [ForeignKey("RoomId")]
        public Room? Room { get; set; }

        public ICollection<BillTransaction> Transactions { get; set; } = new List<BillTransaction>();
    }
}
