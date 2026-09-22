using System.Threading.Tasks;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Services
{
    public interface ISePayService
    {
        bool IsConfigured();
        SePayPaymentResponseDto CreatePaymentInfo(long orderCode, decimal amount, string packageName, int packageId, int months, string userEmail);
        SePayPaymentResponseDto CreateBillPaymentInfo(long orderCode, decimal amount, long billId, string customDescription, string userEmail);
        bool VerifyWebhookToken(string? authHeader);
        Task<bool> CheckTransactionFromSePayAsync(string descriptionPattern, decimal expectedAmount);
    }
}
