using System.ComponentModel.DataAnnotations;

namespace ZHome.API.Models.DTOs
{
    public class PayBillDto
    {
        [Required]
        [Range(1000, double.MaxValue, ErrorMessage = "Số tiền thanh toán phải lớn hơn 1000")]
        public decimal Amount { get; set; }
    }
}
