import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landlord-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bills-container">
      
      <!-- Top Title & Fast Action Row -->
      <div class="header-action-row mb-4">
        <div>
          <h1 class="page-main-title m-0">QUẢN LÝ HÓA ĐƠN & THU TIỀN HÀNG THÁNG</h1>
          <p class="text-muted text-sm m-0 mt-1">Theo dõi chi tiết tiền phòng, điện nước, công nợ hàng tháng phân chia theo từng khu trọ và từng phòng</p>
        </div>
        <div class="header-btns-wrap">
          <button type="button" class="btn-refresh-clean" (click)="refreshAll()">
            Làm mới
          </button>
          <a routerLink="/landlord/utility-grid" class="btn-primary-action">
            Lập Hóa Đơn Điện Nước & Tiền Phòng
          </a>
        </div>
      </div>

      <!-- KPI Revenue Summary Stats (Dynamic with current monthly filters) -->
      <div class="summary-stats-grid mb-4">
        <div class="summary-stat-card border-sky" (click)="selectedStatus.set('All')">
          <div class="stat-icon bg-sky-light"></div>
          <div class="stat-info">
            <span class="stat-label">Tổng Doanh Thu Dự Thu</span>
            <strong class="stat-value text-sky">{{ totalExpectedRevenue() | number:'1.0-0' }} đ</strong>
            <span class="stat-sub text-xs text-muted">{{ filteredBills().length }} hóa đơn</span>
          </div>
        </div>

        <div class="summary-stat-card border-emerald" (click)="selectedStatus.set('Paid')">
          <div class="stat-icon bg-emerald-light"></div>
          <div class="stat-info">
            <span class="stat-label">Thực Thu (Đã Thu)</span>
            <strong class="stat-value text-emerald">{{ totalPaidRevenue() | number:'1.0-0' }} đ</strong>
            <span class="stat-sub text-xs text-emerald">Đạt {{ collectionRate() }}% chỉ tiêu</span>
          </div>
        </div>

        <div class="summary-stat-card border-rose" (click)="selectedStatus.set('Unpaid')">
          <div class="stat-icon bg-rose-light"></div>
          <div class="stat-info">
            <span class="stat-label">Công Nợ Còn Lại</span>
            <strong class="stat-value text-rose">{{ totalRemainingRevenue() | number:'1.0-0' }} đ</strong>
            <span class="stat-sub text-xs text-rose">{{ unpaidBillsCount() }} phòng chưa xong</span>
          </div>
        </div>
      </div>

      <!-- Multi-Dimensional Filter Bar (Kỳ Tháng/Năm, Khu trọ, Phòng, Trạng thái, Tìm kiếm) -->
      <div class="filters-card-wrapper mb-4">
        
        <!-- Row 1: Month/Year navigation bar -->
        <div class="month-selector-bar mb-3">
          <div class="month-nav-group">
            <button type="button" class="btn-month-nav" (click)="prevMonth()">◀ Tháng trước</button>
            <div class="current-month-display">
              <strong>{{ selectedMonth() === 0 ? 'Tất Cả Các Tháng' : 'Tháng ' + selectedMonth() + ' / ' + selectedYear() }}</strong>
            </div>
            <button type="button" class="btn-month-nav" (click)="nextMonth()">Tháng sau ▶</button>
          </div>

          <div class="month-quick-pills">
            <button 
              type="button" 
              class="quick-pill-btn" 
              [class.active]="selectedMonth() === currentCalendarMonth && selectedYear() === currentCalendarYear"
              (click)="setCurrentMonth()">
              Tháng Hiện Tại ({{ currentCalendarMonth }}/{{ currentCalendarYear }})
            </button>
            <button 
              type="button" 
              class="quick-pill-btn" 
              [class.active]="selectedMonth() === 0"
              (click)="selectedMonth.set(0)">
              Tất Cả Các Tháng
            </button>
          </div>
        </div>

        <!-- Row 2: Selectors Grid -->
        <div class="filters-grid">
          
          <!-- 1. Chọn Tháng/Năm Dropdown -->
          <div class="filter-item">
            <label class="filter-label">Kỳ Hóa Đơn (Tháng/Năm)</label>
            <select [ngModel]="selectedMonth()" (ngModelChange)="onMonthSelect($event)" class="filter-select">
              <option [value]="0">-- Tất cả các tháng --</option>
              @for (m of availableMonthsList(); track m.value) {
                <option [value]="m.month">{{ m.label }}</option>
              }
            </select>
          </div>

          <!-- 2. Lọc theo Khu trọ (Nhà trọ) -->
          <div class="filter-item">
            <label class="filter-label">Chọn Khu Trọ (Nhà trọ)</label>
            <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyChange($event)" class="filter-select">
              <option [value]="0">-- Tất cả khu trọ ({{ propertyList().length }}) --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.id">{{ p.title }}</option>
              }
            </select>
          </div>

          <!-- 3. Lọc theo Phòng của Khu trọ -->
          <div class="filter-item">
            <label class="filter-label">Chọn Phòng</label>
            <select [ngModel]="selectedRoomId()" (ngModelChange)="selectedRoomId.set(+$event)" class="filter-select" [disabled]="selectedPropertyId() === 0">
              <option [value]="0">-- Tất cả phòng {{ selectedPropertyId() > 0 ? '(' + availableRoomsForFilter().length + ')' : '' }} --</option>
              @for (r of availableRoomsForFilter(); track r.id) {
                <option [value]="r.id">Phòng {{ r.roomNumber }}</option>
              }
            </select>
          </div>

          <!-- 4. Tìm kiếm nhanh -->
          <div class="filter-item search-filter-item">
            <label class="filter-label">Tìm kiếm hóa đơn</label>
            <div class="search-input-box">
              <input 
                type="text" 
                [ngModel]="searchQuery()" 
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Nhập số phòng, tên khách, SĐT..." 
                class="filter-search-input" />
              @if (searchQuery()) {
                <button type="button" class="btn-clear-search" (click)="searchQuery.set('')">&times;</button>
              }
            </div>
          </div>

        </div>

        <!-- Row 3: Status Filter Tabs -->
        <div class="status-tabs-row mt-3">
          <button 
            type="button" 
            class="tab-filter-btn" 
            [class.active]="selectedStatus() === 'All'" 
            (click)="selectedStatus.set('All')">
            Tất cả hóa đơn ({{ filteredByMonthBills().length }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn tab-btn-pending" 
            [class.active]="selectedStatus() === 'PendingConfirmation'" 
            (click)="selectedStatus.set('PendingConfirmation')">
            ⏳ Chờ xác nhận chuyển tiền ({{ countByStatus('PendingConfirmation') }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn tab-btn-danger" 
            [class.active]="selectedStatus() === 'Unpaid'" 
            (click)="selectedStatus.set('Unpaid')">
            Chưa thanh toán ({{ countByStatus('Unpaid') }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn tab-btn-warning" 
            [class.active]="selectedStatus() === 'Partial'" 
            (click)="selectedStatus.set('Partial')">
            Thu một phần ({{ countByStatus('Partial') }})
          </button>
          <button 
            type="button" 
            class="tab-filter-btn tab-btn-success" 
            [class.active]="selectedStatus() === 'Paid'" 
            (click)="selectedStatus.set('Paid')">
            Đã thu đủ ({{ countByStatus('Paid') }})
          </button>
        </div>
      </div>

      <!-- Main Content: Grouped by Property & Detailed by Room -->
      @if (isLoading()) {
        <div class="loading-state-card py-5 text-center">
          <div class="spinner mb-2"></div>
          <p class="text-muted">Đang tải dữ liệu hóa đơn...</p>
        </div>
      } @else if (groupedPropertiesWithBills().length === 0) {
        <div class="empty-state-card py-5 text-center">
          <span class="empty-icon"></span>
          <h3 class="font-bold text-dark mb-1">Không Có Hóa Đơn Nào Phù Hợp</h3>
          <p class="text-muted text-sm mb-4">
            @if (selectedMonth() > 0) {
              Chưa có hóa đơn nào được lập cho kỳ Tháng {{ selectedMonth() }}/{{ selectedYear() }}. Hãy tạo hóa đơn ngay!
            } @else {
              Không tìm thấy hóa đơn nào phù hợp với bộ lọc hiện tại.
            }
          </p>
          <a routerLink="/landlord/utility-grid" class="btn-primary-action">
            Lập Hóa Đơn Cho Tháng Này
          </a>
        </div>
      } @else {
        
        <!-- List of Properties Grouped with their Room Bills -->
        <div class="properties-bills-stack">
          @for (group of groupedPropertiesWithBills(); track group.propertyId) {
            <div class="property-bills-group-card mb-4">
              
              <!-- Property Header Summary Bar -->
              <div class="property-group-header" (click)="togglePropertyCollapse(group.propertyId)">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <span class="prop-collapse-icon">{{ isPropertyCollapsed(group.propertyId) ? '▶' : '▼' }}</span>
                  <div>
                    <h3 class="prop-group-title m-0">{{ group.propertyTitle }}</h3>
                    <p class="prop-group-address text-xs text-muted m-0 mt-1">{{ group.propertyAddress || 'Đang cập nhật địa chỉ' }}</p>
                  </div>
                </div>

                <!-- Summary KPIs for this specific property -->
                <div class="prop-kpis-summary-bar">
                  <div class="prop-kpi-chip">
                    <span class="chip-label">Số phòng:</span>
                    <strong class="chip-val text-dark">{{ group.bills.length }} phòng</strong>
                  </div>
                  <div class="prop-kpi-chip">
                    <span class="chip-label">Dự thu:</span>
                    <strong class="chip-val text-sky">{{ group.totalAmount | number:'1.0-0' }} đ</strong>
                  </div>
                  <div class="prop-kpi-chip">
                    <span class="chip-label">Đã thu:</span>
                    <strong class="chip-val text-emerald">{{ group.paidAmount | number:'1.0-0' }} đ</strong>
                  </div>
                  @if (group.remainingAmount > 0) {
                    <div class="prop-kpi-chip chip-danger">
                      <span class="chip-label">Còn nợ:</span>
                      <strong class="chip-val text-rose">{{ group.remainingAmount | number:'1.0-0' }} đ</strong>
                    </div>
                  }
                </div>
              </div>

              <!-- Property Room Bills Table / Grid (Collapsible) -->
              @if (!isPropertyCollapsed(group.propertyId)) {
                <div class="table-responsive-wrapper">
                  <table class="modern-bills-table">
                    <thead>
                      <tr>
                        <th>Phòng</th>
                        <th>Khách Thuê</th>
                        <th>Kỳ Hóa Đơn</th>
                        <th>Tiền Phòng</th>
                        <th>Điện (Sử Dụng)</th>
                        <th>Nước (Sử Dụng)</th>
                        <th>Dịch Vụ / Khấu Trừ</th>
                        <th>Tổng Cần Thu</th>
                        <th>Đã Thu</th>
                        <th>Còn Nợ</th>
                        <th>Trạng Thái</th>
                        <th class="text-end">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (bill of group.bills; track bill.id) {
                        <tr [class.row-unpaid]="bill.status === 'Unpaid'" [class.row-paid]="bill.status === 'Paid'">
                          
                          <!-- Room Number -->
                          <td>
                            <strong class="room-number-badge">P.{{ bill.roomNumber }}</strong>
                          </td>

                          <!-- Tenant -->
                          <td>
                            <div class="tenant-cell-info">
                              <strong class="tenant-name-text">{{ bill.tenantName || 'Khách thuê' }}</strong>
                              @if (bill.tenantPhone) {
                                <a [href]="'tel:' + bill.tenantPhone" class="tenant-phone-link">{{ bill.tenantPhone }}</a>
                              }
                            </div>
                          </td>

                          <!-- Billing Period -->
                          <td>
                            <span class="month-pill-badge">Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</span>
                          </td>

                          <!-- Room Fee -->
                          <td>
                            <strong class="text-dark">{{ bill.roomFee | number:'1.0-0' }} đ</strong>
                          </td>

                          <!-- Electricity -->
                          <td>
                            <div class="usage-cell-block">
                              <strong class="text-amber">{{ bill.electricityFee | number:'1.0-0' }} đ</strong>
                              <span class="cell-sub-note">{{ bill.electricityNewReading - bill.electricityOldReading }} số ({{ bill.electricityOldReading }}→ {{ bill.electricityNewReading }})</span>
                            </div>
                          </td>

                          <!-- Water -->
                          <td>
                            <div class="usage-cell-block">
                              <strong class="text-sky">{{ bill.waterFee | number:'1.0-0' }} đ</strong>
                              <span class="cell-sub-note">{{ bill.waterNewReading - bill.waterOldReading }} m³ ({{ bill.waterOldReading }}→ {{ bill.waterNewReading }})</span>
                            </div>
                          </td>

                          <!-- Service & Deductions -->
                          <td>
                            <div class="fee-cell-block">
                              <span class="text-dark">+{{ bill.serviceFee | number:'1.0-0' }} đ</span>
                              @if (bill.repairDeduction > 0) {
                                <span class="text-rose text-xs">-{{ bill.repairDeduction | number:'1.0-0' }} đ</span>
                              }
                            </div>
                          </td>

                          <!-- Total Amount -->
                          <td>
                            <strong class="total-amount-highlight">{{ bill.totalAmount | number:'1.0-0' }} đ</strong>
                          </td>

                          <!-- Paid Amount -->
                          <td>
                            <strong class="text-emerald">{{ bill.paidAmount | number:'1.0-0' }} đ</strong>
                          </td>

                          <!-- Remaining Amount -->
                          <td>
                            <strong class="text-rose font-bold">{{ bill.remainingAmount | number:'1.0-0' }} đ</strong>
                          </td>

                          <!-- Status -->
                          <td>
                            <span class="badge-status-pill"
                                  [class.badge-status-paid]="bill.status === 'Paid'"
                                  [class.badge-status-pending]="bill.status === 'PendingConfirmation'"
                                  [class.badge-status-partial]="bill.status === 'Partial' || bill.status === 'PartialPaid'"
                                  [class.badge-status-unpaid]="bill.status === 'Unpaid'">
                              @if (bill.status === 'Paid') {
                                Đã thu đủ
                              } @else if (bill.status === 'PendingConfirmation') {
                                ⏳ Chờ duyệt chuyển tiền
                              } @else if (bill.status === 'Partial' || bill.status === 'PartialPaid') {
                                Thu một phần
                              } @else {
                                Chưa thu
                              }
                            </span>
                          </td>

                          <!-- Action Buttons -->
                          <td class="text-end">
                            <div class="action-buttons-wrap justify-content-end">
                              <button type="button" (click)="viewInvoice(bill)" class="btn-action-outline" title="Xem chi tiết và in hóa đơn">
                                Hóa đơn
                              </button>

                              @if (bill.proofImageUrl) {
                                <button type="button" (click)="viewProofImage(bill.proofImageUrl)" class="btn-action-proof" style="background: #eff6ff; border: 1.5px solid #93c5fd; color: #1d4ed8; font-size: 0.8rem; font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer;" title="Xem ảnh chụp biên lai chuyển khoản">
                                  📸 Xem bill CK
                                </button>
                              }

                              @if (bill.status === 'PendingConfirmation') {
                                <button type="button" (click)="confirmPendingPayment(bill)" class="btn-action-confirm-pay" title="Xác nhận khách đã chuyển tiền thành công">
                                   Xác nhận đã nhận tiền
                                </button>
                                <button type="button" (click)="openRejectModal(bill)" class="btn-action-reject" title="Từ chối do chưa nhận được tiền">
                                  ❌ Từ chối
                                </button>
                              } @else if (bill.status !== 'Paid') {
                                <button type="button" (click)="openPayModal(bill)" class="btn-action-pay" title="Xác nhận thu tiền hàng tháng">
                                  Thu tiền
                                </button>
                                <button type="button" (click)="sendEmail(bill.id)" class="btn-action-email" title="Gửi email nhắc nợ">
                                  ✉️
                                </button>
                              }
                            </div>
                          </td>

                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- ================= MODALS ================= -->

      <!-- 1. MODAL THU TIỀN HÀNG THÁNG (THANH TOÁN) -->
      @if (showPayModal(); as bill) {
        <div class="modal-backdrop" (click)="showPayModal.set(null)">
          <div class="modal-card max-w-520" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0">THU TIỀN HÀNG THÁNG - PHÒNG {{ bill.roomNumber }}</h2>
              <button (click)="showPayModal.set(null)" class="modal-close-x">&times;</button>
            </div>

            <div class="pay-modal-body mt-3">
              <div class="bill-summary-banner p-3 mb-3">
                <div class="d-flex justify-content-between text-sm mb-1">
                  <span>Kỳ hóa đơn:</span>
                  <strong>Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</strong>
                </div>
                <div class="d-flex justify-content-between text-sm mb-1">
                  <span>Khách thuê:</span>
                  <strong>{{ bill.tenantName }} ({{ bill.tenantPhone }})</strong>
                </div>
                <div class="d-flex justify-content-between text-sm mb-1">
                  <span>Tổng tiền hóa đơn:</span>
                  <strong class="text-primary">{{ bill.totalAmount | number:'1.0-0' }} đ</strong>
                </div>
                <div class="d-flex justify-content-between text-sm mb-1">
                  <span>Đã thanh toán trước đó:</span>
                  <strong class="text-emerald">{{ bill.paidAmount | number:'1.0-0' }} đ</strong>
                </div>
                <div class="d-flex justify-content-between text-sm pt-2 border-top">
                  <span>Số tiền còn nợ:</span>
                  <strong class="text-rose font-lg">{{ bill.remainingAmount | number:'1.0-0' }} đ</strong>
                </div>
              </div>

              <!-- Input Amount to Pay -->
              <div class="form-group mb-3">
                <label class="form-label-custom">Số tiền khách thanh toán (VNĐ) <span class="text-danger">*</span></label>
                <div class="input-money-box">
                  <input 
                    type="number" 
                    [ngModel]="payAmountInput()" 
                    (ngModelChange)="payAmountInput.set(+$event)" 
                    class="form-control-custom" 
                    placeholder="Nhập số tiền thu" />
                  <span class="money-suffix">VNĐ</span>
                </div>
                <div class="quick-pay-tags mt-2">
                  <button type="button" class="btn-quick-fill" (click)="payAmountInput.set(bill.remainingAmount)">
                    Điền đủ số tiền còn lại ({{ bill.remainingAmount | number:'1.0-0' }} đ)
                  </button>
                </div>
              </div>

              <!-- Payment Method & Note -->
              <div class="form-group mb-3">
                <label class="form-label-custom">Hình thức thu tiền</label>
                <select [ngModel]="payNote()" (ngModelChange)="payNote.set($event)" class="form-control-custom">
                  <option value="Tiền mặt">Tiền mặt trực tiếp</option>
                  <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng / Quét QR</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div class="modal-actions-footer mt-4">
                <button type="button" class="btn-cancel-custom" (click)="showPayModal.set(null)">Hủy</button>
                <button type="button" class="btn-submit-custom btn-confirm-pay" (click)="confirmPayment(bill.id)">
                  Xác Nhận Đã Thu {{ payAmountInput() | number:'1.0-0' }} đ
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- 2. DETAILED RECEIPT MODAL (IN HÓA ĐƠN TIỀN NHÀ CHUẨN) -->
      @if (activeInvoice(); as bill) {
        <div class="modal-backdrop" (click)="closeInvoice()">
          <div class="modal-card max-w-680 print-card" (click)="$event.stopPropagation()">
            <div class="modal-header-clean no-print">
              <h2 class="modal-main-title m-0">HÓA ĐƠN TIỀN NHÀ THÁNG {{ bill.billingMonth }}/{{ bill.billingYear }}</h2>
              <button (click)="closeInvoice()" class="modal-close-x">&times;</button>
            </div>
            
            <div id="printable-receipt" class="receipt-content mt-3 p-4">
              <div class="receipt-header text-center mb-4">
                <h2 class="receipt-brand m-0">HÓA ĐƠN TIỀN PHÒNG & DỊCH VỤ</h2>
                <p class="text-sm text-muted m-0 mt-1">Kỳ thanh toán: Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</p>
                <div class="receipt-divider my-2"></div>
                <h3 class="receipt-property-name m-0">{{ bill.propertyTitle }}</h3>
                <p class="text-xs text-muted m-0">{{ bill.propertyAddress }}</p>
              </div>

              <div class="receipt-customer-info mb-3">
                <div class="row-2-cols">
                  <div>
                    <span class="text-xs text-muted">Phòng trọ:</span>
                    <strong class="d-block font-lg">Phòng {{ bill.roomNumber }}</strong>
                  </div>
                  <div class="text-end">
                    <span class="text-xs text-muted">Khách thuê đại diện:</span>
                    <strong class="d-block font-lg">{{ bill.tenantName }}</strong>
                    <span class="text-xs text-muted">{{ bill.tenantPhone }}</span>
                  </div>
                </div>
              </div>

              <!-- Details Table -->
              <table class="receipt-breakdown-table mb-4">
                <thead>
                  <tr>
                    <th>Khoản mục</th>
                    <th>Chỉ số / Số lượng</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tiền thuê phòng</td>
                    <td>1 tháng</td>
                    <td class="text-end font-bold">{{ bill.roomFee | number:'1.0-0' }} đ</td>
                  </tr>
                  <tr>
                    <td>Tiền điện sinh hoạt</td>
                    <td>{{ bill.electricityNewReading - bill.electricityOldReading }} số ({{ bill.electricityOldReading }} → {{ bill.electricityNewReading }})</td>
                    <td class="text-end font-bold">{{ bill.electricityFee | number:'1.0-0' }} đ</td>
                  </tr>
                  <tr>
                    <td>Tiền nước sạch</td>
                    <td>{{ bill.waterNewReading - bill.waterOldReading }} m³ ({{ bill.waterOldReading }} → {{ bill.waterNewReading }})</td>
                    <td class="text-end font-bold">{{ bill.waterFee | number:'1.0-0' }} đ</td>
                  </tr>
                  @if (bill.serviceFee > 0) {
                    <tr>
                      <td>Phí dịch vụ khác (Wifi, rác, vệ sinh...)</td>
                      <td>Trọn gói tháng</td>
                      <td class="text-end font-bold">+{{ bill.serviceFee | number:'1.0-0' }} đ</td>
                    </tr>
                  }
                  @if (bill.repairDeduction > 0) {
                    <tr>
                      <td>Khấu trừ sửa chữa</td>
                      <td>Hỗ trợ chi phí</td>
                      <td class="text-end font-bold text-rose">-{{ bill.repairDeduction | number:'1.0-0' }} đ</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="tfoot-total">
                    <th colspan="2">TỔNG CỘNG TIỀN PHÒNG & TIỆN ÍCH</th>
                    <th class="text-end text-primary font-xl">{{ bill.totalAmount | number:'1.0-0' }} đ</th>
                  </tr>
                  <tr>
                    <td colspan="2">Số tiền đã thanh toán</td>
                    <td class="text-end text-emerald font-bold">{{ bill.paidAmount | number:'1.0-0' }} đ</td>
                  </tr>
                  <tr class="tfoot-remaining">
                    <th colspan="2">SỐ TIỀN CÒN PHẢI THANH TOÁN</th>
                    <th class="text-end text-rose font-lg">{{ bill.remainingAmount | number:'1.0-0' }} đ</th>
                  </tr>
                </tfoot>
              </table>

              <div class="receipt-footer text-center text-xs text-muted pt-3 border-top">
                <p class="m-0">Cảm ơn quý khách đã thanh toán đúng hạn! Mọi thắc mắc xin liên hệ chủ nhà.</p>
                <p class="m-0 mt-1">Ngày xuất phiếu: {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>

            <div class="modal-actions-footer mt-4 no-print">
              <button type="button" class="btn-cancel-custom" (click)="closeInvoice()">Đóng</button>
              <button type="button" class="btn-submit-custom" (click)="printReceipt()">In Hóa Đơn</button>
            </div>
          </div>
        </div>
      }

      <!-- 3. REJECT PAYMENT MODAL -->
      @if (showRejectModal(); as bill) {
        <div class="modal-backdrop" (click)="closeRejectModal()">
          <div class="modal-card max-w-450" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0" style="color: #dc2626;">TỪ CHỐI XÁC NHẬN CHUYỂN TIỀN</h2>
              <button (click)="closeRejectModal()" class="modal-close-x">&times;</button>
            </div>

            <p class="text-sm text-muted mt-2">
              Bạn đang từ chối xác nhận thanh toán cho Phòng <strong>{{ bill.roomNumber }}</strong> (Khách: {{ bill.tenantName }}). Hóa đơn sẽ quay lại trạng thái Chưa thanh toán và khách thuê sẽ nhận được thông báo kèm lý do.
            </p>

            <form (ngSubmit)="submitRejectPayment()" class="mt-3">
              <div class="form-group mb-3 text-start">
                <label class="form-label-custom">Lý do từ chối (Gửi thông báo tới khách thuê)</label>
                <textarea 
                  [ngModel]="rejectReason()" 
                  (ngModelChange)="rejectReason.set($event)"
                  name="rejectReason"
                  class="form-control-custom" 
                  rows="3" 
                  placeholder="VD: Chủ trọ chưa kiểm tra thấy tiền vào tài khoản ngân hàng..."></textarea>
              </div>

              <div class="modal-actions-footer mt-4">
                <button type="button" class="btn-cancel-custom" (click)="closeRejectModal()">Hủy</button>
                <button type="submit" class="btn-submit-custom" style="background: #dc2626 !important; border: none; color: white !important;">
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 4. PROOF RECEIPT IMAGE PREVIEW MODAL -->
      @if (previewProofUrl(); as proofUrl) {
        <div class="modal-backdrop" (click)="previewProofUrl.set(null)">
          <div class="modal-card max-w-600 text-center" (click)="$event.stopPropagation()" style="background: #ffffff !important; color: #0f172a !important; border-radius: 20px; padding: 24px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 style="color: #0f172a; font-weight: 800; margin: 0; font-size: 1.15rem;">📸 Minh Chứng Chuyển Khoản Của Khách</h3>
              <button (click)="previewProofUrl.set(null)" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">&times;</button>
            </div>
            <div style="max-height: 65vh; overflow: auto; background: #f8fafc; border-radius: 12px; padding: 12px; border: 1.5px solid #e2e8f0;">
              <img [src]="getFullImageUrl(proofUrl)" alt="Ảnh minh chứng chuyển khoản" style="max-width: 100%; border-radius: 8px; object-fit: contain;">
            </div>
            <div class="mt-3 d-flex justify-content-end">
              <button class="btn-cancel-custom px-4" (click)="previewProofUrl.set(null)">Đóng xem ảnh</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .bills-container {
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
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary-action:hover {
      background: #1d4ed8;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }

    /* KPI Summary Stats */
    .summary-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 768px) {
      .summary-stats-grid {
        grid-template-columns: 1fr;
      }
    }
    .summary-stat-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .summary-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    }
    .border-sky:hover { border-color: #38bdf8; }
    .border-emerald:hover { border-color: #34d399; }
    .border-rose:hover { border-color: #fb7185; }
    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .bg-sky-light { background: #e0f2fe; }
    .bg-emerald-light { background: #dcfce7; }
    .bg-rose-light { background: #ffe4e6; }
    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 1.45rem;
      font-weight: 900;
    }
    .text-sky { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }

    /* Filters Card */
    .filters-card-wrapper {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .month-selector-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .month-nav-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-month-nav {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-month-nav:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }
    .current-month-display {
      font-size: 1rem;
      color: #0f172a;
      background: #f8fafc;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .month-quick-pills {
      display: flex;
      gap: 8px;
    }
    .quick-pill-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
    }
    .quick-pill-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1.5fr 2.5fr;
      gap: 12px;
    }
    @media (max-width: 992px) {
      .filters-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 600px) {
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
      font-weight: 700;
      color: #475569;
    }
    .filter-select {
      height: 40px;
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
      height: 40px;
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
    .tab-filter-btn:hover { background: #e2e8f0; }
    .tab-filter-btn.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
    }
    .tab-btn-pending.active { background: #f59e0b; border-color: #f59e0b; }
    .tab-btn-danger.active { background: #dc2626; border-color: #dc2626; }
    .tab-btn-warning.active { background: #d97706; border-color: #d97706; }
    .tab-btn-success.active { background: #16a34a; border-color: #16a34a; }

    /* Property Bills Group Card */
    .property-bills-group-card {
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
    .prop-collapse-icon {
      font-size: 0.85rem;
      color: #64748b;
    }
    .prop-group-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .prop-kpis-summary-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .prop-kpi-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      display: flex;
      gap: 4px;
    }
    .chip-danger {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .chip-label { color: #64748b; font-weight: 600; }

    /* Modern Bills Table */
    .table-responsive-wrapper {
      overflow-x: auto;
    }
    .modern-bills-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .modern-bills-table th {
      background: #f8fafc;
      padding: 12px 14px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .modern-bills-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .modern-bills-table tr:hover {
      background: #fafafa;
    }
    .row-unpaid { background: #fffcfc; }
    .row-pending-confirm { background: #fffdf5 !important; }
    .room-number-badge {
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 800;
    }
    .tenant-cell-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tenant-name-text {
      color: #0f172a;
      font-weight: 700;
    }
    .tenant-phone-link {
      font-size: 0.75rem;
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    .month-pill-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
      white-space: nowrap;
    }
    .usage-cell-block, .fee-cell-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cell-sub-note {
      font-size: 0.72rem;
      color: #64748b;
    }
    .total-amount-highlight {
      font-size: 1rem;
      font-weight: 900;
      color: #0f172a;
    }

    .badge-status-pill {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 12px;
      white-space: nowrap;
    }
    .badge-status-paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-status-pending { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
    .badge-status-partial { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-status-unpaid { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

    .action-buttons-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action-outline {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-action-outline:hover { background: #e2e8f0; }
    .btn-action-confirm-pay {
      background: #16a34a;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
      transition: all 0.15s ease;
    }
    .btn-action-confirm-pay:hover { background: #15803d; }
    .btn-action-reject {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-action-reject:hover { background: #fecaca; }
    .btn-action-pay {
      background: #2563eb;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-action-pay:hover { background: #1d4ed8; }
    .btn-action-email {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-size: 0.85rem;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Modal Styles */
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
    .max-w-520 { max-width: 520px; width: 100%; }
    .max-w-680 { max-width: 680px; width: 100%; }
    .modal-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
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

    .bill-summary-banner {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
    }
    .input-money-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .money-suffix {
      position: absolute;
      right: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
    }
    .btn-quick-fill {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-confirm-pay {
      background: #16a34a;
    }
    .btn-confirm-pay:hover {
      background: #15803d;
    }

    /* Receipt Print Layout */
    .receipt-content {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .receipt-brand {
      font-size: 1.3rem;
      font-weight: 900;
      color: #0f172a;
    }
    .receipt-divider {
      width: 80px;
      height: 2px;
      background: #2563eb;
      margin: 8px auto;
    }
    .receipt-property-name {
      font-size: 1.05rem;
      font-weight: 800;
    }
    .receipt-breakdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .receipt-breakdown-table th, .receipt-breakdown-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .receipt-breakdown-table thead th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .tfoot-total th, .tfoot-total td {
      border-top: 2px solid #0f172a;
      background: #f8fafc;
    }
    .tfoot-remaining th, .tfoot-remaining td {
      background: #fff1f2;
      border-top: 1px dashed #fecdd3;
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

    @media print {
      body * { visibility: hidden; }
      .no-print { display: none !important; }
      #printable-receipt, #printable-receipt * { visibility: visible; }
      #printable-receipt {
        position: absolute;
        left: 0; top: 0; width: 100%;
        border: none; box-shadow: none; padding: 0;
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
export class LandlordBillsComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly propertyService = inject(PropertyService);
  readonly toastService = inject(ToastService);

  today = new Date();
  currentCalendarMonth = new Date().getMonth() + 1;
  currentCalendarYear = new Date().getFullYear();

  bills = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  allRooms = signal<any[]>([]);
  isLoading = signal(true);

  // Filters
  selectedMonth = signal<number>(new Date().getMonth() + 1); // 0 = all months, 1..12
  selectedYear = signal<number>(new Date().getFullYear());
  selectedPropertyId = signal<number>(0);
  selectedRoomId = signal<number>(0);
  selectedStatus = signal<string>('All'); // 'All' | 'Unpaid' | 'Partial' | 'Paid'
  searchQuery = signal<string>('');
  collapsedProperties = signal<Set<number>>(new Set());

  // Modals state
  activeInvoice = signal<any | null>(null);
  showPayModal = signal<any | null>(null);
  showRejectModal = signal<any | null>(null);
  rejectReason = signal<string>('');
  payAmountInput = signal<number>(0);
  payNote = signal<string>('Tiền mặt');
  previewProofUrl = signal<string | null>(null);

  viewProofImage(url: string): void {
    this.previewProofUrl.set(url);
  }

  getFullImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : 'http://localhost:5000' + url;
  }

  // Computed: available rooms for selected property
  availableRoomsForFilter = computed(() => {
    const propId = Number(this.selectedPropertyId());
    if (propId > 0) {
      return this.allRooms().filter(r => r.propertyId === propId);
    }
    return this.allRooms();
  });

  // Computed: List of month/year options available from existing bills or calendar
  availableMonthsList = computed(() => {
    const list: { month: number; year: number; label: string; value: string }[] = [];
    const now = new Date();
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      list.push({
        month: m,
        year: y,
        label: `Tháng ${m}/${y}` + (m === this.currentCalendarMonth && y === this.currentCalendarYear ? ' (Hiện tại)' : ''),
        value: `${m}-${y}`
      });
    }
    return list;
  });

  // Computed: Filtered by Month & Year only (for counters)
  filteredByMonthBills = computed(() => {
    let list = this.bills();
    const month = Number(this.selectedMonth());
    const year = Number(this.selectedYear());

    if (month > 0) {
      list = list.filter(b => b.billingMonth === month && b.billingYear === year);
    }
    return list;
  });

  // Computed: Filtered with all criteria
  filteredBills = computed(() => {
    let list = this.filteredByMonthBills();
    const propId = Number(this.selectedPropertyId());
    const roomId = Number(this.selectedRoomId());
    const status = this.selectedStatus();
    const search = this.searchQuery().toLowerCase().trim();

    if (propId > 0) {
      list = list.filter(b => b.propertyId === propId);
    }

    if (roomId > 0) {
      list = list.filter(b => b.roomId === roomId);
    }

    if (status === 'Paid') {
      list = list.filter(b => b.status === 'Paid');
    } else if (status === 'PendingConfirmation') {
      list = list.filter(b => b.status === 'PendingConfirmation');
    } else if (status === 'Partial') {
      list = list.filter(b => b.status === 'Partial' || b.status === 'PartialPaid');
    } else if (status === 'Unpaid') {
      list = list.filter(b => b.status === 'Unpaid');
    }

    if (search) {
      list = list.filter(b => 
        (b.roomNumber && b.roomNumber.toLowerCase().includes(search)) ||
        (b.tenantName && b.tenantName.toLowerCase().includes(search)) ||
        (b.tenantPhone && b.tenantPhone.toLowerCase().includes(search)) ||
        (b.propertyTitle && b.propertyTitle.toLowerCase().includes(search))
      );
    }

    const getStatusPriority = (s?: string) => {
      if (s === 'PendingConfirmation') return 1;
      if (s === 'Unpaid' || s === 'Partial' || s === 'PartialPaid') return 2;
      if (s === 'Paid') return 3;
      return 2;
    };

    return [...list].sort((a, b) => {
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;
      if (b.billingYear !== a.billingYear) return (b.billingYear || 0) - (a.billingYear || 0);
      if (b.billingMonth !== a.billingMonth) return (b.billingMonth || 0) - (a.billingMonth || 0);
      return (a.roomNumber || '').localeCompare(b.roomNumber || '', undefined, { numeric: true });
    });
  });

  // Computed: Grouped by Property with detail rooms for each property
  groupedPropertiesWithBills = computed(() => {
    const list = this.filteredBills();
    const map = new Map<number, {
      propertyId: number;
      propertyTitle: string;
      propertyAddress: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      bills: any[];
    }>();

    for (const b of list) {
      const pId = b.propertyId || 0;
      if (!map.has(pId)) {
        map.set(pId, {
          propertyId: pId,
          propertyTitle: b.propertyTitle || 'Nhà trọ',
          propertyAddress: b.propertyAddress || '',
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          bills: []
        });
      }

      const group = map.get(pId)!;
      group.bills.push(b);
      group.totalAmount += (b.totalAmount || 0);
      group.paidAmount += (b.paidAmount || 0);
      group.remainingAmount += (b.remainingAmount || 0);
    }

    return Array.from(map.values());
  });

  // Revenue KPI Stats computed from filtered bills
  totalExpectedRevenue = computed(() => {
    return this.filteredBills().reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  });

  totalPaidRevenue = computed(() => {
    return this.filteredBills().reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  });

  totalRemainingRevenue = computed(() => {
    return this.filteredBills().reduce((acc, b) => acc + (b.remainingAmount || 0), 0);
  });

  collectionRate = computed(() => {
    const total = this.totalExpectedRevenue();
    if (!total || total === 0) return 100;
    return Math.min(100, Math.round((this.totalPaidRevenue() / total) * 100));
  });

  unpaidBillsCount = computed(() => {
    return this.filteredBills().filter(b => b.status !== 'Paid').length;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load Properties & Rooms
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

    // Load Bills
    this.billService.getLandlordBills().subscribe({
      next: (data) => {
        this.bills.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách hóa đơn.', 'error');
      }
    });
  }

  refreshAll(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('All');
    this.selectedPropertyId.set(0);
    this.selectedRoomId.set(0);
    this.loadData();
    this.toastService.show('Đã làm mới dữ liệu hóa đơn!', 'info');
  }

  setCurrentMonth(): void {
    this.selectedMonth.set(this.currentCalendarMonth);
    this.selectedYear.set(this.currentCalendarYear);
  }

  prevMonth(): void {
    let m = this.selectedMonth();
    let y = this.selectedYear();
    if (m <= 1) {
      m = 12;
      y -= 1;
    } else {
      m -= 1;
    }
    this.selectedMonth.set(m);
    this.selectedYear.set(y);
  }

  nextMonth(): void {
    let m = this.selectedMonth();
    let y = this.selectedYear();
    if (m >= 12) {
      m = 1;
      y += 1;
    } else {
      m += 1;
    }
    this.selectedMonth.set(m);
    this.selectedYear.set(y);
  }

  onMonthSelect(val: any): void {
    this.selectedMonth.set(Number(val));
  }

  onPropertyChange(propId: any): void {
    this.selectedPropertyId.set(Number(propId));
    this.selectedRoomId.set(0);
  }

  countByStatus(status: string): number {
    const list = this.filteredByMonthBills();
    if (status === 'Paid') return list.filter(b => b.status === 'Paid').length;
    if (status === 'PendingConfirmation') return list.filter(b => b.status === 'PendingConfirmation').length;
    if (status === 'Partial') return list.filter(b => b.status === 'Partial' || b.status === 'PartialPaid').length;
    if (status === 'Unpaid') return list.filter(b => b.status === 'Unpaid').length;
    return list.length;
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

  // Confirm Pending Payment (from tenant report)
  confirmPendingPayment(bill: any): void {
    const remaining = bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount;
    if (!confirm(`Xác nhận phòng ${bill.roomNumber} (${bill.tenantName || 'Khách thuê'}) đã thanh toán số tiền ${remaining.toLocaleString('vi-VN')} đ?`)) return;

    this.billService.confirmPayment(bill.id, { amount: remaining }).subscribe({
      next: (res) => {
        this.toastService.show(res.message || `Đã xác nhận thanh toán thành công cho phòng ${bill.roomNumber}!`, 'success');
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi khi xác nhận thanh toán.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Reject Pending Payment
  openRejectModal(bill: any): void {
    this.showRejectModal.set(bill);
    this.rejectReason.set('');
  }

  closeRejectModal(): void {
    this.showRejectModal.set(null);
    this.rejectReason.set('');
  }

  submitRejectPayment(): void {
    const bill = this.showRejectModal();
    if (!bill) return;

    this.billService.rejectPayment(bill.id, { reason: this.rejectReason().trim() }).subscribe({
      next: (res) => {
        this.toastService.show(res.message || `Đã từ chối xác nhận thanh toán cho phòng ${bill.roomNumber}.`, 'info');
        this.closeRejectModal();
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi khi từ chối xác nhận.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Pay Modal Handlers
  openPayModal(bill: any): void {
    this.showPayModal.set(bill);
    this.payAmountInput.set(bill.remainingAmount);
    this.payNote.set('Tiền mặt');
  }

  confirmPayment(billId: number): void {
    const amount = Number(this.payAmountInput());
    if (amount <= 0) {
      this.toastService.show('Vui lòng nhập số tiền thu hợp lệ!', 'error');
      return;
    }

    this.billService.payBill(billId, amount).subscribe({
      next: () => {
        this.toastService.show('Đã ghi nhận thu tiền thành công!', 'success');
        this.showPayModal.set(null);
        this.loadData();
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi khi thu tiền.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Receipt Modal
  viewInvoice(bill: any): void {
    this.activeInvoice.set(bill);
  }

  closeInvoice(): void {
    this.activeInvoice.set(null);
  }

  printReceipt(): void {
    window.print();
  }

  sendEmail(billId: number): void {
    this.billService.sendEmailNotification(billId).subscribe({
      next: () => this.toastService.show('Đã gửi thông báo hóa đơn thành công!', 'success'),
      error: (err) => this.toastService.show(err.error?.message || 'Lỗi gửi email.', 'error')
    });
  }
}
