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

        <!-- Group 1: TỔNG QUAN -->
        <div class="sidebar-section-title">TỔNG QUAN</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Tổng quan') || isMenuVisible('Bảng điều khiển') || isMenuVisible('Dashboard')) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              <span>Tổng quan sàn</span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group 2: KIỂM DUYỆT & XÁC THỰC -->
        <div class="sidebar-section-title">KIỂM DUYỆT & XÁC THỰC</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Duyệt chủ trọ') || isMenuVisible('Xác minh') || isMenuVisible('CCCD')) {
            <a routerLink="/admin/verifications" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
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
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Quản lý tài khoản</span>
            </a>
          }
          @if (isMenuVisible('Nhà trọ') || isMenuVisible('Phòng trọ') || isMenuVisible('Bất động sản')) {
            <a routerLink="/admin/properties" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
              <span>Quản lý nhà trọ</span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group 4: TÀI CHÍNH & DÒNG TIỀN -->
        <div class="sidebar-section-title">TÀI CHÍNH & GIAO DỊCH</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Giao dịch') || isMenuVisible('Dòng tiền') || isMenuVisible('Thu chi')) {
            <a routerLink="/admin/transactions" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3"></rect>
                <path d="M2 10h20"></path>
                <circle cx="17" cy="14.5" r="1.2" fill="currentColor"></circle>
              </svg>
              <span>Lịch sử giao dịch</span>
            </a>
          }
        </div>

        <div class="sidebar-spacer"></div>

        <!-- Bottom Admin Session Card -->
        <div class="sidebar-admin-footer">
          <div class="admin-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="admin-profile-info">
            <strong class="admin-name">{{ authService.userName() || 'Administrator' }}</strong>
            <span class="admin-role-tag">Super Admin</span>
          </div>
          <button (click)="logout()" class="admin-logout-btn" title="Đăng xuất">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      <!-- RIGHT MAIN CONTENT WORKSPACE -->
      <main class="dash-main-area">
        <!-- Top Workspace Bar -->
        <header class="dash-top-bar">
          <div class="top-bar-left">
            <div class="system-status-pill">
              <span class="status-dot"></span>
              <span>Hệ thống ZHome: Trực tuyến</span>
            </div>
          </div>
          <div class="top-bar-right">
            <span class="current-date">{{ currentDateString }}</span>
          </div>
        </header>

        <!-- CHILD ROUTE CONTENT AREA -->
        <div class="dash-content-container">
          <router-outlet></router-outlet>
        </div>
      </main>

    </div>
  `,
  styles: [`
    .dash-full-layout {
      display: flex;
      min-height: calc(100vh - 70px);
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: -32px -32px -48px -32px;
    }

    /* LEFT SIDEBAR */
    .dash-sidebar {
      width: 270px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 20px 16px;
      flex-shrink: 0;
    }

    .sidebar-brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px 18px 10px;
    }

    .admin-shield-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #38bdf8;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
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
      font-size: 0.92rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.05em;
    }

    .brand-sub {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }

    .sidebar-search {
      position: relative;
      margin-bottom: 16px;
    }

    .sidebar-search-input {
      width: 100%;
      padding: 9px 12px 9px 36px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #334155;
      outline: none;
      transition: all 0.2s ease;
    }

    .sidebar-search-input:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-svg {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      stroke: #64748b;
      stroke-width: 2.2;
      pointer-events: none;
    }

    .sidebar-nav-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .nav-svg-icon {
      width: 20px;
      height: 20px;
      stroke: #1e293b;
      stroke-width: 2.2;
      transition: stroke 0.15s ease, transform 0.15s ease;
      flex-shrink: 0;
    }

    .nav-item:hover .nav-svg-icon {
      stroke: #0f172a;
      transform: scale(1.05);
    }

    .nav-item.active {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
    }

    .nav-item.active .nav-svg-icon {
      stroke: #38bdf8;
      transform: none;
    }

    .nav-label-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .nav-badge-pill {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 12px;
    }

    .sidebar-section-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 14px 0 10px 0;
    }

    .sidebar-section-title {
      font-size: 0.68rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.06em;
      padding: 0 12px;
      margin-bottom: 6px;
    }

    .sidebar-spacer {
      flex-grow: 1;
    }

    /* FOOTER */
    .sidebar-admin-footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .admin-avatar {
      width: 36px;
      height: 36px;
      background: #e2e8f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e293b;
      flex-shrink: 0;
    }

    .admin-avatar svg {
      width: 18px;
      height: 18px;
    }

    .admin-profile-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-width: 0;
    }

    .admin-name {
      font-size: 0.8rem;
      font-weight: 800;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .admin-role-tag {
      font-size: 0.68rem;
      color: #2563eb;
      font-weight: 700;
    }

    .admin-logout-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .admin-logout-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .admin-logout-btn svg {
      width: 16px;
      height: 16px;
    }

    /* RIGHT MAIN AREA */
    .dash-main-area {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dash-top-bar {
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }

    .system-status-pill {
      display: inline-flex;
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
