import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface TopPage {
  rank: number;
  pageTitle: string;
  pageUrl: string;
  pageCategory: string;
  visitsCount: number;
  uniqueVisitorsCount: number;
  percentage: number;
  avgDurationSeconds: number;
  avgDurationFormatted: string;
}

export interface DailyTraffic {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  visitsCount: number;
  uniqueVisitorsCount: number;
  sessionsCount: number;
  avgDurationSeconds: number;
}

export interface DailyPageRatio {
  date: string;
  formattedDate: string;
  totalVisits: number;
  homepageVisits: number;
  homepageRatio: number;
  viewTroVisits: number;
  viewTroRatio: number;
  ghepTroVisits: number;
  ghepTroRatio: number;
  landlordVisits: number;
  landlordRatio: number;
  tenantVisits: number;
  tenantRatio: number;
  otherVisits: number;
  otherRatio: number;
}

export interface RoleDistribution {
  roleName: string;
  roleKey: string;
  visitsCount: number;
  percentage: number;
}

export interface TopActiveUser {
  rank: number;
  userId?: number;
  fullName: string;
  phone?: string;
  userRole: string;
  roleDisplay: string;
  totalVisits: number;
  totalSessions: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  lastActivityAt: string;
  deviceType: string;
}

export interface RecentSession {
  sessionToken: string;
  userId?: number;
  userName: string;
  phone?: string;
  userRole: string;
  roleDisplay: string;
  deviceType: string;
  startedAt: string;
  lastActivityAt: string;
  durationSeconds: number;
  durationFormatted: string;
  pageCount: number;
}

export interface AnalyticsOverview {
  allTimeTotalVisits: number;
  allTimeTotalUniqueVisitors: number;
  allTimeTotalSessions: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  todaySessions: number;
  averageSessionDurationSeconds: number;
  averageSessionDurationFormatted: string;
  topPages: TopPage[];
  dailyTraffic: DailyTraffic[];
  dailyPageRatios: DailyPageRatio[];
  roleDistributions: RoleDistribution[];
  topActiveUsers: TopActiveUser[];
  recentSessions: RecentSession[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  private sessionToken = '';
  private currentUrl = '';
  private pingTimer: any = null;
  private isInitialized = false;

  constructor() {}

  /**
   * Khởi tạo cơ chế tự động theo dõi lượt truy cập và thời lượng phiên toàn hệ thống
   */
  initTracking(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Khởi tạo hoặc lấy lại session token từ sessionStorage
    this.sessionToken = this.getOrCreateSessionToken();

    // 2. Theo dõi chuyển trang qua NavigationEnd
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.handlePageNavigation(url);
      });

    // 3. Khởi chạy định kỳ Ping (mỗi 20 giây) để cập nhật thời lượng phiên
    this.startHeartbeatPing();

