using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZHome.API.Services;

namespace ZHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int limit = 50)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var notifs = await _notificationService.GetUserNotificationsAsync(userId, limit);
            var unreadCount = await _notificationService.GetUnreadCountAsync(userId);

            return Ok(new
            {
                unreadCount = unreadCount,
                items = notifs
            });
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var unreadCount = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { unreadCount });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(long id)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            var success = await _notificationService.MarkAsReadAsync(id, userId);
            if (!success)
            {
                return NotFound("Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn.");
            }

            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu tất cả thông báo là đã đọc." });
        }
    }
}
