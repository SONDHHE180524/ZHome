import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

export interface ViewingAppointment {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string;
  title: string;
  message: string;
  customerName: string;
  customerPhone: string;
  viewingDate: string;
  viewingTime: string;
  numberOfPeople: number;
  note: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-landlord-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="appointments-page-container animate-fade-in">
      
      <!-- HEADER ROW -->
      <div class="page-header-row mb-4">
        <div>
          <div class="header-badge-tag mb-1">
            <span class="pulse-indicator-dot"></span>
            <span>TIẾP ĐÓN KHÁCH THUÊ</span>
          </div>
          <h1 class="page-main-title m-0">Lịch Hẹn Xem Phòng Của Khách Hàng</h1>
          <p class="text-sm text-muted m-0 mt-1">Theo dõi, xác nhận và quản lý các lịch hẹn đến xem phòng trọ trực tiếp từ khách thuê</p>
        </div>

        <div class="header-actions-group d-flex gap-2 align-items-center flex-wrap">
          <button (click)="loadAppointments()" class="btn-refresh" title="Làm mới danh sách">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="stats-kpi-grid mb-4">
        <!-- 1. Total Appointments -->
        <div class="stat-card" (click)="statusFilter.set('all')" [class.active-kpi]="statusFilter() === 'all'">
          <div class="stat-icon-wrapper bg-blue-subtle">
            <svg class="stat-svg text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Tổng lịch hẹn</div>
            <div class="stat-value text-blue">{{ appointments().length }}</div>
          </div>
        </div>

        <!-- 2. Pending confirmation -->
        <div class="stat-card" (click)="statusFilter.set('pending')" [class.active-kpi]="statusFilter() === 'pending'">
          <div class="stat-icon-wrapper bg-amber-subtle">
            <svg class="stat-svg text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Chờ xác nhận</div>
            <div class="stat-value text-amber">{{ countPending() }}</div>
          </div>
        </div>

        <!-- 3. Confirmed -->
        <div class="stat-card" (click)="statusFilter.set('confirmed')" [class.active-kpi]="statusFilter() === 'confirmed'">
          <div class="stat-icon-wrapper bg-emerald-subtle">
            <svg class="stat-svg text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Đã xác nhận</div>
            <div class="stat-value text-emerald">{{ countConfirmed() }}</div>
          </div>
        </div>

        <!-- 4. Completed -->
        <div class="stat-card" (click)="statusFilter.set('completed')" [class.active-kpi]="statusFilter() === 'completed'">
          <div class="stat-icon-wrapper bg-indigo-subtle">
            <svg class="stat-svg text-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Đã xem phòng</div>
            <div class="stat-value text-indigo">{{ countCompleted() }}</div>
          </div>
        </div>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="filter-controls-card mb-4">
        <div class="filters-wrap">
          <!-- Search input -->
          <div class="search-input-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Tìm theo tên khách, số điện thoại, tên khu trọ..." 
              class="search-input" />
            @if (searchQuery) {
              <button class="clear-search-btn" (click)="searchQuery = ''">✕</button>
            }
          </div>

          <!-- Property Filter -->
          <div class="filter-select-box">
            <label class="filter-label">Khu trọ:</label>
            <select [(ngModel)]="selectedPropertyId" class="filter-select">
              <option [value]="0">Tất cả khu trọ</option>
              @for (prop of propertiesList(); track prop.id) {
                <option [value]="prop.id">{{ prop.title }}</option>
              }
            </select>
          </div>