    // 4. Bắt sự kiện khi người dùng đóng trang / chuyển tab để lưu thời gian hoạt động cuối
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendBeaconPing();
      });
    }
  }

  private getOrCreateSessionToken(): string {
    if (typeof window === 'undefined') return 'ssr_sess';
    let token = sessionStorage.getItem('zh_visitor_session');
    if (!token) {
      token = 'zh_sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem('zh_visitor_session', token);
    }
    return token;
  }

  private handlePageNavigation(url: string): void {
    this.currentUrl = url;
    const { title, category } = this.resolvePageMetadata(url);

    const payload = {
      sessionToken: this.sessionToken,
      pageUrl: url,
      pageTitle: title,
      pageCategory: category,
      referrerUrl: typeof document !== 'undefined' ? document.referrer : '',
      deviceType: this.detectDeviceType(),
      durationSeconds: 0
    };

    this.http.post<any>(`${this.apiUrl}/track`, payload).subscribe({
      next: (res) => {
        if (res && res.sessionToken) {
          this.sessionToken = res.sessionToken;
        }
      },
      error: () => {
        // Lỗi âm thầm, không ảnh hưởng trải nghiệm người dùng
      }
    });
  }

  private startHeartbeatPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    if (typeof window !== 'undefined') {
      this.pingTimer = setInterval(() => {
        if (!this.sessionToken) return;
        this.http.post<any>(`${this.apiUrl}/ping`, {
          sessionToken: this.sessionToken,
          durationIncrementSeconds: 20,
          currentPageUrl: this.currentUrl
        }).subscribe({
          error: () => {}
        });
      }, 20000);
    }
  }

  private sendBeaconPing(): void {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const data = JSON.stringify({
        sessionToken: this.sessionToken,
        durationIncrementSeconds: 5,
        currentPageUrl: this.currentUrl
      });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(`${this.apiUrl}/ping`, blob);
    }
  }

  private resolvePageMetadata(url: string): { title: string; category: string } {
    const cleanUrl = url.split('?')[0].split('#')[0];

    if (cleanUrl === '' || cleanUrl === '/') {
      return { title: 'Trang chủ ZHome', category: 'Homepage' };
    }
    if (cleanUrl.startsWith('/phong-tro/') || cleanUrl.startsWith('/phong-tro-detail/')) {
      return { title: 'Xem chi tiết phòng trọ', category: 'ViewTro' };
    }
    if (cleanUrl === '/ghep-tro' || cleanUrl === '/tenant/match') {
      return { title: 'Sàn ghép trọ & Tìm bạn cùng phòng', category: 'GhepTro' };
    }
    if (cleanUrl.startsWith('/landlord/overview')) {
      return { title: 'Tổng quan tài chính chủ trọ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/properties') || cleanUrl.startsWith('/landlord/create-property')) {
      return { title: 'Quản lý nhà trọ & Đăng tin', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/rooms')) {
      return { title: 'Quản lý phòng trọ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/bills') || cleanUrl.startsWith('/landlord/utility-grid')) {
      return { title: 'Hóa đơn tiền phòng & Điện nước', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/contracts') || cleanUrl.startsWith('/landlord/create-contract')) {
      return { title: 'Hợp đồng thuê trọ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/tenants')) {
      return { title: 'Quản lý khách thuê', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/reports')) {
      return { title: 'Báo cáo doanh thu & Công nợ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord/packages')) {
      return { title: 'Gói dịch vụ VIP chủ trọ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/landlord')) {
      return { title: 'Phân hệ quản lý chủ trọ', category: 'LandlordArea' };
    }
    if (cleanUrl.startsWith('/tenant/my-rental')) {
      return { title: 'Thông tin phòng trọ đang thuê', category: 'TenantArea' };
    }
    if (cleanUrl.startsWith('/tenant/bills')) {
      return { title: 'Tra cứu & Thanh toán hóa đơn', category: 'TenantArea' };
    }
    if (cleanUrl.startsWith('/tenant')) {
      return { title: 'Phân hệ người thuê trọ', category: 'TenantArea' };
    }
    if (cleanUrl === '/login') {
      return { title: 'Đăng nhập ZHome', category: 'Auth' };
    }
    if (cleanUrl === '/register') {
      return { title: 'Đăng ký tài khoản', category: 'Auth' };
    }
    if (cleanUrl === '/profile') {
      return { title: 'Hồ sơ cá nhân & CCCD', category: 'Profile' };
    }
    if (cleanUrl.startsWith('/admin')) {
      return { title: 'Khu vực quản trị Admin', category: 'AdminArea' };
    }

    return { title: cleanUrl, category: 'Other' };
  }

  private detectDeviceType(): string {
    if (typeof window === 'undefined') return 'Desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
    if (ua.includes('ipad') || ua.includes('tablet')) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Gọi API lấy dữ liệu thống kê tổng thể cho Quản trị viên
   * @param days Số ngày cần xem (7, 14, 30, hoặc 90 ngày)
   */
  getAnalyticsOverview(days: number = 14): Observable<AnalyticsOverview> {
    return this.http.get<AnalyticsOverview>(`${this.apiUrl}/admin/overview?days=${days}`);
  }
}
