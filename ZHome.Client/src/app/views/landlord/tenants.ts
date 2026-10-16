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
    <div class="tenants-container animate-fade-in">
      
      <!-- HEADER ROW -->
      <div class="header-action-row mb-4">
        <div>
          <div class="header-badge-tag mb-1">
            <span class="pulse-indicator-dot"></span>
            <span>QUẢN LÝ CƯ TRÚ & KHÁCH THUÊ</span>
          </div>
          <h1 class="page-main-title m-0">Danh Sách Khách Thuê & Ghép Trọ</h1>
          <p class="text-sm text-muted m-0 mt-1">Quản lý hồ sơ cư dân, hợp đồng thuê phòng và kết nối tìm bạn ở ghép theo từng khu trọ</p>
        </div>

        <div class="header-buttons-group d-flex gap-2 align-items-center flex-wrap">
          <button (click)="refreshAll()" class="btn-action-light" title="Làm mới dữ liệu">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Làm mới</span>
          </button>
          
          <button type="button" class="btn-roommate-quick-add" (click)="openCreateRoommateModal()">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <span>+ Đăng Tin Ghép Trọ</span>
          </button>

          <a routerLink="/landlord/contracts" class="btn-primary-add">
            <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>Quản Lý Hợp Đồng</span>
          </a>
        </div>
      </div>

      <!-- MAIN NAVIGATION TABS (MODERN SEGMENTED PILL) -->
      <div class="tenants-tabs-wrapper mb-4">
        <div class="tenants-nav-tabs">
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
            <span>Tìm Bạn Ở Ghép (Ghép Trọ)</span>
            <span class="tab-count-pill pill-roommate-badge">Mới</span>
          </button>

          <a 
            routerLink="/landlord/appointments" 
            class="tenant-tab-btn tab-appointment-link">
            <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Lịch Hẹn Xem Phòng</span>
            <span class="tab-count-pill pill-appointment-badge">Khách hẹn</span>
          </a>
        </div>
      </div>

      <!-- TAB 1: KHÁCH THUÊ THEO PHÒNG -->
      @if (activeTab() === 'all-tenants') {
        
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
                <svg class="search-icon-inside" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
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
            <div class="spinner-custom"></div>
            <p class="text-sm text-muted mt-3 font-semibold">Đang tải thông tin khách thuê cư trú...</p>
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
            <p class="text-muted text-sm max-w-400 mx-auto mb-4">Không có hồ sơ cư trú nào khớp với điều kiện tìm kiếm của bạn.</p>
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
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div>
                      <h2 class="property-group-title m-0">{{ prop.propertyTitle }}</h2>
                      <span class="property-group-address text-xs text-muted d-flex align-items-center gap-1 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
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
                      <span>{{ isPropertyCollapsed(prop.propertyId) ? 'Mở rộng' : 'Thu gọn' }}</span>
                      <span class="collapse-arrow" [class.rotated]="isPropertyCollapsed(prop.propertyId)">▲</span>
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
                              {{ roomGroup.tenants.length }} khách đang ở
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
                                    <div class="d-flex align-items-center gap-2">
                                      <strong class="tenant-name font-md text-dark">{{ tenant.tenantFullName }}</strong>
                                      @if (tenant.status === 'Active') {
                                        <span class="tenant-dot-active" title="Hợp đồng đang hiệu lực"></span>
                                      }
                                    </div>
                                    <span class="status-badge-chip" [ngClass]="getStatusBadgeClass(tenant)">
                                      {{ getStatusText(tenant) }}
                                    </span>
                                  </div>

                                  <div class="tenant-meta-details-grid">
                                    <!-- SĐT -->
                                    <div class="meta-item">
                                      <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                      <a [href]="'tel:' + tenant.tenantPhone" (click)="$event.stopPropagation()" class="meta-link-phone">
                                        {{ tenant.tenantPhone }}
                                      </a>
                                    </div>

                                    <!-- CCCD -->
                                    <div class="meta-item">
                                      <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/></svg>
                                      <span class="meta-text">{{ tenant.tenantCccd || 'Chưa cập nhật CCCD' }}</span>
                                    </div>

                                    <!-- Thời gian thuê -->
                                    <div class="meta-item col-span-2">
                                      <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                      <span class="meta-text text-xs">
                                        Từ {{ tenant.startDate | date:'dd/MM/yyyy' }} → Đến {{ tenant.endDate | date:'dd/MM/yyyy' }}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="tenant-row-actions" (click)="$event.stopPropagation()">
                                  <button type="button" class="btn-row-action btn-doc-action" title="Xem & Xuất Hợp Đồng (.doc / In)" (click)="openLegalDocForTenant(tenant)">
                                    <svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <path d="M14 2v6h6"/>
                                      <line x1="16" y1="13" x2="8" y2="13"/>
                                      <line x1="16" y1="17" x2="8" y2="17"/>
                                      <line x1="10" y1="9" x2="8" y2="9"/>
                                    </svg>
                                  </button>
                                  <button type="button" class="btn-row-action" title="Xem chi tiết hồ sơ" (click)="openTenantDetails(tenant)">
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

      } @else {

        <!-- TAB 2: TÌM BẠN Ở GHÉP (GHÉP TRỌ) -->
        <div class="roommate-tab-container animate-fade-in">
          
          <!-- Hero Banner -->
          <div class="roommate-hero-card mb-4">
            <div class="hero-left-content">
              <div class="hero-tag mb-2">
                <span class="hero-tag-icon">✨</span>
                <span>TÍNH NĂNG ĐỘC QUYỀN ZHOME</span>
              </div>
              <h2 class="hero-title m-0 mb-2">Sàn Tìm Bạn Ở Ghép & Lấp Đầy Phòng Trống</h2>
              <p class="hero-desc m-0 mb-3">
                Đăng tin tìm bạn cùng phòng để lấp đầy các giường/chỗ trống trong khu trọ của bạn, hoặc hỗ trợ khách thuê hiện tại tìm bạn chia sẻ tiền phòng nhanh chóng, an toàn.
              </p>
              
              <div class="d-flex gap-3 align-items-center flex-wrap">
                <button type="button" class="btn-hero-primary" (click)="openCreateRoommateModal()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  <span>+ Đăng Tin Tìm Bạn Ở Ghép Ngay</span>
                </button>
                <a routerLink="/tenant/match" class="btn-hero-secondary">
                  <span>Khám phá Sàn Ghép Trọ Công Khai &rarr;</span>
                </a>
              </div>
            </div>

            <div class="hero-right-illustration">
              <div class="illustration-badge-box">
                <div class="illus-icon">🤝</div>
                <div class="illus-text font-bold">Cộng Đồng Văn Minh</div>
                <div class="illus-sub">Kết nối sinh viên & người đi làm</div>
              </div>
            </div>
          </div>

          <!-- Rooms available for roommate matching -->
          <div class="roommate-rooms-section">
            <div class="section-header-row mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h3 class="font-bold text-lg m-0 text-dark">Danh Sách Phòng Trong Khu Trọ Của Bạn</h3>
                <p class="text-xs text-muted m-0 mt-0.5">Chọn phòng cần đăng tin ghép trọ để đưa lên Sàn Ghép Trọ sinh viên</p>
              </div>
              <span class="badge-total-rooms">Tổng: {{ allRooms().length }} phòng trọ</span>
            </div>

            @if (allRooms().length === 0) {
              <div class="empty-state-box text-center py-5">
                <p class="text-muted text-sm m-0">Chưa có phòng trọ nào. Hãy tạo phòng trọ trước khi đăng tin ghép trọ.</p>
              </div>
            } @else {
              <div class="roommate-grid">
                @for (room of allRooms(); track room.id) {
                  <div class="roommate-room-card">
                    <div class="r-card-top">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="r-room-badge">Phòng {{ room.roomNumber }}</span>
                        <span class="r-status-badge" [class.status-avail]="room.status === 'Available'">
                          {{ room.status === 'Available' ? 'Phòng trống' : 'Đang thuê' }}
                        </span>
                      </div>
                      <h4 class="r-prop-title m-0">{{ room.propertyTitle }}</h4>
                    </div>

                    <div class="r-card-body">
                      <div class="r-metric-row">
                        <span class="r-metric-label">Giá nguyên phòng:</span>
                        <strong class="r-metric-val">{{ (room.price || 0) | number:'1.0-0' }} đ/tháng</strong>
                      </div>
                      <div class="r-metric-row">
                        <span class="r-metric-label">Ước tính khi ghép 2 người:</span>
                        <strong class="r-metric-val text-primary">{{ ((room.price || 0) / 2) | number:'1.0-0' }} đ/người</strong>
                      </div>
                      <div class="r-metric-row">
                        <span class="r-metric-label">Diện tích phòng:</span>
                        <span class="font-semibold text-dark">{{ room.area || 20 }} m²</span>
                      </div>
                    </div>

                    <div class="r-card-footer">
                      <button type="button" class="btn-card-match" (click)="openCreateRoommateModal()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        <span>Đăng Tin Ghép Cho Phòng Này</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

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
                <div class="spinner-custom mb-2"></div>
                <p class="text-muted font-semibold">Đang tải văn bản hợp đồng pháp lý...</p>
              </div>
            } @else if (legalDocData(); as doc) {
              
              <!-- Legal Paper Body -->
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
                  <p class="legal-text-p">Nơi đăng ký HK thường trú: <strong>{{ doc.propertyAddress || 'Đăng ký theo CCCD / Thường trú hợp pháp' }}</strong></p>
                  <p class="legal-text-p">CMND/CCCD số: <strong>{{ doc.landlordCccd || 'Chưa cập nhật' }}</strong></p>
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

    .animate-fade-in {
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }

    .pulse-indicator-dot {
      width: 7px;
      height: 7px;
      background: #2563eb;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
    }

    .header-action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-main-title {
      font-size: 1.65rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .btn-action-light {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      color: #334155;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 16px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .btn-action-light:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }

    .btn-roommate-quick-add {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      transition: all 0.2s ease;
    }

    .btn-roommate-quick-add:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
    }

    .btn-primary-add {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }

    .btn-primary-add:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
      color: #ffffff;
    }

    .btn-icon-svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* MODERN SEGMENTED TABS */
    .tenants-tabs-wrapper {
      display: flex;
    }

    .tenants-nav-tabs {
      display: inline-flex;
      background: #f1f5f9;
      border: 1.5px solid #e2e8f0;
      padding: 4px;
      border-radius: 14px;
      gap: 4px;
    }

    .tenant-tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tenant-tab-btn:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }

    .tenant-tab-btn.active {
      background: #ffffff;
      color: #2563eb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .tab-svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      stroke: currentColor;
    }

    .tab-count-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 20px;
      background: #e2e8f0;
      color: #475569;
    }

    .tenant-tab-btn.active .tab-count-pill {
      background: #eff6ff;
      color: #2563eb;
    }

    .tab-roommate-highlight.active {
      color: #7c3aed;
    }

    .tab-roommate-highlight.active .tab-count-pill {
      background: #f5f3ff;
      color: #7c3aed;
    }

    .pill-roommate-badge {
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.68rem;
    }

    /* KPI STATS CARDS */
    .stats-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
      border-color: #cbd5e1;
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
      font-size: 0.74rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-value {
      font-size: 1.45rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 2px;
    }

    /* FILTERS CARD */
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
      font-size: 0.76rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .filter-select {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
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

    .search-icon-inside {
      position: absolute;
      left: 12px;
      width: 16px;
      height: 16px;
      stroke: #94a3b8;
      pointer-events: none;
    }

    .filter-search-input {
      width: 100%;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 9px 34px 9px 36px;
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

    /* PROPERTY GROUP CARD */
    .property-group-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
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
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.12);
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
      font-size: 0.78rem;
      color: #475569;
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 600;
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
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .collapse-arrow {
      font-size: 0.7rem;
      transition: transform 0.2s ease;
    }

    .collapse-arrow.rotated {
      transform: rotate(180deg);
    }

    /* ROOMS & TENANTS GRID */
    .rooms-tenants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .room-tenant-item-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .room-tenant-item-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
    }

    .room-card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .room-badge-pill {
      background: #0f172a;
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .occupants-badge {
      background: #f1f5f9;
      color: #64748b;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.74rem;
    }

    .occupants-badge.badge-active {
      background: #dcfce7;
      color: #15803d;
    }

    /* TENANT INFO ROW */
    .tenant-info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tenant-info-row:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
      transform: translateY(-1px);
    }

    .tenant-avatar-circle {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      color: #475569;
      font-weight: 800;
      font-size: 1rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }

    .tenant-avatar-circle.avatar-active {
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
    }

    .tenant-dot-active {
      width: 8px;
      height: 8px;
      background: #16a34a;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
    }

    .tenant-name {
      font-size: 0.96rem;
      font-weight: 800;
    }

    .tenant-meta-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 10px;
      margin-top: 4px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #475569;
    }

    .meta-svg {
      width: 14px;
      height: 14px;
      stroke: #64748b;
      flex-shrink: 0;
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
      padding: 3px 8px;
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
      gap: 6px;
    }

    .btn-row-action {
      width: 32px;
      height: 32px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .btn-row-action:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      transform: scale(1.05);
    }

    .btn-doc-action:hover {
      background: #0284c7;
      border-color: #0284c7;
      color: #ffffff;
    }

    .btn-call {
      color: #059669;
    }

    .btn-call:hover {
      background: #059669;
      border-color: #059669;
      color: #ffffff;
    }

    .action-svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
    }

    /* ROOMMATE MATCH TAB STYLES */
    .roommate-hero-card {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
      border-radius: 18px;
      padding: 28px 32px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      box-shadow: 0 8px 24px rgba(49, 46, 129, 0.28);
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }

    .hero-title {
      font-size: 1.6rem;
      font-weight: 900;
      line-height: 1.25;
      color: #ffffff;
    }

    .hero-desc {
      font-size: 0.92rem;
      color: #c7d2fe;
      max-width: 640px;
      line-height: 1.5;
    }

    .btn-hero-primary {
      background: #ffffff;
      color: #4338ca;
      font-size: 0.88rem;
      font-weight: 800;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }

    .btn-hero-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    }

    .btn-hero-secondary {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .hero-right-illustration {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .illustration-badge-box {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 18px 24px;
      border-radius: 16px;
      text-align: center;
    }

    .illus-icon {
      font-size: 2.2rem;
      margin-bottom: 4px;
    }

    .illus-text {
      font-size: 0.95rem;
      color: #ffffff;
    }

    .illus-sub {
      font-size: 0.74rem;
      color: #c7d2fe;
    }

    @media (max-width: 900px) {
      .roommate-hero-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-right-illustration {
        display: none;
      }
    }

    .badge-total-rooms {
      background: #eff6ff;
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .roommate-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .roommate-room-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .roommate-room-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    }

    .r-room-badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .r-status-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
    }

    .r-status-badge.status-avail {
      background: #ecfdf5;
      color: #059669;
    }

    .r-prop-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin-top: 8px;
    }

    .r-card-body {
      margin: 14px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .r-metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }

    .r-metric-label {
      color: #64748b;
    }

    .r-metric-val {
      font-weight: 800;
    }

    .btn-card-match {
      width: 100%;
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.85rem;
      font-weight: 800;
      padding: 9px 16px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-card-match:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    /* MODAL STYLES */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 24px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
    }

    .max-w-600 { max-width: 600px; }
    .max-w-850 { max-width: 850px; }

    .animate-slide-up {
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #f1f5f9;
    }

    .tenant-modal-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
      color: #1d4ed8;
      font-size: 1.25rem;
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
      font-size: 1.6rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 8px;
    }

    .modal-close-x:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .detail-section-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
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
      gap: 10px 14px;
    }

    .info-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .field-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .field-value {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-cancel-custom {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      color: #475569;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 10px;
      cursor: pointer;
    }

    .btn-call-direct {
      background: #16a34a;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 20px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
    }

    .btn-call-direct:hover {
      background: #15803d;
      color: #ffffff;
    }

    .btn-submit-custom {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 9px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
    }

    /* LEGAL CONTRACT PAPER (PRINT FRIENDLY) */
    .legal-contract-paper {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 36px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      font-family: 'Times New Roman', Times, serif;
      color: #111827;
      line-height: 1.6;
    }

    .country-title {
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: 0.02em;
    }

    .country-motto {
      font-size: 1rem;
      font-weight: 700;
    }

    .motto-divider {
      color: #475569;
      font-weight: bold;
    }

    .contract-doc-title {
      font-size: 1.45rem;
      font-weight: 900;
      color: #0f172a;
    }

    .legal-basis {
      font-size: 0.95rem;
    }

    .legal-party-head {
      margin-bottom: 4px;
      font-size: 1rem;
    }

    .legal-text-p {
      margin: 4px 0;
      font-size: 0.98rem;
    }

    .legal-clause-heading {
      font-size: 1rem;
      font-weight: 800;
      margin: 12px 0 6px 0;
      text-transform: uppercase;
    }

    .legal-clause-p {
      margin: 6px 0;
      font-size: 0.98rem;
      text-align: justify;
    }

    .legal-clause-list {
      margin: 4px 0 8px 24px;
      padding: 0;
    }

    .legal-clause-list li {
      margin-bottom: 4px;
      font-size: 0.95rem;
      text-align: justify;
    }

    .legal-signatures-row {
      display: flex;
      justify-content: space-around;
      margin-top: 36px;
    }

    .sig-col {
      min-width: 200px;
    }

    .sig-blank-space {
      height: 70px;
    }

    .spinner-custom {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tab-appointment-link {
      text-decoration: none;
      color: #334155;
    }
    .tab-appointment-link:hover {
      background: #eff6ff;
      color: #2563eb;
    }
    .pill-appointment-badge {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 700;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      .legal-contract-paper {
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
