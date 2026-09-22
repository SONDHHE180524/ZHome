import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';

export interface RoommateNeed {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  roomId: number;
  roomNumber: string;
  currentOccupants: number;
  maxOccupants: number;
  roomPrice: number;
  pricePerPerson: number;
  currentTenantName: string;
  currentTenantPhone: string;
  genderPreference: 'Male' | 'Female' | 'Any';
  lifestyleTags: string[];
  description: string;
  status: 'Looking' | 'Filled';
  createdDate: string;
}

@Component({
  selector: 'app-landlord-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="tenants-container">
      
      <!-- HEADER ROW -->
      <div class="header-action-row mb-4">
        <div>
          <h1 class="page-main-title m-0">Danh Sách Khách Thuê & Ghép Trọ</h1>
          <p class="text-sm text-muted m-0 mt-1">Quản lý thông tin người thuê phòng và kết nối tìm bạn ở ghép theo từng khu trọ</p>
        </div>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <button (click)="refreshAll()" class="btn-action-light">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Làm mới
          </button>
          
          <button type="button" class="btn-roommate-quick-add" (click)="openCreateRoommateModal()">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            + Đăng Tin Ghép Trọ
          </button>

          <a routerLink="/landlord/contracts" class="btn-primary-add">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Quản Lý Hợp Đồng
          </a>
        </div>
      </div>

      <!-- MAIN NAVIGATION TABS -->
      <div class="tenants-nav-tabs mb-4">
        <button 
          type="button" 
          class="tenant-tab-btn" 
          [class.active]="activeTab() === 'all-tenants'"
          (click)="activeTab.set('all-tenants')">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Khách Thuê Theo Phòng</span>
          <span class="tab-count-pill">{{ activeTenantsCount() }}</span>
        </button>

        <button 
          type="button" 
          class="tenant-tab-btn tab-roommate-highlight" 
          [class.active]="activeTab() === 'roommate-match'"
          (click)="activeTab.set('roommate-match')">
          <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <polyline points="17 11 19 13 23 9"/>
          </svg>
          <span>Ô Ghép Trọ (Tìm Bạn Ở Ghép)</span>
          <span class="tab-count-pill pill-roommate-badge">{{ activeLookingRoommatesCount() }} chỗ đang tìm</span>
        </button>
      </div>

      <!-- STATS KPI BANNER -->
      <div class="stats-kpi-grid mb-4">
        <!-- 1. Total Tenants -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue-subtle">
            <svg class="stat-svg text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-meta">
            <span class="stat-label">Tổng khách đang thuê</span>
            <strong class="stat-value text-sky">{{ activeTenantsCount() }} <span class="text-sm font-normal text-muted">người</span></strong>
          </div>
        </div>

        <!-- 2. Occupied Rooms -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-emerald-subtle">
            <svg class="stat-svg text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2"/>
              <path d="M4 3l10 2.5v13L4 21V3z"/>
              <circle cx="11.5" cy="12" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="stat-meta">
            <span class="stat-label">Phòng có người thuê</span>
            <strong class="stat-value text-emerald">{{ occupiedRoomsCount() }} <span class="text-sm font-normal text-muted">phòng</span></strong>
          </div>
        </div>

        <!-- 3. Properties With Tenants -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-indigo-subtle">
            <svg class="stat-svg text-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
              <path d="M2 22v-6.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V22"/>
              <path d="M2 22h20"/>
            </svg>
          </div>
          <div class="stat-meta">
            <span class="stat-label">Khu trọ có khách</span>
            <strong class="stat-value text-indigo">{{ propertiesWithTenantsCount() }} <span class="text-sm font-normal text-muted">khu</span></strong>
          </div>
        </div>

        <!-- 4. Expiring Soon -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-amber-subtle">
            <svg class="stat-svg text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-meta">
            <span class="stat-label">Hợp đồng sắp hết hạn</span>
            <strong class="stat-value text-amber">{{ expiringSoonCount() }} <span class="text-sm font-normal text-muted">hợp đồng</span></strong>
          </div>
        </div>
      </div>

      <!-- FILTER CONTROLS BAR -->
      <div class="filters-card-wrapper mb-4">
        <div class="filters-grid">
          
          <!-- 1. Chọn Khu Trọ -->
          <div class="filter-item">
            <label class="filter-label">Chọn Khu Trọ (Nhà trọ)</label>
            <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyChange($event)" class="filter-select">
              <option [value]="0">-- Tất cả khu trọ ({{ propertyList().length }}) --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.id">{{ p.title }}</option>
              }
            </select>
          </div>

          <!-- 2. Chọn Phòng -->
          <div class="filter-item">
            <label class="filter-label">Chọn Phòng</label>
            <select [ngModel]="selectedRoomId()" (ngModelChange)="selectedRoomId.set(+$event)" class="filter-select" [disabled]="selectedPropertyId() === 0">
              <option [value]="0">-- Tất cả phòng {{ selectedPropertyId() > 0 ? '(' + availableRoomsForFilter().length + ')' : '' }} --</option>
              @for (r of availableRoomsForFilter(); track r.id) {
                <option [value]="r.id">Phòng {{ r.roomNumber }}</option>
              }
            </select>
          </div>

          <!-- 3. Trạng thái khách thuê -->
          <div class="filter-item">
            <label class="filter-label">Trạng Thái Thuê</label>
            <select [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)" class="filter-select">
              <option value="Active">Đang thuê (Hiện tại)</option>
              <option value="Expiring">Sắp hết hạn (30 ngày)</option>
              <option value="Terminated">Đã trả phòng / Kết thúc</option>
              <option value="All">-- Tất cả trạng thái --</option>
            </select>
          </div>

          <!-- 4. Tìm kiếm nhanh -->
          <div class="filter-item search-filter-item">
            <label class="filter-label">Tìm kiếm người thuê</label>
            <div class="search-input-box">
              <input 
                type="text" 
                [ngModel]="searchQuery()" 
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Nhập tên khách, SĐT, CCCD, số phòng..." 
                class="filter-search-input" />
              @if (searchQuery()) {
                <button type="button" class="btn-clear-search" (click)="searchQuery.set('')">&times;</button>
              }
            </div>
          </div>

        </div>
      </div>

      <!-- MAIN CONTENT: TENANTS GROUPED BY PROPERTY & ROOM -->
      @if (isLoading()) {
        <div class="loading-state text-center py-5">
          <div class="spinner"></div>
          <p class="text-sm text-muted mt-3">Đang tải thông tin khách thuê...</p>
        </div>
      } @else if (groupedPropertiesWithTenants().length === 0) {
        <div class="empty-state-box text-center py-5">
          <div class="empty-icon-circle mb-3">
            <svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="18" y1="8" x2="23" y2="13"/>
              <line x1="23" y1="8" x2="18" y2="13"/>
            </svg>
          </div>
          <h3 class="font-bold text-lg mb-1">Không tìm thấy khách thuê nào</h3>
          <p class="text-muted text-sm max-w-400 mx-auto mb-4">Không có khách thuê nào phù hợp với bộ lọc hiện tại của bạn.</p>
          <button (click)="refreshAll()" class="btn-action-light mx-auto">Đặt lại bộ lọc</button>
        </div>
      } @else {
        <div class="properties-tenants-list d-flex flex-column gap-4">
          @for (prop of groupedPropertiesWithTenants(); track prop.propertyId) {
            <div class="property-group-card">
              
              <!-- Property Header Banner -->
              <div class="property-group-header" (click)="togglePropertyCollapse(prop.propertyId)">
                <div class="d-flex align-items-center gap-3">
                  <div class="property-badge-icon">
                    <svg class="prop-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
                      <path d="M2 22v-6.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V22"/>
                      <path d="M2 22h20"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="property-group-title m-0">{{ prop.propertyTitle }}</h2>
                    <span class="property-group-address text-xs text-muted d-flex align-items-center gap-1 mt-0.5">
                      {{ prop.propertyAddress || 'Chưa cập nhật địa chỉ' }}
                    </span>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <div class="group-metrics-pills">
                    <span class="metric-pill">
                      <strong>{{ prop.occupiedRoomsCount }}</strong> phòng có khách
                    </span>
                    <span class="metric-pill metric-pill-primary">
                      <strong>{{ prop.tenantsCount }}</strong> khách thuê
                    </span>
                  </div>
                  <button type="button" class="btn-collapse-toggle">
                    {{ isPropertyCollapsed(prop.propertyId) ? 'Mở rộng ▼' : 'Thu gọn ▲' }}
                  </button>
                </div>
              </div>

              <!-- Property Rooms & Tenants Grid -->
              @if (!isPropertyCollapsed(prop.propertyId)) {
                <div class="property-rooms-body p-3">
                  <div class="rooms-tenants-grid">
                    @for (roomGroup of prop.rooms; track roomGroup.roomId) {
                      <div class="room-tenant-item-card">
                        
                        <!-- Room Header Badge -->
                        <div class="room-card-top-bar">
                          <div class="d-flex align-items-center gap-2">
                            <span class="room-badge-pill">Phòng {{ roomGroup.roomNumber }}</span>
                            <span class="room-price-tag text-xs font-semibold text-muted">
                              {{ (roomGroup.roomPrice || 0) | number:'1.0-0' }} đ/tháng
                            </span>
                          </div>
                          <span class="occupants-badge text-xs font-bold" [class.badge-active]="roomGroup.hasActiveTenant">
                            {{ roomGroup.tenants.length }} khách
                          </span>
                        </div>

                        <!-- Tenants Inside This Room -->
                        <div class="room-tenants-content mt-2 d-flex flex-column gap-2">
                          @for (tenant of roomGroup.tenants; track tenant.id) {
                            <div class="tenant-info-row" (click)="openTenantDetails(tenant)">
                              
                              <!-- Avatar / Initial -->
                              <div class="tenant-avatar-circle" [class.avatar-active]="tenant.status === 'Active'">
                                {{ getInitials(tenant.tenantFullName) }}
                              </div>

                              <!-- Info Body -->
                              <div class="tenant-main-info flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                  <strong class="tenant-name font-md text-dark">{{ tenant.tenantFullName }}</strong>
                                  <span class="status-badge-chip" [ngClass]="getStatusBadgeClass(tenant)">
                                    {{ getStatusText(tenant) }}
                                  </span>
                                </div>

                                <div class="tenant-meta-details-grid">
                                  <!-- SĐT -->
                                  <div class="meta-item">
                                    <span class="meta-icon"></span>
                                    <a [href]="'tel:' + tenant.tenantPhone" (click)="$event.stopPropagation()" class="meta-link-phone">
                                      {{ tenant.tenantPhone }}
                                    </a>
                                  </div>

                                  <!-- CCCD -->
                                  <div class="meta-item">
                                    <span class="meta-icon"></span>
                                    <span class="meta-text">{{ tenant.tenantCccd || 'Chưa cập nhật CCCD' }}</span>
                                  </div>

                                  <!-- Thời gian thuê -->
                                  <div class="meta-item col-span-2">
                                    <span class="meta-icon"></span>
                                    <span class="meta-text text-xs">
                                      Từ {{ tenant.startDate | date:'dd/MM/yyyy' }} → Đến {{ tenant.endDate | date:'dd/MM/yyyy' }}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <!-- Action Buttons Dropdown or Quick Actions -->
                              <div class="tenant-row-actions" (click)="$event.stopPropagation()">
                                <button type="button" class="btn-row-action" title="Xem & Xuất Hợp Đồng (.doc / In)" (click)="openLegalDocForTenant(tenant)">
                                  <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <path d="M14 2v6h6"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <line x1="10" y1="9" x2="8" y2="9"/>
                                  </svg>
                                </button>
                                <button type="button" class="btn-row-action" title="Xem chi tiết" (click)="openTenantDetails(tenant)">
                                  <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </button>
                                <a [href]="'tel:' + tenant.tenantPhone" class="btn-row-action btn-call" title="Gọi điện">
                                  <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                </a>
                              </div>

                            </div>
                          }
                        </div>

                      </div>
                    }
                  </div>
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- MODAL: CHI TIẾT THÔNG TIN KHÁCH THUÊ -->
      @if (activeTenantDetails(); as tenant) {
        <div class="modal-backdrop" (click)="closeTenantDetails()">
          <div class="modal-card max-w-600 animate-slide-up" (click)="$event.stopPropagation()">
            
            <div class="modal-header-clean">
              <div class="d-flex align-items-center gap-3">
                <div class="tenant-modal-avatar">
                  {{ getInitials(tenant.tenantFullName) }}
                </div>
                <div>
                  <h2 class="modal-main-title m-0">{{ tenant.tenantFullName }}</h2>
                  <span class="text-xs text-muted">Khách thuê đại diện hợp đồng</span>
                </div>
              </div>
              <button (click)="closeTenantDetails()" class="modal-close-x">&times;</button>
            </div>

            <div class="modal-body-content mt-3">
              
              <!-- Section 1: Thông tin liên hệ cơ bản -->
              <div class="detail-section-block mb-3">
                <h3 class="section-subtitle">THÔNG TIN CÁ NHÂN</h3>
                <div class="info-two-cols-grid">
                  <div class="info-field">
                    <span class="field-label">Họ và tên:</span>
                    <strong class="field-value">{{ tenant.tenantFullName }}</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Số điện thoại:</span>
                    <strong class="field-value">
                      <a [href]="'tel:' + tenant.tenantPhone" class="text-primary">{{ tenant.tenantPhone }}</a>
                    </strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Số CCCD / CMND:</span>
                    <strong class="field-value">{{ tenant.tenantCccd || 'Chưa cập nhật' }}</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Email:</span>
                    <strong class="field-value">{{ tenant.tenantEmail || 'Chưa cập nhật' }}</strong>
                  </div>
                </div>
              </div>

              <!-- Section 2: Thông tin phòng đang ở -->
              <div class="detail-section-block mb-3">
                <h3 class="section-subtitle">THÔNG TIN PHÒNG TRỌ</h3>
                <div class="info-two-cols-grid">
                  <div class="info-field">
                    <span class="field-label">Khu trọ:</span>
                    <strong class="field-value">{{ tenant.propertyTitle }}</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Phòng đang ở:</span>
                    <strong class="field-value text-primary">Phòng {{ tenant.roomNumber }}</strong>
                  </div>
                  <div class="info-field col-span-2">
                    <span class="field-label">Địa chỉ khu trọ:</span>
                    <span class="field-value text-muted text-sm">{{ tenant.propertyAddress }}</span>
                  </div>
                </div>
              </div>

              <!-- Section 3: Thông tin hợp đồng thuê -->
              <div class="detail-section-block mb-3">
                <h3 class="section-subtitle">HỢP ĐỒNG & THANH TOÁN</h3>
                <div class="info-two-cols-grid">
                  <div class="info-field">
                    <span class="field-label">Giá thuê thỏa thuận:</span>
                    <strong class="field-value text-emerald font-lg">{{ tenant.roomPrice | number:'1.0-0' }} đ/tháng</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Tiền cọc giữ chân:</span>
                    <strong class="field-value">{{ (tenant.depositAmount || tenant.roomPrice) | number:'1.0-0' }} đ</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Ngày bắt đầu vào ở:</span>
                    <strong class="field-value">{{ tenant.startDate | date:'dd/MM/yyyy' }}</strong>
                  </div>
                  <div class="info-field">
                    <span class="field-label">Thời hạn hợp đồng đến:</span>
                    <strong class="field-value" [class.text-amber]="isExpiringSoon(tenant.endDate)">
                      {{ tenant.endDate | date:'dd/MM/yyyy' }}
                    </strong>
                  </div>
                  <div class="info-field col-span-2">
                    <span class="field-label">Trạng thái hợp đồng:</span>
                    <span class="status-badge-chip" [ngClass]="getStatusBadgeClass(tenant)">
                      {{ getStatusText(tenant) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quick Links Footer -->
              <div class="modal-actions-footer mt-4">
                <button type="button" class="btn-cancel-custom" (click)="closeTenantDetails()">Đóng</button>
                <button type="button" class="btn-cancel-custom" style="border-color: #2563eb; color: #2563eb; font-weight: 700;" (click)="openLegalDocForTenant(tenant)">
                  📄 Xuất / In Hợp Đồng
                </button>
                <a [href]="'tel:' + tenant.tenantPhone" class="btn-call-direct">
                  Gọi Điện Ngay ({{ tenant.tenantPhone }})
                </a>
              </div>

            </div>

          </div>
        </div>
      }

      <!-- MODAL: VĂN BẢN HỢP ĐỒNG PHÁP LÝ (CHUẨN mau-hop-dong-thue-nha-tro-ngan-gon.docx) -->
      @if (showLegalDocModal()) {
        <div class="modal-backdrop" (click)="showLegalDocModal.set(false)">
          <div class="modal-card max-w-850 legal-doc-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header-clean no-print">
              <div>
                <h2 class="modal-main-title m-0">VĂN BẢN HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
                <p class="text-muted text-sm m-0 mt-1">Chuẩn theo mẫu hợp đồng thuê nhà trọ ngắn gọn (Pháp luật Việt Nam)</p>
              </div>
              <button (click)="showLegalDocModal.set(false)" class="modal-close-x">&times;</button>
            </div>

            @if (isLoadingLegalDoc()) {
              <div class="text-center py-5">
                <div class="spinner mb-2"></div>
                <p class="text-muted">Đang tải văn bản hợp đồng pháp lý...</p>
              </div>
            } @else if (legalDocData(); as doc) {
              
              <!-- Legal Paper Body (Chuẩn mẫu văn bản mau-hop-dong-thue-nha-tro-ngan-gon.docx) -->
              <div class="legal-contract-paper mt-3" id="printableContractTenant">
                
                <!-- Quốc hiệu & Tiêu ngữ -->
                <div class="text-center mb-3">
                  <h3 class="country-title m-0">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                  <p class="country-motto m-0 mt-1">Độc lập - Tự do - Hạnh phúc</p>
                  <div class="motto-divider">-----------------</div>
                </div>

                <!-- Tên văn bản -->
                <div class="text-center mb-3 mt-4">
                  <h2 class="contract-doc-title m-0">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
                  <p class="legal-basis m-0 mt-1">
                    <em>Hôm nay, ngày {{ doc.startDate | date:'dd' }} tháng {{ doc.startDate | date:'MM' }} năm {{ doc.startDate | date:'yyyy' }}; tại địa chỉ: {{ doc.propertyAddress || doc.propertyTitle }}</em>
                  </p>
                </div>

                <p class="legal-text-p mt-3"><strong>Chúng tôi gồm:</strong></p>

                <!-- 1. Bên A -->
                <div class="legal-party-section">
                  <p class="legal-party-head"><strong>1. Đại diện bên cho thuê phòng trọ (Bên A):</strong></p>
                  <p class="legal-text-p">Ông/bà: <strong>{{ doc.landlordFullName }}</strong></p>
                  <p class="legal-text-p">Nơi đăng ký HK thường trú: <strong>{{ doc.propertyAddress || 'Cư Xá Phú Lâm B, Phường 13, Quận 6, TP.HCM' }}</strong></p>
                  <p class="legal-text-p">CMND/CCCD số: <strong>{{ doc.landlordCccd || '075189005448' }}</strong></p>
                  <p class="legal-text-p">Số điện thoại: <strong>{{ doc.landlordPhone }}</strong></p>
                </div>

                <!-- 2. Bên B -->
                <div class="legal-party-section mt-3">
                  <p class="legal-party-head"><strong>2. Bên thuê phòng trọ (Bên B):</strong></p>
                  <p class="legal-text-p">Ông/bà: <strong>{{ doc.tenantFullName }}</strong></p>
                  <p class="legal-text-p">Nơi đăng ký HK thường trú: <strong>Đăng ký theo CCCD / Thường trú hợp pháp</strong></p>
                  <p class="legal-text-p">Số CMND/CCCD: <strong>{{ doc.tenantCccd || 'Chưa cập nhật' }}</strong></p>
                  <p class="legal-text-p">Số điện thoại: <strong>{{ doc.tenantPhone }}</strong></p>
                </div>

                <p class="legal-text-p mt-3">
                  <em>Sau khi bàn bạc trên tinh thần dân chủ, hai bên cùng có lợi, cùng thống nhất như sau:</em>
                </p>

                <!-- Nội dung thỏa thuận -->
                <div class="legal-clauses-section mt-3">
                  <p class="legal-clause-p">
                    Bên A đồng ý cho bên B thuê <strong>01 phòng ở (Phòng số {{ doc.roomNumber }})</strong> tại địa chỉ: <strong>{{ doc.propertyAddress || doc.propertyTitle }}</strong> (Diện tích: <strong>{{ doc.area || 20 }} m²</strong>).
                  </p>
                  <p class="legal-clause-p">
                    Giá thuê: <strong>{{ doc.roomPrice | number:'1.0-0' }} VNĐ / tháng</strong> (Bằng chữ: <em>{{ getMoneyInWords(doc.roomPrice) }}</em>).
                  </p>
                  <p class="legal-clause-p">
                    Hình thức thanh toán: <strong>Thanh toán theo chu kỳ 1 tháng</strong> vào đầu mỗi kỳ thanh toán.
                  </p>
                  <p class="legal-clause-p">
                    Tiền điện: <strong>3.500 VNĐ / số (kWh)</strong> tính theo chỉ số công tơ, thanh toán vào cuối các tháng.
                  </p>
                  <p class="legal-clause-p">
                    Tiền nước: <strong>100.000 VNĐ / người / tháng</strong> (hoặc theo chỉ số đồng hồ nước thực tế), thanh toán vào đầu các tháng.
                  </p>
                  <p class="legal-clause-p">
                    Tiền đặt cọc: <strong>{{ (doc.depositAmount || doc.roomPrice) | number:'1.0-0' }} VNĐ</strong> (Bằng chữ: <em>{{ getMoneyInWords(doc.depositAmount || doc.roomPrice) }}</em>). Bên A giữ và hoàn trả cho Bên B khi kết thúc hợp đồng mà không vi phạm các điều khoản.
                  </p>
                  <p class="legal-clause-p">
                    Hợp đồng có giá trị kể từ ngày <strong>{{ doc.startDate | date:'dd/MM/yyyy' }}</strong> đến ngày <strong>{{ doc.endDate | date:'dd/MM/yyyy' }}</strong> (Thời hạn: <strong>{{ getMonthsDuration(doc.startDate, doc.endDate) }} tháng</strong>).
                  </p>
                </div>

                <!-- Trách nhiệm các bên -->
                <div class="legal-clauses-section mt-3">
                  <h4 class="legal-clause-heading">TRÁCH NHIỆM CỦA CÁC BÊN</h4>
                  <p class="legal-clause-p"><strong>* Trách nhiệm của bên A:</strong></p>
                  <ul class="legal-clause-list">
                    <li>Tạo mọi điều kiện thuận lợi để bên B thực hiện theo hợp đồng.</li>
                    <li>Cung cấp nguồn điện, nước, wifi cho bên B sử dụng.</li>
                  </ul>

                  <p class="legal-clause-p mt-2"><strong>* Trách nhiệm của bên B:</strong></p>
                  <ul class="legal-clause-list">
                    <li>Thanh toán đầy đủ các khoản tiền theo đúng thỏa thuận.</li>
                    <li>Bảo quản các trang thiết bị và cơ sở vật chất của bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).</li>
                    <li>Không được tự ý sửa chữa, cải tạo cơ sở vật chất khi chưa được sự đồng ý của bên A.</li>
                    <li>Giữ gìn vệ sinh trong và ngoài khuôn viên của phòng trọ.</li>
                    <li>Bên B phải chấp hành mọi quy định của pháp luật Nhà nước và quy định của địa phương.</li>
                    <li>Nếu bên B cho khách ở qua đêm thì phải báo và được sự đồng ý của chủ nhà đồng thời phải chịu trách nhiệm về các hành vi vi phạm pháp luật của khách trong thời gian ở lại.</li>
                  </ul>
                </div>

                <!-- Trách nhiệm chung -->
                <div class="legal-clauses-section mt-3">
                  <h4 class="legal-clause-heading">TRÁCH NHIỆM CHUNG</h4>
                  <ul class="legal-clause-list">
                    <li>Hai bên phải tạo điều kiện cho nhau thực hiện hợp đồng.</li>
                    <li>Trong thời gian hợp đồng còn hiệu lực nếu bên nào vi phạm các điều khoản đã thỏa thuận thì bên còn lại có quyền đơn phương chấm dứt hợp đồng; nếu sự vi phạm hợp đồng đó gây tổn thất cho bên bị vi phạm hợp đồng thì bên vi phạm hợp đồng phải bồi thường thiệt hại.</li>
                    <li>Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải báo trước cho bên kia ít nhất 30 ngày và hai bên phải có sự thống nhất.</li>
                    <li>Bên A phải trả lại tiền đặt cọc cho bên B khi kết thúc hợp đồng mà không vi phạm các điều khoản.</li>
                    <li>Bên nào vi phạm điều khoản chung thì phải chịu trách nhiệm trước pháp luật.</li>
                    <li>Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản.</li>
                  </ul>
                </div>

                <!-- Chữ ký 2 bên -->
                <div class="legal-signatures-row mt-5">
                  <div class="sig-col text-center">
                    <p class="sig-title"><strong>ĐẠI DIỆN BÊN B</strong></p>
                    <p class="sig-hint"><em>(Ký và ghi rõ họ tên)</em></p>
                    <div class="sig-blank-space"></div>
                    <p class="sig-name"><strong>{{ doc.tenantFullName }}</strong></p>
                  </div>

                  <div class="sig-col text-center">
                    <p class="sig-title"><strong>ĐẠI DIỆN BÊN A</strong></p>
                    <p class="sig-hint"><em>(Ký và ghi rõ họ tên)</em></p>
                    <div class="sig-blank-space"></div>
                    <p class="sig-name"><strong>{{ doc.landlordFullName }}</strong></p>
                  </div>
                </div>

              </div>

              <!-- Footer Buttons (Hidden on Print) -->
              <div class="modal-actions-footer mt-4 no-print">
                <button type="button" class="btn-cancel-custom" (click)="showLegalDocModal.set(false)">Đóng</button>
                <button type="button" class="btn-cancel-custom" style="border-color: #2563eb; color: #2563eb; font-weight: 600;" (click)="exportToWordDoc()">
                  Xuất File Word (.doc)
                </button>
                <button type="button" class="btn-submit-custom btn-print-big" (click)="printContract()">In Hợp Đồng</button>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .tenants-container {
      padding: 4px 0;
    }

    .header-action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-main-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .btn-action-light {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-action-light:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .btn-primary-add {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }

    .btn-primary-add:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .btn-icon-svg {
      width: 16px;
      height: 16px;
    }

    /* KPI Cards */
    .stats-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .stat-icon-wrapper {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-svg {
      width: 24px;
      height: 24px;
    }

    .bg-blue-subtle { background: #eff6ff; }
    .bg-emerald-subtle { background: #ecfdf5; }
    .bg-indigo-subtle { background: #eef2ff; }
    .bg-amber-subtle { background: #fffbeb; }

    .text-sky { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-indigo { color: #4f46e5; }
    .text-amber { color: #d97706; }

    .stat-meta {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
    }

    /* Filters */
    .filters-card-wrapper {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1.5fr;
      gap: 16px;
    }

    @media (max-width: 1024px) {
      .filters-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-label {
      font-size: 0.78rem;
      font-weight: 800;
      color: #475569;
    }

    .filter-select {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 0.86rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;
    }

    .filter-select:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .filter-search-input {
      width: 100%;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 34px 9px 12px;
      font-size: 0.86rem;
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;
    }

    .filter-search-input:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .btn-clear-search {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      font-size: 1.2rem;
      color: #94a3b8;
      cursor: pointer;
    }

    /* Property Group Card */
    .property-group-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .property-group-header {
      background: #f8fafc;
      border-bottom: 1.5px solid #e2e8f0;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .property-group-header:hover {
      background: #f1f5f9;
    }

    .property-badge-icon {
      width: 40px;
      height: 40px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
      flex-shrink: 0;
    }

    .prop-header-svg {
      width: 22px;
      height: 22px;
      stroke: #2563eb;
    }

    .property-group-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }

    .group-metrics-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .metric-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      font-size: 0.8rem;
      color: #475569;
      padding: 5px 12px;
      border-radius: 20px;
    }

    .metric-pill-primary {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }

    .btn-collapse-toggle {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Rooms & Tenants Grid */
    .rooms-tenants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .room-tenant-item-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      transition: all 0.2s ease;
    }

    .room-tenant-item-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }

    .room-card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .room-badge-pill {
      background: #0f172a;
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .occupants-badge {
      background: #f1f5f9;
      color: #64748b;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .occupants-badge.badge-active {
      background: #dcfce7;
      color: #15803d;
    }

    /* Tenant Info Row Inside Room */
    .tenant-info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tenant-info-row:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .tenant-avatar-circle {
      width: 38px;
      height: 38px;
      background: #e2e8f0;
      color: #475569;
      font-weight: 800;
      font-size: 0.95rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tenant-avatar-circle.avatar-active {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .tenant-name {
      font-size: 0.95rem;
    }

    .tenant-meta-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #475569;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    .meta-link-phone {
      color: #2563eb;
      font-weight: 700;
      text-decoration: none;
    }

    .meta-link-phone:hover {
      text-decoration: underline;
    }

    .status-badge-chip {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .badge-chip-active {
      background: #dcfce7;
      color: #166534;
    }

    .badge-chip-expiring {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-chip-terminated {
      background: #f1f5f9;
      color: #64748b;
    }

    .tenant-row-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .btn-row-action {
      width: 28px;
      height: 28px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-row-action:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .btn-call:hover {
      background: #16a34a;
      border-color: #16a34a;
      color: #ffffff;
    }

    .action-svg {
      width: 14px;
      height: 14px;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .max-w-600 { max-width: 600px; }

    .modal-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1.5px solid #e2e8f0;
    }

    .tenant-modal-avatar {
      width: 44px;
      height: 44px;
      background: #2563eb;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 900;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-main-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }

    .modal-close-x {
      background: none;
      border: none;
      font-size: 1.8rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
    }

    .detail-section-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }

    .section-subtitle {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      margin: 0 0 10px 0;
    }

    .info-two-cols-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
    }

    .info-field {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    .field-value {
      font-size: 0.92rem;
      color: #0f172a;
    }

    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-cancel-custom {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-call-direct {
      background: #16a34a;
      color: #ffffff;
      font-weight: 700;
      padding: 9px 20px;
      border-radius: 8px;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
    }

    .btn-call-direct:hover {
      background: #15803d;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #cbd5e1;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-icon-circle {
      width: 64px;
      height: 64px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .empty-svg {
      width: 32px;
      height: 32px;
      stroke: #94a3b8;
    }

    /* Legal Contract Paper Styling (Matching Vietnamese Standard mau-hop-dong-thue-nha-tro-ngan-gon.docx) */
    .legal-doc-modal-card {
      background: #f8fafc;
      max-height: 92vh;
    }
    .legal-contract-paper {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 40px 48px;
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      line-height: 1.6;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      max-width: 780px;
      margin: 0 auto;
    }
    .country-title {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #000000;
    }
    .country-motto {
      font-size: 1.05rem;
      font-weight: 700;
      color: #000000;
    }
    .motto-divider {
      text-align: center;
      color: #000000;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .contract-doc-title {
      font-size: 1.45rem;
      font-weight: 900;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .legal-basis {
      font-size: 0.95rem;
      color: #333333;
    }
    .legal-text-p {
      font-size: 1rem;
      margin: 4px 0;
      text-align: justify;
      color: #000000;
    }
    .legal-party-head {
      font-size: 1.02rem;
      margin: 10px 0 4px 0;
      color: #000000;
    }
    .legal-clause-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: #000000;
      margin: 14px 0 6px 0;
    }
    .legal-clause-p {
      font-size: 1rem;
      margin: 6px 0;
      text-align: justify;
      color: #000000;
    }
    .legal-clause-list {
      margin: 4px 0 10px 24px;
      padding: 0;
      font-size: 0.98rem;
      line-height: 1.6;
      color: #000000;
    }
    .legal-clause-list li {
      margin-bottom: 4px;
    }
    .legal-signatures-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 36px;
      padding-top: 10px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-title {
      font-size: 1.02rem;
      margin: 0;
      color: #000000;
    }
    .sig-hint {
      font-size: 0.88rem;
      margin: 2px 0 0 0;
      color: #555555;
    }
    .sig-blank-space {
      height: 70px;
    }
    .sig-name {
      font-size: 1.02rem;
      margin: 0;
      color: #000000;
      text-transform: uppercase;
    }
    .btn-print-big {
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      padding: 9px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .btn-print-big:hover {
      background: #1d4ed8;
    }

    @media print {
      @page {
        size: A4;
        margin: 15mm 15mm 15mm 15mm;
      }
      body * {
        visibility: hidden;
      }
      .no-print {
        display: none !important;
      }
      .modal-backdrop {
        position: static !important;
        background: none !important;
        padding: 0 !important;
      }
      .legal-doc-modal-card {
        box-shadow: none !important;
        padding: 0 !important;
        max-height: none !important;
      }
      #printableContractTenant, #printableContractTenant * {
        visibility: visible !important;
      }
      #printableContractTenant {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }
  `]
})
export class LandlordTenantsComponent implements OnInit {
  private readonly contractService = inject(ContractService);
  private readonly propertyService = inject(PropertyService);
  readonly toastService = inject(ToastService);
  readonly router = inject(Router);

  contracts = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  allRooms = signal<any[]>([]);
  isLoading = signal(true);

  // Active tab & roommate state
  activeTab = signal<'all-tenants' | 'roommate-match'>('all-tenants');
  activeLookingRoommatesCount = signal<number>(0);

  // Filters
  selectedPropertyId = signal<number>(0);
  selectedRoomId = signal<number>(0);
  selectedStatus = signal<string>('Active'); // 'Active' | 'Expiring' | 'Terminated' | 'All'
  searchQuery = signal<string>('');
  collapsedProperties = signal<Set<number>>(new Set());

  // Modal detail
  activeTenantDetails = signal<any | null>(null);

  // Legal Doc Modal state
  showLegalDocModal = signal<boolean>(false);
  isLoadingLegalDoc = signal<boolean>(false);
  legalDocData = signal<any | null>(null);

  openCreateRoommateModal(): void {
    this.router.navigate(['/tenant/match'], { queryParams: { tab: 'post' } });
  }

  // Computed: Rooms available for filter dropdown
  availableRoomsForFilter = computed(() => {
    const propId = Number(this.selectedPropertyId());
    if (propId > 0) {
      return this.allRooms().filter(r => r.propertyId === propId);
    }
    return this.allRooms();
  });

  // KPI Computations
  activeTenantsCount = computed(() => {
    return this.contracts().filter(c => c.status === 'Active').length;
  });

  occupiedRoomsCount = computed(() => {
    const activeContracts = this.contracts().filter(c => c.status === 'Active');
    const roomSet = new Set(activeContracts.map(c => c.roomId));
    return roomSet.size;
  });

  propertiesWithTenantsCount = computed(() => {
    const activeContracts = this.contracts().filter(c => c.status === 'Active');
    const propSet = new Set(activeContracts.map(c => c.propertyId));
    return propSet.size;
  });

  expiringSoonCount = computed(() => {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.contracts().filter(c => {
      if (c.status !== 'Active') return false;
      const end = new Date(c.endDate);
      return end >= now && end <= next30Days;
    }).length;
  });

  // Computed: Filtered list of contracts/tenants
  filteredContracts = computed(() => {
    let list = this.contracts();
    const propId = Number(this.selectedPropertyId());
    const roomId = Number(this.selectedRoomId());
    const status = this.selectedStatus();
    const search = this.searchQuery().toLowerCase().trim();

    if (propId > 0) {
      list = list.filter(c => c.propertyId === propId);
    }

    if (roomId > 0) {
      list = list.filter(c => c.roomId === roomId);
    }

    if (status === 'Active') {
      list = list.filter(c => c.status === 'Active');
    } else if (status === 'Terminated') {
      list = list.filter(c => c.status === 'Terminated' || c.status === 'Expired');
    } else if (status === 'Expiring') {
      const now = new Date();
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      list = list.filter(c => {
        if (c.status !== 'Active') return false;
        const end = new Date(c.endDate);
        return end >= now && end <= next30Days;
      });
    }

    if (search) {
      list = list.filter(c => 
        (c.tenantFullName && c.tenantFullName.toLowerCase().includes(search)) ||
        (c.tenantPhone && c.tenantPhone.toLowerCase().includes(search)) ||
        (c.tenantCccd && c.tenantCccd.toLowerCase().includes(search)) ||
        (c.roomNumber && c.roomNumber.toLowerCase().includes(search)) ||
        (c.propertyTitle && c.propertyTitle.toLowerCase().includes(search))
      );
    }

    return list;
  });

  // Computed: Grouped by Property → Từng Phòng Trọ
  groupedPropertiesWithTenants = computed(() => {
    const list = this.filteredContracts();
    const propMap = new Map<number, {
      propertyId: number;
      propertyTitle: string;
      propertyAddress: string;
      occupiedRoomsCount: number;
      tenantsCount: number;
      roomsMap: Map<number, {
        roomId: number;
        roomNumber: string;
        roomPrice: number;
        hasActiveTenant: boolean;
        tenants: any[];
      }>;
    }>();

    for (const c of list) {
      const pId = c.propertyId || 0;
      if (!propMap.has(pId)) {
        propMap.set(pId, {
          propertyId: pId,
          propertyTitle: c.propertyTitle || 'Nhà trọ',
          propertyAddress: c.PropertyAddress || c.propertyAddress || '',
          occupiedRoomsCount: 0,
          tenantsCount: 0,
          roomsMap: new Map()
        });
      }

      const pGroup = propMap.get(pId)!;
      pGroup.tenantsCount += 1;

      const rId = c.roomId || 0;
      if (!pGroup.roomsMap.has(rId)) {
        pGroup.roomsMap.set(rId, {
          roomId: rId,
          roomNumber: c.roomNumber || 'Phòng',
          roomPrice: c.roomPrice || 0,
          hasActiveTenant: false,
          tenants: []
        });
      }

      const rGroup = pGroup.roomsMap.get(rId)!;
      rGroup.tenants.push(c);
      if (c.status === 'Active') {
        rGroup.hasActiveTenant = true;
      }
    }

    // Convert map to structured array
    return Array.from(propMap.values()).map(p => {
      const roomsArray = Array.from(p.roomsMap.values());
      const activeRooms = roomsArray.filter(r => r.hasActiveTenant).length;
      return {
        propertyId: p.propertyId,
        propertyTitle: p.propertyTitle,
        propertyAddress: p.propertyAddress,
        occupiedRoomsCount: activeRooms,
        tenantsCount: p.tenantsCount,
        rooms: roomsArray
      };
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load properties & rooms
    this.propertyService.getProperties().subscribe({
      next: (props) => {
        this.propertyList.set(props);
        const rooms: any[] = [];
        for (const p of props) {
          if (p.rooms) {
            for (const r of p.rooms) {
              rooms.push({
                ...r,
                propertyId: p.id,
                propertyTitle: p.title
              });
            }
          }
        }
        this.allRooms.set(rooms);
      },
      error: () => {}
    });

    // Load contracts
    this.contractService.getContracts().subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách khách thuê.', 'error');
      }
    });
  }

  refreshAll(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('Active');
    this.selectedPropertyId.set(0);
    this.selectedRoomId.set(0);
    this.loadData();
    this.toastService.show('Đã làm mới danh sách khách thuê!', 'info');
  }

  onPropertyChange(propId: any): void {
    this.selectedPropertyId.set(Number(propId));
    this.selectedRoomId.set(0);
  }

  isPropertyCollapsed(propId: number): boolean {
    return this.collapsedProperties().has(propId);
  }

  togglePropertyCollapse(propId: number): void {
    const set = new Set(this.collapsedProperties());
    if (set.has(propId)) {
      set.delete(propId);
    } else {
      set.add(propId);
    }
    this.collapsedProperties.set(set);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  isExpiringSoon(endDate: any): boolean {
    if (!endDate) return false;
    const now = new Date();
    const end = new Date(endDate);
    const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  getStatusBadgeClass(tenant: any): string {
    if (tenant.status !== 'Active') return 'badge-chip-terminated';
    if (this.isExpiringSoon(tenant.endDate)) return 'badge-chip-expiring';
    return 'badge-chip-active';
  }

  getStatusText(tenant: any): string {
    if (tenant.status !== 'Active') return 'Đã kết thúc';
    if (this.isExpiringSoon(tenant.endDate)) return 'Sắp hết hạn';
    return 'Đang ở';
  }

  openTenantDetails(tenant: any): void {
    this.activeTenantDetails.set(tenant);
  }

  closeTenantDetails(): void {
    this.activeTenantDetails.set(null);
  }

  openLegalDocForTenant(tenant: any): void {
    const contractId = tenant?.id || tenant?.contractId;
    if (!contractId) {
      this.toastService.show('Không tìm thấy thông tin hợp đồng của khách thuê này.', 'error');
      return;
    }
    this.showLegalDocModal.set(true);
    this.isLoadingLegalDoc.set(true);
    this.contractService.getLegalContractDocument(contractId).subscribe({
      next: (doc) => {
        this.legalDocData.set(doc);
        this.isLoadingLegalDoc.set(false);
      },
      error: () => {
        this.isLoadingLegalDoc.set(false);
        this.toastService.show('Lỗi tải văn bản hợp đồng pháp lý.', 'error');
      }
    });
  }

  getMonthsDuration(start: string, end: string): number {
    if (!start || !end) return 12;
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
      return months > 0 ? months : 12;
    } catch {
      return 12;
    }
  }

  getMoneyInWords(amount: number): string {
    if (!amount || isNaN(amount)) return 'Không đồng';
    const defaultMap: Record<number, string> = {
      1000000: 'Một triệu đồng',
      1200000: 'Một triệu hai trăm nghìn đồng',
      1300000: 'Một triệu ba trăm nghìn đồng',
      1400000: 'Một triệu bốn trăm nghìn đồng',
      1500000: 'Một triệu năm trăm nghìn đồng',
      1600000: 'Một triệu sáu trăm nghìn đồng',
      1700000: 'Một triệu bảy trăm nghìn đồng',
      1800000: 'Một triệu tám trăm nghìn đồng',
      1900000: 'Một triệu chín trăm nghìn đồng',
      2000000: 'Hai triệu đồng',
      2200000: 'Hai triệu hai trăm nghìn đồng',
      2300000: 'Hai triệu ba trăm nghìn đồng',
      2400000: 'Hai triệu bốn trăm nghìn đồng',
      2500000: 'Hai triệu năm trăm nghìn đồng',
      2600000: 'Hai triệu sáu trăm nghìn đồng',
      2800000: 'Hai triệu tám trăm nghìn đồng',
      3000000: 'Ba triệu đồng',
      3200000: 'Ba triệu hai trăm nghìn đồng',
      3500000: 'Ba triệu năm trăm nghìn đồng',
      3800000: 'Ba triệu tám trăm nghìn đồng',
      4000000: 'Bốn triệu đồng',
      4200000: 'Bốn triệu hai trăm nghìn đồng',
      4500000: 'Bốn triệu năm trăm nghìn đồng',
      5000000: 'Năm triệu đồng',
      6000000: 'Sáu triệu đồng',
      7000000: 'Bảy triệu đồng',
      8000000: 'Tám triệu đồng',
      9000000: 'Chín triệu đồng',
      10000000: 'Mười triệu đồng'
    };
    if (defaultMap[amount]) return defaultMap[amount];
    return Number(amount).toLocaleString('vi-VN') + ' đồng';
  }

  printContract(): void {
    window.print();
  }

  exportToWordDoc(): void {
    const doc = this.legalDocData();
    const content = document.getElementById('printableContractTenant')?.innerHTML;
    if (!content) {
      this.toastService.show('Không tìm thấy nội dung hợp đồng.', 'error');
      return;
    }
    const tenantName = doc?.tenantFullName || 'KhachThue';
    const roomNumber = doc?.roomNumber || 'Phong';
    const fileName = `HopDongThue_${roomNumber}_${tenantName.replace(/\s+/g, '_')}.doc`;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hợp Đồng Thuê Phòng Trọ</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          h2, h3, h4, h5 { text-align: center; margin: 6px 0; }
          p { margin: 4px 0; }
          .text-center { text-align: center; }
          .fw-bold { font-weight: bold; }
          .italic { font-style: italic; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = url;
    link.download = fileName;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.toastService.show(`Đã xuất file Word hợp đồng cho ${tenantName}!`, 'success');
  }
}
