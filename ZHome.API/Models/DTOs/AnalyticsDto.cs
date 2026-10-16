using System;
using System.Collections.Generic;

namespace ZHome.API.Models.DTOs
{
    public class TrackPageViewRequest
    {
        public string SessionToken { get; set; } = string.Empty;
        public string PageUrl { get; set; } = string.Empty;
        public string PageTitle { get; set; } = string.Empty;
        public string PageCategory { get; set; } = "Other";
        public string? ReferrerUrl { get; set; }
        public string? DeviceType { get; set; }
        public int DurationSeconds { get; set; } = 0;
    }

    public class PingSessionRequest
    {
        public string SessionToken { get; set; } = string.Empty;
        public int DurationIncrementSeconds { get; set; } = 15;
        public string? CurrentPageUrl { get; set; }
    }

    public class AnalyticsOverviewDto
    {
        // 1. Tổng số người truy cập hệ thống từ lúc lập hệ thống
        public long AllTimeTotalVisits { get; set; }
        public long AllTimeTotalUniqueVisitors { get; set; }
        public long AllTimeTotalSessions { get; set; }

        // Thống kê hôm nay
        public long TodayVisits { get; set; }
        public long TodayUniqueVisitors { get; set; }
        public long TodaySessions { get; set; }

        // 4. Thời lượng mỗi phiên đăng nhập / truy cập
        public double AverageSessionDurationSeconds { get; set; }
        public string AverageSessionDurationFormatted { get; set; } = "0:00";

        // 3. Người dùng truy cập trang nào nhiều nhất, nhiều thứ 2, thứ 3
        public List<TopPageDto> TopPages { get; set; } = new();

        // 2. Tổng số lượng người truy cập web theo ngày
        public List<DailyTrafficDto> DailyTraffic { get; set; } = new();

        // 5. Tỉ lệ người dùng truy cập từng ngày tính hết các trang mà chủ trọ vs sinh viên truy cập được
        public List<DailyPageRatioDto> DailyPageRatios { get; set; } = new();

        // Phân bố vai trò người dùng (Sinh viên vs Chủ trọ vs Khách vãng lai vs Quản trị viên)
        public List<RoleDistributionDto> RoleDistributions { get; set; } = new();

        // Thống kê ai truy cập nhiều nhất & thời gian hoạt động bao nhiêu
        public List<TopActiveUserDto> TopActiveUsers { get; set; } = new();

        // Nhật ký phiên truy cập gần đây (Thời lượng mỗi phiên)
        public List<RecentSessionDto> RecentSessions { get; set; } = new();
    }

    public class TopActiveUserDto
    {
        public int Rank { get; set; }
        public long? UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string UserRole { get; set; } = "Guest";
        public string RoleDisplay { get; set; } = "Khách vãng lai";
        public long TotalVisits { get; set; }
        public long TotalSessions { get; set; }
        public long TotalDurationSeconds { get; set; }
        public string TotalDurationFormatted { get; set; } = "0s";
        public DateTime LastActivityAt { get; set; }
        public string DeviceType { get; set; } = "Desktop";
    }

    public class TopPageDto
    {
        public int Rank { get; set; } // 1, 2, 3...
        public string PageTitle { get; set; } = string.Empty;
        public string PageUrl { get; set; } = string.Empty;
        public string PageCategory { get; set; } = string.Empty;
        public long VisitsCount { get; set; }
        public long UniqueVisitorsCount { get; set; }
        public double Percentage { get; set; }
        public double AvgDurationSeconds { get; set; }
        public string AvgDurationFormatted { get; set; } = "0:00";
    }

    public class DailyTrafficDto
    {
        public string Date { get; set; } = string.Empty; // yyyy-MM-dd
        public string FormattedDate { get; set; } = string.Empty; // dd/MM
        public string DayOfWeek { get; set; } = string.Empty; // Thứ Hai, v.v.
        public long VisitsCount { get; set; }
        public long UniqueVisitorsCount { get; set; }
        public long SessionsCount { get; set; }
        public double AvgDurationSeconds { get; set; }
    }

    public class DailyPageRatioDto
    {
        public string Date { get; set; } = string.Empty; // yyyy-MM-dd
        public string FormattedDate { get; set; } = string.Empty; // dd/MM
        public long TotalVisits { get; set; }

        // Tỉ lệ các trang chính:
        public long HomepageVisits { get; set; }
        public double HomepageRatio { get; set; }

        public long ViewTroVisits { get; set; }
        public double ViewTroRatio { get; set; }

        public long GhepTroVisits { get; set; }
        public double GhepTroRatio { get; set; }

        public long LandlordVisits { get; set; }
        public double LandlordRatio { get; set; }

        public long TenantVisits { get; set; }
        public double TenantRatio { get; set; }

        public long OtherVisits { get; set; }
        public double OtherRatio { get; set; }
    }

    public class RoleDistributionDto
    {
        public string RoleName { get; set; } = string.Empty; // Sinh viên / Khách thuê, Chủ trọ, Khách vãng lai, Admin
        public string RoleKey { get; set; } = string.Empty; // Tenant, Landlord, Guest, Administrator
        public long VisitsCount { get; set; }
        public double Percentage { get; set; }
    }

    public class RecentSessionDto
    {
        public string SessionToken { get; set; } = string.Empty;
        public long? UserId { get; set; }
        public string UserName { get; set; } = "Khách vãng lai";
        public string? Phone { get; set; }
        public string UserRole { get; set; } = "Guest";
        public string RoleDisplay { get; set; } = "Khách vãng lai";
        public string DeviceType { get; set; } = "Desktop";
        public DateTime StartedAt { get; set; }
        public DateTime LastActivityAt { get; set; }
        public int DurationSeconds { get; set; }
        public string DurationFormatted { get; set; } = "0s";
        public int PageCount { get; set; }
    }
}
