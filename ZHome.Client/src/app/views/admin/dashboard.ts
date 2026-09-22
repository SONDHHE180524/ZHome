import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dashboard-container animate-fade-in">
      <!-- Header Banner -->
      <div class="dash-header">
        <div class="header-content">
          <span class="role-badge">Hệ Thống Quản Trị Trung Tâm</span>
          <h1>Bảng Điều Khiển Admin ZHome</h1>
          <p>Giám sát toàn bộ hoạt động nhà trọ, chủ trọ, duyệt hồ sơ và thống kê dòng tiền hệ thống.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/verifications" class="btn btn-primary">
            ️ Phê duyệt chủ trọ
            @if (stats()?.pendingVerifications > 0) {
              <span class="badge-count">{{ stats()?.pendingVerifications }}</span>
            }
          </a>
          <a routerLink="/admin/properties" class="btn btn-secondary"> Quản lý nhà trọ</a>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu tổng quan hệ thống...</p>
        </div>
      } @else {
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <div class="kpi-card card-blue">
            <div class="kpi-icon"></div>
            <div class="kpi-info">
              <span class="kpi-label">Tổng Nhà Trọ</span>
              <strong class="kpi-value">{{ stats()?.totalProperties || 0 }}</strong>
              <span class="kpi-sub">Trọ hoạt động trên hệ thống</span>
            </div>
          </div>

          <div class="kpi-card card-indigo">
            <div class="kpi-icon"></div>
            <div class="kpi-info">
              <span class="kpi-label">Tổng Chủ Trọ</span>
              <strong class="kpi-value">{{ stats()?.totalLandlords || 0 }}</strong>
              <span class="kpi-sub">
                Tài khoản đăng ký chủ trọ
              </span>
            </div>
          </div>

          <div class="kpi-card card-emerald">
            <div class="kpi-icon"></div>
            <div class="kpi-info">
              <span class="kpi-label">Tổng Số Phòng</span>
              <strong class="kpi-value">{{ stats()?.totalRooms || 0 }}</strong>
              <span class="kpi-sub">
                <span class="text-success">{{ stats()?.vacantRooms || 0 }} phòng trống</span> / {{ stats()?.occupiedRooms || 0 }} đang thuê
              </span>
            </div>
          </div>

          <div class="kpi-card card-amber">
            <div class="kpi-icon">️</div>
            <div class="kpi-info">
              <span class="kpi-label">Duyệt Hồ Sơ</span>
              <strong class="kpi-value">{{ stats()?.pendingVerifications || 0 }}</strong>
              <span class="kpi-sub">Chủ trọ đang chờ xác minh</span>
            </div>
          </div>

          <div class="kpi-card card-purple span-2">
            <div class="kpi-icon"></div>
            <div class="kpi-info">
              <span class="kpi-label">Tổng Doanh Thu Giao Dịch Hóa Đơn</span>
              <strong class="kpi-value text-purple">{{ (stats()?.totalTransactionsRevenue || 0) | number:'1.0-0' }} VNĐ</strong>
              <span class="kpi-sub">Tổng tiền giao dịch thanh toán qua ZHome</span>
            </div>
          </div>
        </div>

        <!-- System Quick Navigation Cards -->
        <div class="section-title">
          <h2>Chức Năng Quản Trị Hệ Thống</h2>
          <p>Truy cập nhanh các phân hệ dành riêng cho Quản trị viên</p>
        </div>

        <div class="admin-modules-grid">
          <a routerLink="/admin/verifications" class="module-card">
            <div class="module-header">
              <div class="module-icon">️</div>
              <span class="module-tag tag-warning">Cần xử lý</span>
            </div>
            <h3>Xác Nhận & Duyệt Chủ Trọ</h3>
            <p>Kiểm tra thông tin căn cước công dân, ảnh mặt trước/sau và phê duyệt tích xanh xác minh cho chủ nhà trọ.</p>
            <div class="module-footer">
              <span>Xem chi tiết danh sách</span>
              <span class="arrow">→</span>
            </div>
          </a>

          <a routerLink="/admin/properties" class="module-card">
            <div class="module-header">
              <div class="module-icon"></div>
              <span class="module-tag tag-primary">Tất cả trọ</span>
            </div>
            <h3>Quản Lý Nhà Trọ & Phòng Trống</h3>
            <p>Xem toàn bộ danh sách nhà trọ hệ thống, lọc theo từng chủ trọ, theo dõi danh sách phòng trống. Báo cáo đảm bảo tính bảo mật riêng tư người thuê.</p>
            <div class="module-footer">
              <span>Khám phá nhà trọ</span>
              <span class="arrow">→</span>
            </div>
          </a>

          <a routerLink="/admin/transactions" class="module-card">
            <div class="module-header">
              <div class="module-icon"></div>
              <span class="module-tag tag-success">Dòng tiền</span>
            </div>
            <h3>Lịch Sử Giao Dịch Theo Trọ</h3>
            <p>Tra cứu lịch sử giao dịch thanh toán hóa đơn phân loại chi tiết theo từng nhà trọ riêng biệt.</p>
            <div class="module-footer">
              <span>Tra cứu giao dịch</span>
              <span class="arrow">→</span>
            </div>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 36px 40px;
      border-radius: 20px;
      margin-bottom: 32px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
    }

    .role-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }

    .dash-header h1 {
      font-size: 1.9rem;
      font-weight: 800;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .dash-header p {
      color: #94a3b8;
      font-size: 0.98rem;
      max-width: 600px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.92rem;
      text-decoration: none;
      transition: all 0.25s ease;
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
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .badge-count {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 10px;
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
    }

    .kpi-icon {
      font-size: 2.2rem;
      width: 60px;
      height: 60px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-blue .kpi-icon { background: #eff6ff; }
    .card-indigo .kpi-icon { background: #e0e7ff; }
    .card-emerald .kpi-icon { background: #ecfdf5; }
    .card-amber .kpi-icon { background: #fffbeb; }
    .card-purple .kpi-icon { background: #f3e8ff; }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .kpi-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 4px 0;
    }

    .text-purple { color: #7c3aed; }
    .text-success { color: #16a34a; font-weight: 700; }

    .kpi-sub {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .span-2 {
      grid-column: span 2;
    }

    @media (max-width: 992px) {
      .span-2 { grid-column: span 1; }
      .dash-header { flex-direction: column; align-items: flex-start; gap: 20px; }
    }

    .section-title {
      margin-bottom: 24px;
    }

    .section-title h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .section-title p {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .admin-modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .module-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 28px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
    }

    .module-card:hover {
      border-color: #2563eb;
      transform: translateY(-5px);
      box-shadow: 0 14px 28px rgba(37, 99, 235, 0.12);
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .module-icon {
      font-size: 2rem;
      width: 52px;
      height: 52px;
      background: #f8fafc;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
    }

    .module-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .tag-warning { background: #fef3c7; color: #d97706; }
    .tag-primary { background: #dbeafe; color: #1d4ed8; }
    .tag-success { background: #dcfce7; color: #15803d; }

    .module-card h3 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .module-card p {
      font-size: 0.88rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .module-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.88rem;
      color: #2563eb;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .arrow {
      transition: transform 0.2s ease;
    }

    .module-card:hover .arrow {
      transform: translateX(6px);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(true);
  stats = signal<any>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.toastService.show('Không thể tải dữ liệu bảng điều khiển.', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
