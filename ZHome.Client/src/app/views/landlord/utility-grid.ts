import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { BillService } from '../../services/bill.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landlord-utility-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="utility-container">
      
      <!-- Page Header -->
      <div class="header-row">
        <div>
          <h1>Ghi Chỉ Số Điện & Nước Hàng Tháng</h1>
          <p>Tự động liệt kê tất cả các phòng trọ. Bấm trực tiếp vào từng phòng để chốt chỉ số và tính tổng tiền hóa đơn nhanh chóng!</p>
        </div>
        <div class="view-mode-toggle">
          <button class="toggle-btn" [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')">
            Dạng Thẻ Phòng (Dễ dùng)
          </button>
          <button class="toggle-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
            Dạng Bảng Nhập Nhanh
          </button>
        </div>
      </div>

      <!-- Settings Filter Bar -->
      <div class="glass-panel settings-panel-light">
        <div class="settings-grid">
          <div class="form-group select-box">
            <label for="propertySelect">Chọn Khu Trọ</label>
            <select 
              id="propertySelect" 
              [(ngModel)]="selectedPropertyId" 
              (change)="loadGrid()" 
              class="form-control-light">
              <option [value]="0">-- Tất cả các khu trọ --</option>
              @for (prop of properties(); track prop.id) {
                <option [value]="prop.id">{{ prop.title }}</option>
              }
            </select>
          </div>

          <div class="form-group month-box">
            <label for="billingMonth">Tháng hóa đơn</label>
            <select id="billingMonth" [(ngModel)]="billingMonth" (change)="onMonthChange()" class="form-control-light">
              @for (m of [1,2,3,4,5,6,7,8,9,10,11,12]; track m) {
                <option [value]="m">Tháng {{ m }}</option>
              }
            </select>
          </div>

          <div class="form-group year-box">
            <label for="billingYear">Năm hóa đơn</label>
            <select id="billingYear" [(ngModel)]="billingYear" (change)="onYearChange()" class="form-control-light">
              <option [value]="2024">2024</option>
              <option [value]="2025">2025</option>
              <option [value]="2026">2026</option>
              <option [value]="2027">2027</option>
              <option [value]="2028">2028</option>
            </select>
          </div>

          <div class="btn-align-row">
            <button (click)="loadGrid()" [disabled]="isGridLoading()" class="btn btn-primary-light">
              Tải lại danh sách
            </button>
            <button (click)="openSupplementaryModal()" class="btn btn-outline-sky">
              + Tạo Hóa Đơn Bổ Sung
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      @if (isGridLoading()) {
        <div class="loading-state-light text-center py-5">
          <div class="spinner"></div>
          <p class="mt-2 text-muted">Đang tải danh sách các phòng trọ...</p>
        </div>
      } @else if (hasLoadedGrid()) {
        
        @if (gridItems().length === 0) {
          <div class="empty-state-light text-center py-5 mt-4">
            <div class="empty-icon-svg">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                <path d="M4 3l10 2.5v13L4 21V3z"></path>
              </svg>
            </div>
            <h3>Chưa có phòng trọ nào</h3>
            <p class="text-muted">Chưa tìm thấy phòng trọ nào thuộc khu trọ này. Bạn hãy thêm phòng trong mục Nhà trọ trước nhé.</p>
          </div>
        } @else {

          <!-- 1. CARDS GRID VIEW (DEFAULT) -->
          @if (viewMode() === 'cards') {
            <div class="cards-view-container mt-4">
              <div class="cards-header-info mb-3">
                <span class="rented-count-badge">Đang hiển thị {{ gridItems().length }} phòng trọ</span>
                <span class="hint-text">* Bấm vào bất kỳ phòng nào dưới đây để ghi số điện nước và lập hóa đơn</span>
              </div>

              <div class="room-cards-grid">
                @for (item of gridItems(); track item.roomId) {
                  <div class="room-utility-card" (click)="openRoomMeterModal(item)" [class.card-paid]="item.existingBillStatus === 'Paid'">
                    <div class="card-header-bar">
                      <div class="room-title-badge">
                        Phòng P.{{ item.roomNumber }}
                      </div>
                      <span class="status-pill-tag" 
                            [class.pill-none]="item.existingBillStatus === 'None'"
                            [class.pill-created]="item.existingBillStatus === 'Unpaid' || item.existingBillStatus === 'Partial'"
                            [class.pill-paid]="item.existingBillStatus === 'Paid'">
                        {{ getStatusText(item.existingBillStatus) }}
                      </span>
                    </div>

                    <div class="card-body-info">
                      @if (item.propertyTitle) {
                        <p class="prop-sub-name">{{ item.propertyTitle }}</p>
                      }
                      <p class="tenant-name-row">Khách thuê: <strong>{{ item.tenantName }}</strong></p>
                      <p class="room-price-row">Giá phòng: <strong>{{ item.roomPrice | number:'1.0-0' }}đ/tháng</strong></p>
                      
                      <div class="readings-preview-box">
                        <div class="r-item">
                          <span>Điện gần nhất:</span>
                          <strong>{{ item.previousElectricityReading }} kWh</strong>
                        </div>
                        <div class="r-item">
                          <span>Nước gần nhất:</span>
                          <strong>{{ item.previousWaterReading }} m³</strong>
                        </div>
                      </div>
                    </div>

                    <div class="card-footer-action">
                      @if (item.existingBillStatus === 'Paid') {
                        <button class="btn btn-disabled-light btn-block" (click)="$event.stopPropagation()">
                          Đã Thanh Toán ({{ getEstimatedTotal(item) | number:'1.0-0' }}đ)
                        </button>
                      } @else if (item.existingBillStatus === 'Unpaid' || item.existingBillStatus === 'Partial') {
                        <button class="btn btn-warning-light btn-block" (click)="openRoomMeterModal(item); $event.stopPropagation()">
                          Sửa Chỉ Số & Tính Lại ({{ getEstimatedTotal(item) | number:'1.0-0' }}đ)
                        </button>
                      } @else {
                        <button class="btn btn-action-primary btn-block" (click)="openRoomMeterModal(item); $event.stopPropagation()">
                          Ghi Số & Lập Hóa Đơn
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- 2. SPREADSHEET TABLE VIEW -->
          @if (viewMode() === 'table') {
            <div class="table-view-container mt-4 glass-panel-light">
              <div class="table-wrapper">
                <table class="utility-table-light">
                  <thead>
                    <tr>
                      <th><input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()" /></th>
                      <th>Khu Trọ</th>
                      <th>Phòng</th>
                      <th>Người Thuê</th>
                      <th>Điện Cũ</th>
                      <th>Điện Mới</th>
                      <th>Nước Cũ</th>
                      <th>Nước Mới</th>
                      <th>Phí Dịch Vụ</th>
                      <th>Khấu Trừ</th>
                      <th>Tổng Tạm Tính</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of gridItems(); track item.roomId) {
                      <tr>
                        <td>
                          <input type="checkbox" [(ngModel)]="item.isChecked" [disabled]="item.existingBillStatus === 'Paid'" />
                        </td>
                        <td><small>{{ item.propertyTitle }}</small></td>
                        <td class="font-bold">P.{{ item.roomNumber }}</td>
                        <td>{{ item.tenantName }}</td>
                        <td><input type="number" [(ngModel)]="item.previousElectricityReading" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td><input type="number" [(ngModel)]="item.currentElectricityReading" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td><input type="number" [(ngModel)]="item.previousWaterReading" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td><input type="number" [(ngModel)]="item.currentWaterReading" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td><input type="number" [(ngModel)]="item.serviceFee" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td><input type="number" [(ngModel)]="item.repairDeduction" (input)="getEstimatedTotal(item)" class="table-input" /></td>
                        <td class="font-bold text-sky">{{ getEstimatedTotal(item) | number:'1.0-0' }}đ</td>
                        <td>
                          <span class="status-pill-tag" [class.pill-none]="item.existingBillStatus === 'None'" [class.pill-created]="item.existingBillStatus === 'Unpaid'" [class.pill-paid]="item.existingBillStatus === 'Paid'">
                            {{ getStatusText(item.existingBillStatus) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="submit-bar-light mt-3 p-3">
                <span class="text-muted text-xs">* Tích chọn danh sách các phòng và bấm tạo hóa đơn hàng loạt</span>
                <button (click)="submitGrid()" [disabled]="isSubmitting() || !isGridValid()" class="btn btn-success-light">
                  {{ isSubmitting() ? 'Đang lập hóa đơn...' : 'Tạo Hóa Đơn Hàng Loạt' }}
                </button>
              </div>
            </div>
          }

        }
      }
    </div>

    <!-- MODAL CHỐT SỐ ĐIỆN NƯỚC 1 PHÒNG -->
      @if (selectedMeterRoom(); as item) {
        <div class="modal-backdrop" (click)="closeRoomMeterModal()">
          <div class="modal-card max-w-600" (click)="$event.stopPropagation()" style="background: #ffffff !important; color: #0f172a !important; border-radius: 16px;">
            
            <div class="meter-modal-header">
              <div class="d-flex align-items-center gap-2">
                <span class="big-room-badge">P.{{ item.roomNumber }}</span>
                <div>
                  <h3 style="margin:0; font-size: 1.2rem; font-weight: 800; color: #0c4a6e;">Ghi Số Điện Nước Phòng {{ item.roomNumber }}</h3>
                  <p style="margin: 2px 0 0 0; color: #475569; font-size: 0.85rem;">{{ item.propertyTitle || 'Khu trọ' }} • Khách thuê: <strong>{{ item.tenantName }}</strong></p>
                </div>
              </div>
              <button (click)="closeRoomMeterModal()" class="close-btn">&times;</button>
            </div>

            <div class="meter-modal-body mt-3">
              <!-- Electricity Section -->
              <div class="meter-section-card yellow-theme">
                <div class="section-card-title">
                  <span>Chỉ Số Điện (kWh)</span>
                  <div class="d-flex align-items-center gap-1">
                    <span class="text-xs text-muted">Đơn giá:</span>
                    <input type="number" [(ngModel)]="item.electricityRate" class="rate-input-box" placeholder="3500" />
                    <span class="text-xs text-muted">đ/kWh</span>
                  </div>
                </div>
                <div class="row-inputs mt-2">
                  <div class="input-col">
                    <label>Số điện cũ (Kỳ trước)</label>
                    <input type="number" [(ngModel)]="item.previousElectricityReading" class="form-control-light disabled-bg" readonly />
                  </div>
                  <div class="input-col">
                    <label>Số điện mới (Tháng {{ billingMonth }}) <span class="text-danger">*</span></label>
                    <input type="number" [(ngModel)]="item.currentElectricityReading" class="form-control-light" placeholder="Nhập chỉ số điện mới" />
                  </div>
                </div>
                <div class="calc-result-row mt-2">
                  <span>Tiêu thụ: <strong>{{ getElecUsage(item) }} kWh</strong></span>
                  <span>Thành tiền: <strong class="text-amber">{{ getElecCost(item) | number:'1.0-0' }}đ</strong></span>
                </div>
              </div>

              <!-- Water Section -->
              <div class="meter-section-card cyan-theme mt-3">
                <div class="section-card-title mb-2">
                  <span>Tiền Nước</span>
                  <div class="water-mode-toggle">
                    <label class="mode-radio-label" [class.active-mode]="item.waterCalculationMethod === 'PerCubic'">
                      <input type="radio" [(ngModel)]="item.waterCalculationMethod" value="PerCubic" name="waterCalcMethod_{{item.roomId}}" />
                      <span>Tính theo khối (m³)</span>
                    </label>
                    <label class="mode-radio-label" [class.active-mode]="item.waterCalculationMethod === 'PerPerson'">
                      <input type="radio" [(ngModel)]="item.waterCalculationMethod" value="PerPerson" name="waterCalcMethod_{{item.roomId}}" />
                      <span>Tính theo đầu người</span>
                    </label>
                  </div>
                </div>

                <!-- Mode 1: Per Cubic (m3) -->
                @if (item.waterCalculationMethod === 'PerCubic' || !item.waterCalculationMethod) {
                  <div class="water-mode-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="text-xs font-semibold text-muted">Nhập chỉ số công tơ nước:</span>
                      <div class="d-flex align-items-center gap-1">
                        <span class="text-xs text-muted">Đơn giá:</span>
                        <input type="number" [(ngModel)]="item.waterRate" class="rate-input-box" placeholder="25000" />
                        <span class="text-xs text-muted">đ/m³</span>
                      </div>
                    </div>
                    <div class="row-inputs">
                      <div class="input-col">
                        <label>Số nước cũ (Kỳ trước)</label>
                        <input type="number" [(ngModel)]="item.previousWaterReading" class="form-control-light disabled-bg" readonly />
                      </div>
                      <div class="input-col">
                        <label>Số nước mới (Tháng {{ billingMonth }}) <span class="text-danger">*</span></label>
                        <input type="number" [(ngModel)]="item.currentWaterReading" class="form-control-light" placeholder="Nhập chỉ số nước mới" />
                      </div>
                    </div>
                    <div class="calc-result-row mt-2">
                      <span>Tiêu thụ: <strong>{{ getWaterUsage(item) }} m³</strong></span>
                      <span>Thành tiền: <strong class="text-cyan">{{ getWaterCost(item) | number:'1.0-0' }}đ</strong></span>
                    </div>
                  </div>
                }

                <!-- Mode 2: Per Person -->
                @if (item.waterCalculationMethod === 'PerPerson') {
                  <div class="water-mode-body">
                    <div class="row-inputs mt-1">
                      <div class="input-col">
                        <label>Số người ở thực tế trong phòng</label>
                        <input type="number" [(ngModel)]="item.occupantsCount" class="form-control-light" placeholder="Số người ở" />
                      </div>
                      <div class="input-col">
                        <label>Đơn giá nước / 1 người (đ/tháng)</label>
                        <input type="number" [(ngModel)]="item.waterPerPersonRate" class="form-control-light" placeholder="Ví dụ: 100000" />
                      </div>
                    </div>
                    <div class="calc-result-row mt-2">
                      <span>Công thức: <strong>{{ item.occupantsCount || 1 }} người x {{ item.waterPerPersonRate || 100000 | number:'1.0-0' }}đ</strong></span>
                      <span>Thành tiền: <strong class="text-cyan">{{ getWaterCost(item) | number:'1.0-0' }}đ</strong></span>
                    </div>
                  </div>
                }
              </div>

              <!-- Fees Section -->
              <div class="meter-section-card sky-theme mt-3">
                <div class="row-inputs">
                  <div class="input-col">
                    <label>Phí dịch vụ (Wifi, rác, vệ sinh...)</label>
                    <input type="number" [(ngModel)]="item.serviceFee" class="form-control-light" />
                  </div>
                  <div class="input-col">
                    <label>Trừ tiền sửa chữa (Chủ trọ chịu)</label>
                    <input type="number" [(ngModel)]="item.repairDeduction" class="form-control-light" />
                  </div>
                </div>
              </div>

              <!-- Summary Receipt Box -->
              <div class="receipt-summary-box mt-3">
                <div class="receipt-title">BẢNG BÁO GIÁ HÓA ĐƠN KỲ THÁNG {{ billingMonth }}/{{ billingYear }}</div>
                <div class="receipt-row">
                  <span>Giá thuê phòng niêm yết:</span>
                  <span>{{ item.roomPrice | number:'1.0-0' }}đ</span>
                </div>
                <div class="receipt-row">
                  <span>Tiền điện ({{ getElecUsage(item) }} kWh x {{ (item.electricityRate || 3500) | number }}đ):</span>
                  <span>{{ getElecCost(item) | number:'1.0-0' }}đ</span>
                </div>
                <div class="receipt-row">
                  @if (item.waterCalculationMethod === 'PerPerson') {
                    <span>Tiền nước ({{ item.occupantsCount || 1 }} người x {{ (item.waterPerPersonRate || 100000) | number }}đ):</span>
                  } @else {
                    <span>Tiền nước ({{ getWaterUsage(item) }} m³ x {{ (item.waterRate || 25000) | number }}đ):</span>
                  }
                  <span>{{ getWaterCost(item) | number:'1.0-0' }}đ</span>
                </div>
                <div class="receipt-row">
                  <span>Phí dịch vụ chung:</span>
                  <span>{{ item.serviceFee | number:'1.0-0' }}đ</span>
                </div>
                @if (item.repairDeduction > 0) {
                  <div class="receipt-row text-danger">
                    <span>Trừ sửa chữa:</span>
                    <span>-{{ item.repairDeduction | number:'1.0-0' }}đ</span>
                  </div>
                }
                <div class="receipt-total-row">
                  <span>TỔNG CỘNG HÓA ĐƠN:</span>
                  <span class="total-price">{{ getEstimatedTotal(item) | number:'1.0-0' }}đ</span>
                </div>
              </div>
            </div>

            <div class="meter-modal-footer mt-4">
              <button (click)="closeRoomMeterModal()" class="btn btn-secondary-light">Đóng</button>
              <button (click)="submitSingleRoom(item)" [disabled]="isSubmittingSingle() || item.currentElectricityReading < item.previousElectricityReading || (item.waterCalculationMethod !== 'PerPerson' && item.currentWaterReading < item.previousWaterReading)" class="btn btn-success-action">
                {{ isSubmittingSingle() ? 'Đang lập hóa đơn...' : 'Chốt Số & Tạo Hóa Đơn Ngay' }}
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Modal Tạo Hóa Đơn Bổ Sung -->
      @if (showSupplementaryModal()) {
        <div class="modal-backdrop" (click)="closeSupplementaryModal()">
          <div class="modal-card max-w-500" (click)="$event.stopPropagation()" style="background: #ffffff !important; color: #0f172a !important; border-radius: 16px;">
            <h2>Tạo Hóa Đơn Bổ Sung</h2>
            <p class="text-muted text-sm">Lập hóa đơn riêng cho các khoản thu/phạt ngoài lề</p>

            <div class="form-group mt-3">
              <label>Chọn Phòng Thuê</label>
              <select [(ngModel)]="suppData.roomId" class="form-control-light">
                <option [value]="0" disabled>-- Chọn phòng --</option>
                @for (item of gridItems(); track item.roomId) {
                  <option [value]="item.roomId">Phòng P.{{ item.roomNumber }} ({{ item.tenantName }})</option>
                }
              </select>
            </div>

            <div class="form-grid-2 mt-2">
              <div class="form-group">
                <label>Tháng</label>
                <select [(ngModel)]="suppData.month" class="form-control-light">
                  @for (m of [1,2,3,4,5,6,7,8,9,10,11,12]; track m) {
                    <option [value]="m">Tháng {{ m }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Năm</label>
                <select [(ngModel)]="suppData.year" class="form-control-light">
                  <option [value]="2024">2024</option>
                  <option [value]="2025">2025</option>
                  <option [value]="2026">2026</option>
                  <option [value]="2027">2027</option>
                  <option [value]="2028">2028</option>
                </select>
              </div>
            </div>

            <div class="form-group mt-2">
              <label>Số Tiền Bổ Sung (VNĐ)</label>
              <input type="number" [(ngModel)]="suppData.amount" class="form-control-light" placeholder="Nhập số tiền..." />
            </div>

            <div class="form-group mt-2">
              <label>Nội Dung / Ghi Chú</label>
              <textarea [(ngModel)]="suppData.note" class="form-control-light" rows="3" placeholder="Ghi chú chi tiết..."></textarea>
            </div>

            <div class="modal-actions mt-4 d-flex justify-content-end gap-2">
              <button (click)="closeSupplementaryModal()" class="btn btn-secondary-light">Hủy</button>
              <button (click)="submitSupplementary()" [disabled]="suppData.roomId === 0 || suppData.amount <= 0 || isSubmittingSupp" class="btn btn-primary-light">
                {{ isSubmittingSupp ? 'Đang tạo...' : 'Xác Nhận Tạo' }}
              </button>
            </div>
          </div>
        </div>
      }
  `,
  styles: [`
    .utility-container {
      padding: 10px 0 40px 0;
      max-width: 1240px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-row h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .header-row p {
      color: #64748b;
      margin: 0;
      font-size: 0.95rem;
    }

    .view-mode-toggle {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
      gap: 4px;
      border: 1px solid #e2e8f0;
    }
    .toggle-btn {
      background: transparent;
      border: none;
      padding: 8px 16px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .toggle-btn.active {
      background: #ffffff;
      color: #0284c7;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    }

    .settings-panel-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 24px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }
    .settings-grid {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .select-box { flex: 2; min-width: 200px; }
    .month-box, .year-box { flex: 1; min-width: 120px; }
    .btn-align-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 6px;
    }
    .form-control-light {
      width: 100%;
      padding: 9px 12px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      transition: all 0.2s;
    }
    .form-control-light:focus {
      border-color: #0284c7;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .disabled-bg {
      background: #e2e8f0 !important;
      color: #64748b !important;
      cursor: not-allowed;
    }

    .btn {
      padding: 9px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary-light {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-primary-light:hover { background: #0369a1; }
    .btn-outline-sky {
      background: #ffffff;
      color: #0284c7;
      border: 1.5px solid #7dd3fc;
    }
    .btn-outline-sky:hover { background: #f0f9ff; }

    /* Cards Grid */
    .cards-header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .rented-count-badge {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.82rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
    }
    .hint-text {
      font-size: 0.82rem;
      color: #64748b;
      font-style: italic;
    }

    .room-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 18px;
    }
    .room-utility-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .room-utility-card:hover {
      border-color: #38bdf8;
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(2, 132, 199, 0.12);
    }
    .card-paid {
      border-color: #bbf7d0;
      background: #fcfdfc;
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .room-title-badge {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0c4a6e;
    }
    .status-pill-tag {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .pill-none { background: #f1f5f9; color: #64748b; }
    .pill-created { background: #fef3c7; color: #b45309; }
    .pill-paid { background: #dcfce7; color: #15803d; }

    .card-body-info .prop-sub-name {
      font-size: 0.78rem;
      color: #94a3b8;
      margin: 0 0 4px 0;
      font-weight: 600;
    }
    .tenant-name-row, .room-price-row {
      font-size: 0.85rem;
      color: #334155;
      margin: 4px 0;
    }

    .readings-preview-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      margin-top: 12px;
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .r-item span {
      display: block;
      font-size: 0.72rem;
      color: #64748b;
      margin-bottom: 2px;
    }
    .r-item strong {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .card-footer-action {
      margin-top: 16px;
    }
    .btn-block { width: 100%; text-align: center; }
    .btn-action-primary {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-action-primary:hover { background: #0369a1; }
    .btn-warning-light {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .btn-warning-light:hover { background: #fde68a; }
    .btn-disabled-light {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
      cursor: default;
    }

    /* Spreadsheet Table */
    .table-view-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
    }
    .table-wrapper {
      overflow-x: auto;
    }
    .utility-table-light {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .utility-table-light th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1.5px solid #e2e8f0;
      white-space: nowrap;
    }
    .utility-table-light td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
      white-space: nowrap;
    }
    .table-input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.88rem;
      text-align: center;
      outline: none;
    }
    .table-input:focus { border-color: #0284c7; }
    .submit-bar-light {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .btn-success-light {
      background: #16a34a;
      color: #ffffff;
    }
    .btn-success-light:hover { background: #15803d; }

    /* Meter Modal */
    .modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(15, 23, 42, 0.75) !important;
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      margin: 0 !important;
    }
    .max-w-600 { max-width: 600px; width: 100%; }
    .max-w-500 { max-width: 500px; width: 100%; }
    .modal-card {
      background: #ffffff !important;
      padding: 24px 28px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      max-height: 90vh;
      overflow-y: auto;
      margin: auto !important;
      position: relative !important;
    }
    .meter-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #f1f5f9;
      padding-bottom: 12px;
    }
    .big-room-badge {
      width: 44px; height: 44px; border-radius: 12px;
      background: #0284c7; color: #ffffff; font-size: 1.1rem;
      font-weight: 900; display: flex; align-items: center; justify-content: center;
    }
    .close-btn {
      background: none; border: none; font-size: 1.6rem; color: #64748b; cursor: pointer;
    }

    .meter-section-card {
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .yellow-theme { background: #fefce8; border-color: #fef08a; }
    .cyan-theme { background: #f0fdfa; border-color: #99f6e4; }
    .sky-theme { background: #f0f9ff; border-color: #bae6fd; }

    .section-card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 800;
      font-size: 0.92rem;
      color: #0f172a;
    }
    .rate-input-box {
      width: 80px; padding: 3px 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; font-weight: 700; text-align: center;
    }
    .row-inputs {
      display: flex;
      gap: 12px;
    }
    .input-col { flex: 1; }
    .input-col label { display: block; font-size: 0.78rem; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .calc-result-row {
      display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 8px;
    }
    .text-amber { color: #d97706; font-size: 0.95rem; font-weight: 800; }
    .text-cyan { color: #0d9488; font-size: 0.95rem; font-weight: 800; }

    .water-mode-toggle {
      display: flex; gap: 8px;
    }
    .mode-radio-label {
      font-size: 0.78rem; font-weight: 700; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; border: 1px solid #cbd5e1;
    }
    .active-mode {
      background: #0d9488; color: #ffffff; border-color: #0d9488;
    }

    /* Receipt Box */
    .receipt-summary-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .receipt-title {
      font-size: 0.78rem; font-weight: 800; color: #0284c7; text-align: center; margin-bottom: 8px; letter-spacing: 0.05em;
    }
    .receipt-row {
      display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; margin: 4px 0;
    }
    .receipt-total-row {
      display: flex; justify-content: space-between; font-size: 1rem; font-weight: 900; color: #0f172a; border-top: 1.5px solid #cbd5e1; padding-top: 8px; margin-top: 8px;
    }
    .total-price { color: #16a34a; font-size: 1.15rem; }

    .meter-modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn-secondary-light { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-success-action { background: #16a34a; color: #ffffff; font-weight: 800; }
    .btn-success-action:hover { background: #15803d; }

    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .empty-icon-svg { margin-bottom: 8px; }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #cbd5e1; border-top-color: #0284c7; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class LandlordUtilityGridComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly billService = inject(BillService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  properties = signal<any[]>([]);
  selectedPropertyId = 0; // 0 = All Properties
  billingMonth = new Date().getMonth() + 1;
  billingYear = new Date().getFullYear();

  viewMode = signal<'cards' | 'table'>('cards');

  gridItems = signal<any[]>([]);
  isGridLoading = signal(false);
  hasLoadedGrid = signal(false);
  isSubmitting = signal(false);
  isSubmittingSingle = signal(false);

  selectedMeterRoom = signal<any | null>(null);

  showSupplementaryModal = signal(false);
  isSubmittingSupp = false;
  suppData = {
    roomId: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
    note: ''
  };

  onMonthChange(): void {
    this.loadGrid();
  }

  onYearChange(): void {
    this.loadGrid();
  }

  ngOnInit(): void {
    this.fetchPropertiesAndAutoLoad();
  }

  fetchPropertiesAndAutoLoad(): void {
    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.loadGrid();
      },
      error: () => {
        this.loadGrid();
      }
    });
  }

  loadGrid(): void {
    this.selectedMeterRoom.set(null);
    this.isGridLoading.set(true);
    this.hasLoadedGrid.set(false);

    this.billService.getUtilityGrid(this.selectedPropertyId, this.billingMonth, this.billingYear).subscribe({
      next: (items) => {
        this.gridItems.set(items);
        this.isGridLoading.set(false);
        this.hasLoadedGrid.set(true);
      },
      error: () => {
        this.isGridLoading.set(false);
        this.toastService.show('Lỗi tải danh sách chỉ số điện nước từ máy chủ.', 'error');
      }
    });
  }

  openRoomMeterModal(item: any): void {
    const copy = { ...item };
    copy.electricityRate = copy.electricityRate || copy.ElectricityRate || 3500;
    copy.waterRate = copy.waterRate || copy.WaterRate || 25000;
    copy.ElectricityRate = copy.electricityRate;
    copy.WaterRate = copy.waterRate;

    if (!copy.currentElectricityReading || copy.currentElectricityReading < copy.previousElectricityReading) {
      copy.currentElectricityReading = copy.previousElectricityReading;
    }
    if (!copy.currentWaterReading || copy.currentWaterReading < copy.previousWaterReading) {
      copy.currentWaterReading = copy.previousWaterReading;
    }
    if (!copy.waterCalculationMethod) {
      copy.waterCalculationMethod = 'PerCubic';
    }
    if (!copy.occupantsCount || copy.occupantsCount <= 0) {
      copy.occupantsCount = 1;
    }
    if (!copy.waterPerPersonRate || copy.waterPerPersonRate <= 0) {
      copy.waterPerPersonRate = 100000;
    }
    if (copy.serviceFee === undefined || copy.serviceFee === null) {
      copy.serviceFee = 100000;
    }
    if (copy.repairDeduction === undefined || copy.repairDeduction === null) {
      copy.repairDeduction = 0;
    }
    this.selectedMeterRoom.set(copy);
  }

  closeRoomMeterModal(): void {
    this.selectedMeterRoom.set(null);
  }

  getElecUsage(item: any): number {
    return Math.max(0, (item.currentElectricityReading || 0) - (item.previousElectricityReading || 0));
  }

  getElecCost(item: any): number {
    const rate = item.electricityRate || item.ElectricityRate || 3500;
    return this.getElecUsage(item) * rate;
  }

  getWaterUsage(item: any): number {
    return Math.max(0, (item.currentWaterReading || 0) - (item.previousWaterReading || 0));
  }

  getWaterCost(item: any): number {
    if (item.waterCalculationMethod === 'PerPerson') {
      const count = Math.max(1, item.occupantsCount || 1);
      const rate = item.waterPerPersonRate || 100000;
      return count * rate;
    }
    const rate = item.waterRate || item.WaterRate || 25000;
    return this.getWaterUsage(item) * rate;
  }

  getEstimatedTotal(item: any): number {
    const roomFee = item.roomPrice || 0;
    const elecCost = this.getElecCost(item);
    const waterCost = this.getWaterCost(item);
    const serviceFee = item.serviceFee || 0;
    const repairDeduction = item.repairDeduction || 0;
    return Math.max(0, roomFee + elecCost + waterCost + serviceFee - repairDeduction);
  }

  getStatusText(status?: string): string {
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'Unpaid': return 'Đã lập HĐ (Chưa thu)';
      case 'Partial': return 'Đã thu một phần';
      default: return 'Chưa chốt chỉ số';
    }
  }

  submitSingleRoom(item: any): void {
    if (item.waterCalculationMethod !== 'PerPerson' && item.currentWaterReading < item.previousWaterReading) {
      this.toastService.show('Chỉ số nước mới không được nhỏ hơn chỉ số cũ.', 'error');
      return;
    }
    if (item.currentElectricityReading < item.previousElectricityReading) {
      this.toastService.show('Chỉ số điện mới không được nhỏ hơn chỉ số cũ.', 'error');
      return;
    }

    this.isSubmittingSingle.set(true);

    const payload = {
      propertyId: this.selectedPropertyId,
      month: this.billingMonth,
      year: this.billingYear,
      readings: [{
        roomId: item.roomId,
        oldElectricityReading: item.previousElectricityReading || 0,
        newElectricityReading: item.currentElectricityReading || 0,
        oldWaterReading: item.previousWaterReading || 0,
        newWaterReading: item.currentWaterReading || 0,
        electricityRate: item.electricityRate || item.ElectricityRate || 3500,
        waterRate: item.waterRate || item.WaterRate || 25000,
        waterCalculationMethod: item.waterCalculationMethod || 'PerCubic',
        occupantsCount: item.occupantsCount || 1,
        waterPerPersonRate: item.waterPerPersonRate || 100000,
        serviceFee: item.serviceFee || 0,
        repairDeduction: item.repairDeduction || 0
      }]
    };

    this.billService.submitUtilityGrid(payload).subscribe({
      next: (res) => {
        this.isSubmittingSingle.set(false);
        this.toastService.show(res.message || `Đã chốt chỉ số và tạo hóa đơn phòng P.${item.roomNumber} thành công!`, 'success');
        this.closeRoomMeterModal();
        this.loadGrid();
      },
      error: (err) => {
        this.isSubmittingSingle.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi chốt hóa đơn.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  openSupplementaryModal(): void {
    this.showSupplementaryModal.set(true);
    this.suppData = {
      roomId: 0,
      month: this.billingMonth,
      year: this.billingYear,
      amount: 0,
      note: ''
    };
  }

  closeSupplementaryModal(): void {
    this.showSupplementaryModal.set(false);
  }

  submitSupplementary(): void {
    this.isSubmittingSupp = true;
    this.billService.createSupplementaryBill(this.suppData).subscribe({
      next: (res) => {
        this.isSubmittingSupp = false;
        this.toastService.show(res.message || 'Tạo hóa đơn bổ sung thành công!', 'success');
        this.closeSupplementaryModal();
        this.loadGrid();
      },
      error: (err) => {
        this.isSubmittingSupp = false;
        this.toastService.show(err.error || 'Lỗi tạo hóa đơn bổ sung.', 'error');
      }
    });
  }

  toggleAll(event: any): void {
    const isChecked = event.target.checked;
    this.gridItems.update(items => items.map(item => {
      if (item.existingBillStatus !== 'Paid') {
        item.isChecked = isChecked;
      }
      return item;
    }));
  }

  isAllSelected(): boolean {
    const items = this.gridItems();
    if (items.length === 0) return false;
    const editableItems = items.filter(i => i.existingBillStatus !== 'Paid');
    if (editableItems.length === 0) return false;
    return editableItems.every(i => i.isChecked);
  }

  isGridValid(): boolean {
    const items = this.gridItems();
    if (items.length === 0) return false;
    for (const item of items) {
      if (item.currentElectricityReading < item.previousElectricityReading) return false;
      if (item.waterCalculationMethod !== 'PerPerson' && item.currentWaterReading < item.previousWaterReading) return false;
    }
    return true;
  }

  submitGrid(): void {
    if (!this.isGridValid()) {
      this.toastService.show('Vui lòng kiểm tra lại. Chỉ số điện/nước mới phải lớn hơn hoặc bằng số cũ.', 'error');
      return;
    }

    const selectedItems = this.gridItems().filter(item => item.isChecked);
    
    if (selectedItems.length === 0) {
      this.toastService.show('Chưa chọn phòng nào để tạo hóa đơn.', 'info');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      propertyId: this.selectedPropertyId,
      month: this.billingMonth,
      year: this.billingYear,
      readings: selectedItems.map(item => ({
        roomId: item.roomId,
        oldElectricityReading: item.previousElectricityReading || 0,
        newElectricityReading: item.currentElectricityReading || 0,
        oldWaterReading: item.previousWaterReading || 0,
        newWaterReading: item.currentWaterReading || 0,
        electricityRate: item.electricityRate || item.ElectricityRate || 3500,
        waterRate: item.waterRate || item.WaterRate || 25000,
        waterCalculationMethod: item.waterCalculationMethod || 'PerCubic',
        occupantsCount: item.occupantsCount || 1,
        waterPerPersonRate: item.waterPerPersonRate || 100000,
        serviceFee: item.serviceFee || 0,
        repairDeduction: item.repairDeduction || 0
      }))
    };

    this.billService.submitUtilityGrid(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.show(res.message || 'Đã lập hóa đơn thành công!', 'success');
        this.router.navigate(['/landlord/bills']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error || 'Lỗi lập hóa đơn.', 'error');
      }
    });
  }
}
