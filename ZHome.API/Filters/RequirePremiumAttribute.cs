using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using System.Security.Claims;
using ZHome.API.Data;

namespace ZHome.API.Filters
{
    public class RequirePremiumAttribute : TypeFilterAttribute
    {
        public RequirePremiumAttribute(int minPriceRequired) : base(typeof(RequirePremiumFilter))
        {
            Arguments = new object[] { minPriceRequired };
        }
    }

    public class RequirePremiumFilter : IAuthorizationFilter
    {
        private readonly int _minPriceRequired;
        private readonly ZHomeDbContext _context;

        public RequirePremiumFilter(int minPriceRequired, ZHomeDbContext context)
        {
            _minPriceRequired = minPriceRequired;
            _context = context;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var userClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userClaim == null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            if (!long.TryParse(userClaim.Value, out long userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // If minPriceRequired is 0, then any active user (even free) is allowed.
            // Actually, we use this attribute specifically to require a PAID package.
            // For example, [RequirePremium(99000)] means the user must have a subscription package of at least 99,000.

            if (user.SubscriptionId == null || user.SubscriptionEndDate == null || user.SubscriptionEndDate < System.DateTime.UtcNow)
            {
                context.Result = new ObjectResult(new { message = "Tính năng này yêu cầu gói cước Premium. Vui lòng nâng cấp gói cước để sử dụng." })
                {
                    StatusCode = 403
                };
                return;
            }

            var package = _context.SubscriptionPackages.FirstOrDefault(p => p.Id == user.SubscriptionId);
            if (package == null || package.Price < _minPriceRequired)
            {
                context.Result = new ObjectResult(new { message = $"Tính năng này yêu cầu gói cước từ {_minPriceRequired:N0}đ/tháng trở lên. Vui lòng nâng cấp gói cước để sử dụng." })
                {
                    StatusCode = 403
                };
                return;
            }
        }
    }
}
