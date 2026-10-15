import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="dash-full-layout">
      <!-- PERSISTENT LEFT SIDEBAR FOR ADMIN -->
      <aside class="dash-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="admin-brand-box">
            <svg class="admin-shield-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div class="brand-text-col">
              <span class="brand-title">Admin ZHome</span>
              <span class="brand-sub">Quản Trị Trung Tâm</span>
            </div>
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
            placeholder="Tìm menu..." 
            [(ngModel)]="menuSearchQuery" 
            class="sidebar-search-input" />
        </div>

        <!-- Main Navigation Links Group 1: Tổng quan & Phân tích -->
        <div class="sidebar-section-title">GIÁM SÁT HỆ THỐNG</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Tổng quan')) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-blue">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="9"/>
                  <rect x="14" y="3" width="7" height="5"/>
                  <rect x="14" y="12" width="7" height="9"/>
                  <rect x="3" y="16" width="7" height="5"/>
                </svg>
              </span>
              <span>Tổng quan</span>
            </a>
          }

          @if (isMenuVisible('Thống kê') || isMenuVisible('Lưu lượng') || isMenuVisible('Phiên')) {
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

        <!-- Group Section: QUẢN LÝ VẬN HÀNH -->
        <div class="sidebar-section-title">VẬN HÀNH TRỌ</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Phê duyệt') || isMenuVisible('Chủ trọ')) {
            <a routerLink="/admin/verifications" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-emerald">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <polyline points="17 11 19 13 23 9"/>
                </svg>
              </span>
              <span>Phê duyệt chủ trọ</span>
            </a>
          }

          @if (isMenuVisible('Nhà trọ') || isMenuVisible('Phòng')) {
            <a routerLink="/admin/properties" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-amber">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </span>
              <span>Quản lý nhà trọ</span>
            </a>
          }

          @if (isMenuVisible('Giao dịch') || isMenuVisible('Dòng tiền')) {
            <a routerLink="/admin/transactions" routerLinkActive="active" class="nav-item">
              <span class="nav-icon-box bg-box-cyan">
                <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </span>
            <span>Về trang chủ</span>
          </a>
        </div>
      </aside>

      <!-- MAIN CONTENT VIEW -->
      <main class="dash-main-content">
        <router-outlet></router-outlet>
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
      width: 260px;
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

    .sidebar-header {
      padding: 6px 8px 16px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 14px;
    }

    .admin-brand-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .admin-shield-svg {
      width: 24px;
      height: 24px;
      color: #0f172a;
      flex-shrink: 0;
    }

    .brand-text-col {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .brand-sub {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .sidebar-search {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 16px;
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

    .sidebar-footer {
      margin-top: auto;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }

    .nav-footer-link {
      color: #64748b;
    }

    /* MAIN CONTENT WRAPPER */
    .dash-main-content {
      flex: 1;
      min-width: 0;
      overflow-x: hidden;
    }

    @media (max-width: 992px) {
      .dash-full-layout {
        flex-direction: column;
      }
      .dash-sidebar {
        width: 100%;
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
      }
    }
  `]
})
export class AdminLayoutComponent {
  menuSearchQuery = '';

  isMenuVisible(menuTitle: string): boolean {
    if (!this.menuSearchQuery) return true;
    return menuTitle.toLowerCase().includes(this.menuSearchQuery.toLowerCase());
  }
}
