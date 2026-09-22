import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landlord-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contracts-page-container">
      
      <!-- Top Title Bar -->
      <div class="header-action-row mb-4">
        <div>
          <h1 class="page-main-title m-0">QUẢN LÝ HỢP ĐỒNG THUÊ TRỌ</h1>
          <p class="text-muted text-sm m-0 mt-1">Tổng hợp, theo dõi và quản lý hợp đồng thuê của từng phòng thuộc từng nhà trọ</p>
        </div>
        <div class="header-btns-wrap">
          <button type="button" class="btn-refresh-clean" (click)="refreshAll()">
            Làm mới
          </button>
          <button type="button" class="btn-primary-action" (click)="openCheckInModal()">
            + Lập Hợp Đồng Mới
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-cards-grid mb-4">
        <div class="kpi-card kpi-card-blue" (click)="statusFilter.set('all')">
          <div class="kpi-icon-wrap"></div>
          <div class="kpi-info-wrap">
            <span class="kpi-label">Tổng số hợp đồng</span>
            <strong class="kpi-value text-primary">{{ allContracts().length }}</strong>
          </div>
        </div>

        <div class="kpi-card kpi-card-green" (click)="statusFilter.set('Active')">
          <div class="kpi-icon-wrap"></div>
          <div class="kpi-info-wrap">
            <span class="kpi-label">Đang có hiệu lực</span>
            <strong class="kpi-value text-success">{{ activeContractsCount() }}</strong>
          </div>
        </div>

        <div class="kpi-card kpi-card-amber" (click)="statusFilter.set('Expiring')">
          <div class="kpi-icon-wrap">⏳</div>
          <div class="kpi-info-wrap">
            <span class="kpi-label">Sắp hết hạn (&le; 30 ngày)</span>
            <strong class="kpi-value text-amber">{{ expiringContractsCount() }}</strong>
          </div>
        </div>

        <div class="kpi-card kpi-card-slate" (click)="statusFilter.set('Terminated')">
          <div class="kpi-icon-wrap"></div>
          <div class="kpi-info-wrap">
            <span class="kpi-label">Đã thanh lý / Kết thúc</span>
            <strong class="kpi-value text-muted">{{ terminatedContractsCount() }}</strong>
          </div>
        </div>
      </div>

      <!-- Advanced Filters Bar (Lọc theo Nhà trọ, Lọc theo Phòng, Lọc theo Trạng thái, Tìm kiếm) -->
      <div class="filters-card-wrapper mb-4">
        <div class="filters-top-grid">
          
          <!-- 1. Lọc theo Nhà trọ -->
          <div class="filter-item">
            <label class="filter-label">Chọn Nhà trọ</label>
            <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyFilterChange($event)" class="filter-select">
              <option [value]="0">-- Tất cả nhà trọ ({{ propertyList().length }}) --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.id">{{ p.title }}</option>
              }
            </select>
          </div>

          <!-- 2. Lọc theo Phòng của nhà trọ -->
          <div class="filter-item">
            <label class="filter-label">Chọn Phòng</label>
            <select [(ngModel)]="selectedRoomId" class="filter-select" [disabled]="selectedPropertyId() === 0">
              <option [value]="0">-- Tất cả phòng {{ selectedPropertyId() > 0 ? '(' + availableRoomsForFilter().length + ')' : '' }} --</option>
              @for (r of availableRoomsForFilter(); track r.id) {
                <option [value]="r.id">Phòng {{ r.roomNumber }}</option>
              }
            </select>
          </div>

          <!-- 3. Tìm kiếm theo tên khách, sđt, cccd, số phòng -->
          <div class="filter-item search-filter-item">
            <label class="filter-label">Tìm kiếm hợp đồng</label>
            <div class="search-input-box">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Nhập tên khách thuê, SĐT, CCCD, số phòng..." 
                class="filter-search-input" />
              @if (searchQuery()) {
                <button type="button" class="btn-clear-search" (click)="searchQuery.set('')">&times;</button>
              }
            </div>
          </div>

          <!-- 4. Sắp xếp -->
          <div class="filter-item sort-filter-item">
            <label class="filter-label">Sắp xếp</label>
            <select [(ngModel)]="selectedSort" class="filter-select">
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="price-desc">Giá thuê: Cao → Thấp</option>
              <option value="price-asc">Giá thuê: Thấp → Cao</option>
              <option value="expiring-soon">Sắp hết hạn nhất</option>
            </select>
          </div>

        </div>

        <!-- Status Filter Tabs -->
        <div class="status-tabs-row mt-3">
          <button 
            type="button" 
            class="tab-filter-btn" 
            [class.active]="statusFilter() === 'all'" 
            (click)="statusFilter.set('all')">
            Tất cả ({{ allContracts().length }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn" 
            [class.active]="statusFilter() === 'Active'" 
            (click)="statusFilter.set('Active')">
            Đang hiệu lực ({{ activeContractsCount() }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn" 
            [class.active]="statusFilter() === 'Expiring'" 
            (click)="statusFilter.set('Expiring')">
            ⏳ Sắp hết hạn ({{ expiringContractsCount() }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn" 
            [class.active]="statusFilter() === 'Terminated'" 
            (click)="statusFilter.set('Terminated')">
            Đã thanh lý ({{ terminatedContractsCount() }})
          </button>
        </div>
      </div>

      <!-- Main Contracts List Content -->
      @if (isLoading()) {
        <div class="loading-state-card py-5 text-center">
          <div class="spinner mb-2"></div>
          <p class="text-muted">Đang tải danh sách hợp đồng thuê...</p>
        </div>
      } @else if (filteredContracts().length === 0) {
        <div class="empty-state-card py-5 text-center">
          <span class="empty-icon"></span>
          <h3 class="font-bold text-dark mb-1">Không tìm thấy hợp đồng nào</h3>
          <p class="text-muted text-sm mb-4">
            @if (searchQuery() || statusFilter() !== 'all' || selectedPropertyId() > 0 || selectedRoomId() > 0) {
              Không có hợp đồng nào phù hợp với bộ lọc hiện tại. Vui lòng thử xóa bớt bộ lọc.
            } @else {
              Bạn chưa có hợp đồng thuê nào trong hệ thống. Hãy tạo hợp đồng mới ngay!
            }
          </p>
          <button type="button" class="btn-primary-action" (click)="openCheckInModal()">
            + Lập Hợp Đồng Mới
          </button>
        </div>
      } @else {
        
        <!-- Grouped by Property or Flat Cards Grid -->
        <div class="contracts-list-grid">
          @for (c of filteredContracts(); track c.id) {
            <div class="contract-card-item" [class.is-terminated]="c.status === 'Terminated'">
              
              <!-- Card Header -->
              <div class="contract-card-header">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="contract-code-tag">#HĐ-{{ c.id }}</span>
                  
                  @if (c.status === 'Active') {
                    @if (isExpiringSoon(c.endDate)) {
                      <span class="badge-status-pill badge-status-expiring">⏳ Sắp hết hạn (còn {{ getDaysRemaining(c.endDate) }} ngày)</span>
                    } @else {
                      <span class="badge-status-pill badge-status-active">Đang hiệu lực</span>
                    }
                  } @else {
                    <span class="badge-status-pill badge-status-terminated">Đã thanh lý</span>
                  }
                </div>

                <div class="contract-price-tag">
                  <span class="price-num">{{ c.roomPrice | number:'1.0-0' }} đ</span>
                  <span class="price-sub">/tháng</span>
                </div>
              </div>

              <!-- Property & Room Location Banner -->
              <div class="contract-location-row mt-2">
                <span class="loc-room">Phòng {{ c.roomNumber }}</span>
                <span class="loc-dot">•</span>
                <span class="loc-prop">{{ c.propertyTitle }}</span>
              </div>
              <p class="loc-address text-muted text-xs m-0 mt-1">{{ c.propertyAddress || 'Đang cập nhật địa chỉ' }}</p>

              <!-- Tenant & Contract Details Grid -->
              <div class="contract-body-grid mt-3">
                <div class="info-cell">
                  <span class="cell-label">Khách đại diện:</span>
                  <strong class="cell-val text-dark font-bold">{{ c.tenantFullName }}</strong>
                </div>

                <div class="info-cell">
                  <span class="cell-label">Số điện thoại:</span>
                  <a [href]="'tel:' + c.tenantPhone" class="cell-val text-primary font-bold">{{ c.tenantPhone }}</a>
                </div>

                <div class="info-cell">
                  <span class="cell-label">CCCD / CMND:</span>
                  <span class="cell-val text-dark">{{ c.tenantCccd || 'Đã xác minh' }}</span>
                </div>

                <div class="info-cell">
                  <span class="cell-label">Tiền đặt cọc:</span>
                  <span class="cell-val text-dark font-bold">{{ (c.depositAmount || c.roomPrice) | number:'1.0-0' }} đ</span>
                </div>

                <div class="info-cell">
                  <span class="cell-label">Ngày bắt đầu:</span>
                  <span class="cell-val text-dark">{{ c.startDate | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="info-cell">
                  <span class="cell-label">Ngày hết hạn:</span>
                  <strong class="cell-val" [class.text-danger]="isExpiringSoon(c.endDate)">{{ c.endDate | date:'dd/MM/yyyy' }}</strong>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div class="contract-card-footer mt-3">
                <button type="button" class="btn-detail-outline" (click)="openContractDetailModal(c.roomId)">
                  Xem chi tiết (Dạng to)
                </button>
                <button type="button" class="btn-print-doc" (click)="openLegalDocModal(c.id)">
                  📄 Xuất / In Hợp Đồng
                </button>
                @if (c.status === 'Active') {
                  <button type="button" class="btn-checkout-sm" (click)="triggerCheckOut(c.id, c.roomNumber)">
                    Thanh lý
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- ================= MODALS ================= -->

      <!-- 1. CHECK-IN / LẬP HỢP ĐỒNG MODAL -->
      @if (showCheckInModal()) {
        <div class="modal-backdrop" (click)="showCheckInModal.set(false)">
          <div class="modal-card max-w-680" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0">LẬP HỢP ĐỒNG MỚI</h2>
              <button (click)="showCheckInModal.set(false)" class="modal-close-x">&times;</button>
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
                <button type="button" (click)="showCheckInModal.set(false)" class="btn-cancel-custom">Hủy</button>
                <button type="submit" class="btn-submit-custom">Lập hợp đồng & Bàn giao</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 2. CONTRACT DETAIL MODAL (DẠNG TO, RÕ RÀNG) -->
      @if (selectedDetailRoomId(); as roomId) {
        <div class="modal-backdrop" (click)="closeContractDetailModal()">
          <div class="modal-card max-w-850" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <div>
                <h2 class="modal-main-title m-0">HỢP ĐỒNG THUÊ PHÒNG {{ roomDetail()?.roomNumber }}</h2>
                <p class="text-muted text-sm m-0 mt-1">{{ roomDetail()?.propertyTitle }} • {{ roomDetail()?.propertyAddress }}</p>
              </div>
              <button (click)="closeContractDetailModal()" class="modal-close-x">&times;</button>
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
                      <div class="contract-card-actions mt-3 d-flex gap-2 flex-wrap align-items-center">
                        <button type="button" class="btn-detail-outline" (click)="openLegalDocModal(c.contractId)">
                          📄 Xuất & In Văn Bản Hợp Đồng
                        </button>
                        <button type="button" class="btn-checkout-danger" (click)="triggerCheckOut(c.contractId, room.roomNumber)">
                          Trả phòng & Thanh lý Hợp đồng
                        </button>
                      </div>

                    </div>
                  }
                } @else {
                  <div class="empty-contract-state py-5 text-center">
                    <span class="empty-icon"></span>
                    <h3 class="font-bold text-dark mb-1">Phòng {{ room.roomNumber }} Không Có Hợp Đồng</h3>
                    <p class="text-muted text-sm mb-4">Hiện tại phòng này đang trống hoặc đã được thanh lý.</p>
                  </div>
                }
              </div>

              <!-- Footer Modal Close -->
              <div class="modal-actions-footer mt-4">
                <button type="button" (click)="closeContractDetailModal()" class="btn-cancel-custom">Đóng</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- 3. LEGAL CONTRACT DOCUMENT MODAL (CHUẨN THEO MẪU HỢP ĐỒNG PHÁP LÝ VIỆT NAM) -->
      @if (showLegalDocModal()) {
        <div class="modal-backdrop" (click)="showLegalDocModal.set(false)">
          <div class="modal-card max-w-850 legal-doc-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header-clean no-print">
              <div>
                <h2 class="modal-main-title m-0">VĂN BẢN HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
                <p class="text-muted text-sm m-0 mt-1">Văn bản pháp lý theo mẫu hợp đồng cho thuê phòng trọ chuẩn</p>
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
              <div class="legal-contract-paper mt-3" id="printableContract">
                
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
    .contracts-page-container {
      padding: 6px 0;
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
      letter-spacing: -0.3px;
    }
    .header-btns-wrap {
      display: flex;
      gap: 10px;
    }
    .btn-refresh-clean {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      color: #334155;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 9px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-refresh-clean:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-primary-action {
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }
    .btn-primary-action:hover {
      background: #1d4ed8;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }

    /* KPI Cards */
    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .kpi-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .kpi-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    }
    .kpi-card-blue:hover { border-color: #3b82f6; }
    .kpi-card-green:hover { border-color: #22c55e; }
    .kpi-card-amber:hover { border-color: #f59e0b; }
    .kpi-card-slate:hover { border-color: #64748b; }
    .kpi-icon-wrap {
      font-size: 1.8rem;
    }
    .kpi-info-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 900;
    }
    .text-amber { color: #d97706; }

    /* Filters Card */
    .filters-card-wrapper {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .filters-top-grid {
      display: grid;
      grid-template-columns: 2fr 1.5fr 3fr 1.5fr;
      gap: 14px;
    }
    @media (max-width: 992px) {
      .filters-top-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 600px) {
      .filters-top-grid {
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
      font-weight: 700;
      color: #475569;
    }
    .filter-select {
      height: 42px;
      padding: 0 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      background: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      outline: none;
    }
    .filter-select:focus {
      border-color: #2563eb;
      background: #ffffff;
    }
    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .filter-search-input {
      width: 100%;
      height: 42px;
      padding: 0 34px 0 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      background: #f8fafc;
      outline: none;
    }
    .filter-search-input:focus {
      border-color: #2563eb;
      background: #ffffff;
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

    /* Status Tabs */
    .status-tabs-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    .tab-filter-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 7px 14px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-filter-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .tab-filter-btn.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }

    /* Contracts Grid */
    .contracts-list-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }
    @media (max-width: 900px) {
      .contracts-list-grid {
        grid-template-columns: 1fr;
      }
    }
    .contract-card-item {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .contract-card-item:hover {
      border-color: #93c5fd;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.08);
      transform: translateY(-2px);
    }
    .contract-card-item.is-terminated {
      opacity: 0.75;
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    .contract-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .contract-code-tag {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      font-weight: 800;
      font-size: 0.82rem;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .contract-price-tag {
      text-align: right;
    }
    .price-num {
      font-size: 1.15rem;
      font-weight: 900;
      color: #2563eb;
    }
    .price-sub {
      font-size: 0.75rem;
      color: #64748b;
    }
    .contract-location-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 800;
    }
    .loc-room { color: #0f172a; }
    .loc-dot { color: #94a3b8; }
    .loc-prop { color: #2563eb; }

    .contract-body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      flex: 1;
    }
    .info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.82rem;
    }
    .cell-label {
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .cell-val {
      word-break: break-word;
    }

    .contract-card-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-detail-outline {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-detail-outline:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
    .btn-print-doc {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print-doc:hover {
      background: #e2e8f0;
    }
    .btn-checkout-sm {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-checkout-sm:hover {
      background: #dc2626;
      color: #ffffff;
    }

    /* Status Pills */
    .badge-status-pill {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .badge-status-active { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-status-expiring { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
    .badge-status-terminated { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .max-w-680 { max-width: 680px; width: 100%; }
    .max-w-780 { max-width: 780px; width: 100%; }
    .max-w-850 { max-width: 850px; width: 100%; }
    .modal-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 14px;
    }
    .modal-close-x {
      background: none;
      border: none;
      font-size: 1.8rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }
    .modal-close-x:hover { color: #0f172a; }

    /* Form groups in modal */
    .form-section-group {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .section-title-bold {
      font-size: 0.92rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .form-label-custom {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      display: block;
      margin-bottom: 5px;
    }
    .form-control-custom {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      outline: none;
      background: #ffffff;
      box-sizing: border-box;
    }
    .form-control-custom:focus {
      border-color: #2563eb;
    }
    .row-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .currency-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .input-money-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-money-suffix {
      position: absolute;
      right: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
    }
    .water-radio-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
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
      font-size: 0.85rem;
      font-weight: 700;
    }
    .radio-card-option.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
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
    .btn-submit-custom {
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-weight: 700;
      padding: 9px 20px;
      border-radius: 8px;
      cursor: pointer;
    }

    /* Large Contract View inside Modal */
    .large-contract-box {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
    }
    .contract-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 2px dashed #e2e8f0;
    }
    .contract-tag-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-weight: 800;
      font-size: 0.88rem;
      padding: 6px 12px;
      border-radius: 8px;
    }
    .contract-status-active {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #15803d;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .contract-validity-date {
      font-size: 0.85rem;
      color: #475569;
      background: #f8fafc;
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .contract-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    @media (max-width: 768px) {
      .contract-cards-grid { grid-template-columns: 1fr; }
    }
    .contract-info-block {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .block-highlight-blue {
      background: #f0f7ff;
      border-color: #bfdbfe;
    }
    .block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .block-title {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .block-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.82rem;
    }
    .info-label { color: #64748b; font-size: 0.75rem; font-weight: 600; }
    .price-highlight { font-size: 1.1rem; font-weight: 900; }
    .badge-rep { background: #e0e7ff; color: #3730a3; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; width: fit-content; }
    .badge-water-type { background: #e0f2fe; color: #0369a1; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; width: fit-content; }
    .contract-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 14px;
      border-top: 1.5px dashed #e2e8f0;
    }
    .btn-checkout-danger {
      background: #fee2e2;
      border: 1.5px solid #fca5a5;
      color: #b91c1c;
      font-weight: 700;
      padding: 9px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-checkout-danger:hover {
      background: #dc2626;
      color: #ffffff;
    }

    /* Legal Contract Paper Styling (Matching Vietnamese Standard Document) */
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
      width: 140px;
      height: 1.5px;
      background: #000000;
      margin: 6px auto 0 auto;
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
      height: 75px;
    }
    .sig-name {
      font-size: 1.02rem;
      margin: 0;
      color: #000000;
    }
    .btn-print-big {
      font-size: 0.95rem;
      padding: 10px 24px;
    }

    /* Print styling rules */
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
      #printableContract, #printableContract * {
        visibility: visible !important;
      }
      #printableContract {
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
    .empty-icon { font-size: 2.8rem; display: block; margin-bottom: 8px; }
  `]
})
export class LandlordContractsComponent implements OnInit {
  private readonly contractService = inject(ContractService);
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);

  allContracts = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  allRooms = signal<any[]>([]);
  isLoading = signal(true);

  // Filters signals
  selectedPropertyId = signal<number>(0);
  selectedRoomId = signal<number>(0);
  statusFilter = signal<string>('all'); // 'all' | 'Active' | 'Expiring' | 'Terminated'
  searchQuery = signal<string>('');
  selectedSort = signal<string>('newest');

  // Modals state
  showCheckInModal = signal(false);
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
    waterPricingType: 'fixed',
    waterUnitPrice: 100000
  };

  selectedDetailRoomId = signal<number | null>(null);
  roomDetail = signal<any | null>(null);
  isLoadingDetail = signal(false);

  showLegalDocModal = signal(false);
  legalDocData = signal<any | null>(null);
  isLoadingLegalDoc = signal(false);

  // Rooms available for current property filter
  availableRoomsForFilter = computed(() => {
    const propId = Number(this.selectedPropertyId());
    if (propId > 0) {
      return this.allRooms().filter(r => r.propertyId === propId);
    }
    return this.allRooms();
  });

  // KPI Counters
  activeContractsCount = computed(() => {
    return this.allContracts().filter(c => c.status === 'Active').length;
  });

  expiringContractsCount = computed(() => {
    return this.allContracts().filter(c => c.status === 'Active' && this.isExpiringSoon(c.endDate)).length;
  });

  terminatedContractsCount = computed(() => {
    return this.allContracts().filter(c => c.status === 'Terminated').length;
  });

  // Computed filtered and sorted contracts
  filteredContracts = computed(() => {
    let list = this.allContracts();
    const propId = Number(this.selectedPropertyId());
    const roomId = Number(this.selectedRoomId());
    const status = this.statusFilter();
    const search = this.searchQuery().toLowerCase().trim();
    const sort = this.selectedSort();

    // 1. Property Filter
    if (propId > 0) {
      list = list.filter(c => c.propertyId === propId);
    }

    // 2. Room Filter
    if (roomId > 0) {
      list = list.filter(c => c.roomId === roomId);
    }

    // 3. Status Filter
    if (status === 'Active') {
      list = list.filter(c => c.status === 'Active');
    } else if (status === 'Expiring') {
      list = list.filter(c => c.status === 'Active' && this.isExpiringSoon(c.endDate));
    } else if (status === 'Terminated') {
      list = list.filter(c => c.status === 'Terminated');
    }

    // 4. Search Filter
    if (search) {
      list = list.filter(c => 
        (c.tenantFullName && c.tenantFullName.toLowerCase().includes(search)) ||
        (c.tenantPhone && c.tenantPhone.toLowerCase().includes(search)) ||
        (c.tenantCccd && c.tenantCccd.toLowerCase().includes(search)) ||
        (c.roomNumber && c.roomNumber.toLowerCase().includes(search)) ||
        (c.propertyTitle && c.propertyTitle.toLowerCase().includes(search)) ||
        (c.id && c.id.toString().includes(search))
      );
    }

    // 5. Sorting
    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
    } else if (sort === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.createdAt || a.startDate).getTime() - new Date(b.createdAt || b.startDate).getTime());
    } else if (sort === 'price-desc') {
      list = [...list].sort((a, b) => (b.roomPrice || 0) - (a.roomPrice || 0));
    } else if (sort === 'price-asc') {
      list = [...list].sort((a, b) => (a.roomPrice || 0) - (b.roomPrice || 0));
    } else if (sort === 'expiring-soon') {
      list = [...list].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }

    return list;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['propertyId']) {
        this.selectedPropertyId.set(Number(params['propertyId']));
      }
      if (params['roomId']) {
        this.selectedRoomId.set(Number(params['roomId']));
      }
    });
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load Properties & Rooms
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
      },
      error: () => {}
    });

    // Load Contracts
    this.contractService.getContracts().subscribe({
      next: (contracts) => {
        this.allContracts.set(contracts);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách hợp đồng.', 'error');
      }
    });
  }

  refreshAll(): void {
    this.searchQuery.set('');
    this.selectedPropertyId.set(0);
    this.selectedRoomId.set(0);
    this.statusFilter.set('all');
    this.selectedSort.set('newest');
    this.loadData();
    this.toastService.show('Đã làm mới danh sách hợp đồng!', 'info');
  }

  onPropertyFilterChange(propId: any): void {
    this.selectedPropertyId.set(Number(propId));
    this.selectedRoomId.set(0); // reset room filter
  }

  isExpiringSoon(endDateStr: string): boolean {
    if (!endDateStr) return false;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = (end - now) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  getDaysRemaining(endDateStr: string): number {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  formatMoney(val: any): string {
    if (val === null || val === undefined || val === '') return '0 đ';
    const num = Number(val);
    if (isNaN(num)) return '0 đ';
    return num.toLocaleString('vi-VN') + ' đ';
  }

  // Open Contract Detail Modal (Large Dedicated View)
  openContractDetailModal(roomId: number): void {
    this.selectedDetailRoomId.set(roomId);
    this.isLoadingDetail.set(true);
    this.propertyService.getLandlordRoomDetail(roomId).subscribe({
      next: (detail) => {
        this.roomDetail.set(detail);
        this.isLoadingDetail.set(false);
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.toastService.show('Lỗi tải thông tin chi tiết hợp đồng.', 'error');
      }
    });
  }

  closeContractDetailModal(): void {
    this.selectedDetailRoomId.set(null);
    this.roomDetail.set(null);
  }

  // Open Check-in (Chuyển sang trang tạo hợp đồng mới)
  openCheckInModal(): void {
    this.router.navigate(['/landlord/create-contract']);
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
        this.showCheckInModal.set(false);
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi khi lập hợp đồng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  triggerCheckOut(contractId: number, roomNumber: string): void {
    if (!confirm(`Bạn có chắc chắn muốn kết thúc và thanh lý hợp đồng của phòng ${roomNumber}?`)) return;

    this.contractService.checkOut(contractId).subscribe({
      next: () => {
        this.toastService.show(`Đã thanh lý hợp đồng phòng ${roomNumber} thành công!`, 'success');
        this.closeContractDetailModal();
        this.loadData();
      },
      error: (err) => this.toastService.show(err.error || 'Lỗi thanh lý hợp đồng.', 'error')
    });
  }

  // Legal Doc Modal
  openLegalDocModal(contractId: number): void {
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
    const content = document.getElementById('printableContract')?.innerHTML;
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

    const blob = new Blob(['\\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = url;
    link.download = fileName;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toastService.show(`Đã xuất file Word hợp đồng cho khách ${tenantName}!`, 'success');
  }
}
