using System.Threading.Tasks;
using ZHome.API.Models.DTOs;
using ZHome.API.Models.Entities;

namespace ZHome.API.Services
{
    public interface IBillService
    {
        Task<(bool Success, string Message)> SubmitUtilityGridAsync(long landlordId, UtilityGridSubmitDto request);
        Task<(bool Success, string Message, MonthlyBill? Bill)> ConfirmPaymentAsync(long billId, long landlordId, bool isAdmin, decimal? amount, string? note);
        Task<(bool Success, string Message, MonthlyBill? Bill)> RejectPaymentAsync(long billId, long landlordId, bool isAdmin, string? reason);
    }
}
