import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { ContractService } from '../../services/contract.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landlord-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rooms-page-wrapper animate-fade-in">

      <!-- 1. TOP PROPERTY SELECTOR BAR -->
      <div class="top-nav-bar mb-3">
        <div class="property-select-wrapper">
          <select 
            [ngModel]="selectedPropertyIdFilter()" 
            (ngModelChange)="selectedPropertyIdFilter.set(+$event); onPropertyFilterChange()" 
            class="property-top-select">
            <option [value]="0">Tất cả nhà trọ</option>
            @for (p of propertyList(); track p.id) {
              <option [value]="p.id">{{ p.title }}</option>
            }
          </select>
        </div>
      </div>

      <!-- 2. PAGE HEADER ROW -->
      <div class="page-header-row mb-4">
        <div>
          <h1 class="page-title m-0">Quản lý phòng</h1>
        </div>
        <div>
          <button type="button" (click)="openAddRoomModal()" class="btn-create-room">
            <span class="plus-icon">+</span> Thêm phòng mới
          </button>
        </div>
      </div>

      <!-- 3. SEARCH & SORT TOOLBAR -->
      <div class="search-filter-toolbar mb-4">
        <!-- Search Room Input -->
        <div class="search-input-box">
          <span class="search-icon"></span>
          <input 
            type="text" 
            [ngModel]="searchRoomNumber()" 
            (ngModelChange)="searchRoomNumber.set($event)" 
            placeholder="Tìm kiếm tên phòng..." 
            class="search-input-field" />
        </div>

        <!-- Sort Dropdown -->
        <div class="sort-select-box">
          <span class="sort-icon">⇅</span>
          <select 
            [ngModel]="selectedSort()" 
            (ngModelChange)="selectedSort.set($event)" 
            class="sort-select-field">
            <option value="default">Sắp xếp: Ưu tiên phòng trống & hoạt động</option>
            <option value="room-asc">Số phòng tăng dần</option>
            <option value="room-desc">Số phòng giảm dần</option>
            <option value="price-asc">Giá thuê tăng dần</option>
            <option value="price-desc">Giá thuê giảm dần</option>
          </select>
        </div>

        <!-- Filter & Refresh Buttons -->
        <div class="d-flex gap-2">
          <button type="button" class="btn-filter-dark" (click)="fetchRoomsList()">Lọc</button>
          <button type="button" class="btn-refresh-sync" (click)="refreshAll()" title="Làm mới danh sách"></button>
        </div>
      </div>

      <!-- 4. STATUS PILLS ROW -->
      <div class="status-pills-row mb-4">
        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'All'"
          (click)="selectedStatusFilter.set('All')">
          <span>Tất cả</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'All'">{{ totalRoomsCount() }}</span>
        </button>

        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'Rented'"
          (click)="selectedStatusFilter.set('Rented')">
          <span>Đang thuê</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'Rented'">{{ rentedRoomsCount() }}</span>
        </button>

        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'Available'"
          (click)="selectedStatusFilter.set('Available')">
          <span>Đang trống</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'Available'">{{ availableRoomsCount() }}</span>
        </button>

        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'Debt'"
          (click)="selectedStatusFilter.set('Debt')">
          <span>Đang nợ</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'Debt'">0</span>
        </button>

        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'Expiring'"
          (click)="selectedStatusFilter.set('Expiring')">
          <span>Sắp hết hạn</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'Expiring'">0</span>
        </button>

        <button 
          type="button" 
          class="status-pill-btn" 
          [class.active]="selectedStatusFilter() === 'Overdue'"
          (click)="selectedStatusFilter.set('Overdue')">
          <span>Đã quá hạn</span>
          <span class="pill-counter" [class.active-counter]="selectedStatusFilter() === 'Overdue'">0</span>
        </button>
      </div>

      <!-- 5. PROPERTIES ACCORDION & ROOMS CARDS (3 ROOMS PER ROW) -->
      @if (isLoadingList()) {
        <div class="loading-state-card text-center py-5">
          <div class="spinner"></div>
          <p class="text-muted mt-2">Đang tải danh sách phòng trọ...</p>
        </div>
      } @else if (displayedProperties().length === 0) {
        <div class="empty-state-card text-center py-5">
          <span class="empty-icon"></span>
          <h3 class="mt-2 font-bold text-dark">Không tìm thấy phòng trọ nào</h3>
          <p class="text-muted">Thử thay đổi bộ lọc hoặc thêm phòng trọ mới vào hệ thống</p>
          <button (click)="openAddRoomModal()" class="btn-create-room mt-3">+ Thêm phòng ngay</button>
        </div>
      } @else {
        <div class="properties-accordion-stack">
          @for (prop of displayedProperties(); track prop.id) {
            <div class="property-accordion-card">
              
              <!-- Property Header Banner -->
              <div class="prop-accordion-header" (click)="togglePropertyCollapse(prop.id)">
                <div class="prop-header-info">
                  <img [src]="getImageUrl(prop.imageUrl)" alt="Ảnh trọ" class="prop-avatar-thumb" />
                  <div>
                    <h2 class="prop-title-text m-0">{{ prop.title }}</h2>
                    <p class="prop-address-text m-0">{{ prop.address }}</p>
                  </div>
                </div>

                <div class="prop-header-toggle">
                  <span class="chevron-arrow" [class.collapsed]="isPropertyCollapsed(prop.id)">▲</span>
                </div>
              </div>

              <!-- Rooms Grid Section (3 Rooms Per Row) -->
              @if (!isPropertyCollapsed(prop.id)) {
                <div class="prop-rooms-body">
                  @if (prop.matchedRooms.length === 0) {
                    <div class="empty-rooms-in-prop text-center py-4">
                      <p class="text-muted m-0">Không có phòng nào phù hợp với bộ lọc trong khu trọ này.</p>
                      <button (click)="openAddRoomModalWithProp(prop.id)" class="btn-link-add mt-2">+ Thêm phòng cho khu trọ này</button>
                    </div>
                  } @else {
                    <div class="rooms-grid">
                      @for (room of prop.matchedRooms; track room.id) {
                        <div class="room-item-card">
                          
                          <!-- Top Row: Room Number & 3 Badges -->
                          <div class="room-top-row">
                            <strong class="room-num-text">{{ room.roomNumber }}</strong>
                            <div class="room-badges-cluster">
                              <span class="badge-pill-gray">{{ room.area }} m²</span>
                              <span class="badge-pill-pink">0/{{ room.bedsCount || 1 }}</span>
                              <span class="badge-pill-pink">{{ (room.activeTenantsCount != null ? room.activeTenantsCount : (room.activeContracts?.length || (room.status === 'Rented' ? 1 : 0))) }}/{{ room.maxOccupants || 2 }}</span>
                            </div>
                          </div>

                          <!-- Price & Status Row -->
                          <div class="room-price-status-block">
                            <span class="price-title-label">Giá thuê:</span>
                            <div class="price-val-row">
                              <!-- Status Tag -->
                              @if (room.status === 'Available') {
                                <span class="room-status-badge-available">
                                  <span class="status-pulse-dot"></span>
                                  CÒN TRỐNG
                                </span>
                              } @else if (room.status === 'Rented') {
                                <span class="room-status-badge-blue">ĐANG THUÊ</span>
                              } @else {
                                <span class="room-status-badge-orange">BẢO TRÌ</span>
                              }

                              <!-- Price Value -->
                              <strong class="room-price-val">{{ room.price | number:'1.0-0' }} đ</strong>
                            </div>
                          </div>

                          <!-- Two Link Buttons (Contracts & Tenants) -->
                          <!-- Two Link Buttons (Contracts & Tenants) -->
                          <div class="room-counter-buttons-grid">
                            <button type="button" class="btn-sub-counter" (click)="openContractModal(room.id)">
                              <span class="btn-icon"></span> Hợp đồng ({{ room.activeTenantsCount != null ? room.activeTenantsCount : (room.activeContracts?.length || (room.status === 'Rented' ? 1 : 0)) }})
                            </button>
                            <button type="button" class="btn-sub-counter" (click)="openContractModal(room.id)">
                              <span class="btn-icon"></span> Khách thuê ({{ room.activeTenantsCount != null ? room.activeTenantsCount : (room.activeContracts?.length || (room.status === 'Rented' ? 1 : 0)) }})
                            </button>
                          </div>

                          <!-- Bottom Actions: Primary Button + 3 Dots Menu Button -->
                          <div class="room-card-actions-bar">
                            @if (room.status === 'Available') {
                              <button type="button" class="btn-main-room-action" (click)="openCheckInModal(room)">
                                Lập hợp đồng
                              </button>
                            } @else if (room.status === 'Rented') {
                              <button type="button" class="btn-main-room-action" (click)="openContractModal(room.id)">
                                Xem hợp đồng
                              </button>
                            } @else {
                              <button type="button" class="btn-main-room-action" (click)="openRoomDetailModal(room.id)">
                                Chi tiết phòng
                              </button>
                            }

                            <!-- 3 Dots Options Button -->
                            <div class="room-more-menu-wrapper" (click)="$event.stopPropagation()">
                              <button type="button" class="btn-more-options" (click)="toggleRoomMenu(room.id)">⋮</button>
                              @if (activeRoomMenu() === room.id) {
                                <div class="room-dropdown-menu">
                                  <button type="button" class="dropdown-item-opt" (click)="openRoomDetailModal(room.id); closeRoomMenu()">
                                    Xem chi tiết
                                  </button>
                                  <button type="button" class="dropdown-item-opt" (click)="openEditRoomModal(room); closeRoomMenu()">
                                    Sửa phòng
                                  </button>
                                  @if (room.status === 'Available') {
                                    <button type="button" class="dropdown-item-opt" (click)="openCheckInModal(room); closeRoomMenu()">
                                      Lập hợp đồng / Check-in
                                    </button>
                                  } @else {
                                    <button type="button" class="dropdown-item-opt" (click)="openContractModal(room.id); closeRoomMenu()">
                                      Xem hợp đồng
                                    </button>
                                  }
                                  <button type="button" class="dropdown-item-opt text-danger" (click)="deleteRoom(room); closeRoomMenu()">
                                    Xóa phòng
                                  </button>
                                </div>
                              }
                            </div>
                          </div>

                        </div>
                      }
                    </div>
                  }
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- ================= MODALS ================= -->

      <!-- 1. ADD ROOM MODAL (REDESIGNED MATCHING USER SCREENSHOT) -->
      @if (showAddRoomModal()) {
        <div class="modal-backdrop" (click)="showAddRoomModal.set(false)">
          <div class="modal-card max-w-680" (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0">THÊM PHÒNG</h2>
              <button type="button" (click)="showAddRoomModal.set(false)" class="modal-close-x">&times;</button>
            </div>

            <form (ngSubmit)="submitAddRoom()" class="modal-form-body">
              
              <!-- Section: Thông tin cơ bản -->
              <div class="form-sub-header mb-4">
                <h3 class="section-title-bold m-0">Thông tin cơ bản</h3>
                <p class="section-subtitle-muted m-0">Các thông tin cơ bản của phòng trọ</p>
              </div>

              <!-- 1. Nhà trọ * -->
              <div class="form-group mb-3">
                <label class="form-label-custom">Nhà trọ <span class="text-danger">*</span></label>
                <select [(ngModel)]="newRoomData.propertyId" name="propertyId" required class="form-control-custom">
                  <option [value]="0">Chọn nhà trọ</option>
                  @for (p of propertyList(); track p.id) {
                    <option [value]="p.id">{{ p.title }}</option>
                  }
                </select>
              </div>

              <!-- 2. Tên phòng * -->
              <div class="form-group mb-3">
                <label class="form-label-custom">Tên phòng <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="newRoomData.roomNumber" 
                  name="roomNumber" 
                  required 
                  placeholder="Nhập tên phòng" 
                  class="form-control-custom" />
              </div>

              <!-- 3. Giá thuê * & Giá cọc (2 columns) -->
              <div class="row-2-cols mb-3">
                <div class="form-group">
                  <label class="form-label-custom">Giá thuê <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newRoomData.price" 
                    name="price" 
                    required 
                    placeholder="Nhập giá thuê" 
                    class="form-control-custom" />
                </div>
                <div class="form-group">
                  <label class="form-label-custom">Giá cọc</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newRoomData.deposit" 
                    name="deposit" 
                    placeholder="Giá cọc" 
                    class="form-control-custom" />
                </div>
              </div>

              <!-- 4. Diện tích *, Số người ở tối đa *, Số giường (3 columns) -->
              <div class="row-3-cols mb-3">
                <div class="form-group">
                  <label class="form-label-custom">Diện tích <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    step="0.1" 
                    [(ngModel)]="newRoomData.area" 
                    name="area" 
                    required 
                    placeholder="Nhập diện tích" 
                    class="form-control-custom" />
                </div>
                <div class="form-group">
                  <label class="form-label-custom">Số người ở tối đa <span class="text-danger">*</span></label>
                  <input 
                    type="number" 
                    [(ngModel)]="newRoomData.maxOccupants" 
                    name="maxOccupants" 
                    required 
                    placeholder="Nhập số người ở tối đa" 
                    class="form-control-custom" />
                </div>
                <div class="form-group">
                  <label class="form-label-custom">Số giường</label>
                  <input 
                    type="number" 
                    [(ngModel)]="newRoomData.bedsCount" 
                    name="bedsCount" 
                    placeholder="1" 
                    class="form-control-custom" />
                </div>
              </div>

              <!-- 6. Chu kỳ thu tiền * -->
              <div class="form-group mb-4">
                <label class="form-label-custom">Chu kỳ thu tiền <span class="text-danger">*</span></label>
                <select [(ngModel)]="newRoomData.paymentCycle" name="paymentCycle" required class="form-control-custom">
                  <option value="1 tháng">1 tháng</option>
                  <option value="2 tháng">2 tháng</option>
                  <option value="3 tháng">3 tháng</option>
                  <option value="6 tháng">6 tháng</option>
                  <option value="12 tháng">12 tháng</option>
                </select>
              </div>

              <!-- Modal Actions Toolbar -->
              <div class="modal-actions-footer">
                <button type="button" (click)="showAddRoomModal.set(false)" class="btn-cancel-custom">Hủy</button>
                <button type="submit" class="btn-submit-custom">Thêm phòng</button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- 2. CHECK-IN / LẬP HỢP ĐỒNG MODAL -->
      @if (showCheckInModal()) {
        <div class="modal-backdrop" (click)="showCheckInModal.set(null)">
          <div class="modal-card max-w-680" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0">LẬP HỢP ĐỒNG MỚI</h2>
              <button (click)="showCheckInModal.set(null)" class="modal-close-x">&times;</button>
            </div>

            <form (ngSubmit)="submitCheckIn()" class="modal-form-body mt-3">
              
              <!-- 1. THÔNG TIN CHÍNH -->
              <div class="form-section-group mb-4">
                <h3 class="section-title-bold mb-3">Thông tin chính</h3>
                
                <!-- Row 1: Nhà trọ & Phòng -->
                <div class="row-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label-custom">Nhà trọ <span class="text-danger">*</span></label>
                    <select [ngModel]="checkInModel.propertyId" (ngModelChange)="onPropertyChangeInModal($event)" name="contractProperty" required class="form-control-custom">
                      @for (p of propertyList(); track p.id) {
                        <option [value]="p.id">{{ p.title }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label-custom">Phòng <span class="text-danger">*</span></label>
                    <select [ngModel]="checkInModel.roomId" (ngModelChange)="onRoomChangeInModal($event)" name="contractRoom" required class="form-control-custom">
                      @for (r of getModalRooms(); track r.id) {
                        <option [value]="r.id">{{ r.roomNumber }} ({{ formatMoney(r.price) }})</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Row 2: Ngày bắt đầu & Ngày hết hợp đồng -->
                <div class="row-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label-custom">Ngày bắt đầu <span class="text-danger">*</span></label>
                    <input type="date" [(ngModel)]="checkInModel.startDate" name="startDate" required class="form-control-custom" />
                  </div>
                  <div class="form-group">
                    <label class="form-label-custom">Ngày hết hợp đồng <span class="text-danger">*</span></label>
                    <input type="date" [(ngModel)]="checkInModel.endDate" name="endDate" required class="form-control-custom" />
                  </div>
                </div>

                <!-- Row 3: Giá thuê & Giá cọc -->
                <div class="row-2-cols mb-3">
                  <div class="form-group">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <label class="form-label-custom m-0">Giá thuê <span class="text-danger">*</span></label>
                      <span class="currency-tag">{{ formatMoney(checkInModel.roomPrice) }}</span>
                    </div>
                    <div class="input-money-wrapper">
                      <input type="number" [(ngModel)]="checkInModel.roomPrice" name="roomPrice" required class="form-control-custom" placeholder="Ví dụ: 1300000" />
                      <span class="input-money-suffix">VNĐ</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <label class="form-label-custom m-0">Giá cọc <span class="text-danger">*</span></label>
                      <span class="currency-tag">{{ formatMoney(checkInModel.depositAmount) }}</span>
                    </div>
                    <div class="input-money-wrapper">
                      <input type="number" [(ngModel)]="checkInModel.depositAmount" name="depositAmount" class="form-control-custom" placeholder="Ví dụ: 1300000" />
                      <span class="input-money-suffix">VNĐ</span>
                    </div>
                  </div>
                </div>

                <!-- Row 4: Số giường & Chu kỳ thanh toán -->
                <div class="row-2-cols mb-1">
                  <div class="form-group">
                    <label class="form-label-custom">Số giường</label>
                    <input type="number" [(ngModel)]="checkInModel.bedsCount" name="bedsCount" min="1" class="form-control-custom" placeholder="1" />
                  </div>
                  <div class="form-group">
                    <label class="form-label-custom">Chu kỳ thanh toán <span class="text-danger">*</span></label>
                    <select [(ngModel)]="checkInModel.paymentCycle" name="paymentCycle" class="form-control-custom">
                      <option value="1 tháng">1 tháng</option>
                      <option value="2 tháng">2 tháng</option>
                      <option value="3 tháng">3 tháng</option>
                      <option value="6 tháng">6 tháng</option>
                      <option value="12 tháng">12 tháng</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 2. KHÁCH THUÊ -->
              <div class="form-section-group mb-4">
                <h3 class="section-title-bold mb-3">Khách thuê</h3>
                
                <div class="row-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label-custom">Họ và tên khách thuê <span class="text-danger">*</span></label>
                    <input type="text" [(ngModel)]="checkInModel.tenantFullName" name="tenantName" required class="form-control-custom" placeholder="Ví dụ: Nguyễn Văn A" />
                  </div>
                  <div class="form-group">
                    <label class="form-label-custom">Số điện thoại <span class="text-danger">*</span></label>
                    <input type="text" [(ngModel)]="checkInModel.tenantPhone" (input)="onTenantPhoneInput($event)" name="tenantPhone" required pattern="^0[35789]\\d{8}$" class="form-control-custom" placeholder="Ví dụ: 0912345678" />
                  </div>
                </div>

                <div class="form-group mb-2">
                  <label class="form-label-custom">Số CCCD / CMND</label>
                  <input type="text" [(ngModel)]="checkInModel.tenantIdCardNumber" name="tenantIdCard" class="form-control-custom" placeholder="Số CCCD 12 chữ số" />
                </div>
                
                <p class="text-danger-note text-xs m-0">
                  <span class="text-danger">*</span> Khách được chọn đầu tiên sẽ là người đại diện hợp đồng
                </p>
              </div>

              <!-- 3. DỊCH VỤ ĐIỆN & NƯỚC -->
              <div class="pricing-section-box p-3 rounded-lg mb-4">
                <h3 class="section-title-bold mb-3">Dịch vụ Điện & Nước</h3>

                <!-- Tiền điện -->
                <div class="form-group mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label-custom m-0">Đơn giá điện (đ/số, kWh) <span class="text-danger">*</span></label>
                    <span class="currency-tag currency-tag-elec">{{ formatMoney(checkInModel.electricityUnitPrice) }}/số</span>
                  </div>
                  <div class="input-money-wrapper">
                    <input type="number" [(ngModel)]="checkInModel.electricityUnitPrice" name="electricityUnitPrice" required class="form-control-custom" placeholder="Ví dụ: 3500" />
                    <span class="input-money-suffix">đ/số</span>
                  </div>
                </div>

                <!-- Tiền nước: 2 lựa chọn -->
                <div class="form-group mb-0">
                  <label class="form-label-custom mb-2">Tiền nước <span class="text-danger">*</span></label>
                  <div class="water-radio-group mb-3">
                    <label class="radio-card-option" [class.active]="checkInModel.waterPricingType === 'fixed'">
                      <input type="radio" [(ngModel)]="checkInModel.waterPricingType" name="waterPricingType" value="fixed" (change)="onWaterPricingTypeChange('fixed')" />
                      <span class="radio-label-text">Cố định theo người</span>
                    </label>
                    <label class="radio-card-option" [class.active]="checkInModel.waterPricingType === 'metered'">
                      <input type="radio" [(ngModel)]="checkInModel.waterPricingType" name="waterPricingType" value="metered" (change)="onWaterPricingTypeChange('metered')" />
                      <span class="radio-label-text">Tính theo khối (m³)</span>
                    </label>
                  </div>

                  @if (checkInModel.waterPricingType === 'fixed') {
                    <div class="form-group mb-0">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label-custom m-0">Đơn giá nước theo người (đ/người/tháng) <span class="text-danger">*</span></label>
                        <span class="currency-tag currency-tag-water">{{ formatMoney(checkInModel.waterUnitPrice) }}/người</span>
                      </div>
                      <div class="input-money-wrapper">
                        <input type="number" [(ngModel)]="checkInModel.waterUnitPrice" name="waterUnitPriceFixed" required class="form-control-custom" placeholder="Ví dụ: 100000" />
                        <span class="input-money-suffix">đ/người</span>
                      </div>
                    </div>
                  } @else {
                    <div class="form-group mb-0">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label-custom m-0">Đơn giá nước theo khối (đ/m³) <span class="text-danger">*</span></label>
                        <span class="currency-tag currency-tag-water">{{ formatMoney(checkInModel.waterUnitPrice) }}/khối</span>
                      </div>
                      <div class="input-money-wrapper">
                        <input type="number" [(ngModel)]="checkInModel.waterUnitPrice" name="waterUnitPriceMetered" required class="form-control-custom" placeholder="Ví dụ: 25000" />
                        <span class="input-money-suffix">đ/m³</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Modal Actions Footer -->
              <div class="modal-actions-footer">
                <button type="button" (click)="showCheckInModal.set(null)" class="btn-cancel-custom">Hủy</button>
                <button type="submit" class="btn-submit-custom">Lập hợp đồng & Bàn giao</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 3. EDIT ROOM MODAL -->
      @if (showEditRoomModal()) {
        <div class="modal-backdrop" (click)="showEditRoomModal.set(null)">
          <div class="modal-card max-w-520" (click)="$event.stopPropagation()">
            <button (click)="showEditRoomModal.set(null)" class="modal-close-x">&times;</button>
            <div class="modal-header-clean mb-3">
              <h2 class="modal-main-title m-0">CHỈNH SỬA PHÒNG {{ editRoomModel.roomNumber }}</h2>
            </div>

            <form (ngSubmit)="submitEditRoom()" class="modal-form-body">
              <div class="form-group mb-3">
                <label class="form-label-custom">Số phòng / Tên phòng <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="editRoomModel.roomNumber" name="editRoomNum" required class="form-control-custom" />
              </div>

              <div class="row-2-cols mb-3">
                <div class="form-group">
                  <label class="form-label-custom">Giá thuê (VND/tháng) <span class="text-danger">*</span></label>
                  <input type="number" [(ngModel)]="editRoomModel.price" name="editPrice" required class="form-control-custom" />
                </div>
                <div class="form-group">
                  <label class="form-label-custom">Diện tích (m²) <span class="text-danger">*</span></label>
                  <input type="number" step="0.1" [(ngModel)]="editRoomModel.area" name="editArea" required class="form-control-custom" />
                </div>
              </div>

              <div class="row-2-cols mb-4">
                <div class="form-group">
                  <label class="form-label-custom">Số người ở tối đa</label>
                  <input type="number" [(ngModel)]="editRoomModel.maxOccupants" name="editMaxOcc" required class="form-control-custom" />
                </div>
                <div class="form-group">
                  <label class="form-label-custom">Trạng thái phòng</label>
                  <select [(ngModel)]="editRoomModel.status" name="editStatus" class="form-control-custom" [disabled]="editRoomModel.status === 'Rented'">
                    <option value="Available">Trống</option>
                    <option value="Maintenance">Bảo trì</option>
                    @if (editRoomModel.status === 'Rented') {
                      <option value="Rented">Đang thuê</option>
                    }
                  </select>
                </div>
              </div>

              <div class="modal-actions-footer">
                <button type="button" (click)="showEditRoomModal.set(null)" class="btn-cancel-custom">Hủy</button>
                <button type="submit" class="btn-submit-custom">Lưu cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 4. ROOM DETAIL MODAL (XEM CHI TIẾT THÔNG TIN PHÒNG) -->
      @if (showRoomDetailModal(); as roomId) {
        <div class="modal-backdrop" (click)="closeRoomDetailModal()">
          <div class="modal-card max-w-680" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <div>
                <h2 class="modal-main-title m-0">CHI TIẾT PHÒNG {{ roomDetail()?.roomNumber }}</h2>
                <p class="text-muted text-sm m-0 mt-1">{{ roomDetail()?.propertyTitle }} • {{ roomDetail()?.propertyAddress }}</p>
              </div>
              <button (click)="closeRoomDetailModal()" class="modal-close-x">&times;</button>
            </div>

            @if (isLoadingDetail()) {
              <div class="text-center py-5">
                <div class="spinner mb-2"></div>
                <p class="text-muted">Đang tải thông tin chi tiết phòng...</p>
              </div>
            } @else if (roomDetail(); as room) {
              <div class="room-detail-body mt-3">
                
                <!-- Status & Price Banner Card -->
                <div class="detail-banner-card mb-4">
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span class="detail-label-muted">Trạng thái phòng:</span>
                      <div class="mt-1">
                        @if (room.status === 'Available') {
                          <span class="badge-status-pill badge-status-avail">Phòng trống (Sẵn sàng cho thuê)</span>
                        } @else if (room.status === 'Rented') {
                          <span class="badge-status-pill badge-status-rented">Đang cho thuê</span>
                        } @else {
                          <span class="badge-status-pill badge-status-maint">Đang bảo trì</span>
                        }
                      </div>
                    </div>
                    <div class="text-end">
                      <span class="detail-label-muted">Giá niêm yết:</span>
                      <div class="detail-main-price text-primary font-bold">{{ room.price | number:'1.0-0' }} đ<span class="text-xs text-muted">/tháng</span></div>
                    </div>
                  </div>
                </div>

                <!-- Room Key Specs (6 Items Grid) -->
                <h4 class="detail-group-title mb-3">Thông số phòng</h4>
                <div class="room-specs-detail-grid mb-4">
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Diện tích</div>
                      <strong class="spec-detail-val">{{ room.area || 20 }} m²</strong>
                    </div>
                  </div>
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Số người ở tối đa</div>
                      <strong class="spec-detail-val">{{ room.maxOccupants || 2 }} người</strong>
                    </div>
                  </div>
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Số giường ngủ</div>
                      <strong class="spec-detail-val">{{ room.bedsCount || 1 }} giường</strong>
                    </div>
                  </div>
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Tiền đặt cọc chuẩn</div>
                      <strong class="spec-detail-val">{{ (room.deposit || room.price) | number:'1.0-0' }} đ</strong>
                    </div>
                  </div>
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Chu kỳ thanh toán</div>
                      <strong class="spec-detail-val">{{ room.paymentCycle || '1 tháng' }}</strong>
                    </div>
                  </div>
                  <div class="spec-detail-card">
                    <span class="spec-detail-icon"></span>
                    <div>
                      <div class="spec-detail-label">Mã phòng</div>
                      <strong class="spec-detail-val">#P-{{ room.id }}</strong>
                    </div>
                  </div>
                </div>

                <!-- Current Tenant Quick Info (if Rented) -->
                @if (room.activeContracts && room.activeContracts.length > 0) {
                  <h4 class="detail-group-title mb-2">Khách thuê đang ở</h4>
                  <div class="tenant-overview-box mb-4">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <strong class="tenant-overview-name font-lg">{{ room.activeContracts[0].tenantFullName }}</strong>
                        <div class="tenant-overview-phone text-muted mt-1">{{ room.activeContracts[0].tenantPhone }} • CCCD: {{ room.activeContracts[0].tenantIdCardNumber || 'Đã xác minh' }}</div>
                        <div class="text-xs text-muted mt-1">Thuê từ: {{ room.activeContracts[0].startDate | date:'dd/MM/yyyy' }} → Hạn: {{ room.activeContracts[0].endDate | date:'dd/MM/yyyy' }}</div>
                      </div>
                      <button type="button" class="btn-goto-contract" (click)="closeRoomDetailModal(); openContractModal(room.id)">
                        Xem hợp đồng chi tiết
                      </button>
                    </div>
                  </div>
                }

              </div>

              <!-- Footer Modal Actions -->
              <div class="modal-actions-footer mt-4">
                <button type="button" class="btn-secondary-custom" (click)="closeRoomDetailModal(); openEditRoomModal(room)">
                  Chỉnh sửa phòng
                </button>
                @if (room.status === 'Available') {
                  <button type="button" class="btn-submit-custom" (click)="closeRoomDetailModal(); openCheckInModal(room)">
                    Lập hợp đồng mới
                  </button>
                } @else if (room.status === 'Rented') {
                  <button type="button" class="btn-submit-custom" (click)="closeRoomDetailModal(); openContractModal(room.id)">
                    Xem hợp đồng
                  </button>
                }
                <button type="button" (click)="closeRoomDetailModal()" class="btn-cancel-custom">Đóng</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- 5. ROOM CONTRACT MODAL (DẠNG TO, DỄ NHÌN, CHỈ HIỆN HỢP ĐỒNG) -->
      @if (showContractModal(); as roomId) {
        <div class="modal-backdrop" (click)="closeContractModal()">
          <div class="modal-card max-w-850" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <div>
                <h2 class="modal-main-title m-0">HỢP ĐỒNG THUÊ PHÒNG {{ roomDetail()?.roomNumber }}</h2>
                <p class="text-muted text-sm m-0 mt-1">{{ roomDetail()?.propertyTitle }} • {{ roomDetail()?.propertyAddress }}</p>
              </div>
              <button (click)="closeContractModal()" class="modal-close-x">&times;</button>
            </div>
            
            @if (isLoadingDetail()) {
              <div class="text-center py-5">
                <div class="spinner mb-2"></div>
                <p class="text-muted">Đang tải thông tin hợp đồng...</p>
              </div>
            } @else if (roomDetail(); as room) {
              
              <div class="modal-contract-body mt-4">
                @if (room.activeContracts && room.activeContracts.length > 0) {
                  @for (c of room.activeContracts; track c.contractId; let idx = $index) {
                    <div class="large-contract-box mb-4">
                      
                      <!-- Contract Top Bar -->
                      <div class="contract-top-bar">
                        <div class="d-flex align-items-center gap-2">
                          <span class="contract-tag-badge">HỢP ĐỒNG THUÊ #HĐ-{{ c.contractId }}</span>
                          <span class="contract-status-active">Đang có hiệu lực</span>
                        </div>
                        <div class="contract-validity-date">
                          Thời hạn thuê: <strong>{{ c.startDate | date:'dd/MM/yyyy' }}</strong> → <strong>{{ c.endDate | date:'dd/MM/yyyy' }}</strong>
                        </div>
                      </div>

                      <!-- 3 Main Information Cards Grid (Dạng to, chia 3 khối rõ ràng) -->
                      <div class="contract-cards-grid mt-3">
                        
                        <!-- Block 1: Khách thuê đại diện -->
                        <div class="contract-info-block">
                          <div class="block-header">
                            <span class="block-icon"></span>
                            <h4 class="block-title">Khách Thuê (Đại diện)</h4>
                          </div>
                          <div class="block-body">
                            <div class="info-row">
                              <span class="info-label">Họ và tên:</span>
                              <strong class="info-val text-dark font-lg">{{ c.tenantFullName }}</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Số điện thoại:</span>
                              <a [href]="'tel:' + c.tenantPhone" class="info-val text-primary font-bold">{{ c.tenantPhone }}</a>
                            </div>
                            <div class="info-row">
                              <span class="info-label">CCCD / CMND:</span>
                              <strong class="info-val text-dark">{{ c.tenantIdCardNumber || 'Đã xác minh' }}</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Vai trò:</span>
                              <span class="badge-rep">Người đại diện hợp đồng</span>
                            </div>
                          </div>
                        </div>

                        <!-- Block 2: Giá thuê & Đặt cọc -->
                        <div class="contract-info-block block-highlight-blue">
                          <div class="block-header">
                            <span class="block-icon"></span>
                            <h4 class="block-title">Giá Thuê & Tiền Cọc</h4>
                          </div>
                          <div class="block-body">
                            <div class="info-row">
                              <span class="info-label">Giá thuê thỏa thuận:</span>
                              <strong class="info-val price-highlight text-primary">{{ c.roomPrice | number:'1.0-0' }} đ/tháng</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Tiền đặt cọc:</span>
                              <strong class="info-val text-dark font-bold">{{ (c.depositAmount || c.roomPrice) | number:'1.0-0' }} đ</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Chu kỳ thanh toán:</span>
                              <strong class="info-val text-dark">{{ c.paymentCycle || '1 tháng' }}</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Ngày bắt đầu thuê:</span>
                              <strong class="info-val text-dark">{{ c.startDate | date:'dd/MM/yyyy' }}</strong>
                            </div>
                          </div>
                        </div>

                        <!-- Block 3: Đơn giá Điện & Nước -->
                        <div class="contract-info-block">
                          <div class="block-header">
                            <span class="block-icon"></span>
                            <h4 class="block-title">Dịch Vụ Điện & Nước</h4>
                          </div>
                          <div class="block-body">
                            <div class="info-row">
                              <span class="info-label">Tiền điện theo số:</span>
                              <strong class="info-val text-amber font-bold">{{ (c.electricityUnitPrice || 3500) | number:'1.0-0' }} đ / số</strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Tiền nước thỏa thuận:</span>
                              <strong class="info-val text-sky font-bold">
                                {{ c.waterPricingType === 'metered' ? ((c.waterUnitPrice || 25000) | number:'1.0-0') + ' đ / khối (m³)' : ((c.waterUnitPrice || 100000) | number:'1.0-0') + ' đ / người / tháng' }}
                              </strong>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Hình thức tính nước:</span>
                              <span class="badge-water-type">{{ c.waterPricingType === 'metered' ? 'Theo khối (m³)' : 'Cố định theo người' }}</span>
                            </div>
                            <div class="info-row">
                              <span class="info-label">Ngày hết hợp đồng:</span>
                              <strong class="info-val text-danger font-bold">{{ c.endDate | date:'dd/MM/yyyy' }}</strong>
                            </div>
                          </div>
                        </div>

                      </div>

                      <!-- Footer Action for this Contract -->
                      <div class="contract-card-actions mt-3">
                        <span class="text-xs text-muted">Khi thanh lý hợp đồng, phòng sẽ tự động được khôi phục về trạng thái phòng trống.</span>
                        <button type="button" class="btn-checkout-danger" (click)="triggerCheckOutFromDetail(c.contractId)">
                          Trả phòng & Thanh lý Hợp đồng (Check-out)
                        </button>
                      </div>

                    </div>
                  }
                } @else {
                  <div class="empty-contract-state py-5 text-center">
                    <span class="empty-icon"></span>
                    <h3 class="font-bold text-dark mb-1">Phòng {{ room.roomNumber }} Chưa Có Hợp Đồng</h3>
                    <p class="text-muted text-sm mb-4">Hiện tại phòng này đang trống và chưa có khách thuê hay hợp đồng nào có hiệu lực.</p>
                    <button type="button" class="btn-create-contract-big" (click)="closeContractModal(); openCheckInModal(room)">
                      + Lập Hợp Đồng Mới Cho Phòng Này
                    </button>
                  </div>
                }
              </div>

              <!-- Footer Modal Close -->
              <div class="modal-actions-footer mt-4">
                <button type="button" (click)="closeContractModal()" class="btn-cancel-custom">Đóng</button>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .rooms-page-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1.5rem 1rem 4rem 1rem;
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* 1. TOP PROPERTY SELECTOR */
    .top-nav-bar {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .property-top-select {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 9px 18px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      outline: none;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      min-width: 190px;
    }
    .property-top-select:focus {
      border-color: #2563eb;
    }

    /* 2. PAGE HEADER ROW */
    .page-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 900;
      color: #0f172a;
    }
    .btn-create-room {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 9px 22px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
    }
    .btn-create-room:hover {
      background: #1d4ed8;
    }
    .plus-icon {
      font-size: 1.1rem;
      line-height: 1;
    }

    /* 3. SEARCH & SORT TOOLBAR */
    .search-filter-toolbar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      flex-wrap: wrap;
    }
    .search-input-box {
      flex: 1 1 280px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 0.9rem;
      color: #94a3b8;
    }
    .search-input-field {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 14px 9px 36px;
      font-size: 0.88rem;
      color: #1e293b;
      outline: none;
    }
    .search-input-field:focus {
      border-color: #93c5fd;
      background: #ffffff;
    }

    .sort-select-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .sort-icon {
      position: absolute;
      left: 12px;
      font-size: 0.95rem;
      color: #64748b;
      pointer-events: none;
    }
    .sort-select-field {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 16px 9px 34px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      outline: none;
      cursor: pointer;
    }
    .sort-select-field:focus {
      border-color: #93c5fd;
    }

    .btn-filter-dark {
      background: #0f172a;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 9px 24px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-filter-dark:hover {
      background: #1e293b;
    }

    .btn-refresh-sync {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.05rem;
      color: #475569;
      transition: background 0.15s ease;
    }
    .btn-refresh-sync:hover {
      background: #f1f5f9;
    }

    /* 4. STATUS PILLS ROW */
    .status-pills-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .status-pill-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 7px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .status-pill-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .status-pill-btn.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
    }
    .pill-counter {
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 12px;
      padding: 2px 8px;
      min-width: 20px;
      text-align: center;
    }
    .active-counter {
      background: rgba(255, 255, 255, 0.28);
      color: #ffffff;
    }

    /* 5. PROPERTY ACCORDION CARD */
    .properties-accordion-stack {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .property-accordion-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    }
    .prop-accordion-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      background: #ffffff;
      transition: background 0.15s;
    }
    .prop-accordion-header:hover {
      background: #fcfdfe;
    }
    .prop-header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .prop-avatar-thumb {
      width: 52px;
      height: 52px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .prop-title-text {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
    }
    .prop-address-text {
      font-size: 0.82rem;
      color: #64748b;
      margin-top: 3px !important;
    }
    .chevron-arrow {
      font-size: 0.85rem;
      color: #64748b;
      display: inline-block;
      transition: transform 0.2s ease;
    }
    .chevron-arrow.collapsed {
      transform: rotate(180deg);
    }

    /* 3 ROOMS PER ROW GRID */
    .prop-rooms-body {
      background: #f8fafc;
      padding: 20px;
      border-top: 1px solid #f1f5f9;
    }
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 1080px) {
      .rooms-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 680px) {
      .rooms-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ROOM ITEM CARD */
    .room-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      transition: all 0.2s ease;
      position: relative;
    }
    .room-item-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
      border-color: #cbd5e1;
    }

    .room-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .room-num-text {
      font-size: 1.45rem;
      font-weight: 900;
      color: #0f172a;
    }
    .room-badges-cluster {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .badge-pill-gray {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      padding: 3px 8px;
    }
    .badge-pill-pink {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #e11d48;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;
      padding: 3px 8px;
    }

    /* Price & Status */
    .room-price-status-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .price-title-label {
      font-size: 0.78rem;
      color: #64748b;
    }
    .price-val-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .room-status-badge-available {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #ffffff;
      font-size: 0.76rem;
      font-weight: 800;
      border-radius: 6px;
      padding: 4px 10px;
      letter-spacing: 0.04em;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
    }
    .status-pulse-dot {
      width: 6px;
      height: 6px;
      background: #ffffff;
      border-radius: 50%;
      display: inline-block;
      animation: statusDotPulse 1.4s infinite ease-in-out;
    }
    @keyframes statusDotPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.65); }
    }
    .room-status-badge-gray {
      background: #475569;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      border-radius: 6px;
      padding: 4px 10px;
      letter-spacing: 0.04em;
    }
    .room-status-badge-blue {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      border-radius: 6px;
      padding: 4px 10px;
      letter-spacing: 0.04em;
    }
    .room-status-badge-orange {
      background: #ea580c;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      border-radius: 6px;
      padding: 4px 10px;
      letter-spacing: 0.04em;
    }
    .room-price-val {
      font-size: 1.25rem;
      font-weight: 900;
      color: #0f172a;
    }

    /* 2 Sub-counter buttons */
    .room-counter-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .btn-sub-counter {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-sub-counter:hover {
      background: #edf2f7;
      color: #1e293b;
    }
    .btn-icon {
      font-size: 0.88rem;
    }

    /* Action buttons bar */
    .room-card-actions-bar {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn-main-room-action {
      flex: 1;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #1e293b;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }
    .btn-main-room-action:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .room-more-menu-wrapper {
      position: relative;
    }
    .btn-more-options {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      color: #475569;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-more-options:hover {
      background: #f1f5f9;
    }

    .room-dropdown-menu {
      position: absolute;
      bottom: 44px;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      width: 190px;
      padding: 6px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dropdown-item-opt {
      background: none;
      border: none;
      text-align: left;
      padding: 8px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .dropdown-item-opt:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .dropdown-item-opt.text-danger:hover {
      background: #fee2e2;
      color: #b91c1c;
    }

    .btn-link-add {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
    }

    /* MODALS GENERAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 26px 30px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
    }
    .max-w-520 { max-width: 520px; }
    .max-w-560 { max-width: 560px; }
    .max-w-680 { max-width: 680px; }
    .max-w-720 { max-width: 720px; }

    .modal-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .modal-main-title {
      font-size: 1.3rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.02em;
    }
    .modal-close-x {
      background: none;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: #64748b;
      padding: 4px;
      line-height: 1;
    }
    .modal-close-x:hover { color: #0f172a; }

    .form-sub-header {
      margin-bottom: 16px;
    }
    .section-title-bold {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .section-subtitle-muted {
      font-size: 0.82rem;
      color: #64748b;
      margin-top: 3px !important;
    }

    .form-label-custom {
      display: block;
      font-size: 0.88rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .form-control-custom {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1e293b;
      background: #ffffff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }
    .form-control-custom:focus {
      border-color: #2563eb;
    }

    .row-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .row-3-cols {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
    }

    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel-custom {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-cancel-custom:hover { background: #e2e8f0; }
    .btn-submit-custom {
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-weight: 700;
      padding: 10px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.15s ease;
    }
    .currency-tag {
      font-size: 0.8rem;
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    .currency-tag-elec {
      color: #b45309;
      background: #fef3c7;
      border-color: #fde68a;
    }
    .currency-tag-water {
      color: #0369a1;
      background: #e0f2fe;
      border-color: #bae6fd;
    }
    .input-money-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-money-wrapper .form-control-custom {
      padding-right: 52px;
    }
    .input-money-suffix {
      position: absolute;
      right: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      pointer-events: none;
    }
    .water-radio-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .radio-card-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      transition: all 0.15s ease;
    }
    .radio-card-option:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }
    .radio-card-option.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .radio-card-option input[type="radio"] {
      cursor: pointer;
      accent-color: #2563eb;
    }
    .pricing-section-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .text-danger-note {
      font-size: 0.78rem;
      color: #dc2626;
      font-weight: 500;
      margin-top: 4px;
    }

    /* ROOM DETAIL MODAL STYLES */
    .detail-banner-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .detail-label-muted {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
      display: block;
    }
    .badge-status-pill {
      display: inline-block;
      font-size: 0.82rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
    }
    .badge-status-avail { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-status-rented { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
    .badge-status-maint { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
    .detail-main-price {
      font-size: 1.35rem;
      font-weight: 900;
      color: #2563eb;
    }
    .detail-group-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .room-specs-detail-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 600px) {
      .room-specs-detail-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .spec-detail-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .spec-detail-icon {
      font-size: 1.4rem;
    }
    .spec-detail-label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
    }
    .spec-detail-val {
      font-size: 0.95rem;
      color: #0f172a;
      font-weight: 800;
    }
    .tenant-overview-box {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 18px;
    }
    .tenant-overview-name {
      color: #166534;
    }
    .btn-goto-contract {
      background: #ffffff;
      border: 1.5px solid #86efac;
      color: #15803d;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-goto-contract:hover {
      background: #15803d;
      color: #ffffff;
    }
    .btn-secondary-custom {
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
      color: #334155;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 9px 18px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-secondary-custom:hover {
      background: #e2e8f0;
    }

    /* CONTRACT VIEW ELEMENTS (DẠNG TO, DỄ NHÌN) */
    .max-w-850 {
      max-width: 850px;
      width: 100%;
    }
    .modal-contract-body {
      padding: 4px 0;
    }
    .large-contract-box {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }
    .contract-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 2px dashed #e2e8f0;
    }
    .contract-tag-badge {
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
      color: #1e293b;
      font-weight: 800;
      font-size: 0.88rem;
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: 0.3px;
    }
    .contract-status-active {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #15803d;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 5px 12px;
      border-radius: 20px;
    }
    .contract-validity-date {
      font-size: 0.88rem;
      color: #475569;
      background: #f8fafc;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .contract-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 768px) {
      .contract-cards-grid {
        grid-template-columns: 1fr;
      }
    }
    .contract-info-block {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .contract-info-block:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    }
    .block-highlight-blue {
      background: #f0f7ff;
      border-color: #bfdbfe;
    }
    .block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    .block-icon {
      font-size: 1.25rem;
    }
    .block-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .block-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 0.85rem;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
      font-size: 0.78rem;
    }
    .info-val {
      word-break: break-word;
    }
    .font-lg {
      font-size: 1rem;
      font-weight: 800;
    }
    .font-bold {
      font-weight: 700;
    }
    .price-highlight {
      font-size: 1.1rem;
      font-weight: 900;
      color: #2563eb;
    }
    .badge-rep {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      width: fit-content;
    }
    .badge-water-type {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      width: fit-content;
    }
    .text-amber {
      color: #d97706;
    }
    .text-sky {
      color: #0284c7;
    }
    .contract-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 16px;
      border-top: 1.5px dashed #e2e8f0;
    }
    .btn-checkout-danger {
      background: #fee2e2;
      border: 1.5px solid #fca5a5;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-checkout-danger:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);
    }
    .empty-contract-state {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 40px 20px;
    }
    .btn-create-contract-big {
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 24px;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }
    .btn-create-contract-big:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
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

    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 8px; }
  `]
})
export class LandlordRoomsComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly contractService = inject(ContractService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);

  propertyList = signal<any[]>([]);
  allRooms = signal<any[]>([]);
  isLoadingList = signal(true);
  isLoadingDetail = signal(false);

  // Reactive Filter Signals
  selectedPropertyIdFilter = signal<number>(0);
  selectedStatusFilter = signal<string>('All');
  searchRoomNumber = signal<string>('');
  selectedSort = signal<string>('default');

  collapsedProperties = signal<Set<number>>(new Set());
  activeRoomMenu = signal<number | null>(null);

  // Modals state
  showAddRoomModal = signal(false);
  newRoomData = {
    propertyId: 0,
    roomNumber: '',
    price: null as number | null,
    deposit: null as number | null,
    area: null as number | null,
    maxOccupants: null as number | null,
    bedsCount: 1,
    paymentCycle: '1 tháng'
  };

  showEditRoomModal = signal<any | null>(null);
  editRoomModel = { id: 0, propertyId: 0, roomNumber: '', price: 0, area: 0, maxOccupants: 1, status: 'Available' };

  showCheckInModal = signal<any | null>(null);
  checkInModel: any = {
    propertyId: 0,
    propertyTitle: '',
    roomId: 0,
    roomNumber: '',
    startDate: '',
    endDate: '',
    roomPrice: 0,
    depositAmount: 0,
    bedsCount: 1,
    paymentCycle: '1 tháng',
    tenantFullName: '',
    tenantPhone: '',
    tenantIdCardNumber: '',
    electricityUnitPrice: 3500,
    waterPricingType: 'fixed', // 'fixed' | 'metered'
    waterUnitPrice: 100000
  };

  showRoomDetailModal = signal<number | null>(null);
  showContractModal = signal<number | null>(null);
  roomDetail = signal<any | null>(null);

  // Computed: Rooms for currently selected property filter (or all)
  currentPropertyRooms = computed(() => {
    const propId = this.selectedPropertyIdFilter();
    if (propId > 0) {
      return this.allRooms().filter(r => r.propertyId === propId);
    }
    return this.allRooms();
  });

  // Dynamic status counters
  totalRoomsCount = computed(() => this.currentPropertyRooms().length);
  rentedRoomsCount = computed(() => this.currentPropertyRooms().filter(r => r.status === 'Rented').length);
  availableRoomsCount = computed(() => this.currentPropertyRooms().filter(r => r.status === 'Available').length);

  // Computed: Filtered list of rooms reacting to all signals
  filteredRooms = computed(() => {
    let list = this.allRooms();
    const propId = this.selectedPropertyIdFilter();
    const status = this.selectedStatusFilter();
    const search = this.searchRoomNumber().toLowerCase().trim();
    const sort = this.selectedSort();

    if (propId > 0) {
      list = list.filter(r => r.propertyId === propId);
    }

    if (status === 'Rented') {
      list = list.filter(r => r.status === 'Rented');
    } else if (status === 'Available') {
      list = list.filter(r => r.status === 'Available');
    }

    if (search) {
      list = list.filter(r => 
        (r.roomNumber && r.roomNumber.toLowerCase().includes(search)) || 
        (r.propertyTitle && r.propertyTitle.toLowerCase().includes(search))
      );
    }

    // Sorting
    if (sort === 'room-asc') {
      list = [...list].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
    } else if (sort === 'room-desc') {
      list = [...list].sort((a, b) => b.roomNumber.localeCompare(a.roomNumber, undefined, { numeric: true }));
    } else if (sort === 'price-asc') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price-desc') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      // Default: available first
      list = [...list].sort((a, b) => {
        if (a.status === 'Available' && b.status !== 'Available') return -1;
        if (a.status !== 'Available' && b.status === 'Available') return 1;
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
    }

    return list;
  });

  // Group by property for display
  displayedProperties = computed(() => {
    const props = this.propertyList();
    const rooms = this.filteredRooms();
    const propId = this.selectedPropertyIdFilter();
    const search = this.searchRoomNumber().trim();
    const status = this.selectedStatusFilter();

    if (propId > 0) {
      const p = props.find(x => x.id === propId);
      if (!p) return [];
      return [{
        ...p,
        matchedRooms: rooms.filter(r => r.propertyId === p.id)
      }];
    }

    return props.map(p => ({
      ...p,
      matchedRooms: rooms.filter(r => r.propertyId === p.id)
    })).filter(p => p.matchedRooms.length > 0 || (search === '' && status === 'All'));
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['propertyId']) {
        this.selectedPropertyIdFilter.set(Number(params['propertyId']));
      }
    });
    this.fetchRoomsList();
  }

  fetchRoomsList(): void {
    this.isLoadingList.set(true);
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.propertyList.set(properties);
        const rooms: any[] = [];
        for (const p of properties) {
          if (p.rooms) {
            for (const r of p.rooms) {
              rooms.push({
                ...r,
                propertyId: p.id,
                propertyTitle: p.title,
                propertyAddress: p.address
              });
            }
          }
        }
        this.allRooms.set(rooms);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.isLoadingList.set(false);
        this.toastService.show('Lỗi tải danh sách phòng trọ.', 'error');
      }
    });
  }

  refreshAll(): void {
    this.searchRoomNumber.set('');
    this.selectedSort.set('default');
    this.selectedStatusFilter.set('All');
    this.fetchRoomsList();
    this.toastService.show('Đã làm mới dữ liệu danh sách phòng!', 'info');
  }

  onPropertyFilterChange(): void {
    const propId = this.selectedPropertyIdFilter();
    if (propId > 0) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { propertyId: propId },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { propertyId: null },
        queryParamsHandling: 'merge'
      });
    }
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

  toggleRoomMenu(roomId: number): void {
    if (this.activeRoomMenu() === roomId) {
      this.activeRoomMenu.set(null);
    } else {
      this.activeRoomMenu.set(roomId);
    }
  }

  closeRoomMenu(): void {
    this.activeRoomMenu.set(null);
  }

  // Check-In / Lập Hợp Đồng (Chuyển sang trang mới)
  openCheckInModal(room: any): void {
    this.closeRoomMenu();
    this.router.navigate(['/landlord/create-contract'], {
      queryParams: {
        propertyId: room?.propertyId || (this.selectedPropertyIdFilter() > 0 ? this.selectedPropertyIdFilter() : undefined),
        roomId: room?.id
      }
    });
  }

  getModalRooms(): any[] {
    if (!this.checkInModel.propertyId) return this.allRooms();
    const filtered = this.allRooms().filter(r => r.propertyId === Number(this.checkInModel.propertyId));
    return filtered.length > 0 ? filtered : this.allRooms();
  }

  onPropertyChangeInModal(propId: any): void {
    this.checkInModel.propertyId = Number(propId);
    const prop = this.propertyList().find(p => p.id === Number(propId));
    if (prop) this.checkInModel.propertyTitle = prop.title;
    
    const propRooms = this.allRooms().filter(r => r.propertyId === Number(propId));
    if (propRooms.length > 0) {
      this.onRoomChangeInModal(propRooms[0].id);
    }
  }

  onRoomChangeInModal(roomId: any): void {
    const room = this.allRooms().find(r => r.id === Number(roomId));
    if (room) {
      this.checkInModel.roomId = room.id;
      this.checkInModel.roomNumber = room.roomNumber;
      this.checkInModel.propertyId = room.propertyId;
      this.checkInModel.propertyTitle = room.propertyTitle;
      this.checkInModel.roomPrice = room.price || 0;
      this.checkInModel.depositAmount = room.deposit || room.price || 0;
      if (room.bedsCount) this.checkInModel.bedsCount = room.bedsCount;
      if (room.paymentCycle) this.checkInModel.paymentCycle = room.paymentCycle;
    }
  }

  onWaterPricingTypeChange(type: 'fixed' | 'metered'): void {
    this.checkInModel.waterPricingType = type;
    if (type === 'fixed') {
      this.checkInModel.waterUnitPrice = 100000;
    } else {
      this.checkInModel.waterUnitPrice = 25000;
    }
  }

  formatMoney(val: any): string {
    if (val === null || val === undefined || val === '') return '0 đ';
    const num = Number(val);
    if (isNaN(num)) return '0 đ';
    return num.toLocaleString('vi-VN') + ' đ';
  }

  onTenantPhoneInput(event: any): void {
    const phone = event.target?.value || '';
    if (phone && /^0[35789]\d{8}$/.test(phone)) {
      this.contractService.getTenantByPhone(phone).subscribe({
        next: (tenant) => {
          if (tenant) {
            this.checkInModel.tenantFullName = tenant.fullName || this.checkInModel.tenantFullName;
            this.checkInModel.tenantIdCardNumber = tenant.cccdNumber || this.checkInModel.tenantIdCardNumber;
            this.toastService.show(`Tìm thấy khách thuê: ${tenant.fullName}`, 'success');
          }
        },
        error: () => {}
      });
    }
  }

  submitCheckIn(): void {
    if (!this.checkInModel.tenantFullName || !this.checkInModel.tenantPhone) {
      this.toastService.show('Vui lòng nhập họ tên và số điện thoại người thuê!', 'error');
      return;
    }

    this.contractService.checkIn(this.checkInModel).subscribe({
      next: () => {
        this.toastService.show(`Lập hợp đồng thành công cho phòng ${this.checkInModel.roomNumber}!`, 'success');
        this.showCheckInModal.set(null);
        this.fetchRoomsList();
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi khi lập hợp đồng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Add Room
  openAddRoomModal(): void {
    const props = this.propertyList();
    const defaultPropId = this.selectedPropertyIdFilter() > 0 ? this.selectedPropertyIdFilter() : (props.length > 0 ? props[0].id : 0);
    this.newRoomData = {
      propertyId: defaultPropId,
      roomNumber: '',
      price: null,
      deposit: null,
      area: null,
      maxOccupants: null,
      bedsCount: 1,
      paymentCycle: '1 tháng'
    };
    this.showAddRoomModal.set(true);
  }

  openAddRoomModalWithProp(propId: number): void {
    this.newRoomData = {
      propertyId: propId,
      roomNumber: '',
      price: null,
      deposit: null,
      area: null,
      maxOccupants: null,
      bedsCount: 1,
      paymentCycle: '1 tháng'
    };
    this.showAddRoomModal.set(true);
  }

  submitAddRoom(): void {
    const propId = Number(this.newRoomData.propertyId);
    if (!propId) {
      this.toastService.show('Vui lòng chọn nhà trọ!', 'error');
      return;
    }
    if (!this.newRoomData.roomNumber) {
      this.toastService.show('Vui lòng nhập tên phòng!', 'error');
      return;
    }

    const payload = {
      roomNumber: this.newRoomData.roomNumber,
      price: this.newRoomData.price || 0,
      area: this.newRoomData.area || 20,
      maxOccupants: this.newRoomData.maxOccupants || 2,
      deposit: this.newRoomData.deposit || 0,
      bedsCount: this.newRoomData.bedsCount || 1,
      paymentCycle: this.newRoomData.paymentCycle || '1 tháng'
    };

    this.propertyService.addRoom(propId, payload).subscribe({
      next: () => {
        this.toastService.show('Thêm phòng trọ mới thành công!', 'success');
        this.showAddRoomModal.set(false);
        this.fetchRoomsList();
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi khi thêm phòng.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Edit Room
  openEditRoomModal(room: any): void {
    this.closeRoomMenu();
    this.editRoomModel = {
      id: room.id,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      price: room.price,
      area: room.area,
      maxOccupants: room.maxOccupants,
      status: room.status
    };
    this.showEditRoomModal.set(room);
  }

  submitEditRoom(): void {
    this.propertyService.updateRoom(this.editRoomModel.id, this.editRoomModel).subscribe({
      next: () => {
        this.toastService.show('Đã cập nhật thông tin phòng thành công!', 'success');
        this.showEditRoomModal.set(null);
        this.fetchRoomsList();
      },
      error: (err) => {
        const msg = err.error?.message || 'Lỗi cập nhật phòng.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Delete Room
  deleteRoom(room: any): void {
    this.closeRoomMenu();
    if (room.status === 'Rented') {
      this.toastService.show('Không thể xóa phòng đang có người thuê!', 'error');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ${room.roomNumber}?`)) return;

    this.propertyService.deleteRoom(room.id).subscribe({
      next: () => {
        this.toastService.show(`Đã xóa phòng ${room.roomNumber}!`, 'success');
        this.fetchRoomsList();
      },
      error: (err) => {
        const msg = err.error?.message || 'Lỗi khi xóa phòng.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // 1. Room Detail Modal Handlers
  openRoomDetailModal(roomId: number): void {
    this.closeRoomMenu();
    this.showRoomDetailModal.set(roomId);
    this.isLoadingDetail.set(true);
    this.propertyService.getLandlordRoomDetail(roomId).subscribe({
      next: (detail) => {
        this.roomDetail.set(detail);
        this.isLoadingDetail.set(false);
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.toastService.show('Lỗi tải thông tin chi tiết phòng.', 'error');
      }
    });
  }

  closeRoomDetailModal(): void {
    this.showRoomDetailModal.set(null);
    this.roomDetail.set(null);
  }

  // 2. Contract Modal Handlers (Large Dedicated View)
  openContractModal(roomId: number): void {
    this.closeRoomMenu();
    this.showContractModal.set(roomId);
    this.isLoadingDetail.set(true);
    this.propertyService.getLandlordRoomDetail(roomId).subscribe({
      next: (detail) => {
        this.roomDetail.set(detail);
        this.isLoadingDetail.set(false);
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.toastService.show('Lỗi tải thông tin hợp đồng phòng.', 'error');
      }
    });
  }

  closeContractModal(): void {
    this.showContractModal.set(null);
    this.roomDetail.set(null);
  }

  // Backward compatibility alias if needed
  openRoomContracts(room: any): void {
    this.openContractModal(room.id);
  }

  openRoomTenants(room: any): void {
    this.openContractModal(room.id);
  }

  triggerCheckOutFromDetail(contractId: number): void {
    if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng và làm thủ tục trả phòng không?')) return;

    this.contractService.checkOut(contractId).subscribe({
      next: () => {
        this.toastService.show('Đã làm thủ tục trả phòng thành công!', 'success');
        if (this.showContractModal()) {
          this.openContractModal(this.showContractModal()!);
        } else if (this.showRoomDetailModal()) {
          this.openRoomDetailModal(this.showRoomDetailModal()!);
        }
        this.fetchRoomsList();
      },
      error: (err) => this.toastService.show(err.error || 'Lỗi trả phòng.', 'error')
    });
  }

  getVietnameseStatus(status: string): string {
    switch (status) {
      case 'Available': return 'Phòng trống';
      case 'Rented': return 'Đang thuê';
      case 'Maintenance': return 'Bảo trì';
      default: return status;
    }
  }

  getImageUrl(url?: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `${environment.baseUrl}${url}` : url;
  }
}
