using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class UtilityGridItemDto
    {
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string TenantName { get; set; } = string.Empty;
        public decimal RoomPrice { get; set; }
        public decimal PreviousElectricityReading { get; set; }
        public decimal PreviousWaterReading { get; set; }
        public decimal CurrentElectricityReading { get; set; }
        public decimal CurrentWaterReading { get; set; }
        public decimal ElectricityRate { get; set; } = 3000; // default rate
        public decimal WaterRate { get; set; } = 10000;      // default rate
        public decimal ServiceFee { get; set; } = 50000;      // default service fee
        public decimal RepairDeduction { get; set; } = 0;
        
        // Added for bill status checking
        public string ExistingBillStatus { get; set; } = "None"; // None, Unpaid, Partial, Paid
        public long? ExistingBillId { get; set; }
        public bool IsChecked { get; set; } = true;
    }

    public class UtilityGridSubmitDto
    {
        [Required]
        public long PropertyId { get; set; }

        [Required]
        [Range(1, 12, ErrorMessage = "Tháng phải từ 1 đến 12")]
        public int Month { get; set; }

        [Required]
        [Range(2020, 2100, ErrorMessage = "Năm không hợp lệ")]
        public int Year { get; set; }

        public List<UtilityRoomReadingDto> Readings { get; set; } = new();
    }

    public class UtilityRoomReadingDto
    {
        [Required]
        public long RoomId { get; set; }

        [Required]
        public decimal OldElectricityReading { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Số điện mới phải lớn hơn hoặc bằng số điện cũ")]
        public decimal NewElectricityReading { get; set; }

        [Required]
        public decimal OldWaterReading { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Số nước mới phải lớn hơn hoặc bằng số nước cũ")]
        public decimal NewWaterReading { get; set; }

        public decimal ElectricityRate { get; set; } = 3000;
        public decimal WaterRate { get; set; } = 10000;
        public decimal ServiceFee { get; set; } = 50000;
        public decimal RepairDeduction { get; set; } = 0;
    }
}
