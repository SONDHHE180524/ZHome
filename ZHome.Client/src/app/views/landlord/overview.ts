import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landlord-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overview-container animate-fade-in">
      <div class="dashboard-header">
        <div>
          <h1>Bảng Phân Tích Tài Chính</h1>
          <p>Quản lý dòng tiền, theo dõi công nợ, và đề xuất tính thuế tự động</p>
        </div>
        <div class="year-filter">
          <label for="year">Năm báo cáo</label>
          <select id="year" [(ngModel)]="currentYear" (change)="onYearChange()" class="form-control">
            <option [value]="2026">2026</option>
            <option [value]="2027">2027</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards Row -->
      @if (isLoading()) {
        <div class="loading-state">Đang tải báo cáo tài chính...</div>
      } @else {
        <div class="stats-grid">
          <div class="glass-panel stats-card card-revenue">
            <span class="card-icon">💰</span>
            <div class="card-content">
              <h3>Tổng Doanh Thu (Đã Thu)</h3>
              <div class="card-value">{{ summary()?.totalRevenue | number:'1.0-0' }}đ</div>
              <p class="card-sub">Tổng tiền từ các hóa đơn đã thanh toán</p>
            </div>
          </div>

          <div class="glass-panel stats-card card-debt">
            <span class="card-icon">💸</span>
            <div class="card-content">
              <h3>Công Nợ Chưa Thanh Toán</h3>
              <div class="card-value value-danger">{{ summary()?.outstandingDebt | number:'1.0-0' }}đ</div>
              <p class="card-sub">Tổng số tiền khách nợ chưa trả</p>
            </div>
          </div>

          <div class="glass-panel stats-card card-occupancy">
            <span class="card-icon">🏠</span>
            <div class="card-content">
              <h3>Tỷ Lệ Lấp Đầy Phòng</h3>
              <div class="card-value">{{ occupancyRate() }}%</div>
              <p class="card-sub">{{ summary()?.occupiedRoomsCount }}/{{ summary()?.totalRoomsCount }} phòng đang được cho thuê</p>
            </div>
          </div>
        </div>

        <div class="dashboard-split">
          <!-- Monthly Revenue Breakdown (Custom SVG Bar Chart) -->
          <div class="glass-panel chart-panel">
            <h3>Biểu đồ Doanh Thu & Nợ theo Tháng (Năm {{ currentYear }})</h3>
            <p class="chart-desc">Phân tích cột: Xanh lá (Đã thu), Đỏ (Nợ chưa thu)</p>
            
            <div class="chart-container">
              @if (summary()?.monthlyRevenues?.length === 0) {
                <div class="empty-chart">Chưa có dữ liệu hóa đơn nào trong năm {{ currentYear }}.</div>
              } @else {
                <svg class="custom-chart" viewBox="0 0 600 250">
                  <!-- Grid lines -->
                  <line x1="40" y1="30" x2="580" y2="30" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="80" x2="580" y2="80" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="130" x2="580" y2="130" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="180" x2="580" y2="180" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="210" x2="580" y2="210" stroke="rgba(0,0,0,0.1)" />

                  <!-- Render Bars -->
                  @for (m of summary()?.monthlyRevenues; track m.month) {
                    <g>
                      <!-- Paid Revenue Bar -->
                      <rect 
                        [attr.x]="calculateX(m.month, 0)" 
                        [attr.y]="calculateY(m.paidRevenue)" 
                        width="16" 
                        [attr.height]="calculateHeight(m.paidRevenue)" 
                        fill="var(--color-success)" 
                        rx="2" />
                      <!-- Unpaid Debt Bar -->
                      <rect 
                        [attr.x]="calculateX(m.month, 1)" 
                        [attr.y]="calculateY(m.unpaidRevenue)" 
                        width="16" 
                        [attr.height]="calculateHeight(m.unpaidRevenue)" 
                        fill="var(--color-danger)" 
                        rx="2" />
                      
                      <!-- Month Label -->
                      <text 
                        [attr.x]="calculateX(m.month, 0) + 12" 
                        y="230" 
                        fill="var(--text-muted)" 
                        font-size="10" 
                        text-anchor="middle">Tháng {{ m.month }}</text>
                    </g>
                  }
                </svg>
              }
            </div>
          </div>

          <!-- Tax Estimation Details -->
          <div class="glass-panel tax-panel">
            <h3>Dự Báo Nghĩa Vụ Thuế Cá Nhân</h3>
            <p class="mb-4">Cách tính thuế cho thuê tài sản theo Thông tư 40/2021/TT-BTC</p>

            <div class="tax-card">
              <div class="tax-header-row">
                <span>Doanh thu tính thuế năm dương lịch</span>
                <span class="value-highlight">{{ summary()?.taxForecast?.totalAnnualRevenue | number:'1.0-0' }}đ</span>
              </div>

              <!-- Progress bar to 100M VND limit -->
              <div class="limit-progress-container">
                <div class="progress-info">
                  <span>Ngưỡng chịu thuế: 100,000,000đ</span>
                  <span>{{ taxLimitPercent() }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="taxLimitPercent()"></div>
                </div>
              </div>

              @if (summary()?.taxForecast?.isTaxable) {
                <div class="tax-status taxable">
                  <span class="status-icon">⚠️</span>
                  <div>
                    <strong>Đã vượt ngưỡng chịu thuế (> 100Tr VND)</strong>
                    <p>Doanh thu của bạn đã phát sinh thuế. Bạn có trách nhiệm khai thuế giá trị gia tăng (VAT 5%) và thuế thu nhập cá nhân (PIT 5%).</p>
                  </div>
                </div>
              } @else {
                <div class="tax-status non-taxable">
                  <span class="status-icon">✓</span>
                  <div>
                    <strong>Chưa đạt ngưỡng đóng thuế (< 100Tr VND)</strong>
                    <p>Nếu tổng doanh thu cho thuê trong năm dưới 100 triệu, bạn được miễn đóng thuế VAT và PIT.</p>
                  </div>
                </div>
              }

              <div class="tax-breakdown">
                <div class="breakdown-row">
                  <span>Thuế GTGT dự kiến (VAT 5%)</span>
                  <span>{{ summary()?.taxForecast?.estimatedVat | number:'1.0-0' }}đ</span>
                </div>
                <div class="breakdown-row">
                  <span>Thuế TNCN dự kiến (PIT 5%)</span>
                  <span>{{ summary()?.taxForecast?.estimatedPit | number:'1.0-0' }}đ</span>
                </div>
                <div class="modal-divider my-2"></div>
                <div class="breakdown-row total">
                  <span>Tổng thuế dự tính đóng (10%)</span>
                  <span>{{ summary()?.taxForecast?.totalEstimatedTax | number:'1.0-0' }}đ</span>
                </div>
              </div>

              <p class="tax-note mt-3">
                * Lưu ý: Thuế ước tính trên chỉ tính trên các hóa đơn có trạng thái "Đã thanh toán" (Paid).
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .overview-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .year-filter {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .year-filter select {
      width: 120px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .stats-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 30px 24px;
    }
    .card-icon {
      font-size: 2.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    .card-content h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .card-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .value-danger {
      color: var(--color-danger-light);
    }
    .card-sub {
      font-size: 0.8rem;
      color: var(--text-dark);
      margin-top: 4px;
    }
    .dashboard-split {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .dashboard-split {
        grid-template-columns: 1fr;
      }
    }
    .chart-panel, .tax-panel {
      padding: 24px;
    }
    .chart-desc {
      font-size: 0.85rem;
      margin-bottom: 15px;
    }
    .chart-container {
      margin-top: 20px;
    }
    .empty-chart {
      text-align: center;
      padding: 80px 0;
      color: var(--text-muted);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
    }
    .custom-chart {
      width: 100%;
      height: auto;
    }
    .tax-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 20px;
    }
    .tax-header-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-bottom: 15px;
    }
    .value-highlight {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1.1rem;
    }
    .limit-progress-container {
      margin-bottom: 24px;
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-dark);
      margin-bottom: 6px;
    }
    .progress-bar {
      height: 6px;
      background: rgba(255,255,255,0.05);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--grad-primary);
      border-radius: 3px;
    }
    .tax-status {
      display: flex;
      gap: 15px;
      padding: 14px;
      border-radius: var(--radius-sm);
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .tax-status.taxable {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #fbd38d;
    }
    .tax-status.non-taxable {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-success-light);
    }
    .status-icon {
      font-size: 1.4rem;
    }
    .tax-breakdown {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 15px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .breakdown-row.total {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1rem;
    }
    .tax-note {
      font-size: 0.75rem;
      color: var(--text-dark);
      font-style: italic;
    }
    .mb-4 { margin-bottom: 16px; }
    .mt-3 { margin-top: 12px; }
    .my-2 { margin: 8px 0; }
  `]
})
export class LandlordOverviewComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);

  summary = signal<any | null>(null);
  isLoading = signal(true);
  currentYear = 2026;

  // Computed signals
  occupancyRate = computed(() => {
    const s = this.summary();
    if (!s || s.totalRoomsCount === 0) return 0;
    return Math.round((s.occupiedRoomsCount / s.totalRoomsCount) * 100);
  });

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
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải dữ liệu báo cáo tài chính.', 'error');
      }
    });
  }

  onYearChange(): void {
    this.fetchOverview();
  }

  // Calculate coordinates for SVG rendering dynamically based on scale
  calculateX(month: number, barIndex: number): number {
    // 12 months spread from x=60 to x=540.
    const startX = 60;
    const gap = 42;
    return startX + (month - 1) * gap + (barIndex * 18);
  }

  calculateY(value: number): number {
    const maxVal = this.getMaxMonthlyValue() || 10000000; // fallback max
    const height = (value / maxVal) * 170; // max SVG height is 170px
    return 210 - height;
  }

  calculateHeight(value: number): number {
    const maxVal = this.getMaxMonthlyValue() || 10000000;
    return (value / maxVal) * 170;
  }

  private getMaxMonthlyValue(): number {
    const s = this.summary();
    if (!s || !s.monthlyRevenues || s.monthlyRevenues.length === 0) return 0;
    let max = 0;
    for (const r of s.monthlyRevenues) {
      if (r.paidRevenue > max) max = r.paidRevenue;
      if (r.unpaidRevenue > max) max = r.unpaidRevenue;
    }
    return max * 1.1; // 10% buffer
  }
}
