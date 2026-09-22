using System.Collections.Generic;
using System.Threading.Tasks;
using ZHome.API.Models.Entities;

namespace ZHome.API.Services
{
    public interface INotificationService
    {
        Task<Notification> CreateNotificationAsync(long userId, string title, string message, string type, string? targetUrl = null, long? referenceId = null);
        Task NotifyAdminsAsync(string title, string message, string type, string? targetUrl = null, long? referenceId = null);
        Task<List<Notification>> GetUserNotificationsAsync(long userId, int limit = 50);
        Task<int> GetUnreadCountAsync(long userId);
        Task<bool> MarkAsReadAsync(long notificationId, long userId);
        Task<bool> MarkAllAsReadAsync(long userId);
    }
}
