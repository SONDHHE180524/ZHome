using System.Threading.Tasks;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Services
{
    public interface IPayOSService
    {
        Task<PayOSPaymentResponseDto> CreatePaymentLinkAsync(long orderCode, decimal amount, string packageName, int packageId, int months, string userEmail);
        Task<PayOSPaymentResponseDto> CreateBillPaymentLinkAsync(long orderCode, decimal amount, long billId, string description, string userEmail);
        Task<bool> GetPaymentStatusFromPayOSAsync(long orderCode);
        bool VerifyWebhookSignature(PayOSWebhookRequestDto webhookData);
        bool IsConfigured();
    }
}
