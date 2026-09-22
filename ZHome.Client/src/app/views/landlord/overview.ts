import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landlord-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="overview-workspace-container animate-fade-in">
      
      <!-- SECTION TITLE & YEAR FILTER -->
      <div class="dash-title-row">
        <h1 class="dash-page-title">Tổng quan</h1>
        <div class="year-filter-box">
          <label for="yearSelect">NĂM BÁO CÁO: </label>
          <select id="yearSelect" [(ngModel)]="currentYear" (change)="onYearChange()" class="year-select">
            <option [value]="2026">2026</option>
            <option [value]="2027">2027</option>
          </select>
          <button class="btn-export-excel" (click)="exportCsv()">Xuất File Excel/CSV</button>
        </div>
      </div>

      <!-- TOP 5 COLORED KPI STAT CARDS -->
      <div class="kpi-cards-grid">
        <!-- Card 1: Nhà trọ (Blue) -->
        <div class="kpi-card card-bg-blue">
          <div class="kpi-header">
            <span>Nhà trọ</span>
            <button class="kpi-add-btn" routerLink="/landlord/create-property" title="Thêm nhà trọ mới">+</button>
          </div>
          <div class="kpi-value">{{ summary()?.totalPropertiesCount || 0 }}</div>
          <div class="kpi-watermark"></div>
        </div>

        <!-- Card 2: Tổng số phòng (Dark Purple) -->
        <div class="kpi-card card-bg-purple">
          <div class="kpi-header">
            <span>Tổng số phòng</span>
          </div>
          <div class="kpi-value">{{ summary()?.totalRoomsCount || 0 }}</div>
          <div class="kpi-watermark"></div>
        </div>

        <!-- Card 3: Số phòng trống (Orange) -->
        <div class="kpi-card card-bg-orange">
          <div class="kpi-header">
            <span>Số phòng trống</span>
          </div>
          <div class="kpi-value">{{ summary()?.vacantRoomsCount || 0 }}</div>
          <div class="kpi-watermark"></div>
        </div>

        <!-- Card 4: Số phòng cho thuê (Emerald Green) -->
        <div class="kpi-card card-bg-green">
          <div class="kpi-header">
            <span>Số phòng cho thuê</span>
          </div>
          <div class="kpi-value">{{ summary()?.occupiedRoomsCount || 0 }}</div>
          <div class="kpi-watermark"></div>
        </div>

        <!-- Card 5: Số phòng nợ tiền (Crimson Red) -->
        <div class="kpi-card card-bg-red">
          <div class="kpi-header">
            <span>Số phòng nợ tiền</span>
          </div>
          <div class="kpi-value">{{ summary()?.debtedRoomsCount || 0 }}</div>
          <div class="kpi-watermark"></div>
        </div>
      </div>

      <!-- REFINED 3 METRICS GRID (TỔNG KHOẢN THU, SỐ PHÒNG ĐANG ĐĂNG, TIN HOT) -->
      <div class="metrics-grid-3">
        <div class="metric-box">
          <div class="metric-top">
            <span class="metric-label">TỔNG KHOẢN THU</span>
            <span class="metric-icon-badge badge-blue">↗️</span>
          </div>
          <div class="metric-val text-blue">{{ (summary()?.totalRevenue || 0) | number:'1.0-0' }} <span class="currency">đ</span></div>
        </div>

        <div class="metric-box">
          <div class="metric-top">
            <span class="metric-label">SỐ PHÒNG ĐANG ĐĂNG</span>
            <span class="metric-icon-badge badge-purple"></span>
          </div>
          <div class="metric-val text-purple">{{ summary()?.vacantRoomsCount || 0 }}</div>
        </div>

        <div class="metric-box">
          <div class="metric-top">
            <span class="metric-label">TIN HOT</span>
            <span class="metric-icon-badge badge-orange"></span>
          </div>
          <div class="metric-val text-orange">{{ summary()?.hotPostsCount || 0 }}</div>
        </div>
      </div>

      <!-- SINGLE FULL-WIDTH REVENUE CHART PANEL -->
      <div class="chart-single-container">
        <div class="chart-card-box">
          <div class="chart-card-header">
            <div class="chart-title-group">
              <span></span>
              <strong>Biểu đồ Doanh Thu (Thu chi)</strong>
              <a routerLink="/landlord/transactions" class="chart-link-detail">Xem chi tiết</a>
            </div>
            <div class="chart-controls-right">
              <div class="chart-legend">
                <span class="leg-dot leg-thu"></span> Thu
                <span class="leg-dot leg-chi"></span> Chi
              </div>
              <select class="chart-period-select">
                <option>7 ngày gần nhất</option>
                <option>Tháng này</option>
              </select>
            </div>
          </div>

          <div class="chart-wrapper">
            <svg class="svg-line-chart" viewBox="0 0 800 200">
              <line x1="40" y1="20" x2="760" y2="20" stroke="#f1f5f9" />
              <line x1="40" y1="65" x2="760" y2="65" stroke="#f1f5f9" />
              <line x1="40" y1="110" x2="760" y2="110" stroke="#f1f5f9" />
              <line x1="40" y1="155" x2="760" y2="155" stroke="#e2e8f0" stroke-width="1.5" />

              <!-- Thu Line (Blue) -->
              <polyline
                fill="none"
                stroke="#2563eb"
                stroke-width="3.5"
                points="40,150 160,145 280,135 400,130 520,120 640,110 760,95" />
              
              <!-- Chi Line (Red) -->
              <polyline
                fill="none"
                stroke="#ef4444"
                stroke-width="3"
                points="40,154 160,154 280,154 400,154 520,152 640,150 760,148" />

              <circle cx="40" cy="150" r="5" fill="#2563eb" />
              <circle cx="160" cy="145" r="5" fill="#2563eb" />
              <circle cx="280" cy="135" r="5" fill="#2563eb" />
              <circle cx="400" cy="130" r="5" fill="#2563eb" />
              <circle cx="520" cy="120" r="5" fill="#2563eb" />
              <circle cx="640" cy="110" r="5" fill="#2563eb" />
              <circle cx="760" cy="95" r="5" fill="#2563eb" />

              <text x="40" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">11/09</text>
              <text x="160" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">12/09</text>
              <text x="280" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">13/09</text>
              <text x="400" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">14/09</text>
              <text x="520" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">15/09</text>
              <text x="640" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">16/09</text>
              <text x="760" y="178" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">17/09</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- TAX ESTIMATION FORECAST PANEL -->
      <div class="tax-card-wrapper mt-4">
        <div class="tax-card-header">
          <h3>Dự Báo Nghĩa Vụ Thuế Cho Thuê Trọ (Thông tư 40/2021/TT-BTC)</h3>
          <p>Hệ thống tự động theo dõi doanh thu tích lũy để nhắc nhở ngưỡng khai thuế 100,000,000đ/năm</p>
        </div>
        <div class="tax-card-body">
          <div class="tax-info-row">
            <span>Doanh thu tính thuế năm {{ currentYear }}:</span>
            <strong class="text-blue-large">{{ (summary()?.taxForecast?.totalAnnualRevenue || 0) | number:'1.0-0' }}đ</strong>
          </div>
          <div class="tax-progress-bar-bg">
            <div class="tax-progress-fill" [style.width.%]="taxLimitPercent()"></div>
          </div>
          <div class="tax-status-note">
            @if (summary()?.taxForecast?.isTaxable) {
              <span class="status-warning">Đã đạt ngưỡng chịu thuế (>100 triệu VNĐ/năm). Dự tính thuế (VAT 5% + PIT 5% = 10%): {{ (summary()?.taxForecast?.totalEstimatedTax || 0) | number:'1.0-0' }}đ</span>
            } @else {
              <span class="status-ok">Chưa đến ngưỡng đóng thuế (<100 triệu VNĐ/năm). Miễn đóng VAT & PIT.</span>
            }
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .overview-workspace-container {
      width: 100%;
    }

    /* DASH TITLE ROW */
    .dash-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .dash-page-title {
      font-size: 1.4rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }

    .year-filter-box {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.04em;
    }

    .year-select {
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 700;
    }

    .btn-export-excel {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      color: #334155;
      cursor: pointer;
    }

    /* 5 COLORED KPI CARDS */
    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1100px) {
      .kpi-cards-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 700px) {
      .kpi-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-card {
      border-radius: 14px;
      padding: 20px 18px;
      color: #ffffff;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    }

    .card-bg-blue { background: #2563eb; }
    .card-bg-purple { background: #4f46e5; }
    .card-bg-orange { background: #ff6b00; }
    .card-bg-green { background: #059669; }
    .card-bg-red { background: #dc2626; }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 700;
      opacity: 0.95;
    }

    .kpi-add-btn {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      color: #ffffff;
      border: none;
      font-weight: 800;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-value {
      font-size: 2.2rem;
      font-weight: 900;
      margin-top: 10px;
    }

    .kpi-watermark {
      position: absolute;
      right: -10px;
      bottom: -15px;
      font-size: 4rem;
      opacity: 0.15;
      pointer-events: none;
    }

    /* REFINED 3 METRICS GRID */
    .metrics-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .metrics-grid-3 {
        grid-template-columns: 1fr;
      }
    }

    .metric-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .metric-icon-badge {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }

    .badge-blue { background: #eff6ff; }
    .badge-purple { background: #f5f3ff; }
    .badge-orange { background: #fff7ed; }

    .metric-val {
      font-size: 1.4rem;
      font-weight: 900;
    }

    .text-blue { color: #2563eb; }
    .text-purple { color: #4f46e5; }
    .text-orange { color: #ff6b00; }
    .currency { font-size: 0.9rem; font-weight: 700; }

    /* SINGLE FULL-WIDTH REVENUE CHART */
    .chart-single-container {
      margin-bottom: 24px;
    }

    .chart-card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }

    .chart-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .chart-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      color: #0f172a;
    }

    .chart-link-detail {
      font-size: 0.78rem;
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
      margin-left: 6px;
    }

    .chart-controls-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chart-legend {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .leg-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .leg-thu { background: #2563eb; }
    .leg-chi { background: #ef4444; }

    .chart-period-select {
      padding: 4px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.78rem;
      color: #475569;
    }

    .chart-wrapper {
      width: 100%;
    }

    .svg-line-chart {
      width: 100%;
      height: auto;
    }

    /* TAX CARD */
    .tax-card-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
    }

    .tax-card-header h3 {
      font-size: 1rem;
      font-weight: 800;
      margin: 0 0 4px 0;
      color: #0f172a;
    }

    .tax-card-header p {
      margin: 0;
      font-size: 0.82rem;
      color: #64748b;
    }

    .tax-card-body {
      margin-top: 16px;
    }

    .tax-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #334155;
      margin-bottom: 8px;
    }

    .text-blue-large {
      font-size: 1.1rem;
      color: #2563eb;
    }

    .tax-progress-bar-bg {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .tax-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #059669);
      border-radius: 4px;
    }

    .tax-status-note {
      font-size: 0.82rem;
      font-weight: 700;
    }

    .status-ok { color: #059669; }
    .status-warning { color: #d97706; }
    .mt-4 { margin-top: 24px; }
  `]
})
export class LandlordOverviewComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  readonly toastService = inject(ToastService);

  summary = signal<any | null>(null);
  isLoading = signal(true);
  currentYear = 2026;

  taxLimitPercent = computed(() => {
    const s = this.summary();
    if (!s || !s.taxForecast) return 0;
    const rev = s.taxForecast.totalAnnualRevenue;
    const threshold = s.taxForecast.taxThreshold || 100000000;
    return Math.min(100, Math.round((rev / threshold) * 100));
  });

  ngOnInit(): void {
    this.fetchOverview();
  }

  fetchOverview(): void {
    this.isLoading.set(true);
    this.dashboardService.getOverview(this.currentYear).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải dữ liệu báo cáo tổng quan.', 'error');
      }
    });
  }

  onYearChange(): void {
    this.fetchOverview();
  }

  exportCsv(): void {
    this.dashboardService.exportFinancialCsv(this.currentYear).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ZHome_BaoCaoTaiChinh_${this.currentYear}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.show('Tải báo cáo tài chính Excel/CSV thành công!', 'success');
      },
      error: () => {
        this.toastService.show('Có lỗi xảy ra khi xuất file báo cáo.', 'error');
      }
    });
  }
}
