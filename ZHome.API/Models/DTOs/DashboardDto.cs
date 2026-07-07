using System.Collections.Generic;

namespace ZHome.API.Models.DTOs
{
    public class FinancialSummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal OutstandingDebt { get; set; }
        public int TotalRoomsCount { get; set; }
        public int OccupiedRoomsCount { get; set; }
        public int VacantRoomsCount { get; set; }
        public TaxForecastDto TaxForecast { get; set; } = new();
        public List<MonthlyRevenueItemDto> MonthlyRevenues { get; set; } = new();
    }

    public class TaxForecastDto
    {
        public decimal TotalAnnualRevenue { get; set; }
        public decimal TaxThreshold { get; set; }
        public bool IsTaxable { get; set; }
        public decimal EstimatedVat { get; set; }
        public decimal EstimatedPit { get; set; }
        public decimal TotalEstimatedTax { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class MonthlyRevenueItemDto
    {
        public int Month { get; set; }
        public decimal PaidRevenue { get; set; }
        public decimal UnpaidRevenue { get; set; }
        public decimal TotalBilledAmount { get; set; }
    }
}
