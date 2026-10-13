using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZHome.API.Data;
using ZHome.API.Models.Entities;

using Microsoft.AspNetCore.SignalR;
using ZHome.API.Hubs;

namespace ZHome.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ZHomeDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(ZHomeDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<Notification> CreateNotificationAsync(long userId, string title, string message, string type, string? targetUrl = null, long? referenceId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                TargetUrl = targetUrl,
                ReferenceId = referenceId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Real-time Push qua SignalR tới người dùng nhận thông báo
            try
            {
                await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    userId = notification.UserId,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    targetUrl = notification.TargetUrl,
                    referenceId = notification.ReferenceId,
                    isRead = notification.IsRead,
                    createdAt = notification.CreatedAt
                });
            }
            catch
            {
                // Bỏ qua nếu SignalR lỗi ngắt kết nối tạm thời
            }

            return notification;
        }

        public async Task NotifyAdminsAsync(string title, string message, string type, string? targetUrl = null, long? referenceId = null)
        {
            var adminUsers = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "Administrator")
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var admin in adminUsers)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = admin.Id,
                    Title = title,
                    Message = message,
                    Type = type,
                    TargetUrl = targetUrl,
                    ReferenceId = referenceId,
                    IsRead = false,
                    CreatedAt = now
                });
            }

            if (adminUsers.Any())
            {
                await _context.SaveChangesAsync();

                // Real-time Push qua SignalR tới tất cả Quản trị viên
                try
                {
                    await _hubContext.Clients.Group("admins").SendAsync("ReceiveNotification", new
                    {
                        title = title,
                        message = message,
                        type = type,
                        targetUrl = targetUrl,
                        referenceId = referenceId,
                        createdAt = now
                    });
                }
                catch
                {
                    // Bỏ qua nếu SignalR lỗi ngắt kết nối tạm thời
                }
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(long userId, int limit = 50)
        {
            return await _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(long userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<bool> MarkAsReadAsync(long notificationId, long userId)
        {
            var notif = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notif == null) return false;

            if (!notif.IsRead)
            {
                notif.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(long userId)
        {
            var unreadNotifs = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!unreadNotifs.Any()) return true;

            foreach (var n in unreadNotifs)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