          <!-- Status Filter Pills -->
          <div class="status-pills-group">
            <button class="pill-filter-btn" [class.active]="statusFilter() === 'all'" (click)="statusFilter.set('all')">
              Tất cả ({{ appointments().length }})
            </button>
            <button class="pill-filter-btn pill-pending" [class.active]="statusFilter() === 'pending'" (click)="statusFilter.set('pending')">
              Chờ xác nhận ({{ countPending() }})
            </button>
            <button class="pill-filter-btn pill-confirmed" [class.active]="statusFilter() === 'confirmed'" (click)="statusFilter.set('confirmed')">
              Đã xác nhận ({{ countConfirmed() }})
            </button>
            <button class="pill-filter-btn pill-completed" [class.active]="statusFilter() === 'completed'" (click)="statusFilter.set('completed')">
              Đã xem ({{ countCompleted() }})
            </button>
            <button class="pill-filter-btn pill-cancelled" [class.active]="statusFilter() === 'cancelled'" (click)="statusFilter.set('cancelled')">
              Đã huỷ
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT: APPOINTMENTS LIST -->
      @if (isLoading()) {
        <div class="loading-state-box">
          <div class="loading-spinner"></div>
          <p>Đang tải danh sách lịch hẹn của khách...</p>
        </div>
      } @else if (filteredAppointments().length === 0) {
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3>Chưa có lịch hẹn xem phòng nào</h3>
          <p>Khi khách thuê gửi yêu cầu đặt lịch xem phòng từ trang chi tiết khu trọ, thông tin chi tiết và số điện thoại của khách sẽ hiển thị đầy đủ tại đây.</p>
          <button (click)="loadAppointments()" class="btn-primary-pill">Làm mới dữ liệu</button>
        </div>
      } @else {
        <div class="appointments-grid">
          @for (item of filteredAppointments(); track item.id) {
            <div class="appointment-card" [class.card-unread]="!item.isRead">
              
              <!-- Card Header: Date & Status Badge -->
              <div class="card-header-bar">
                <div class="viewing-datetime-chip">
                  <svg class="clock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span class="dt-date">{{ item.viewingDate || 'Chưa định ngày' }}</span>
                  @if (item.viewingTime) {
                    <span class="dt-time">• {{ item.viewingTime }}</span>
                  }
                </div>

                <div class="status-badge" [ngClass]="getStatusBadgeClass(item.status)">
                  <span class="status-dot"></span>
                  <span>{{ getStatusLabel(item.status) }}</span>
                </div>
              </div>

              <!-- Card Body: Customer Profile & Property Info -->
              <div class="card-content-body">
                
                <!-- Tenant / Customer Info -->
                <div class="customer-info-box">
                  <div class="customer-avatar">
                    <span>{{ getCustomerInitial(item.customerName) }}</span>
                  </div>
                  <div class="customer-details">
                    <div class="customer-name-row">
                      <strong class="cust-name">{{ item.customerName || 'Khách thuê' }}</strong>
                      <span class="people-count-tag">
                        👥 {{ item.numberOfPeople || 1 }} người
                      </span>
                    </div>
                    
                    <div class="customer-contact-actions">
                      <a [href]="'tel:' + getCleanPhone(item.customerPhone)" class="cust-phone-btn" title="Bấm để gọi điện">
                        <svg class="phone-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>{{ item.customerPhone || 'Chưa có SĐT' }}</span>
                      </a>

                      @if (item.customerPhone) {
                        <a [href]="'https://zalo.me/' + getCleanPhone(item.customerPhone)" target="_blank" rel="noopener noreferrer" class="zalo-link-btn" title="Nhắn tin qua Zalo">
                          <span class="zalo-pill-text">Zalo</span>
                        </a>
                      }
                    </div>
                  </div>
                </div>

                <!-- Property Details Box -->
                <div class="target-property-box">
                  <div class="prop-thumb-img">
                    <img [src]="item.propertyImage || '/assets/images/default-room.jpg'" [alt]="item.propertyTitle" (error)="onImgError($event)" />
                  </div>
                  <div class="prop-info-texts">
                    <div class="prop-title-link">
                      <a [routerLink]="['/phong-tro-detail', item.propertyId]" target="_blank" title="Xem trang tin phòng này">
                        {{ item.propertyTitle || 'Khu phòng trọ' }}
                      </a>
                    </div>
                    <div class="prop-address-line">
                      <svg class="map-pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{{ item.propertyAddress || 'Chưa cập nhật địa chỉ' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Customer Note (If provided) -->
                @if (item.note) {
                  <div class="customer-note-callout">
                    <div class="note-header-label">
                      <svg class="note-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>Yêu cầu từ khách:</span>
                    </div>
                    <p class="note-body-text">"{{ item.note }}"</p>
                  </div>
                }

                <div class="created-timestamp-row">
                  <span>Khách đặt lúc: {{ item.createdAt | date:'HH:mm • dd/MM/yyyy' }}</span>
                </div>
              </div>

              <!-- Card Footer Actions -->
              <div class="card-footer-actions">
                <div class="action-buttons-wrap">
                  
                  <!-- If pending: Can Confirm or Cancel -->
                  @if (item.status === 'pending') {
                    <button class="btn-card-action btn-action-confirm" (click)="updateStatus(item, 'confirmed')">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Xác nhận đón tiếp</span>
                    </button>

                    <button class="btn-card-action btn-action-cancel" (click)="updateStatus(item, 'cancelled')">
                      <span>Từ chối / Hủy</span>
                    </button>
                  }

                  <!-- If confirmed: Can Complete or Cancel -->
                  @if (item.status === 'confirmed') {
                    <button class="btn-card-action btn-action-complete" (click)="updateStatus(item, 'completed')">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>Đã xem phòng xong</span>
                    </button>

                    <button class="btn-card-action btn-action-cancel" (click)="updateStatus(item, 'cancelled')">
                      <span>Hủy lịch</span>
                    </button>
                  }

                  <!-- If completed or cancelled: Can reopen or change -->
                  @if (item.status === 'completed' || item.status === 'cancelled') {
                    <button class="btn-card-action btn-action-reopen" (click)="updateStatus(item, 'pending')">
                      <span>Đổi trạng thái về Chờ</span>
                    </button>
                  }

                  <!-- Direct link to create contract if tenant wants to rent! -->
                  <a [routerLink]="['/landlord/create-contract']" [queryParams]="{propertyId: item.propertyId}" class="btn-card-action btn-action-contract" title="Làm hợp đồng thuê cho khách">
                    <span>+ Lập HĐ</span>
                  </a>
                </div>
              </div>

            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .appointments-page-container {
      width: 100%;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .page-main-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .header-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 20px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .pulse-indicator-dot {
      width: 6px;
      height: 6px;
      background: #2563eb;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      color: #334155;
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-refresh:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
    }

    .btn-icon-svg {
      width: 16px;
      height: 16px;
    }

    /* KPI STATS CARDS */
    .stats-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 992px) {
      .stats-kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 520px) {
      .stats-kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.06);
      border-color: #cbd5e1;
    }

    .stat-card.active-kpi {
      border-color: #2563eb;
      background: #f8faff;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bg-blue-subtle { background: #eff6ff; }
    .bg-amber-subtle { background: #fffbeb; }
    .bg-emerald-subtle { background: #ecfdf5; }
    .bg-indigo-subtle { background: #eef2ff; }

    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }
    .text-indigo { color: #4f46e5; }

    .stat-svg {
      width: 24px;
      height: 24px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-top: 2px;
    }

    /* FILTERS BAR */
    .filter-controls-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-input-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 17px;
      height: 17px;
      stroke: #94a3b8;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 9px 34px 9px 38px;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: #f8fafc;
      font-size: 0.88rem;
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .clear-search-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 4px;
    }

    .filter-select-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
    }

    .filter-select {
      padding: 8px 14px;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.86rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      cursor: pointer;
    }

    .status-pills-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .pill-filter-btn {
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-filter-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .pill-filter-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .pill-filter-btn.pill-pending.active {
      background: #d97706;
      border-color: #d97706;
    }

    .pill-filter-btn.pill-confirmed.active {
      background: #059669;
      border-color: #059669;
    }

    .pill-filter-btn.pill-completed.active {
      background: #4f46e5;
      border-color: #4f46e5;
    }

    /* APPOINTMENTS GRID */
    .appointments-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 960px) {
      .appointments-grid {
        grid-template-columns: 1fr;
      }
    }

    .appointment-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .appointment-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }

    .appointment-card.card-unread {
      border-left: 5px solid #2563eb;
    }

    .card-header-bar {
      padding: 12px 18px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .viewing-datetime-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
    }

    .clock-svg {
      width: 16px;
      height: 16px;
      stroke: #2563eb;
    }

    .dt-time {
      color: #2563eb;
      font-weight: 800;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-pending .status-dot { background: #d97706; }

    .badge-confirmed {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-confirmed .status-dot { background: #059669; }

    .badge-completed {
      background: #e0e7ff;
      color: #3730a3;
    }
    .badge-completed .status-dot { background: #4f46e5; }

    .badge-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-cancelled .status-dot { background: #ef4444; }

    .card-content-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    /* Customer Info Box */
    .customer-info-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .customer-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
    }

    .customer-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .customer-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cust-name {
      font-size: 1.05rem;
      color: #0f172a;
      font-weight: 800;
    }

    .people-count-tag {
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .customer-contact-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cust-phone-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .cust-phone-btn:hover {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .phone-svg {
      width: 14px;
      height: 14px;
      stroke: #2563eb;
    }

    .zalo-link-btn {
      display: inline-flex;
      align-items: center;
      background: #0068ff;
      color: #ffffff;
      padding: 3px 9px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 800;
      text-decoration: none;
      transition: opacity 0.15s ease;
    }

    .zalo-link-btn:hover {
      opacity: 0.9;
    }

    /* Target Property Box */
    .target-property-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .prop-thumb-img {
      width: 58px;
      height: 58px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #e2e8f0;
    }

    .prop-thumb-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .prop-info-texts {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .prop-title-link a {
      font-size: 0.92rem;
      font-weight: 700;
      color: #1e293b;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .prop-title-link a:hover {
      color: #2563eb;
      text-decoration: underline;
    }

    .prop-address-line {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .map-pin-svg {
      width: 13px;
      height: 13px;
      stroke: #94a3b8;
      flex-shrink: 0;
    }

    /* Customer note callout */
    .customer-note-callout {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .note-header-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .note-svg {
      width: 13px;
      height: 13px;
      stroke: #b45309;
    }

    .note-body-text {
      margin: 3px 0 0 0;
      font-size: 0.85rem;
      color: #78350f;
      font-style: italic;
    }

    .created-timestamp-row {
      font-size: 0.74rem;
      color: #94a3b8;
      font-weight: 600;
    }

    /* Card Footer Actions */
    .card-footer-actions {
      padding: 12px 18px;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
    }

    .action-buttons-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-card-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-card-action svg {
      width: 14px;
      height: 14px;
    }

    .btn-action-confirm {
      background: #059669;
      color: #ffffff;
    }
    .btn-action-confirm:hover {
      background: #047857;
    }

    .btn-action-complete {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-action-complete:hover {
      background: #1d4ed8;
    }

    .btn-action-cancel {
      background: #fee2e2;
      color: #b91c1c;
    }
    .btn-action-cancel:hover {
      background: #fecaca;
    }

    .btn-action-reopen {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-action-reopen:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-action-contract {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      margin-left: auto;
    }
    .btn-action-contract:hover {
      background: #eff6ff;
      border-color: #2563eb;
      color: #2563eb;
    }

    /* EMPTY & LOADING STATES */
    .loading-state-box {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      margin: 0 auto 14px auto;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state-card {
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 16px;
      padding: 60px 24px;
      text-align: center;
      max-width: 600px;
      margin: 40px auto;
    }

    .empty-icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px auto;
    }

    .empty-icon-circle svg {
      width: 32px;
      height: 32px;
    }

    .empty-state-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .empty-state-card p {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .btn-primary-pill {
      background: #2563eb;
      color: #ffffff;
      padding: 9px 22px;
      border-radius: 20px;
      font-size: 0.88rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary-pill:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
    }
  `]
})
export class LandlordAppointmentsComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);

  appointments = signal<ViewingAppointment[]>([]);
  propertiesList = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  searchQuery = '';
  selectedPropertyId = 0;
  statusFilter = signal<string>('all');

  ngOnInit(): void {
    this.loadProperties();
    this.loadAppointments();
  }

  loadProperties(): void {
    this.dashboardService.getOverview().subscribe({
      next: (data) => {
        if (data?.propertyList) {
          this.propertiesList.set(data.propertyList);
        }
      }
    });
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.propertyService.getViewingAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching viewing appointments', err);
        this.isLoading.set(false);
      }
    });
  }

  updateStatus(item: ViewingAppointment, newStatus: string): void {
    this.propertyService.updateViewingAppointmentStatus(item.id, newStatus).subscribe({
      next: () => {
        item.status = newStatus;
        item.isRead = true;
        this.toastService.show(
          newStatus === 'confirmed' ? 'Đã xác nhận đón tiếp khách xem phòng!' :
          newStatus === 'completed' ? 'Đã hoàn tất lịch xem phòng!' :
          newStatus === 'cancelled' ? 'Đã hủy lịch hẹn xem phòng!' :
          'Đã cập nhật trạng thái lịch hẹn.',
          'success'
        );
      },
      error: (err) => {
        console.error('Error updating appointment status', err);
        this.toastService.show('Không thể cập nhật trạng thái. Vui lòng thử lại!', 'error');
      }
    });
  }

  filteredAppointments = computed(() => {
    let list = this.appointments();

    // Filter by property
    if (this.selectedPropertyId > 0) {
      list = list.filter(item => item.propertyId === Number(this.selectedPropertyId));
    }

    // Filter by status
    const status = this.statusFilter();
    if (status !== 'all') {
      list = list.filter(item => (item.status || 'pending').toLowerCase() === status.toLowerCase());
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(item =>
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        (item.customerPhone && item.customerPhone.includes(q)) ||
        (item.propertyTitle && item.propertyTitle.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    }

    return list;
  });

  countPending = computed(() => {
    return this.appointments().filter(a => (a.status || 'pending').toLowerCase() === 'pending').length;
  });

  countConfirmed = computed(() => {
    return this.appointments().filter(a => (a.status || '').toLowerCase() === 'confirmed').length;
  });

  countCompleted = computed(() => {
    return this.appointments().filter(a => (a.status || '').toLowerCase() === 'completed').length;
  });

  getStatusLabel(status: string): string {
    switch ((status || 'pending').toLowerCase()) {
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Đã xem phòng';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ xác nhận';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch ((status || 'pending').toLowerCase()) {
      case 'confirmed': return 'badge-confirmed';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  }

  getCustomerInitial(name: string): string {
    if (!name) return 'K';
    const words = name.trim().split(' ');
    return words[words.length - 1].charAt(0).toUpperCase();
  }

  getCleanPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  }

  onImgError(event: any): void {
    event.target.src = '/assets/images/default-room.jpg';
  }
}
