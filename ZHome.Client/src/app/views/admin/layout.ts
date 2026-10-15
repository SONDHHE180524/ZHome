import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="dash-full-layout">
      <!-- PERSISTENT LEFT SIDEBAR NAVIGATION FOR ADMIN -->
      <aside class="dash-sidebar">
        <!-- Brand / Role Badge -->
        <div class="sidebar-brand-header">
          <div class="admin-shield-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">ZHOME ADMIN</span>
            <span class="brand-sub">Quản trị trung tâm</span>
          </div>
        </div>

        <!-- Menu Search Input -->
        <div class="sidebar-search">
          <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Tìm kiếm menu..." 
            [(ngModel)]="menuSearchQuery" 
            class="sidebar-search-input" />
        </div>

        <!-- Group 1: TỔNG QUAN & PHÂN TÍCH -->
        <div class="sidebar-section-title">GIÁM SÁT HỆ THỐNG</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Tổng quan') || isMenuVisible('Bảng điều khiển') || isMenuVisible('Dashboard')) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-blue">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
              </span>
              <span>Tổng quan</span>
            </a>
          }

          @if (isMenuVisible('Thống kê') || isMenuVisible('Lưu lượng') || isMenuVisible('Phiên') || isMenuVisible('Traffic')) {
            <a routerLink="/admin/traffic-analytics" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-purple">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <span>Thống kê lưu lượng & phiên</span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group 2: KIỂM DUYỆT & XÁC THỰC -->
        <div class="sidebar-section-title">KIỂM DUYỆT & XÁC THỰC</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Duyệt chủ trọ') || isMenuVisible('Xác minh') || isMenuVisible('CCCD')) {
            <a routerLink="/admin/verifications" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-emerald">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
              </span>
              <span class="nav-label-flex">
                <span>Duyệt chủ trọ</span>
                @if (pendingCount() > 0) {
                  <span class="nav-badge-pill">{{ pendingCount() }}</span>
                }
              </span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group 3: QUẢN LÝ DỮ LIỆU SÀN -->
        <div class="sidebar-section-title">QUẢN TRỊ DỮ LIỆU</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Tài khoản') || isMenuVisible('Người dùng') || isMenuVisible('Phân quyền') || isMenuVisible('Users')) {
            <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-indigo">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span>Quản lý tài khoản</span>
            </a>
          }
          @if (isMenuVisible('Nhà trọ') || isMenuVisible('Phòng trọ') || isMenuVisible('Bất động sản')) {
            <a routerLink="/admin/properties" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-amber">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"></path>
                  <path d="M2 22v-6.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V22"></path>
                  <line x1="14" y1="7" x2="14.01" y2="7"></line>
                  <line x1="18" y1="7" x2="18.01" y2="7"></line>
                  <line x1="14" y1="11" x2="14.01" y2="11"></line>
                  <line x1="18" y1="11" x2="18.01" y2="11"></line>
                  <line x1="14" y1="15" x2="14.01" y2="15"></line>
                  <line x1="18" y1="15" x2="18.01" y2="15"></line>
                  <path d="M2 22h20"></path>
                </svg>
              </span>
              <span>Quản lý nhà trọ</span>
            </a>
          }
          @if (isMenuVisible('Nhật ký') || isMenuVisible('Hoạt động') || isMenuVisible('Log') || isMenuVisible('Audit')) {
            <a routerLink="/admin/activity-logs" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-slate">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>Nhật ký hoạt động</span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group 4: TÀI CHÍNH & DÒNG TIỀN -->
        <div class="sidebar-section-title">TÀI CHÍNH & GIAO DỊCH</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Giao dịch') || isMenuVisible('Dòng tiền') || isMenuVisible('Thu chi')) {
            <a routerLink="/admin/transactions" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-cyan">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="3"></rect>
                  <path d="M2 10h20"></path>
                  <circle cx="17" cy="14.5" r="1.2" fill="currentColor"></circle>
                </svg>
              </span>
              <span>Lịch sử giao dịch</span>
            </a>
          }
        </div>

        <!-- Bottom Quick Switch / Back to Homepage -->
        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item nav-footer-link">
            <span class="nav-icon-box bg-box-slate">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </span>
            <span>Về trang chủ</span>
          </a>

          <button (click)="logout()" class="nav-item nav-footer-btn">
            <span class="nav-icon-box bg-box-slate">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT VIEW -->
      <main class="dash-main-content">
        <!-- Top Sticky Header -->
        <header class="dash-top-bar">
          <div class="top-bar-left">
            <h1 class="portal-heading">Hệ Thống Phân Hệ Quản Trị Viên</h1>
            <span class="current-date">{{ currentDateString }}</span>
          </div>

          <div class="top-bar-right">
            <div class="live-status-badge">
              <span class="status-dot"></span>
              <span>Hệ thống hoạt động ổn định</span>
            </div>
            
            <div class="admin-profile-pill">
              <div class="admin-avatar">A</div>
              <div class="admin-info-col">
                <span class="admin-name">{{ authService.session()?.fullName || 'Administrator' }}</span>
                <span class="admin-role-tag">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div class="dash-content-container">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dash-full-layout {
      display: flex;
      min-height: calc(100vh - 65px);
      background: #f8fafc;
    }

    /* LEFT SIDEBAR */
    .dash-sidebar {
      width: 270px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 20px 14px;
      position: sticky;
      top: 65px;
      height: calc(100vh - 65px);
      overflow-y: auto;
    }

    .sidebar-brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 8px 16px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 16px;
    }

    .admin-shield-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .admin-shield-icon svg {
      width: 20px;
      height: 20px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 0.95rem;
      font-weight: 850;
      color: #0f172a;
      letter-spacing: 0.04em;
    }

    .brand-sub {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sidebar-search {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 18px;
    }

    .search-svg {
      width: 15px;
      height: 15px;
      color: #64748b;
      flex-shrink: 0;
    }

    .sidebar-search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.85rem;
      color: #0f172a;
      width: 100%;
    }

    .sidebar-search-input::placeholder {
      color: #94a3b8;
    }

    .sidebar-section-title {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding: 8px 10px 4px;
    }

    .sidebar-nav-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-section-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 14px 6px;
    }

    /* ELEGANT MODERN NAV ITEMS WITH TINTED ICON BOXES */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 12px;
      font-weight: 650;
      font-size: 0.9rem;
      color: #334155;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .nav-item:hover .nav-icon-box {
      transform: scale(1.06);
    }

    .nav-item.active {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: 750;
      box-shadow: inset 3px 0 0 #2563eb;
    }

    .nav-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .bg-box-blue {
      background: #eff6ff;
      border-color: #dbeafe;
      color: #2563eb;
    }
    .bg-box-purple {
      background: #f5f3ff;
      border-color: #ede9fe;
      color: #7c3aed;
    }
    .bg-box-emerald {
      background: #ecfdf5;
      border-color: #d1fae5;
      color: #059669;
    }
    .bg-box-indigo {
      background: #e0e7ff;
      border-color: #c7d2fe;
      color: #4f46e5;
    }
    .bg-box-amber {
      background: #fffbeb;
      border-color: #fef3c7;
      color: #d97706;
    }
    .bg-box-cyan {
      background: #ecfeff;
      border-color: #cffafe;
      color: #0891b2;
    }
    .bg-box-slate {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #475569;
    }

    .nav-svg-icon {
      width: 17px;
      height: 17px;
      color: currentColor;
      flex-shrink: 0;
    }

    .nav-label-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .nav-badge-pill {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 10px;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-footer-link {
      color: #64748b;
    }

    .nav-footer-btn {
      width: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      color: #ef4444;
    }

    .nav-footer-btn:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* MAIN CONTENT */
    .dash-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dash-top-bar {
      height: 65px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 65px;
      z-index: 10;
    }

    .portal-heading {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .admin-profile-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 4px 12px 4px 6px;
      border-radius: 24px;
    }

    .admin-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .admin-info-col {
      display: flex;
      flex-direction: column;
    }

    .admin-name {
      font-size: 0.82rem;
      font-weight: 750;
      color: #0f172a;
      line-height: 1.2;
    }

    .admin-role-tag {
      font-size: 0.68rem;
      color: #2563eb;
      font-weight: 600;
    }

    .live-status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }

    .current-date {
      font-size: 0.82rem;
      color: #64748b;
      font-weight: 600;
    }

    .dash-content-container {
      padding: 24px 28px;
      flex-grow: 1;
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  menuSearchQuery = '';
  pendingCount = signal<number>(0);
  currentDateString = '';

  ngOnInit(): void {
    const now = new Date();
    this.currentDateString = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        if (stats && stats.pendingVerifications) {
          this.pendingCount.set(stats.pendingVerifications);
        }
      }
    });
  }

  isMenuVisible(title: string): boolean {
    if (!this.menuSearchQuery.trim()) return true;
    return title.toLowerCase().includes(this.menuSearchQuery.toLowerCase().trim());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
