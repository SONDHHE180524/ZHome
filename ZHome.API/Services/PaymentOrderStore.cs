using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace ZHome.API.Services
{
    public class PendingPaymentOrder
    {
        public long OrderCode { get; set; }
        public string OrderType { get; set; } = "SUBSCRIPTION"; // SUBSCRIPTION, BILL
        public long UserId { get; set; }
        public int PackageId { get; set; }
        public string PackageName { get; set; } = string.Empty;
        public int Months { get; set; } = 1;
        public long? BillId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING, PAID, CANCELLED
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
    }

    public class PaymentOrderStore
    {
        private static readonly ConcurrentDictionary<long, PendingPaymentOrder> _orders = new();

        public void AddOrder(PendingPaymentOrder order)
        {
            _orders[order.OrderCode] = order;
        }

        public PendingPaymentOrder? GetOrder(long orderCode)
        {
            _orders.TryGetValue(orderCode, out var order);
            return order;
        }

        public bool MarkPaid(long orderCode, out PendingPaymentOrder? order)
        {
            if (_orders.TryGetValue(orderCode, out order))
            {
                order.Status = "PAID";
                order.PaidAt = DateTime.UtcNow;
                return true;
            }
            return false;
        }

        public System.Collections.Generic.List<PendingPaymentOrder> GetUserPendingOrders(long userId)
        {
            return _orders.Values
                .Where(o => o.UserId == userId && o.Status == "PENDING")
                .ToList();
        }
    }
}
