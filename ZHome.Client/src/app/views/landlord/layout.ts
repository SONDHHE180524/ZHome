import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-landlord-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="dash-full-layout">
      
      <!-- PERSISTENT LEFT SIDEBAR NAVIGATION -->
      <aside class="dash-sidebar">
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

        <!-- Main Navigation Links Group 1 -->
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Tổng quan')) {
            <a routerLink="/landlord/overview" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <circle cx="12" cy="13" r="2.5"></circle>
              </svg>
              <span>Tổng quan</span>
            </a>
          }
          @if (isMenuVisible('Nâng cấp') || isMenuVisible('Quảng cáo')) {
            <a routerLink="/landlord/packages" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15V6a2 2 0 0 0-2-2H8L3 8v6l5 4h11a2 2 0 0 0 2-2z"></path>
                <path d="M6 14v4a2 2 0 0 0 2 2h1"></path>
                <line x1="18" y1="8" x2="18" y2="14"></line>
              </svg>
              <span>Nâng cấp</span>
            </a>
          }
        </div>

        <div class="sidebar-section-divider"></div>

        <!-- Group Section: QUẢN LÝ TRỌ -->
        <div class="sidebar-section-title">QUẢN LÝ TRỌ</div>
        <div class="sidebar-nav-group">
          @if (isMenuVisible('Nhà trọ')) {
            <a routerLink="/landlord/properties" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
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
              <span>Nhà trọ</span>
            </a>
          }
          @if (isMenuVisible('Phòng')) {
            <a routerLink="/landlord/rooms" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                <path d="M4 3l10 2.5v13L4 21V3z"></path>
                <circle cx="11.5" cy="12" r="1" fill="currentColor"></circle>
              </svg>
              <span>Phòng</span>
            </a>
          }
          @if (isMenuVisible('Quản lý điện nước')) {
            <a routerLink="/landlord/utility-grid" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 17A8 8 0 0 1 20 17H4z"></path>
                <line x1="12" y1="17" x2="15.5" y2="12.5"></line>
                <circle cx="12" cy="17" r="1.5" fill="currentColor"></circle>
              </svg>
              <span>Quản lý điện nước</span>
            </a>
          }
          @if (isMenuVisible('Khách thuê')) {
            <a routerLink="/landlord/tenants" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
              </svg>
              <span>Khách thuê</span>
            </a>
          }
          @if (isMenuVisible('Hợp đồng')) {
            <a routerLink="/landlord/contracts" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                <line x1="7" y1="8" x2="11" y2="8"></line>
                <line x1="7" y1="12" x2="11" y2="12"></line>
                <line x1="7" y1="16" x2="17" y2="16"></line>
                <line x1="14" y1="8" x2="17" y2="8"></line>
                <line x1="14" y1="12" x2="17" y2="12"></line>
              </svg>
              <span>Hợp đồng</span>
            </a>
          }
          @if (isMenuVisible('Hoá đơn')) {
            <a routerLink="/landlord/bills" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
                <line x1="8" y1="9.5" x2="10.5" y2="9.5"></line>
              </svg>
              <span>Hoá đơn</span>
            </a>
          }
          @if (isMenuVisible('Thu chi')) {
            <a routerLink="/landlord/transactions" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3"></rect>
                <path d="M2 10h20"></path>
                <circle cx="17" cy="14.5" r="1.2" fill="currentColor"></circle>
              </svg>
              <span>Thu chi</span>
            </a>
          }
          @if (isMenuVisible('Phản ánh sự cố') || isMenuVisible('Sự cố') || isMenuVisible('Báo cáo')) {
            <a routerLink="/landlord/incidents" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
              </svg>
              <span>Phản ánh sự cố</span>
            </a>
          }
          @if (isMenuVisible('Phản ánh đánh giá') || isMenuVisible('Đánh giá') || isMenuVisible('Phản ánh')) {
            <a routerLink="/landlord/reports" routerLinkActive="active" class="nav-item">
              <svg class="nav-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Phản ánh đánh giá</span>
            </a>
          }
        </div>

        <div class="sidebar-spacer"></div>

        <!-- Bottom Support Card Footer -->
        <div class="sidebar-support-card">
          <div class="support-title">HỖ TRỢ RIÊNG CHO BẠN</div>
          <div class="support-body">
            <div class="support-avatar">
              <svg class="support-avatar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="support-info">
              <strong class="support-name">LƯƠNG THỊ HUYỀN TRANG</strong>
              <a href="tel:0332661579" class="support-phone">
                <svg class="support-phone-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                033-266-1579
              </a>
            </div>
          </div>
        </div>
      </aside>

      <!-- RIGHT MAIN CONTENT WORKSPACE -->
      <main class="dash-main-area">
        
        <!-- PERSISTENT TOP WORKSPACE HEADER BAR -->
        <header class="dash-top-bar">
          <div class="property-selector-box">
            <select [(ngModel)]="selectedPropertyId" (change)="onPropertySelect()" class="prop-select">
              <option value="0">-- Tất cả nhà trọ --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.id">{{ p.title }}</option>
              }
            </select>
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
      width: 260px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 20px 16px;
      flex-shrink: 0;
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
      gap: 3px;
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
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
    }

    .nav-item.active .nav-svg-icon {
      stroke: #ffffff;
      transform: none;
    }

    .sidebar-section-divider {
      height: 1px;
      background: #f1f5f9;
      margin: 16px 0 12px 0;
    }

    .sidebar-section-title {
      font-size: 0.68rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.06em;
      padding: 0 12px;
      margin-bottom: 8px;
    }

    .sidebar-spacer {
      flex-grow: 1;
    }

    .sidebar-support-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      margin-top: 20px;
    }

    .support-title {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .support-body {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .support-avatar {
      width: 36px;
      height: 36px;
      background: #e2e8f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
    }

    .support-avatar-svg {
      width: 18px;
      height: 18px;
      stroke: #334155;
    }

    .support-info {
      display: flex;
      flex-direction: column;
    }

    .support-name {
      font-size: 0.72rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }

    .support-phone {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
      margin-top: 3px;
    }

    .support-phone-svg {
      width: 12px;
      height: 12px;
      stroke: #2563eb;
    }

    /* MAIN RIGHT AREA */
    .dash-main-area {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* TOP BAR */
    .dash-top-bar {
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 28px;
    }

    .prop-select {
      padding: 8px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      background: #f8fafc;
      outline: none;
      cursor: pointer;
    }

    .dash-content-container {
      padding: 24px 28px;
    }
  `]
})
export class LandlordLayoutComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  
  menuSearchQuery = '';
  selectedPropertyId = 0;
  propertyList = signal<any[]>([]);

  ngOnInit(): void {
    this.dashboardService.getOverview().subscribe({
      next: (data) => {
        if (data?.propertyList) {
          this.propertyList.set(data.propertyList);
        }
      }
    });
  }

  isMenuVisible(title: string): boolean {
    if (!this.menuSearchQuery.trim()) return true;
    return title.toLowerCase().includes(this.menuSearchQuery.toLowerCase().trim());
  }

  onPropertySelect(): void {
    // Optionally trigger property filter event
  }
}
