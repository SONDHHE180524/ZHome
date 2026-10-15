import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService, AnalyticsOverview, TopPage, DailyTraffic, DailyPageRatio, RecentSession, TopActiveUser } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-traffic-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="analytics-container animate-fade-in">
      <!-- Header Banner -->
      <div class="analytics-header">
        <div class="header-content">
          <div class="header-badge-row">
            <span class="role-badge">Hệ Thống Phân Tích & Giám Sát</span>
            <span class="live-dot-badge">
              <span class="pulse-dot"></span>
              Đang ghi nhận thời gian thực
            </span>
          </div>
          <h1>Thống Kê Lưu Lượng & Thời Lượng Truy Cập</h1>
          <p>
            Báo cáo tổng số người truy cập hệ thống từ lúc khởi lập, lượng khách theo ngày, xếp hạng Top 1, Top 2, Top 3 trang xem nhiều nhất, thời lượng mỗi phiên và tỷ lệ truy cập từng trang giữa chủ trọ & sinh viên.
          </p>
        </div>

        <div class="header-controls">
          <!-- Time Range Selector -->
          <div class="filter-pill-group">
            <button 
              type="button"
              class="pill-btn" 
              [class.active]="selectedDays() === 7" 
              (click)="changeTimeRange(7)">
              7 ngày qua
            </button>
            <button 
              type="button"
              class="pill-btn" 
              [class.active]="selectedDays() === 14" 
              (click)="changeTimeRange(14)">
              14 ngày qua
            </button>
            <button 
              type="button"
              class="pill-btn" 
              [class.active]="selectedDays() === 30" 
              (click)="changeTimeRange(30)">
              30 ngày qua
            </button>
          </div>

          <div class="action-buttons">
            <button (click)="loadAnalytics()" class="btn btn-secondary" title="Cập nhật lại dữ liệu">
              <svg class="refresh-icon" [class.spinning]="isLoading()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Làm mới
            </button>
            <a routerLink="/admin/dashboard" class="btn btn-primary">
              ← Về Dashboard Admin
            </a>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang phân tích dữ liệu lưu lượng và nhật ký phiên hệ thống...</p>
        </div>
      } @else if (data()) {
        <!-- 1. TOP 4 KPI CARDS: ALL-TIME & SESSIONS SUMMARY -->
        <div class="kpi-grid">
          <!-- All-time Total Visitors -->
          <div class="kpi-card card-primary">
            <div class="kpi-icon-wrap bg-blue-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-sub-title">Tổng Người Truy Cập Hệ Thống</div>
              <div class="kpi-main-val text-blue">
                {{ data()?.allTimeTotalVisits | number }}
                <span class="unit-text">lượt</span>
              </div>
              <div class="kpi-footer-note">
                <span class="highlight-green">✓ Toàn thời gian</span> từ lúc khởi lập hệ thống
              </div>
            </div>
          </div>

          <!-- All-time Unique Visitors -->
          <div class="kpi-card card-teal">
            <div class="kpi-icon-wrap bg-teal-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-sub-title">Khách Duy Nhất (Unique Visitors)</div>
              <div class="kpi-main-val text-teal">
                {{ data()?.allTimeTotalUniqueVisitors | number }}
                <span class="unit-text">người</span>
              </div>
              <div class="kpi-footer-note">
                Dựa trên thiết bị & địa chỉ IP độc nhất
              </div>
            </div>
          </div>

          <!-- Average Session Duration -->
          <div class="kpi-card card-amber">
            <div class="kpi-icon-wrap bg-amber-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-sub-title">Thời Lượng Trung Bình Mỗi Phiên</div>
              <div class="kpi-main-val text-amber">
                {{ data()?.averageSessionDurationFormatted }}
              </div>
              <div class="kpi-footer-note">
                Tương đương ~{{ data()?.averageSessionDurationSeconds | number:'1.0-0' }} giây mỗi lần truy cập
              </div>
            </div>
          </div>

          <!-- Today Traffic -->
          <div class="kpi-card card-purple">
            <div class="kpi-icon-wrap bg-purple-glow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-sub-title">Truy Cập Hôm Nay</div>
              <div class="kpi-main-val text-purple">
                {{ data()?.todayVisits | number }}
                <span class="unit-text">lượt</span>
              </div>
              <div class="kpi-footer-note">
                <span class="highlight-purple">{{ data()?.todayUniqueVisitors }}</span> khách độc nhất trong ngày
              </div>
            </div>
          </div>
        </div>

        <!-- 2. PODIUM RANKING: NGƯỜI DÙNG TRUY CẬP TRANG NÀO NHIỀU NHẤT, NHIỀU THỨ 2, THỨ 3 -->
        <!-- 2. PODIUM RANKING: NGƯỜI DÙNG TRUY CẬP TRANG NÀO NHIỀU NHẤT, NHIỀU THỨ 2, THỨ 3 -->
        <div class="section-container">
          <div class="section-header">
            <div>
              <span class="section-tag tag-mono">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
                Bảng Xếp Hạng
              </span>
              <h2>Top Các Trang Được Người Dùng Truy Cập Nhiều Nhất</h2>
              <p>Thống kê chính xác trang được xem nhiều nhất (Top 1), nhiều thứ 2 (Top 2), và nhiều thứ 3 (Top 3) trên hệ thống ZHome</p>
            </div>
          </div>

          <!-- Podium 3 Top Cards -->
          <div class="podium-grid">
            <!-- TOP 2 - BẠC (SILVER) -->
            @if (getTopPage(2); as page2) {
              <div class="podium-card podium-silver">
                <div class="podium-badge silver-badge">
                  <span class="rank-tag-mono">#2</span> TOP 2 NHIỀU THỨ HAI
                </div>
                <div class="podium-page-category">
                  <span class="cat-pill" [class]="getCategoryClass(page2.pageCategory)">{{ getCategoryLabel(page2.pageCategory) }}</span>
                </div>
                <h3 class="podium-title" [title]="page2.pageTitle">{{ page2.pageTitle }}</h3>
                <div class="podium-url">{{ page2.pageUrl }}</div>

                <div class="podium-stats-row">
                  <div class="podium-stat-item">
                    <span class="stat-number">{{ page2.visitsCount | number }}</span>
                    <span class="stat-label">Lượt xem</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number text-dark-bold">{{ page2.percentage }}%</span>
                    <span class="stat-label">Tỷ lệ truy cập</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number">{{ page2.avgDurationFormatted }}</span>
                    <span class="stat-label">Dừng trung bình</span>
                  </div>
                </div>

                <div class="progress-bar-wrap">
                  <div class="progress-bar bar-silver" [style.width.%]="page2.percentage"></div>
                </div>
              </div>
            }

            <!-- TOP 1 - VÀNG (GOLD) - TÂM ĐIỂM -->
            @if (getTopPage(1); as page1) {
              <div class="podium-card podium-gold featured-podium">
                <div class="crown-glow-mono">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
                  </svg>
                </div>
                <div class="podium-badge gold-badge">
                  <span class="rank-tag-mono rank-tag-1">#1</span> TOP 1 NHIỀU NHẤT HỆ THỐNG
                </div>
                <div class="podium-page-category">
                  <span class="cat-pill" [class]="getCategoryClass(page1.pageCategory)">{{ getCategoryLabel(page1.pageCategory) }}</span>
                </div>
                <h3 class="podium-title featured-title" [title]="page1.pageTitle">{{ page1.pageTitle }}</h3>
                <div class="podium-url">{{ page1.pageUrl }}</div>

                <div class="podium-stats-row gold-stats">
                  <div class="podium-stat-item">
                    <span class="stat-number text-dark-bold">{{ page1.visitsCount | number }}</span>
                    <span class="stat-label">Lượt truy cập</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number text-dark-bold">{{ page1.percentage }}%</span>
                    <span class="stat-label">Chiếm tỷ lệ</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number text-dark-bold">{{ page1.avgDurationFormatted }}</span>
                    <span class="stat-label">Thời gian xem TB</span>
                  </div>
                </div>

                <div class="progress-bar-wrap">
                  <div class="progress-bar bar-gold" [style.width.%]="page1.percentage"></div>
                </div>
              </div>
            }

            <!-- TOP 3 - ĐỒNG (BRONZE) -->
            @if (getTopPage(3); as page3) {
              <div class="podium-card podium-bronze">
                <div class="podium-badge bronze-badge">
                  <span class="rank-tag-mono">#3</span> TOP 3 NHIỀU THỨ BA
                </div>
                <div class="podium-page-category">
                  <span class="cat-pill" [class]="getCategoryClass(page3.pageCategory)">{{ getCategoryLabel(page3.pageCategory) }}</span>
                </div>
                <h3 class="podium-title" [title]="page3.pageTitle">{{ page3.pageTitle }}</h3>
                <div class="podium-url">{{ page3.pageUrl }}</div>

                <div class="podium-stats-row">
                  <div class="podium-stat-item">
                    <span class="stat-number">{{ page3.visitsCount | number }}</span>
                    <span class="stat-label">Lượt xem</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number text-dark-bold">{{ page3.percentage }}%</span>
                    <span class="stat-label">Tỷ lệ truy cập</span>
                  </div>
                  <div class="podium-stat-item">
                    <span class="stat-number">{{ page3.avgDurationFormatted }}</span>
                    <span class="stat-label">Dừng trung bình</span>
                  </div>
                </div>

                <div class="progress-bar-wrap">
                  <div class="progress-bar bar-bronze" [style.width.%]="page3.percentage"></div>
                </div>
              </div>
            }
          </div>

          <!-- All Top Pages Detailed Table -->
          <div class="table-responsive-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Xếp Hạng</th>
                  <th>Trang / Đường Dẫn</th>
                  <th>Phân Hệ</th>
                  <th class="text-right">Lượt Xem</th>
                  <th class="text-right">Khách Độc Nhất</th>
                  <th>Tỷ Lệ % Traffic</th>
                  <th class="text-right">Thời Gian Dừng TB</th>
                </tr>
              </thead>
              <tbody>
                @for (p of data()?.topPages; track p.pageUrl; let idx = $index) {
                  <tr [class.highlight-row]="idx < 3">
                    <td>
                      @if (p.rank === 1) {
                        <span class="rank-badge rank-1-mono">#1</span>
                      } @else if (p.rank === 2) {
                        <span class="rank-badge rank-2-mono">#2</span>
                      } @else if (p.rank === 3) {
                        <span class="rank-badge rank-3-mono">#3</span>
                      } @else {
                        <span class="rank-badge rank-normal">#{{ p.rank }}</span>
                      }
                    </td>
                    <td>
                      <div class="page-title-bold">{{ p.pageTitle }}</div>
                      <div class="page-url-sub">{{ p.pageUrl }}</div>
                    </td>
                    <td>
                      <span class="cat-pill" [class]="getCategoryClass(p.pageCategory)">
                        {{ getCategoryLabel(p.pageCategory) }}
                      </span>
                    </td>
                    <td class="text-right font-bold text-dark">
                      {{ p.visitsCount | number }}
                    </td>
                    <td class="text-right text-muted">
                      {{ p.uniqueVisitorsCount | number }}
                    </td>
                    <td style="min-width: 160px;">
                      <div class="table-progress-flex">
                        <span class="progress-text font-bold">{{ p.percentage }}%</span>
                        <div class="mini-progress-track">
                          <div class="mini-progress-fill" [style.width.%]="p.percentage"></div>
                        </div>
                      </div>
                    </td>
                    <td class="text-right font-mono">
                      {{ p.avgDurationFormatted }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. DAILY VISITOR TRAFFIC: TỔNG SỐ LƯỢNG NGƯỜI TRUY CẬP WEB THEO NGÀY -->
        <div class="section-container">
          <div class="section-header">
            <div>
              <span class="section-tag tag-mono">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Lưu Lượng Hàng Ngày
              </span>
              <h2>Tổng Số Lượng Người Truy Cập Web Theo Ngày</h2>
              <p>Biểu đồ cột trực quan biến động số lượt truy cập (Visits) và số người dùng độc nhất (Unique Visitors) qua các ngày</p>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-color bg-dark-col"></span> Lượt truy cập (Pageviews)</span>
              <span class="legend-item"><span class="legend-color bg-slate-col"></span> Người truy cập độc nhất</span>
            </div>
          </div>

          <!-- SVG Visual Bar Chart -->
          <div class="chart-container">
            <div class="chart-bars-wrap">
              @for (day of data()?.dailyTraffic; track day.date) {
                <div class="chart-col" [title]="day.dayOfWeek + ' (' + day.formattedDate + '): ' + day.visitsCount + ' lượt, ' + day.uniqueVisitorsCount + ' khách'">
                  <div class="col-count-tip">{{ day.visitsCount }}</div>
                  <div class="bars-pair">
                    <div class="bar-fill bar-visits" [style.height.px]="calculateBarHeight(day.visitsCount)"></div>
                    <div class="bar-fill bar-uniques" [style.height.px]="calculateBarHeight(day.uniqueVisitorsCount)"></div>
                  </div>
                  <div class="col-label">{{ day.formattedDate }}</div>
                  <div class="col-sub-label">{{ day.dayOfWeek }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Daily Table Breakdown -->
          <div class="table-responsive-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Thứ</th>
                  <th class="text-right">Tổng Lượt Xem (Visits)</th>
                  <th class="text-right">Khách Độc Nhất (Unique)</th>
                  <th class="text-right">Số Phiên (Sessions)</th>
                  <th class="text-right">Thời Lượng Phiên TB</th>
                  <th>Mức Độ Tấp Nập</th>
                </tr>
              </thead>
              <tbody>
                @for (d of data()?.dailyTraffic; track d.date) {
                  <tr>
                    <td class="font-bold text-dark">{{ d.formattedDate }}</td>
                    <td>{{ d.dayOfWeek }}</td>
                    <td class="text-right font-bold text-dark">{{ d.visitsCount | number }}</td>
                    <td class="text-right font-bold text-muted">{{ d.uniqueVisitorsCount | number }}</td>
                    <td class="text-right text-muted">{{ d.sessionsCount | number }}</td>
                    <td class="text-right font-mono">{{ formatSeconds(d.avgDurationSeconds) }}</td>
                    <td>
                      <span class="status-chip" [class]="getTrafficLevelClass(d.visitsCount)">
                        {{ getTrafficLevelText(d.visitsCount) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. TỈ LỆ NGƯỜI DÙNG TRUY CẬP TỪNG NGÀY THEO TỪNG TRANG (HOMEPAGE, VIEW TRỌ, GHÉP TRỌ, CHỦ TRỌ VS SINH VIÊN) -->
        <div class="section-container">
          <div class="section-header">
            <div>
              <span class="section-tag tag-mono">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9"/>
                  <path d="M13 17V5"/>
                  <path d="M8 17v-3"/>
                </svg>
                Phân Tích Cơ Cấu
              </span>
              <h2>Tỉ Lệ Người Dùng Truy Cập Từng Ngày Theo Phân Hệ & Trang</h2>
              <p>Tính hết các trang mà Chủ trọ vs Sinh viên truy cập được: Trang chủ, Xem chi tiết trọ, Ghép trọ sinh viên, Phân hệ chủ trọ, v.v.</p>
            </div>
          </div>

          <!-- Role Distribution Cards Grid with Simple Monochrome Icons -->
          <div class="roles-distribution-grid">
            @for (role of data()?.roleDistributions; track role.roleKey) {
              <div class="role-stat-card">
                <div class="role-card-header">
                  <span class="role-icon-box role-icon-mono">
                    @if (role.roleKey === 'Tenant') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    } @else if (role.roleKey === 'Landlord') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    } @else if (role.roleKey === 'Administrator') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    } @else {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    }
                  </span>
                  <span class="role-pct font-bold">{{ role.percentage }}%</span>
                </div>
                <div class="role-card-title">{{ role.roleName }}</div>
                <div class="role-card-visits">{{ role.visitsCount | number }} lượt truy cập</div>
                <div class="mini-progress-track">
                  <div class="mini-progress-fill bg-dark-col" [style.width.%]="role.percentage"></div>
                </div>
              </div>
            }
          </div>

          <!-- Daily Page Breakdown Table With Stacked Bars -->
          <div class="table-responsive-wrapper">
            <div class="table-sub-header">
              <h3>Chi Tiết Tỷ Lệ % Các Trang Truy Cập Từng Ngày</h3>
              <div class="category-legend">
                <span class="leg-dot bg-home"></span> Trang Chủ
                <span class="leg-dot bg-view"></span> View Trọ
                <span class="leg-dot bg-ghep"></span> Ghép Trọ Sinh Viên
                <span class="leg-dot bg-landlord"></span> Chủ Trọ (Phòng, Hợp đồng, Hóa đơn)
                <span class="leg-dot bg-tenant"></span> Sinh Viên (Phòng thuê, Hóa đơn)
              </div>
            </div>

            <table class="modern-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Ngày</th>
                  <th style="width: 110px;" class="text-right">Tổng Lượt</th>
                  <th style="min-width: 280px;">Thanh Phân Bổ Tỷ Lệ Trang</th>
                  <th class="text-right">Trang Chủ</th>
                  <th class="text-right">View Trọ</th>
                  <th class="text-right">Ghép Trọ</th>
                  <th class="text-right">Chủ Trọ</th>
                  <th class="text-right">Sinh Viên</th>
                </tr>
              </thead>
              <tbody>
                @for (ratio of data()?.dailyPageRatios; track ratio.date) {
                  <tr>
                    <td class="font-bold text-dark">{{ ratio.formattedDate }}</td>
                    <td class="text-right font-bold">{{ ratio.totalVisits | number }}</td>
                    <td>
                      <!-- Multi-colored Stacked Bar representing 100% of the day -->
                      <div class="stacked-bar-container" [title]="'Trang chủ: ' + ratio.homepageRatio + '%, View trọ: ' + ratio.viewTroRatio + '%, Ghép trọ: ' + ratio.ghepTroRatio + '%, Chủ trọ: ' + ratio.landlordRatio + '%, Sinh viên: ' + ratio.tenantRatio + '%'">
                        <div class="stack-seg bg-home" [style.width.%]="ratio.homepageRatio"></div>
                        <div class="stack-seg bg-view" [style.width.%]="ratio.viewTroRatio"></div>
                        <div class="stack-seg bg-ghep" [style.width.%]="ratio.ghepTroRatio"></div>
                        <div class="stack-seg bg-landlord" [style.width.%]="ratio.landlordRatio"></div>
                        <div class="stack-seg bg-tenant" [style.width.%]="ratio.tenantRatio"></div>
                        <div class="stack-seg bg-other" [style.width.%]="ratio.otherRatio"></div>
                      </div>
                    </td>
                    <td class="text-right">
                      <span class="pill-sm pill-home">{{ ratio.homepageRatio }}%</span>
                      <small class="count-sub">({{ ratio.homepageVisits }})</small>
                    </td>
                    <td class="text-right">
                      <span class="pill-sm pill-view">{{ ratio.viewTroRatio }}%</span>
                      <small class="count-sub">({{ ratio.viewTroVisits }})</small>
                    </td>
                    <td class="text-right">
                      <span class="pill-sm pill-ghep">{{ ratio.ghepTroRatio }}%</span>
                      <small class="count-sub">({{ ratio.ghepTroVisits }})</small>
                    </td>
                    <td class="text-right">
                      <span class="pill-sm pill-landlord">{{ ratio.landlordRatio }}%</span>
                      <small class="count-sub">({{ ratio.landlordVisits }})</small>
                    </td>
                    <td class="text-right">
                      <span class="pill-sm pill-tenant">{{ ratio.tenantRatio }}%</span>
                      <small class="count-sub">({{ ratio.tenantVisits }})</small>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. TOP ACTIVE USERS: AI TRUY CẬP NHIỀU NHẤT & THỜI GIAN HOẠT ĐỘNG BAO NHIÊU -->
        <div class="section-container">
          <div class="section-header">
            <div>
              <span class="section-tag tag-primary">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <polyline points="17 11 19 13 23 9"/>
                </svg>
                Thống Kê Người Dùng
              </span>
              <h2>Top Người Dùng Hoạt Động & Truy Cập Nhiều Nhất</h2>
              <p>Danh sách người dùng truy cập nhiều nhất hệ thống, thống kê tổng số phiên, số lượt xem và tổng thời gian hoạt động</p>
            </div>
            <div class="header-stat-badge">
              <span class="badge-count-pill">{{ data()?.topActiveUsers?.length || 0 }} thành viên tích cực</span>
            </div>
          </div>

          <div class="table-responsive-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th style="width: 70px;">Hạng</th>
                  <th>Họ Tên / Người Dùng</th>
                  <th>Số Điện Thoại</th>
                  <th>Vai Trò</th>
                  <th class="text-right">Lượt Xem (Visits)</th>
                  <th class="text-right">Số Phiên</th>
                  <th class="text-right">Tổng Thời Gian Hoạt Động</th>
                  <th>Thiết Bị</th>
                  <th>Hoạt Động Gần Nhất</th>
                </tr>
              </thead>
              <tbody>
                @if (data()?.topActiveUsers && data()!.topActiveUsers.length > 0) {
                  @for (u of data()?.topActiveUsers; track u.userId || u.rank) {
                    <tr>
                      <td>
                        @if (u.rank === 1) {
                          <span class="rank-badge rank-1-mono">🥇 #1</span>
                        } @else if (u.rank === 2) {
                          <span class="rank-badge rank-2-mono">🥈 #2</span>
                        } @else if (u.rank === 3) {
                          <span class="rank-badge rank-3-mono">🥉 #3</span>
                        } @else {
                          <span class="rank-badge rank-normal">#{{ u.rank }}</span>
                        }
                      </td>
                      <td>
                        <div class="user-cell">
                          <div class="user-avatar-box" [class]="'avatar-role-' + u.userRole.toLowerCase()">
                            {{ u.fullName.charAt(0).toUpperCase() }}
                          </div>
                          <div class="user-meta-col">
                            <span class="user-fullname font-bold">{{ u.fullName }}</span>
                            <span class="user-subid">ID: #{{ u.userId }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="phone-text font-mono">{{ u.phone || 'Chưa cập nhật' }}</span>
                      </td>
                      <td>
                        <span class="role-pill" [class]="getRoleBadgeClass(u.userRole)">
                          {{ u.roleDisplay }}
                        </span>
                      </td>
                      <td class="text-right font-bold text-dark">
                        {{ u.totalVisits | number }}
                      </td>
                      <td class="text-right text-muted">
                        {{ u.totalSessions | number }} phiên
                      </td>
                      <td class="text-right">
                        <span class="active-time-pill">
                          <svg class="mini-clock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <strong>{{ u.totalDurationFormatted }}</strong>
                        </span>
                      </td>
                      <td>
                        <span class="device-tag">
                          @if (u.deviceType === 'Mobile') {
                            <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                            Mobile
                          } @else if (u.deviceType === 'Tablet') {
                            <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                            Tablet
                          } @else {
                            <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            Desktop
                          }
                        </span>
                      </td>
                      <td class="font-mono text-muted">
                        {{ u.lastActivityAt | date:'HH:mm:ss dd/MM' }}
                      </td>
                    </tr>
                  }
                } @else {
                  <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                      Đang đồng bộ dữ liệu người dùng tích cực...
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. SESSION DURATION LOGS: THỜI LƯỢNG MỖI PHIÊN ĐĂNG NHẬP / TRUY CẬP -->
        <div class="section-container">
          <div class="section-header">
            <div>
              <span class="section-tag tag-mono">
                <svg class="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Nhật Ký Phiên Truy Cập
              </span>
              <h2>Thời Lượng Chi Tiết Của Từng Phiên Đăng Nhập & Khách Web</h2>
              <p>Danh sách các phiên truy cập gần nhất kèm tên người dùng, thời gian bắt đầu, số trang xem và chính xác thời lượng của mỗi phiên</p>
            </div>
            <div class="duration-legend">
              <span class="badge-dur dur-short">Dưới 1 phút</span>
              <span class="badge-dur dur-medium">1 - 5 phút</span>
              <span class="badge-dur dur-long">Trên 5 phút (Tương tác sâu)</span>
            </div>
          </div>

          <div class="table-responsive-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Người Dùng / Tài Khoản</th>
                  <th>Số Điện Thoại</th>
                  <th>Đối Tượng</th>
                  <th>Thiết Bị</th>
                  <th>Thời Điểm Bắt Đầu</th>
                  <th>Hoạt Động Cuối</th>
                  <th class="text-center">Số Trang Xem</th>
                  <th class="text-right">Thời Lượng Mỗi Phiên</th>
                </tr>
              </thead>
              <tbody>
                @for (sess of data()?.recentSessions; track sess.sessionToken) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar-initial" [class]="'avatar-role-' + sess.userRole.toLowerCase()">
                          {{ sess.userName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="user-meta-col">
                          <span class="user-fullname font-bold">{{ sess.userName }}</span>
                          <span class="user-subcode font-mono text-muted">{{ sess.sessionToken.substring(0, 16) }}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="font-mono text-muted">{{ sess.phone || '—' }}</span>
                    </td>
                    <td>
                      <span class="role-pill" [class]="getRoleBadgeClass(sess.userRole)">
                        {{ sess.roleDisplay }}
                      </span>
                    </td>
                    <td>
                      <span class="device-tag">
                        @if (sess.deviceType === 'Mobile') {
                          <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          Mobile
                        } @else if (sess.deviceType === 'Tablet') {
                          <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          Tablet
                        } @else {
                          <svg class="device-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          Desktop
                        }
                      </span>
                    </td>
                    <td class="font-mono text-muted">{{ sess.startedAt | date:'HH:mm:ss dd/MM' }}</td>
                    <td class="font-mono text-muted">{{ sess.lastActivityAt | date:'HH:mm:ss dd/MM' }}</td>
                    <td class="text-center font-bold">{{ sess.pageCount }}</td>
                    <td class="text-right">
                      <span class="session-duration-badge" [class]="getDurationBadgeClass(sess.durationSeconds)">
                        <svg class="mini-clock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {{ sess.durationFormatted }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1360px;
      margin: 0 auto;
      padding: 32px 24px 60px;
      font-family: inherit;
    }

    /* HEADER BANNER */
    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #ffffff;
      padding: 36px 40px;
      border-radius: 24px;
      margin-bottom: 32px;
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
    }

    .analytics-header::after {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%);
      pointer-events: none;
    }

    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .role-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 14px;
      border-radius: 20px;
    }

    .live-dot-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.6s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .analytics-header h1 {
      font-size: 1.95rem;
      font-weight: 850;
      margin-bottom: 8px;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .analytics-header p {
      color: #94a3b8;
      font-size: 0.95rem;
      max-width: 650px;
      margin: 0;
      line-height: 1.5;
    }

    .header-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 16px;
      z-index: 2;
    }

    .filter-pill-group {
      display: flex;
      background: rgba(255, 255, 255, 0.08);
      padding: 4px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .pill-btn {
      background: transparent;
      border: none;
      color: #cbd5e1;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill-btn:hover {
      color: #ffffff;
    }

    .pill-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
      border: none;
    }

    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .refresh-icon.spinning {
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* LOADING */
    .loading-state {
      text-align: center;
      padding: 80px 20px;
    }

    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    /* 1. TOP KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      transition: all 0.25s ease;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
    }

    .kpi-icon-wrap {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bg-blue-glow { background: #eff6ff; color: #2563eb; }
    .bg-teal-glow { background: #ecfdf5; color: #059669; }
    .bg-amber-glow { background: #fffbeb; color: #d97706; }
    .bg-purple-glow { background: #f3e8ff; color: #7c3aed; }

    .kpi-body {
      display: flex;
      flex-direction: column;
    }

    .kpi-sub-title {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      margin-bottom: 4px;
    }

    .kpi-main-val {
      font-size: 1.85rem;
      font-weight: 850;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .unit-text {
      font-size: 0.95rem;
      font-weight: 600;
      color: #94a3b8;
      margin-left: 4px;
    }

    .text-blue { color: #1d4ed8; }
    .text-teal { color: #059669; }
    .text-amber { color: #b45309; }
    .text-purple { color: #7c3aed; }

    .kpi-footer-note {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .highlight-green { color: #16a34a; font-weight: 700; }
    .highlight-purple { color: #7c3aed; font-weight: 700; }

    /* SECTION CONTAINERS */
    .section-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 22px;
      padding: 32px;
      margin-bottom: 36px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 18px;
    }

    .section-tag {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 4px 12px;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .tag-podium { background: #fef3c7; color: #b45309; }
    .tag-traffic { background: #dbeafe; color: #1d4ed8; }
    .tag-ratios { background: #ecfdf5; color: #047857; }
    .tag-sessions { background: #f3e8ff; color: #6b21a8; }
    .tag-mono {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tag-mono .inline-icon {
      color: #2563eb;
    }
    .tag-primary {
      background: #f5f3ff;
      color: #7c3aed;
      border: 1px solid #ede9fe;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tag-primary .inline-icon {
      color: #7c3aed;
    }
    .rank-tag-mono {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      margin-right: 4px;
    }
    .rank-tag-1 {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
    }
    .crown-glow-mono {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 32px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
    }
    .rank-1-mono { background: #0f172a; color: #ffffff; }
    .rank-2-mono { background: #475569; color: #ffffff; }
    .rank-3-mono { background: #94a3b8; color: #ffffff; }
    .role-icon-mono {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #1e293b;
    }
    .bg-dark-col { background: #0f172a !important; }
    .bg-slate-col { background: #64748b !important; }
    .device-svg {
      width: 14px;
      height: 14px;
      vertical-align: -2px;
      margin-right: 4px;
      color: #475569;
    }
    .mini-clock-svg {
      width: 13px;
      height: 13px;
      vertical-align: -1px;
      color: currentColor;
    }

    .section-header h2 {
      font-size: 1.45rem;
      font-weight: 850;
      color: #0f172a;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }

    .section-header p {
      color: #64748b;
      font-size: 0.92rem;
      margin: 0;
    }

    /* 2. PODIUM GRID */
    .podium-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      align-items: end;
    }

    .podium-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 22px;
      padding: 24px 20px;
      position: relative;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .podium-card:hover {
      transform: translateY(-6px);
    }

    .featured-podium {
      border-color: #f59e0b;
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.16);
      background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
      padding: 30px 24px;
    }

    .crown-glow {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.8rem;
      filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.4));
    }

    .podium-silver {
      border-color: #cbd5e1;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }

    .podium-bronze {
      border-color: #fed7aa;
      background: linear-gradient(180deg, #fffbf7 0%, #ffffff 100%);
    }

    .podium-badge {
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: flex-start;
      margin-bottom: 12px;
    }

    .gold-badge { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .silver-badge { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .bronze-badge { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }

    .podium-page-category {
      margin-bottom: 8px;
    }

    .cat-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-block;
    }

    .cat-home { background: #eff6ff; color: #1d4ed8; }
    .cat-view { background: #f0fdf4; color: #15803d; }
    .cat-ghep { background: #ecfeff; color: #0e7490; }
    .cat-landlord { background: #fef3c7; color: #b45309; }
    .cat-tenant { background: #f5f3ff; color: #6d28d9; }
    .cat-auth { background: #f8fafc; color: #475569; }
    .cat-other { background: #f1f5f9; color: #64748b; }

    .podium-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .featured-title {
      font-size: 1.35rem;
      color: #92400e;
    }

    .podium-url {
      font-size: 0.8rem;
      color: #94a3b8;
      font-family: monospace;
      margin-bottom: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .podium-stats-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }

    .gold-stats {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .podium-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }

    .text-gold-bold { color: #b45309; font-size: 1.3rem; }
    .text-silver { color: #475569; }
    .text-bronze { color: #c2410c; }

    .stat-label {
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 2px;
    }

    .progress-bar-wrap {
      width: 100%;
      height: 8px;
      background: #f1f5f9;
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      border-radius: 10px;
      transition: width 0.6s ease;
    }

    .bar-gold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .bar-silver { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
    .bar-bronze { background: linear-gradient(90deg, #ea580c, #fdba74); }

    /* TABLES */
    .table-responsive-wrapper {
      overflow-x: auto;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      text-align: left;
    }

    .modern-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 750;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 14px 18px;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    .modern-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      color: #334155;
    }

    .modern-table tr:hover {
      background: #fafbfd;
    }

    .highlight-row {
      background: #fefce8;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 750; }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace; font-size: 0.85rem; }

    .rank-badge {
      display: inline-block;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 10px;
    }

    .rank-1 { background: #fef3c7; color: #b45309; }
    .rank-2 { background: #f1f5f9; color: #475569; }
    .rank-3 { background: #ffedd5; color: #c2410c; }
    .rank-normal { background: #f8fafc; color: #64748b; }

    .page-title-bold {
      font-weight: 750;
      color: #0f172a;
    }

    .page-url-sub {
      font-size: 0.78rem;
      color: #94a3b8;
      font-family: monospace;
    }

    .table-progress-flex {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-text {
      width: 44px;
      font-size: 0.85rem;
      color: #1e293b;
    }

    .mini-progress-track {
      flex: 1;
      height: 7px;
      background: #f1f5f9;
      border-radius: 10px;
      overflow: hidden;
    }

    .mini-progress-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 10px;
    }

    /* 3. CHART STYLES */
    .chart-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 24px 20px 16px;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .chart-bars-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      min-width: 700px;
      height: 240px;
      gap: 12px;
      padding-top: 30px;
    }

    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
      cursor: pointer;
    }

    .chart-col:hover .bar-fill {
      filter: brightness(1.1);
    }

    .chart-col:hover .col-count-tip {
      opacity: 1;
      transform: translateY(-2px);
    }

    .col-count-tip {
      font-size: 0.72rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 6px;
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      white-space: nowrap;
    }

    .bars-pair {
      display: flex;
      gap: 4px;
      align-items: flex-end;
      width: 100%;
      max-width: 38px;
      justify-content: center;
    }

    .bar-fill {
      width: 14px;
      border-radius: 6px 6px 0 0;
      transition: height 0.5s ease;
      min-height: 4px;
    }

    .bar-visits {
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
    }

    .bar-uniques {
      background: linear-gradient(180deg, #10b981 0%, #059669 100%);
      width: 10px;
    }

    .col-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 10px;
    }

    .col-sub-label {
      font-size: 0.68rem;
      color: #94a3b8;
    }

    .chart-legend {
      display: flex;
      gap: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #475569;
      font-weight: 600;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .bg-primary-blue { background: #2563eb; }
    .bg-teal-emerald { background: #10b981; }

    .status-chip {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-block;
    }

    .status-high { background: #ecfdf5; color: #059669; }
    .status-normal { background: #eff6ff; color: #2563eb; }
    .status-low { background: #f8fafc; color: #64748b; }

    /* 4. ROLES DISTRIBUTION & RATIOS */
    .roles-distribution-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .role-stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .role-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .role-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .role-tenant { background: #ecfeff; color: #0891b2; }
    .role-landlord { background: #fef3c7; color: #b45309; }
    .role-admin { background: #f3e8ff; color: #7c3aed; }
    .role-guest { background: #eff6ff; color: #2563eb; }

    .role-pct {
      font-size: 1.3rem;
      color: #0f172a;
    }

    .role-card-title {
      font-size: 0.92rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .role-card-visits {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 12px;
    }

    .fill-tenant { background: #0891b2; }
    .fill-landlord { background: #d97706; }
    .fill-admin { background: #7c3aed; }
    .fill-guest { background: #2563eb; }

    .table-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .table-sub-header h3 {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .category-legend {
      display: flex;
      gap: 14px;
      font-size: 0.78rem;
      color: #475569;
    }

    .leg-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* STACKED MULTI-SEGMENT BARS */
    .stacked-bar-container {
      width: 100%;
      height: 16px;
      background: #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.06);
    }

    .stack-seg {
      height: 100%;
      transition: width 0.4s ease;
    }

    .bg-home { background: #2563eb; }
    .bg-view { background: #10b981; }
    .bg-ghep { background: #06b6d4; }
    .bg-landlord { background: #f59e0b; }
    .bg-tenant { background: #8b5cf6; }
    .bg-other { background: #94a3b8; }

    .pill-sm {
      font-size: 0.78rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 8px;
      display: inline-block;
    }

    .pill-home { background: #dbeafe; color: #1e40af; }
    .pill-view { background: #d1fae5; color: #065f46; }
    .pill-ghep { background: #cffafe; color: #155e75; }
    .pill-landlord { background: #fef3c7; color: #92400e; }
    .pill-tenant { background: #ede9fe; color: #5b21b6; }

    .count-sub {
      font-size: 0.72rem;
      color: #94a3b8;
      margin-left: 4px;
    }

    /* 5. SESSION DURATION STYLES */
    .duration-legend {
      display: flex;
      gap: 12px;
    }

    .badge-dur {
      font-size: 0.75rem;
      font-weight: 750;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .dur-short { background: #f1f5f9; color: #475569; }
    .dur-medium { background: #e0f2fe; color: #0369a1; }
    .dur-long { background: #ecfdf5; color: #047857; }

    .session-code {
      font-family: monospace;
      font-size: 0.82rem;
      color: #3b82f6;
      background: #eff6ff;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }

    .role-pill {
      font-size: 0.75rem;
      font-weight: 750;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-block;
    }

    .role-badge-tenant { background: #cffafe; color: #155e75; }
    .role-badge-landlord { background: #fef3c7; color: #92400e; }
    .role-badge-admin { background: #ede9fe; color: #5b21b6; }
    .role-badge-guest { background: #f1f5f9; color: #475569; }

    .device-tag {
      font-size: 0.8rem;
      color: #475569;
      font-weight: 600;
    }

    .session-duration-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: monospace;
      font-size: 0.84rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 10px;
    }

    .badge-dur-short { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-dur-med { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-dur-long { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

    /* USER TABLE & AVATAR CELLS */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar-box, .user-avatar-initial {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 850;
      font-size: 0.95rem;
      flex-shrink: 0;
      border: 1px solid transparent;
    }

    .avatar-role-tenant { background: #ecfeff; color: #0891b2; border-color: #cffafe; }
    .avatar-role-landlord { background: #fffbeb; color: #d97706; border-color: #fde68a; }
    .avatar-role-administrator { background: #f3e8ff; color: #7c3aed; border-color: #e9d5ff; }
    .avatar-role-admin { background: #f3e8ff; color: #7c3aed; border-color: #e9d5ff; }
    .avatar-role-guest { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }

    .user-meta-col {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .user-fullname {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .user-subid, .user-subcode, .user-subphone {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .phone-text {
      font-size: 0.85rem;
      color: #334155;
      font-weight: 600;
    }

    .badge-count-pill {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 750;
      font-size: 0.8rem;
      padding: 6px 14px;
      border-radius: 12px;
      border: 1px solid #dbeafe;
    }

    .active-time-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 0.85rem;
    }

    /* RESPONSIVE */
    @media (max-width: 992px) {
      .analytics-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-controls {
        align-items: flex-start;
        width: 100%;
      }
      .podium-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminTrafficAnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(true);
  selectedDays = signal<number>(14);
  data = signal<AnalyticsOverview | null>(null);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.analyticsService.getAnalyticsOverview(this.selectedDays()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching analytics overview:', err);
        this.toastService.show('Không thể tải dữ liệu thống kê lưu lượng.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  changeTimeRange(days: number): void {
    this.selectedDays.set(days);
    this.loadAnalytics();
  }

  getTopPage(rank: number): TopPage | undefined {
    return this.data()?.topPages?.find(p => p.rank === rank);
  }

  calculateBarHeight(val: number): number {
    const list = this.data()?.dailyTraffic || [];
    const maxVal = Math.max(...list.map(d => d.visitsCount), 1);
    const height = (val / maxVal) * 160;
    return Math.max(height, 6);
  }

  formatSeconds(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    const s = Math.round(seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'Homepage': return 'cat-home';
      case 'ViewTro': return 'cat-view';
      case 'GhepTro': return 'cat-ghep';
      case 'LandlordArea': return 'cat-landlord';
      case 'TenantArea': return 'cat-tenant';
      case 'Auth': return 'cat-auth';
      default: return 'cat-other';
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'Homepage': return 'Trang Chủ';
      case 'ViewTro': return 'View Trọ';
      case 'GhepTro': return 'Ghép Trọ';
      case 'LandlordArea': return 'Chủ Trọ';
      case 'TenantArea': return 'Sinh Viên';
      case 'Auth': return 'Đăng Nhập';
      default: return 'Khác';
    }
  }

  getTrafficLevelClass(count: number): string {
    if (count > 50) return 'status-high';
    if (count > 25) return 'status-normal';
    return 'status-low';
  }

  getTrafficLevelText(count: number): string {
    if (count > 50) return '🔥 Rất nhộn nhịp';
    if (count > 25) return 'Ổn định';
    return 'Bình thường';
  }

  getRoleIconClass(roleKey: string): string {
    switch (roleKey) {
      case 'Tenant': return 'role-tenant';
      case 'Landlord': return 'role-landlord';
      case 'Administrator': return 'role-admin';
      default: return 'role-guest';
    }
  }

  getRoleProgressClass(roleKey: string): string {
    switch (roleKey) {
      case 'Tenant': return 'fill-tenant';
      case 'Landlord': return 'fill-landlord';
      case 'Administrator': return 'fill-admin';
      default: return 'fill-guest';
    }
  }

  getRoleBadgeClass(roleKey: string): string {
    switch (roleKey) {
      case 'Tenant': return 'role-badge-tenant';
      case 'Landlord': return 'role-badge-landlord';
      case 'Administrator': return 'role-badge-admin';
      default: return 'role-badge-guest';
    }
  }

  getDurationBadgeClass(seconds: number): string {
    if (seconds >= 300) return 'badge-dur-long'; // >= 5m
    if (seconds >= 60) return 'badge-dur-med'; // 1m - 5m
    return 'badge-dur-short'; // < 1m
  }
}
