import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { ContractService } from '../../services/contract.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landlord-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-container animate-fade-in">
      
      <!-- Top Header Row -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="page-title m-0">Nhà trọ</h1>
        </div>
        <div class="d-flex gap-2">
          <button type="button" (click)="importData()" class="btn btn-import-data">
            Nhập dữ liệu
          </button>
          <button type="button" (click)="navigateToCreateProperty()" class="btn btn-create-property">
            + Tạo tin trọ
          </button>
        </div>
      </div>

      <!-- Properties Cards Stack -->
      @if (isLoading()) {
        <div class="loading-box text-center py-5">
          <div class="spinner"></div>
          <p>Đang tải danh sách nhà trọ...</p>
        </div>
      } @else if (properties().length === 0) {
        <div class="empty-box text-center py-5">
          <span class="empty-icon"></span>
          <h3 class="mt-2">Bạn chưa tạo khu trọ nào</h3>
          <p class="text-muted">Tạo khu trọ mới để quản lý danh sách phòng và đăng tin quảng cáo</p>
          <button (click)="navigateToCreateProperty()" class="btn btn-create-property mt-3">+ Tạo tin trọ ngay</button>
        </div>
      } @else {
        <div class="property-cards-stack">
          @for (prop of properties(); track prop.id) {
            <div class="property-card-horizontal cursor-pointer" (click)="navigateToRooms(prop.id)">
              
              <!-- Left Cover Image Column -->
              <div class="card-cover-col">
                <img [src]="getImageUrl(prop.imageUrl)" alt="Ảnh trọ" class="cover-image" />
                <span class="badge-type">Phòng trọ</span>
              </div>

              <!-- Right Information Column -->
              <div class="card-info-col">
                
                <!-- Title & Status Switch -->
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <h2 class="property-title m-0">{{ prop.title }}</h2>
                  <div class="status-switch-box d-flex align-items-center gap-2" (click)="$event.stopPropagation()">
                    <span class="status-badge-active">Hoạt động</span>
                    <input type="checkbox" checked class="form-check-input" />
                  </div>
                </div>

                <!-- Address & Creation Date -->
                <p class="property-address text-muted mb-1">{{ prop.address }}</p>
                <p class="property-date text-muted text-xs mb-3">Ngày tạo: {{ (prop.createdAt ? (prop.createdAt | date:'dd/MM/yyyy') : '18/09/2026') }}</p>

                <!-- 4 Statistics Boxes Grid -->
                <div class="stats-boxes-grid mb-3">
                  <div class="stat-box">
                    <span class="stat-title">Tổng phòng</span>
                    <strong class="stat-value">{{ prop.rooms?.length || 0 }}</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-title">Đang thuê</span>
                    <strong class="stat-value">{{ getRentedRoomsCount(prop) }}</strong>
                  </div>
                  <div class="stat-box" [class.stat-box-available]="getAvailableRoomsCount(prop) > 0">
                    <span class="stat-title">Còn trống</span>
                    <strong class="stat-value" [class.text-available]="getAvailableRoomsCount(prop) > 0">
                      @if (getAvailableRoomsCount(prop) > 0) {
                        <span class="pulse-dot-green"></span>
                      }
                      {{ getAvailableRoomsCount(prop) }}
                    </strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-title">Đang nợ</span>
                    <strong class="stat-value">0</strong>
                  </div>
                </div>

                <!-- Action Buttons Toolbar -->
                <div class="action-buttons-group d-flex gap-2" (click)="$event.stopPropagation()">
                  <button type="button" class="btn-action-light" (click)="openEditPropertyModal(prop)">
                    Sửa
                  </button>
                  <button type="button" class="btn-action-light" (click)="navigateToRooms(prop.id)">
                    Quản lý
                  </button>
                </div>

              </div>
            </div>
          }
        </div>
      }



      <!-- MODALS -->
      @if (showAddPropertyModal()) {
        <div class="modal-backdrop" (click)="closeAddPropertyModal()">
          <div class="glass-panel modal-card max-w-680" (click)="$event.stopPropagation()">
            <button (click)="closeAddPropertyModal()" class="modal-close-btn">&times;</button>
            <div class="modal-header-custom mb-3">
              <h2 class="m-0">Thêm Khu Trọ / Tòa Nhà Mới</h2>
              <p class="text-muted text-sm mt-1">Điền đầy đủ thông tin để đăng tải khu trọ cho thuê lên hệ thống ZHome</p>
            </div>

            <form (ngSubmit)="submitProperty()" class="property-form-custom">
              
              <!-- 1. Basic Info Section -->
              <div class="form-section">
                <h4 class="section-subtitle">1. Thông tin chung & Địa chỉ</h4>
                <div class="form-group mb-3">
                  <label for="propTitle">Tên nhà trọ / Tòa nhà <span class="text-danger">*</span></label>
                  <input type="text" id="propTitle" name="title" [(ngModel)]="newProp.title" required class="form-control" placeholder="Ví dụ: Nhà trọ số 1 Hòa Lạc, Chung Cư Mini Cầu Giấy" />
                </div>

                <div class="form-group mb-3">
                  <label>Địa chỉ nhà trọ (Khu vực Hà Nội)</label>
                  <div class="address-grid-custom mt-2">
                    
                    <!-- 1. QUẬN / HUYỆN FIRST -->
                    <div class="form-group-sub">
                      <label>Quận / Huyện <span class="text-danger">*</span></label>
                      <select id="propDistrict" name="district" [(ngModel)]="newPropAddress.district" (change)="onPropDistrictChange()" required class="form-control">
                        <option value="">-- Chọn Quận / Huyện --</option>
                        @for (d of districts(); track d.id) {
                          <option [value]="d.name">{{ d.name }}</option>
                        }
                      </select>
                    </div>

                    <!-- 2. PHƯỜNG / XÃ SECOND -->
                    <div class="form-group-sub">
                      <label>Phường / Xã <span class="text-danger">*</span></label>
                      <select id="propWard" name="ward" [(ngModel)]="newPropAddress.ward" [disabled]="!newPropAddress.district" required class="form-control">
                        <option value="">{{ newPropAddress.district ? '-- Chọn Phường / Xã --' : 'Chọn Quận/Huyện trước' }}</option>
                        @for (w of wards(); track w.id) {
                          <option [value]="w.name">{{ w.name }}</option>
                        }
                      </select>
                    </div>

                    <!-- 3. TÊN ĐƯỜNG / THÔN THIRD -->
                    <div class="form-group-sub">
                      <label>Tên đường / Thôn <span class="text-danger">*</span></label>
                      <input type="text" id="propStreet" name="street" [(ngModel)]="newPropAddress.street" required class="form-control" placeholder="Ví dụ: Đường Tân Xã / Thôn 1" />
                    </div>

                    <!-- 4. SỐ NHÀ, NGÕ/NGÁCH FOURTH -->
                    <div class="form-group-sub">
                      <label>Số nhà, ngõ/ngách <span class="text-danger">*</span></label>
                      <input type="text" id="propHouseNumber" name="houseNumber" [(ngModel)]="newPropAddress.houseNumber" required class="form-control" placeholder="Ví dụ: Số 15, Ngõ 8" />
                    </div>

                    <!-- 5. THÀNH PHỐ (MẶC ĐỊNH) FIFTH -->
                    <div class="form-group-sub full-width">
                      <label>Thành phố (Mặc định)</label>
                      <input type="text" value="Thành phố Hà Nội" readonly class="form-control bg-dark-muted" />
                    </div>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label for="googleMapUrl">Link Google Maps (Vị trí nhà trọ)</label>
                  <input type="url" id="googleMapUrl" name="googleMapUrl" [(ngModel)]="googleMapUrl" class="form-control" placeholder="Dán liên kết vị trí từ Google Maps (VD: https://maps.app.goo.gl/...)" />
                </div>
              </div>

              <!-- 2. Services & Amenities Section -->
              <div class="form-section mt-4">
                <h4 class="section-subtitle">2. Dịch vụ & Tiện ích khu trọ</h4>
                <div class="services-checkbox-grid mt-2">
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.electric" name="electric" />
                    <span>Điện sinh hoạt</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.water" name="water" />
                    <span>Nước sạch máy</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.wifi" name="wifi" />
                    <span>Wifi tốc độ cao</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.security" name="security" />
                    <span>An ninh 24/7 / Camera</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.parking" name="parking" />
                    <span>Chỗ để xe máy</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.freedom" name="freedom" />
                    <span>Giờ giấc tự do</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.aircon" name="aircon" />
                    <span>Trang bị Điều hòa</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.waterHeater" name="waterHeater" />
                    <span>Trang bị Nóng lạnh</span>
                  </label>
                  <label class="service-checkbox-card">
                    <input type="checkbox" [(ngModel)]="services.laundry" name="laundry" />
                    <span>Máy giặt chung / Ban công</span>
                  </label>
                </div>
              </div>

              <!-- 3. Photos & Detailed Description -->
              <div class="form-section mt-4">
                <h4 class="section-subtitle">3. Hình ảnh & Mô tả khu trọ</h4>
                
                <div class="form-group mb-3">
                  <label>Ảnh đại diện khu trọ (Hiển thị trang chủ)</label>
                  <div class="file-upload-wrapper mt-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      (change)="onPropertyImageSelected($event)" 
                      class="file-input-hidden"
                      id="propImage" />
                    <label for="propImage" class="file-upload-btn-main">
                      @if (propImagePreview()) {
                        <div class="preview-container">
                          <img [src]="propImagePreview()" alt="Ảnh đại diện khu trọ" class="upload-preview" />
                          <span class="change-photo-badge">Đổi ảnh khác</span>
                        </div>
                      } @else {
                        <div class="upload-placeholder-content">
                          <span class="upload-icon"></span>
                          <span>Bấm để tải ảnh đại diện khu trọ</span>
                        </div>
                      }
                    </label>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label>Ảnh mô tả chi tiết khu trọ (Hình ảnh thực tế cổng, sân, tiện ích...)</label>
                  <div class="gallery-upload-box mt-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      (change)="onGalleryImagesSelected($event)" 
                      class="file-input-hidden"
                      id="propGalleryImages" />
                    <label for="propGalleryImages" class="gallery-add-btn">
                      <span class="plus-icon">+</span>
                      <span>Thêm ảnh thực tế khu trọ</span>
                    </label>
                  </div>

                  @if (galleryPreviews().length > 0) {
                    <div class="gallery-previews-grid mt-3">
                      @for (img of galleryPreviews(); track $index) {
                        <div class="gallery-preview-item">
                          <img [src]="img" alt="Ảnh minh họa" />
                          <button type="button" (click)="removeGalleryImage($index)" class="remove-img-btn" title="Xóa ảnh">&times;</button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="form-group mb-3">
                  <label for="propDesc">Mô tả thêm chi tiết về khu trọ</label>
                  <textarea id="propDesc" name="userDescription" [(ngModel)]="userDescription" class="form-control" rows="3" placeholder="Thông tin bổ sung về nội quy, chợ dân sinh, bến xe bus, tiện ích xung quanh..."></textarea>
                </div>
              </div>

              <!-- Modal Action Buttons -->
              <div class="modal-actions mt-4">
                <button type="button" (click)="closeAddPropertyModal()" class="btn btn-secondary px-4">Hủy</button>
                <button type="submit" class="btn btn-primary px-4 font-bold">Lưu khu trọ</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 2. Add Room Modal -->
      @if (showAddRoomModal()) {
        <div class="modal-backdrop" (click)="closeAddRoomModal()">
          <div class="glass-panel modal-card max-w-500" (click)="$event.stopPropagation()">
            <button (click)="closeAddRoomModal()" class="modal-close-btn">&times;</button>
            <h2>Thêm Phòng Trọ Mới</h2>
            <p class="text-muted">Khu trọ: {{ selectedProperty()?.title }}</p>
            <form (ngSubmit)="submitRoom()" class="mt-3">
              <div class="form-group">
                <label for="roomNumber">Số phòng / Tên phòng</label>
                <input type="text" id="roomNumber" name="roomNumber" [(ngModel)]="newRoom.roomNumber" required class="form-control" placeholder="Ví dụ: 101, 102, 201" />
              </div>
              <div class="form-group">
                <label for="roomPrice">Giá thuê hàng tháng (VND)</label>
                <input type="number" id="roomPrice" name="price" [(ngModel)]="newRoom.price" required class="form-control" placeholder="Ví dụ: 2500000" />
              </div>
              <div class="form-group">
                <label for="roomArea">Diện tích phòng (m²)</label>
                <input type="number" step="0.1" id="roomArea" name="area" [(ngModel)]="newRoom.area" required class="form-control" placeholder="Ví dụ: 20" />
              </div>
              <div class="form-group">
                <label for="roomOccupants">Số khách thuê tối đa</label>
                <input type="number" id="roomOccupants" name="maxOccupants" [(ngModel)]="newRoom.maxOccupants" required class="form-control" placeholder="Ví dụ: 2" />
              </div>
              <div class="modal-actions mt-4">
                <button type="button" (click)="closeAddRoomModal()" class="btn btn-secondary">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 3. Check-in Tenant Modal / Lập hợp đồng mới -->
      @if (showCheckInModal(); as room) {
        <div class="modal-backdrop" (click)="closeCheckInModal()">
          <div class="glass-panel modal-card max-w-680" (click)="$event.stopPropagation()">
            <div class="modal-header-clean">
              <h2 class="modal-main-title m-0">LẬP HỢP ĐỒNG MỚI</h2>
              <button (click)="closeCheckInModal()" class="modal-close-x">&times;</button>
            </div>

            <form (ngSubmit)="submitCheckIn()" class="modal-form-body mt-3">
              
              <!-- 1. THÔNG TIN CHÍNH -->
              <div class="form-section-group mb-4">
                <h3 class="section-title-bold mb-3">Thông tin chính</h3>
                
                <div class="row-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label-custom">Nhà trọ <span class="text-danger">*</span></label>
                    <input type="text" [value]="selectedProperty()?.title || checkInModel.propertyTitle || 'Nhà trọ'" disabled class="form-control-custom bg-light" />
                  </div>
                  <div class="form-group">
                    <label class="form-label-custom">Phòng <span class="text-danger">*</span></label>
                    <input type="text" [value]="room.roomNumber + ' (' + formatMoney(checkInModel.roomPrice) + ')'" disabled class="form-control-custom bg-light" />
                  </div>
                </div>

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

              <div class="modal-actions-footer">
                <button type="button" (click)="closeCheckInModal()" class="btn-cancel-custom">Hủy</button>
                <button type="submit" class="btn-submit-custom">Lập hợp đồng & Bàn giao</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 4. Rented Room Actions / Check-out Modal -->
      @if (showRentedActionsModal(); as room) {
        <div class="modal-backdrop" (click)="closeRentedActionsModal()">
          <div class="glass-panel modal-card max-w-600" (click)="$event.stopPropagation()">
            <button (click)="closeRentedActionsModal()" class="modal-close-btn">&times;</button>
            <h2 class="text-center">Chi Tiết Phòng Đang Thuê</h2>
            <p class="text-muted text-center">Khu trọ: {{ selectedProperty()?.title }} • Phòng: {{ room.roomNumber }} (Tối đa {{ room.maxOccupants }} người)</p>
            
            <div class="mt-4">
              @if (activeContractsOfRoom().length > 0) {
                <div class="tenant-list" style="display: flex; flex-direction: column; gap: 16px; max-height: 350px; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
                  @for (contract of activeContractsOfRoom(); track contract.id; let idx = $index) {
                    <div class="tenant-detail-card-row" style="border: 1px solid var(--border-color); padding: 15px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="avatar-ph" style="margin: 0; width: 45px; height: 45px; font-size: 1.8rem; border-radius: 50%; background: rgba(255,255,255,0.05); display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);"></span>
                        <div class="tenant-details">
                          <p style="margin: 2px 0; color: var(--text-main);"><strong>Khách thuê {{ idx + 1 }}:</strong> {{ contract.tenantFullName }}</p>
                          <p style="margin: 2px 0; font-size: 0.85rem; color: var(--text-muted);"><strong>Số điện thoại:</strong> {{ contract.tenantPhone }}</p>
                          <p style="margin: 2px 0; font-size: 0.85rem; color: var(--text-muted);"><strong>Hạn HĐ:</strong> {{ contract.startDate | date:'dd/MM/yyyy' }} - {{ contract.endDate | date:'dd/MM/yyyy' }}</p>
                          <p style="margin: 2px 0; font-size: 0.85rem; color: var(--text-muted);"><strong>Giá thuê:</strong> {{ contract.roomPrice | number:'1.0-0' }}đ</p>
                        </div>
                      </div>
                      <button (click)="triggerCheckOut(contract.id)" class="btn btn-danger btn-sm">Trả phòng</button>
                    </div>
                  }
                </div>
              } @else {
                <div class="loading-state text-center" style="padding: 20px;">Đang tải danh sách người thuê...</div>
              }

              <!-- Actions Area -->
              <div class="modal-actions flex-col gap-2 mt-4" style="align-items: stretch; display: flex; flex-direction: column;">
                @if (activeContractsOfRoom().length > 0 && activeContractsOfRoom().length < room.maxOccupants) {
                  <button (click)="addOccupantFromModal(room)" class="btn btn-success btn-block">+ Thêm Người Thuê Vào Phòng</button>
                } @else if (activeContractsOfRoom().length > 0 && activeContractsOfRoom().length >= room.maxOccupants) {
                  <div class="text-center text-muted" style="font-size: 0.85rem; padding: 8px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
                    Phòng đã đạt số người ở tối đa ({{ room.maxOccupants }}/{{ room.maxOccupants }} người)
                  </div>
                }
                <button (click)="closeRentedActionsModal()" class="btn btn-secondary btn-block">Quay lại</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Premium Modal -->
      @if (showPremiumModal()) {
        <div class="brand-backdrop" (click)="showPremiumModal.set(false)">
          <div class="brand-modal-card" (click)="$event.stopPropagation()">
            <div class="brand-modal-header">
              <span>Kích Hoạt Gói Premium</span>
              <button class="close-icon-btn" (click)="showPremiumModal.set(false)">&times;</button>
            </div>
            <div class="brand-modal-body">
              <div class="premium-banner">
                <div class="banner-icon-wrapper">
                  <div class="glow-icon"></div>
                </div>
                <div class="banner-text">
                  <h3>Tính năng dành riêng cho gói trả phí</h3>
                  <p>Tính năng này chỉ dành cho chủ trọ đăng ký gói trả phí. Bạn có muốn nâng cấp để trải nghiệm các tính năng mạnh mẽ hơn không?</p>
                </div>
              </div>

              <div class="package-suggestions">
                <!-- Package 1 -->
                <div class="package-option">
                  <div class="pkg-info">
                    <h4>Gói Cơ Bản</h4>
                    <span class="pkg-price">99.000đ<span>/tháng</span></span>
                    <ul class="pkg-features-mini">
                      <li>Tối đa 50 phòng</li>
                      <li>Lập hóa đơn điện nước</li>
                    </ul>
                  </div>
                  <button class="btn-upgrade-outline" (click)="navigateToPackages()">Xem chi tiết</button>
                </div>
                <!-- Package 2 -->
                <div class="package-option premium-opt">
                  <div class="pkg-info">
                    <h4>Gói Nâng Cao <span class="badge-hot">HOT</span></h4>
                    <span class="pkg-price">199.000đ<span>/tháng</span></span>
                    <ul class="pkg-features-mini">
                      <li>Tối đa 150 phòng</li>
                      <li>Gửi nhắc nợ tự động</li>
                      <li>Tham khảo thuế</li>
                    </ul>
                  </div>
                  <button class="btn-upgrade-filled" (click)="navigateToPackages()">Nâng cấp ngay</button>
                </div>
              </div>
            </div>
            <div class="brand-modal-footer">
              <p class="secure-text">Thanh toán an toàn, kích hoạt ngay lập tức.</p>
              <button class="btn-close-text" (click)="showPremiumModal.set(false)">Đóng lại</button>
            </div>
          </div>
        </div>
      }

      <!-- 5. Room Detail Modal (Landlord - Light Theme) -->
      @if (showRoomDetailModal() && selectedRoomDetail(); as room) {
        <div class="modal-backdrop" (click)="closeRoomDetailModal()">
          <div class="modal-card room-detail-light-card max-w-750" (click)="$event.stopPropagation()" style="background: #ffffff !important; color: #0f172a !important; border: 1px solid #e2e8f0; border-radius: 16px;">
            <button (click)="closeRoomDetailModal()" class="modal-close-btn" style="background: #e2e8f0; color: #1e293b !important; border: 1px solid #cbd5e1;">&times;</button>
            
            <!-- Room Header Info -->
            <div class="room-detail-header-card-light">
              <div class="room-header-left">
                <div class="room-big-badge-light">
                  P.{{ room.roomNumber }}
                </div>
                <div>
                  <h2 style="margin: 0; color: #1e1b4b !important; font-size: 1.35rem; font-weight: 800;">Phòng {{ room.roomNumber }} • {{ room.propertyTitle }}</h2>
                  <p style="margin: 4px 0 0 0; color: #475569 !important; font-size: 0.88rem; font-weight: 600;">{{ room.propertyAddress }}</p>
                </div>
              </div>
              <div class="room-header-right">
                <span class="status-pill" [class.status-available]="room.status === 'Available'" [class.status-rented]="room.status === 'Rented'" [class.status-maintenance]="room.status === 'Maintenance'">
                  {{ getVietnameseStatus(room.status) }}
                </span>
                <div class="header-action-btns">
                  <button (click)="openEditRoomModal(room)" class="btn btn-edit-light btn-sm">Sửa phòng</button>
                  <button (click)="onDeleteRoom(room)" class="btn btn-danger-outline-light btn-sm">Xóa</button>
                </div>
              </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="room-detail-tabs-light">
              <button class="tab-btn-light" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
                Tổng quan & Tiện nghi
              </button>
              <button class="tab-btn-light" [class.active]="activeTab() === 'images'" (click)="activeTab.set('images')">
                Hình ảnh ({{ room.imageUrls?.length || 0 }})
              </button>
              <button class="tab-btn-light" [class.active]="activeTab() === 'tenants'" (click)="activeTab.set('tenants')">
                Hợp đồng & Khách ở ({{ room.activeContracts?.length || 0 }})
              </button>
              <button class="tab-btn-light" [class.active]="activeTab() === 'bills'" (click)="activeTab.set('bills')">
                Hóa đơn ({{ room.recentBills?.length || 0 }})
              </button>
            </div>

            <!-- Tab Content Area -->
            <div class="room-detail-tab-body mt-3">
              <!-- TAB 1: OVERVIEW & AMENITIES -->
              @if (activeTab() === 'overview') {
                <div class="overview-tab-container">
                  <div class="specs-grid-cards-light">
                    <div class="spec-card-light">
                      <span class="spec-icon-badge gold"></span>
                      <div class="spec-info">
                        <span class="spec-label-light">Giá thuê niêm yết</span>
                        <span class="spec-value-light text-gold-light">{{ room.price | number:'1.0-0' }}đ/tháng</span>
                      </div>
                    </div>
                    <div class="spec-card-light">
                      <span class="spec-icon-badge cyan"></span>
                      <div class="spec-info">
                        <span class="spec-label-light">Diện tích phòng</span>
                        <span class="spec-value-light">{{ room.area }} m²</span>
                      </div>
                    </div>
                    <div class="spec-card-light">
                      <span class="spec-icon-badge purple"></span>
                      <div class="spec-info">
                        <span class="spec-label-light">Sức chứa tối đa</span>
                        <span class="spec-value-light">{{ room.maxOccupants }} người</span>
                      </div>
                    </div>
                    <div class="spec-card-light">
                      <span class="spec-icon-badge green"></span>
                      <div class="spec-info">
                        <span class="spec-label-light">Đang ở thực tế</span>
                        <span class="spec-value-light">{{ room.activeContracts?.length || 0 }} người</span>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Status Change Bar -->
                  <div class="quick-status-bar-light mt-3">
                    <span style="color: #0f172a !important; font-weight: 800; font-size: 0.9rem;">Chuyển trạng thái nhanh:</span>
                    <div class="status-btn-group">
                      <button 
                        type="button"
                        class="btn-status-option-light" 
                        [class.active]="room.status === 'Available'" 
                        [disabled]="room.status === 'Rented'"
                        (click)="quickChangeStatus('Available')">
                        Trống
                      </button>
                      <button 
                        type="button"
                        class="btn-status-option-light" 
                        [class.active]="room.status === 'Maintenance'" 
                        [disabled]="room.status === 'Rented'"
                        (click)="quickChangeStatus('Maintenance')">
                        Bảo trì
                      </button>
                      @if (room.status === 'Rented') {
                        <span class="rented-lock-note-light">Phòng đang có hợp đồng thuê active</span>
                      }
                    </div>
                  </div>

                  <!-- Amenities Section -->
                  <div class="amenities-section-light mt-3">
                    <h4 class="section-title-light">Tiện nghi & Trang thiết bị trong phòng</h4>
                    @if (room.amenities && room.amenities.length > 0) {
                      <div class="amenity-badges-grid mt-2">
                        @for (am of room.amenities; track $index) {
                          <div class="amenity-badge-item-light">
                            <span class="am-icon">{{ getAmenityIcon(am) }}</span>
                            <span>{{ am }}</span>
                          </div>
                        }
                      </div>
                    } @else {
                      <p style="color: #64748b !important; font-size: 0.9rem; margin-top: 8px; line-height: 1.5;">Phòng này chưa được chọn tiện nghi riêng. Bạn có thể bấm "Sửa phòng" để chọn tiện nghi.</p>
                    }
                  </div>
                </div>
              }

              <!-- TAB 2: ROOM IMAGES -->
              @if (activeTab() === 'images') {
                <div class="images-tab-container">
                  <div class="gallery-header-row mb-3">
                    <h4 class="m-0">Thư viện hình ảnh thực tế phòng</h4>
                    <input type="file" accept="image/*" multiple class="file-input-hidden" id="uploadDetailRoomImages" (change)="onUploadRoomImagesDirect($event)" />
                    <label for="uploadDetailRoomImages" class="btn btn-secondary btn-sm cursor-pointer" style="margin:0;">+ Tải thêm ảnh</label>
                  </div>
                  @if (room.imageUrls && room.imageUrls.length > 0) {
                    <div class="room-gallery-grid">
                      @for (img of room.imageUrls; track $index) {
                        <div class="room-gallery-card">
                          <img [src]="getImageUrl(img)" alt="Ảnh phòng" class="room-gallery-img" />
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-gallery-box">
                      <span class="upload-icon"></span>
                      <p>Chưa có hình ảnh nào cho phòng này.</p>
                      <label for="uploadDetailRoomImages" class="btn btn-primary btn-sm mt-2 cursor-pointer">Tải ảnh đầu tiên ngay</label>
                    </div>
                  }
                </div>
              }

              <!-- TAB 3: TENANTS & CONTRACTS -->
              @if (activeTab() === 'tenants') {
                <div class="tenants-tab-container">
                  <div class="tenants-header-row mb-3">
                    <h4 class="m-0 font-bold" style="color: #1e1b4b; font-size: 1.05rem;">Chi Tiết Hợp Đồng Cho Thuê & Khách Thuê</h4>
                    @if (room.status === 'Available' || (room.activeContracts && room.activeContracts.length < room.maxOccupants)) {
                      <button (click)="openCheckInFromDetail(room)" class="btn btn-success btn-sm font-semibold">+ Thêm Hợp Đồng / Check-In</button>
                    }
                  </div>

                  @if (room.activeContracts && room.activeContracts.length > 0) {
                    <div class="contracts-list-grid">
                      @for (contract of room.activeContracts; track contract.contractId; let idx = $index) {
                        <div class="contract-card-item-light">
                          <div class="contract-card-top-bar">
                            <span class="contract-code-badge">HỢP ĐỒNG #HĐ-{{ contract.contractId }}</span>
                            <span class="contract-status-active">Đang hiệu lực</span>
                          </div>

                          <div class="contract-card-main-body">
                            <div class="tenant-profile-side">
                              <div class="contract-tenant-avatar-light"></div>
                              <div>
                                <div class="contract-tenant-name-light">Khách thuê {{ idx + 1 }}: {{ contract.tenantFullName }}</div>
                                <div class="contract-sub-info">SĐT: <strong>{{ contract.tenantPhone }}</strong></div>
                                <div class="contract-sub-info">Số CCCD: <strong>{{ contract.tenantIdCardNumber || 'Đã xác minh' }}</strong></div>
                              </div>
                            </div>

                            <div class="contract-details-grid-light">
                              <div class="contract-spec-item">
                                <span class="c-spec-label">Giá thuê hợp đồng</span>
                                <span class="c-spec-value text-indigo">{{ contract.roomPrice | number:'1.0-0' }}đ/tháng</span>
                              </div>
                              <div class="contract-spec-item">
                                <span class="c-spec-label">Tiền đặt cọc</span>
                                <span class="c-spec-value text-green">{{ (contract.depositAmount || contract.roomPrice) | number:'1.0-0' }}đ</span>
                              </div>
                              <div class="contract-spec-item">
                                <span class="c-spec-label">Ngày bắt đầu</span>
                                <span class="c-spec-value">{{ contract.startDate | date:'dd/MM/yyyy' }}</span>
                              </div>
                              <div class="contract-spec-item">
                                <span class="c-spec-label">Ngày hết hạn</span>
                                <span class="c-spec-value">{{ contract.endDate | date:'dd/MM/yyyy' }}</span>
                              </div>
                              <div class="contract-spec-item full-width-spec">
                                <span class="c-spec-label">Kỳ thanh toán</span>
                                <span class="c-spec-value">{{ contract.paymentCycle || 'Thanh toán hàng tháng' }}</span>
                              </div>
                            </div>
                          </div>

                          <div class="contract-card-footer">
                            <button (click)="triggerCheckOutFromDetail(contract.contractId)" class="btn btn-danger btn-sm">Làm thủ tục trả phòng (Check-out)</button>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-tenants-box-light text-center py-4">
                      <span class="empty-icon" style="font-size: 2.2rem;"></span>
                      <h3 style="margin: 8px 0; color: #1e293b; font-weight: 800;">Phòng hiện đang trống</h3>
                      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 12px;">Chưa có hợp đồng cho thuê nào đang hoạt động ở phòng này.</p>
                      <button (click)="openCheckInFromDetail(room)" class="btn btn-success font-bold">+ Lập hợp đồng & Check-in ngay</button>
                    </div>
                  }
                </div>
              }

              <!-- TAB 4: BILLING HISTORY -->
              @if (activeTab() === 'bills') {
                <div class="bills-tab-container">
                  <h4 class="mb-3 font-bold" style="color: #1e1b4b; font-size: 1.05rem;">Lịch Sử Hóa Đơn Điện Nước Phòng {{ room.roomNumber }}</h4>
                  @if (room.recentBills && room.recentBills.length > 0) {
                    <div class="bills-table-wrapper">
                      <table class="bill-history-table">
                        <thead>
                          <tr>
                            <th>Kỳ HĐ</th>
                            <th>Điện dùng</th>
                            <th>Nước dùng</th>
                            <th>Tổng tiền</th>
                            <th>Đã thu</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (bill of room.recentBills; track bill.billId) {
                            <tr>
                              <td><strong>Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</strong></td>
                              <td>{{ bill.electricityUsage }} kWh</td>
                              <td>{{ bill.waterUsage }} m³</td>
                              <td class="font-bold" style="color: #4338ca;">{{ bill.totalAmount | number:'1.0-0' }}đ</td>
                              <td>{{ bill.paidAmount | number:'1.0-0' }}đ</td>
                              <td>
                                <span class="bill-status-tag" [class.paid]="bill.status === 'Paid'" [class.unpaid]="bill.status === 'Unpaid'">
                                  {{ bill.status === 'Paid' ? 'Đã thu' : 'Chưa thu' }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="empty-bills-box-light text-center py-4">
                      Chưa có lịch sử hóa đơn nào cho phòng này.
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-actions mt-4 pt-3" style="border-top: 1px solid #e2e8f0;">
              <button (click)="closeRoomDetailModal()" class="btn btn-secondary px-5" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-weight: 700;">Đóng lại</button>
            </div>
          </div>
        </div>
      }

      <!-- 6. Edit Room Modal -->
      @if (showEditRoomModal()) {
        <div class="modal-backdrop" (click)="closeEditRoomModal()">
          <div class="glass-panel modal-card max-w-600" (click)="$event.stopPropagation()">
            <button (click)="closeEditRoomModal()" class="modal-close-btn">&times;</button>
            <h2 class="m-0">Chỉnh Sửa Thông Tin Phòng</h2>
            <p class="text-muted text-sm mt-1">Cập nhật thông tin phòng: {{ editRoomModel.roomNumber }}</p>

            <form (ngSubmit)="submitEditRoom()" class="mt-3">
              <div class="form-group mb-3">
                <label>Số phòng / Tên phòng <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="editRoomModel.roomNumber" name="editRoomNumber" required class="form-control" />
              </div>

              <div class="row-flex mb-3">
                <div class="form-group flex-1">
                  <label>Giá thuê (VND/tháng) <span class="text-danger">*</span></label>
                  <input type="number" [(ngModel)]="editRoomModel.price" name="editPrice" required class="form-control" />
                </div>
                <div class="form-group flex-1">
                  <label>Diện tích (m²) <span class="text-danger">*</span></label>
                  <input type="number" step="0.1" [(ngModel)]="editRoomModel.area" name="editArea" required class="form-control" />
                </div>
              </div>

              <div class="row-flex mb-3">
                <div class="form-group flex-1">
                  <label>Số người ở tối đa <span class="text-danger">*</span></label>
                  <input type="number" [(ngModel)]="editRoomModel.maxOccupants" name="editMaxOccupants" required class="form-control" />
                </div>
                <div class="form-group flex-1">
                  <label>Trạng thái phòng</label>
                  <select [(ngModel)]="editRoomModel.status" name="editStatus" class="form-control" [disabled]="editRoomModel.status === 'Rented'">
                    <option value="Available">Trống (Available)</option>
                    <option value="Maintenance">Bảo trì (Maintenance)</option>
                    @if (editRoomModel.status === 'Rented') {
                      <option value="Rented">Đang thuê (Rented)</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Amenities Selection -->
              <div class="form-group mb-3">
                <label class="mb-2 block font-semibold" style="font-size: 0.9rem; color: #e2e8f0;">Chọn tiện nghi phòng:</label>
                <div class="amenities-edit-grid">
                  @for (am of availableAmenitiesList; track am) {
                    <label class="am-edit-card" [class.selected]="isAmenitySelected(am)">
                      <input type="checkbox" [checked]="isAmenitySelected(am)" (change)="toggleAmenitySelection(am)" />
                      <span>{{ getAmenityIcon(am) }} {{ am }}</span>
                    </label>
                  }
                </div>
              </div>

              <!-- Existing Images Management -->
              @if (editRoomModel.existingImageUrls.length > 0) {
                <div class="form-group mb-3">
                  <label class="mb-2 block font-semibold" style="font-size: 0.9rem; color: #e2e8f0;">Ảnh phòng hiện tại:</label>
                  <div class="gallery-previews-grid">
                    @for (img of editRoomModel.existingImageUrls; track $index) {
                      <div class="gallery-preview-item">
                        <img [src]="getImageUrl(img)" alt="Ảnh phòng" />
                        <button type="button" (click)="removeExistingImage($index)" class="remove-img-btn" title="Xóa ảnh">&times;</button>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- New Image Upload -->
              <div class="form-group mb-3">
                <label class="mb-2 block font-semibold" style="font-size: 0.9rem; color: #e2e8f0;">Tải thêm ảnh mới:</label>
                <input type="file" accept="image/*" multiple (change)="onNewRoomImagesSelected($event)" class="file-input-hidden" id="editRoomNewImages" />
                <label for="editRoomNewImages" class="gallery-add-btn">
                  <span class="plus-icon">+</span>
                  <span>Chọn tệp ảnh từ máy tính</span>
                </label>
                @if (editRoomModel.newPreviews.length > 0) {
                  <div class="gallery-previews-grid mt-2">
                    @for (preview of editRoomModel.newPreviews; track $index) {
                      <div class="gallery-preview-item">
                        <img [src]="preview" alt="Ảnh mới" />
                        <button type="button" (click)="removeNewImagePreview($index)" class="remove-img-btn" title="Xóa">&times;</button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="modal-actions mt-4">
                <button type="button" (click)="closeEditRoomModal()" class="btn btn-secondary px-4">Hủy</button>
                <button type="submit" class="btn btn-primary px-4">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
.properties-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem 1rem;
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .page-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
    }
    .btn-import-data {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-import-data:hover {
      background: #f1f5f9;
    }
    .btn-create-property {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 22px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-create-property:hover {
      background: #1d4ed8;
    }

    /* HORIZONTAL PROPERTY CARD (MATCHING SCREENSHOT) */
    .property-cards-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .property-card-horizontal {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      gap: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease;
    }
    .property-card-horizontal:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
      border-color: #93c5fd;
    }

    .card-cover-col {
      width: 320px;
      height: 220px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }
    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge-type {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(255, 255, 255, 0.95);
      color: #1e293b;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .card-info-col {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .property-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
    }
    .status-badge-active {
      background: #2563eb;
      color: #ffffff;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .property-address {
      font-size: 0.88rem;
      color: #64748b;
    }
    .property-date {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .stats-boxes-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .stat-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 10px 14px;
      transition: all 0.2s ease;
    }
    .stat-box-available {
      background: #f0fdf4 !important;
      border: 1.5px solid #86efac !important;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12);
    }
    .stat-title {
      font-size: 0.78rem;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 1.3rem;
      font-weight: 900;
      color: #0f172a;
    }
    .text-available {
      color: #059669 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pulse-dot-green {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulseGreen 1.6s infinite ease-in-out;
    }
    @keyframes pulseGreen {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .bank-account-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .uppercase-sub {
      letter-spacing: 0.04em;
    }
    .btn-change-bank {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-change-bank:hover { color: #2563eb; }

    .btn-action-light {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 7px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-action-light:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-action-ad {
      background: #fff7ed;
      border: 1px solid #ffedd5;
      color: #ea580c;
      padding: 7px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .badge-ad {
      background: #ea580c;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .cursor-pointer { cursor: pointer; }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #cbd5e1;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto 12px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .property-card-horizontal {
        flex-direction: column;
      }
      .card-cover-col {
        width: 100%;
        height: 200px;
      }
      .stats-boxes-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    .properties-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    @media (max-width: 850px) {
      .properties-grid {
        grid-template-columns: 1fr;
      }
    }
    .property-list-sidebar {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .sidebar-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: rgba(255, 255, 255, 0.01);
      transition: var(--transition);
    }
    .sidebar-item:hover {
      border-color: rgba(99, 102, 241, 0.3);
      background: rgba(255, 255, 255, 0.03);
    }
    .sidebar-item.active {
      border-color: var(--color-primary);
      background: rgba(99, 102, 241, 0.08);
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
    }
    .verified-indicator {
      font-size: 1.2rem;
    }
    .sidebar-prop-img {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .item-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .item-title {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-sub {
      font-size: 0.75rem;
      color: var(--text-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .matrix-details-card {
      padding: 24px;
    }
    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .matrix-legend {
      display: flex;
      gap: 20px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      display: inline-block;
    }
    .color-dot.available { background: rgba(16, 185, 129, 0.2); border: 1px solid var(--color-success); }
    .color-dot.rented { background: rgba(99, 102, 241, 0.15); border: 1px solid var(--color-primary); }
    .color-dot.maintenance { background: rgba(245, 158, 11, 0.15); border: 1px solid var(--color-warning); }

    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .form-group-sub {
      display: flex;
      flex-direction: column;
    }
    .form-group-sub label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    
    .room-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .matrix-room-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 16px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 110px;
    }
    .matrix-room-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .room-available {
      background: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.45);
    }
    .room-available:hover {
      border-color: var(--color-success);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
    }
    .room-rented {
      background: rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
    }
    .room-rented:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
    }
    .room-maintenance {
      background: rgba(245, 158, 11, 0.05);
      border-color: rgba(245, 158, 11, 0.3);
    }

    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .room-label {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1rem;
    }
    .room-status-badge {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .room-available .room-status-badge { 
      color: #ffffff; 
      background: #059669; 
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.35);
    }
    .room-rented .room-status-badge { color: var(--color-primary-light); background: rgba(99, 102, 241, 0.15); }
    .room-maintenance .room-status-badge { color: #fbd38d; background: rgba(245, 158, 11, 0.15); }

    .room-price-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 10px;
    }
    .room-area-val {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
    
    .empty-matrix-msg {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
    }
    .clickable-text {
      color: var(--color-primary-light);
      cursor: pointer;
      text-decoration: underline;
    }
    .no-selection-card {
      text-align: center;
      padding: 80px 40px;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 15px;
      display: inline-block;
    }

    /* Modal Backdrop and Box */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      padding: 30px;
      position: relative;
      background: #161b22;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
    }
    .modal-card::-webkit-scrollbar {
      width: 6px;
    }
    .modal-card::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    .modal-card::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
    .modal-card::-webkit-scrollbar-thumb:hover {
      background: var(--color-primary);
    }
    .max-w-500 { max-width: 500px; }
    .max-w-600 { max-width: 600px; }
    .max-w-680 { max-width: 680px; }

    .form-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 20px;
    }
    .section-subtitle {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-primary-light);
      margin-bottom: 14px;
    }
    .address-grid-custom {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .full-width {
      grid-column: span 2;
    }
    .bg-dark-muted {
      background: rgba(255, 255, 255, 0.05) !important;
      color: #94a3b8 !important;
      cursor: not-allowed;
    }
    .services-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 10px;
    }
    .service-checkbox-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      color: #e2e8f0;
      transition: all 0.2s ease;
    }
    .service-checkbox-card:hover {
      border-color: var(--color-primary);
      background: rgba(99, 102, 241, 0.1);
    }
    .service-checkbox-card input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }

    .file-upload-btn-main {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      min-height: 130px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.02);
      transition: all 0.2s ease;
      width: 100%;
    }
    .file-upload-btn-main:hover {
      border-color: var(--color-primary);
      background: rgba(99, 102, 241, 0.05);
    }
    .preview-container {
      position: relative;
      width: 100%;
      height: 160px;
    }
    .change-photo-badge {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .upload-placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 0.88rem;
    }
    .upload-icon {
      font-size: 1.8rem;
    }

    .gallery-upload-box {
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
    }
    .gallery-add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--color-primary-light);
      font-weight: 600;
      font-size: 0.88rem;
    }
    .plus-icon {
      font-size: 1.2rem;
      font-weight: 800;
    }
    .gallery-previews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
    }
    .gallery-preview-item {
      position: relative;
      height: 75px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .gallery-preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-img-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(244, 63, 94, 0.85);
      border: none;
      color: #fff;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .remove-img-btn:hover {
      background: var(--color-danger);
    }

    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.05);
      border: none;
      color: var(--text-main);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }
    .modal-close-btn:hover { background: var(--color-danger); }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .row-flex {
      display: flex;
      gap: 15px;
    }
    .flex-1 { flex: 1; }
    .flex-col { flex-direction: column; }
    .gap-2 { gap: 8px; }
    .text-center { text-align: center; }
    .avatar-ph {
      font-size: 3rem;
      background: rgba(255,255,255,0.05);
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      margin-bottom: 15px;
    }
    .tenant-detail-card .details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      background: rgba(255,255,255,0.02);
      padding: 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    .file-input-hidden {
      display: none;
    }
    .file-upload-btn {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-sm);
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.02);
      transition: var(--transition);
      color: #94a3b8;
      font-size: 0.9rem;
    }
    .file-upload-btn:hover {
      border-color: var(--color-primary-light);
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .upload-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .max-w-750 { max-width: 800px; }
    
    /* LIGHT THEME MODAL STYLING */
    .room-detail-light-card {
      background: #ffffff !important;
      color: #0f172a !important;
      border: 1px solid #cbd5e1 !important;
      box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25) !important;
    }
    
    .room-detail-header-card-light {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
      border: 1px solid #bae6fd !important;
      border-radius: 14px;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12);
    }
    .room-header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .room-big-badge-light {
      font-size: 1.4rem;
      font-weight: 900;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      border: 1px solid #7dd3fc;
      color: #ffffff !important;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      white-space: nowrap;
    }
    .room-header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    .status-pill {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 5px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .status-available { background: #dcfce7; color: #15803d !important; border: 1px solid #86efac; }
    .status-rented { background: #e0e7ff; color: #4338ca !important; border: 1px solid #c7d2fe; }
    .status-maintenance { background: #fef3c7; color: #b45309 !important; border: 1px solid #fde68a; }

    .header-action-btns {
      display: flex;
      gap: 8px;
    }
    .btn-edit-light {
      background: #ffffff !important;
      color: #4338ca !important;
      border: 1px solid #c7d2fe !important;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .btn-edit-light:hover {
      background: #eef2ff !important;
      border-color: #6366f1 !important;
    }
    .btn-danger-outline-light {
      background: #fff1f2 !important;
      border: 1px solid #fecdd3 !important;
      color: #e11d48 !important;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .btn-danger-outline-light:hover {
      background: #ffe4e6 !important;
      border-color: #fda4af !important;
    }

    .room-detail-tabs-light {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px;
      border-radius: 12px;
      margin-bottom: 18px;
    }
    .tab-btn-light {
      flex: 1;
      background: transparent;
      border: none;
      color: #475569 !important;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .tab-btn-light:hover {
      color: #0f172a !important;
      background: rgba(255, 255, 255, 0.6);
    }
    .tab-btn-light.active {
      color: #4338ca !important;
      background: #ffffff !important;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15) !important;
      border: 1px solid #c7d2fe;
    }

    .specs-grid-cards-light {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 640px) {
      .specs-grid-cards-light {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .spec-card-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .spec-icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }
    .spec-icon-badge.gold { background: #fef3c7; border: 1px solid #fde68a; }
    .spec-icon-badge.cyan { background: #cffafe; border: 1px solid #a5f3fc; }
    .spec-icon-badge.purple { background: #f3e8ff; border: 1px solid #e9d5ff; }
    .spec-icon-badge.green { background: #dcfce7; border: 1px solid #bbf7d0; }

    .spec-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .spec-label-light {
      font-size: 0.72rem;
      color: #64748b !important;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
      white-space: nowrap;
    }
    .spec-value-light {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a !important;
      white-space: nowrap;
    }
    .text-gold-light { color: #d97706 !important; }

    .quick-status-bar-light {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .status-btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-status-option-light {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155 !important;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-status-option-light.active {
      border-color: #6366f1;
      background: #e0e7ff !important;
      color: #4338ca !important;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
    }
    .rented-lock-note-light {
      font-size: 0.85rem;
      color: #475569 !important;
      font-style: italic;
      font-weight: 600;
    }

    .amenities-section-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px;
    }
    .section-title-light {
      font-size: 1rem;
      font-weight: 800;
      color: #4338ca !important;
      margin: 0 0 10px 0;
    }
    .amenity-badges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 10px;
    }
    .amenity-badge-item-light {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 9px 14px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #3730a3 !important;
    }

    .gallery-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .room-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    .room-gallery-card {
      height: 120px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      transition: transform 0.2s ease;
    }
    .room-gallery-card:hover {
      transform: scale(1.03);
    }
    .room-gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .empty-gallery-box-light {
      text-align: center;
      padding: 40px;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      color: #64748b;
      background: #f8fafc;
    }

    /* CONTRACT CARDS LIGHT STYLING */
    .contract-card-item-light {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .contract-card-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 10px;
    }
    .contract-code-badge {
      background: #4f46e5;
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .contract-status-active {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .contract-card-main-body {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 18px;
      align-items: center;
    }
    @media (max-width: 650px) {
      .contract-card-main-body {
        grid-template-columns: 1fr;
      }
    }
    .tenant-profile-side {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 14px;
      border-right: 1px solid #f1f5f9;
    }
    @media (max-width: 650px) {
      .tenant-profile-side {
        border-right: none;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 12px;
      }
    }
    .contract-tenant-avatar-light {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #e0e7ff;
      border: 1px solid #c7d2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .contract-tenant-name-light {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }
    .contract-sub-info {
      font-size: 0.82rem;
      color: #475569;
      margin-top: 2px;
    }

    .contract-details-grid-light {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .contract-spec-item {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .full-width-spec {
      grid-column: span 2;
    }
    .c-spec-label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .c-spec-value {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
    }
    .text-indigo { color: #4338ca !important; }
    .text-green { color: #15803d !important; }

    .contract-card-footer {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }

    .empty-tenants-box-light {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 30px;
    }

    .bill-history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .bill-history-table th {
      text-align: left;
      padding: 11px 14px;
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      border-bottom: 2px solid #cbd5e1;
    }
    .bill-history-table td {
      padding: 11px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .bill-status-tag {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .bill-status-tag.paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .bill-status-tag.unpaid { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
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
  `]
})
export class LandlordPropertiesComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly contractService = inject(ContractService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  properties = signal<any[]>([]);
  isLoading = signal(true);
  selectedProperty = signal<any | null>(null);

  // Modal Control Signals
  showAddPropertyModal = signal(false);
  showAddRoomModal = signal(false);
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
    waterPricingType: 'fixed',
    waterUnitPrice: 100000
  };
  showRentedActionsModal = signal<any | null>(null);
  showPremiumModal = signal(false);

  // Room Detail & Edit Signals
  selectedRoomDetail = signal<any | null>(null);
  showRoomDetailModal = signal(false);
  showEditRoomModal = signal(false);
  activeTab = signal<'overview' | 'images' | 'tenants' | 'bills'>('overview');

  availableAmenitiesList = [
    'Điều hòa',
    'Nóng lạnh',
    'Tủ lạnh',
    'Máy giặt',
    'Ban công / Cửa sổ',
    'WC khép kín',
    'Wifi tốc độ cao',
    'Giường & Nệm',
    'Tủ quần áo',
    'Bàn làm việc',
    'Khu bếp riêng',
    'Khóa vân tay'
  ];

  editRoomModel = {
    id: 0,
    roomNumber: '',
    price: 0,
    area: 0,
    maxOccupants: 1,
    status: 'Available',
    amenities: [] as string[],
    existingImageUrls: [] as string[],
    newImageBase64s: [] as string[],
    newPreviews: [] as string[]
  };

  activeContractsOfRoom = signal<any[]>([]);

  districts = signal<any[]>([]);
  wards = signal<any[]>([]);

  // Form Models
  newPropAddress = { houseNumber: '', street: '', ward: '', district: '' };
  newProp = { title: '', address: '', description: '', imageBase64: '' };
  googleMapUrl = '';
  userDescription = '';

  services = {
    electric: true,
    water: true,
    wifi: true,
    security: true,
    parking: true,
    freedom: true,
    aircon: true,
    waterHeater: true,
    laundry: true
  };

  propImagePreview = signal('');
  galleryPreviews = signal<string[]>([]);
  galleryBase64s = signal<string[]>([]);

  newRoom = { roomNumber: '', price: 0, area: 0, maxOccupants: 1 };

  ngOnInit(): void {
    this.fetchProperties();
    this.propertyService.getLocations(2).subscribe({
      next: (data) => this.districts.set(data),
      error: (err) => console.error(err)
    });
  }

  onPropDistrictChange(): void {
    this.newPropAddress.ward = '';
    this.wards.set([]);

    if (this.newPropAddress.district) {
      const distName = this.newPropAddress.district;
      const districtObj = this.districts().find(d => 
        d.name === distName || 
        d.name.replace(/^(Quận|Huyện|Thị xã)\s+/, '') === distName
      );

      if (districtObj) {
        this.propertyService.getChildren(districtObj.id).subscribe({
          next: (data) => this.wards.set(data),
          error: (err) => console.error(err)
        });
      }
    }
  }

  fetchProperties(selectFirst = true): void {
    this.isLoading.set(true);
    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.isLoading.set(false);
        if (selectFirst && data.length > 0) {
          // Select the first property automatically
          const firstProp = data[0];
          // Retrieve fully loaded property details
          this.loadPropertyDetails(firstProp.id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách nhà trọ.', 'error');
      }
    });
  }

  loadPropertyDetails(id: number): void {
    this.propertyService.getProperty(id).subscribe({
      next: (fullProp) => {
        this.selectedProperty.set(fullProp);
      },
      error: () => {
        this.toastService.show('Lỗi tải sơ đồ phòng chi tiết.', 'error');
      }
    });
  }

  selectProperty(prop: any): void {
    this.loadPropertyDetails(prop.id);
  }

  getVietnameseStatus(status: string): string {
    switch (status) {
      case 'Available': return 'Trống';
      case 'Rented': return 'Đã thuê';
      case 'Maintenance': return 'Bảo trì';
      default: return status;
    }
  }

  navigateToCreateProperty(): void {
    this.router.navigate(['/landlord/create-property']);
  }

  openEditPropertyModal(prop: any): void {
    this.router.navigate(['/landlord/create-property'], { queryParams: { id: prop.id } });
  }

  navigateToRooms(propertyId: number): void {
    this.router.navigate(['/landlord/rooms'], { queryParams: { propertyId } });
  }

  getRentedRoomsCount(prop: any): number {
    return prop?.rooms ? prop.rooms.filter((r: any) => r.status === 'Rented').length : 0;
  }

  getAvailableRoomsCount(prop: any): number {
    return prop?.rooms ? prop.rooms.filter((r: any) => r.status === 'Available').length : 0;
  }

  importData(): void {
    this.toastService.show('Chức năng nhập dữ liệu sẵn sàng!', 'info');
  }

  openBankModal(prop: any): void {
    this.toastService.show(`Liên kết tài khoản nhận tiền cho khu trọ: ${prop.title}`, 'info');
  }

  navigateToPackages() {
    this.showPremiumModal.set(false);
    this.router.navigate(['/landlord/packages']);
  }

  // Add Property handlers
  openAddPropertyModal(): void {
    this.router.navigate(['/landlord/create-property']);
  }

  closeAddPropertyModal(): void {
    this.showAddPropertyModal.set(false);
  }

  onGalleryImagesSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.galleryPreviews.update(prev => [...prev, base64]);
        this.galleryBase64s.update(prev => [...prev, base64]);
      };
      reader.readAsDataURL(files[i]);
    }
  }

  removeGalleryImage(index: number): void {
    this.galleryPreviews.update(prev => prev.filter((_, i) => i !== index));
    this.galleryBase64s.update(prev => prev.filter((_, i) => i !== index));
  }

  submitProperty(): void {
    const { houseNumber, street, ward, district } = this.newPropAddress;
    const parts = [houseNumber, street, ward, district].filter(p => p && p.trim() !== '');
    this.newProp.address = `${parts.join(', ')}, Thành phố Hà Nội`;

    let fullDesc = '';
    if (this.googleMapUrl) {
      fullDesc += `Vị trí Google Maps: ${this.googleMapUrl}\n\n`;
    }

    const activeServices: string[] = [];
    if (this.services.electric) activeServices.push('Điện sinh hoạt (Giá dân / Đồng hồ riêng)');
    if (this.services.water) activeServices.push('Nước sạch sinh hoạt');
    if (this.services.wifi) activeServices.push('Wifi tốc độ cao');
    if (this.services.security) activeServices.push('An ninh 24/7 / Camera giám sát');
    if (this.services.parking) activeServices.push('Chỗ để xe máy rộng rãi');
    if (this.services.freedom) activeServices.push('Giờ giấc tự do / Không chung chủ');
    if (this.services.aircon) activeServices.push('Trang bị Điều hòa');
    if (this.services.waterHeater) activeServices.push('Trang bị Nóng lạnh');
    if (this.services.laundry) activeServices.push('Máy giặt chung / Ban công phơi đồ');

    if (activeServices.length > 0) {
      fullDesc += `Tiện ích & Dịch vụ khu trọ:\n- ${activeServices.join('\n- ')}\n\n`;
    }

    if (this.userDescription) {
      fullDesc += `Mô tả chi tiết:\n${this.userDescription}`;
    }

    this.newProp.description = fullDesc.trim();

    this.propertyService.createProperty(this.newProp).subscribe({
      next: (created) => {
        this.toastService.show('Đã tạo thành công khu trọ mới!', 'success');
        this.showAddPropertyModal.set(false);
        this.fetchProperties(false); // reload but don't force select first, select the new one instead
        this.loadPropertyDetails(created.id);
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Có lỗi xảy ra khi tạo khu trọ.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  onPropertyImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.newProp.imageBase64 = base64;
      this.propImagePreview.set(base64);
    };
    reader.readAsDataURL(file);
  }

  onEditPropertyImage(event: any, prop: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const propId = prop.id || prop.propertyId;
    if (!propId) {
      this.toastService.show('Không tìm thấy ID khu trọ.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.propertyService.updatePropertyImage(propId, base64).subscribe({
        next: (res) => {
          this.toastService.show('Đã cập nhật ảnh đại diện khu trọ thành công!', 'success');
          prop.imageUrl = res.imageUrl; // Update locally
          prop.propertyImageUrl = res.imageUrl;
          if (this.selectedProperty()?.id === propId || this.selectedProperty()?.propertyId === propId) {
            this.selectedProperty.set({ ...this.selectedProperty(), imageUrl: res.imageUrl, propertyImageUrl: res.imageUrl });
          }
          this.fetchProperties(false);
        },
        error: (err) => {
          const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi kết nối server');
          this.toastService.show('Không thể cập nhật ảnh: ' + msg, 'error');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:5000${url}` : url;
  }

  // Add Room handlers
  openAddRoomModal(): void {
    this.newRoom = { roomNumber: '', price: 2000000, area: 20, maxOccupants: 2 };
    this.showAddRoomModal.set(true);
  }
  closeAddRoomModal(): void {
    this.showAddRoomModal.set(false);
  }
  submitRoom(): void {
    const prop = this.selectedProperty();
    if (!prop) return;

    this.propertyService.addRoom(prop.id, this.newRoom).subscribe({
      next: () => {
        this.toastService.show('Đã tạo thành công phòng trọ mới!', 'success');
        this.showAddRoomModal.set(false);
        this.loadPropertyDetails(prop.id); // reload room matrix
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi thêm phòng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Room Grid clicks handler - Opens detailed room modal for landlord
  onRoomClick(room: any): void {
    this.propertyService.getLandlordRoomDetail(room.id).subscribe({
      next: (detail) => {
        this.selectedRoomDetail.set(detail);
        this.activeTab.set('overview');
        this.showRoomDetailModal.set(true);
      },
      error: () => {
        this.toastService.show('Lỗi tải chi tiết phòng.', 'error');
      }
    });
  }

  closeRoomDetailModal(): void {
    this.showRoomDetailModal.set(false);
    this.selectedRoomDetail.set(null);
  }

  getAmenityIcon(amenityName: string): string {
    if (!amenityName) return '';
    const name = amenityName.toLowerCase();
    if (name.includes('điều hòa') || name.includes('máy lạnh')) return '';
    if (name.includes('nóng lạnh') || name.includes('bình nóng')) return '';
    if (name.includes('tủ lạnh')) return '';
    if (name.includes('máy giặt')) return '';
    if (name.includes('ban công') || name.includes('cửa sổ')) return '';
    if (name.includes('wc') || name.includes('vệ sinh')) return '';
    if (name.includes('wifi') || name.includes('mạng')) return '';
    if (name.includes('giường') || name.includes('nệm')) return '';
    if (name.includes('tủ quần áo') || name.includes('tủ gỗ')) return '';
    if (name.includes('bàn') || name.includes('ghế')) return '';
    if (name.includes('bếp')) return '';
    if (name.includes('khóa') || name.includes('vân tay')) return '';
    return '';
  }

  quickChangeStatus(newStatus: string): void {
    const room = this.selectedRoomDetail();
    if (!room || room.status === 'Rented') return;

    const payload = {
      roomNumber: room.roomNumber,
      price: room.price,
      area: room.area,
      maxOccupants: room.maxOccupants,
      status: newStatus,
      amenities: room.amenities || [],
      existingImageUrls: room.imageUrls || [],
      newImageBase64s: []
    };

    this.propertyService.updateRoom(room.id, payload).subscribe({
      next: (updated) => {
        this.selectedRoomDetail.set(updated);
        this.toastService.show(`Đã chuyển trạng thái phòng sang: ${this.getVietnameseStatus(newStatus)}`, 'success');
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id);
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Có lỗi xảy ra.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  onUploadRoomImagesDirect(event: any): void {
    const room = this.selectedRoomDetail();
    if (!room) return;

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newBase64s: string[] = [];
    let loadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newBase64s.push(e.target.result);
        loadedCount++;
        if (loadedCount === files.length) {
          const payload = {
            roomNumber: room.roomNumber,
            price: room.price,
            area: room.area,
            maxOccupants: room.maxOccupants,
            status: room.status,
            amenities: room.amenities || [],
            existingImageUrls: room.imageUrls || [],
            newImageBase64s: newBase64s
          };

          this.propertyService.updateRoom(room.id, payload).subscribe({
            next: (updated) => {
              this.selectedRoomDetail.set(updated);
              this.toastService.show('Đã tải thêm ảnh phòng thành công!', 'success');
              if (this.selectedProperty()) {
                this.loadPropertyDetails(this.selectedProperty().id);
              }
            },
            error: (err) => {
              const msg = err.error?.message || 'Lỗi tải ảnh.';
              this.toastService.show(msg, 'error');
            }
          });
        }
      };
      reader.readAsDataURL(files[i]);
    }
  }

  openCheckInFromDetail(roomDetail: any): void {
    this.closeRoomDetailModal();
    const today = new Date().toISOString().substring(0, 10);
    const oneYearLater = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10);
    
    this.checkInModel = {
      propertyId: this.selectedProperty()?.id || 0,
      propertyTitle: this.selectedProperty()?.title || '',
      roomId: roomDetail.id,
      roomNumber: roomDetail.roomNumber,
      startDate: today,
      endDate: oneYearLater,
      roomPrice: roomDetail.price || 0,
      depositAmount: roomDetail.price || 0,
      bedsCount: 1,
      paymentCycle: '1 tháng',
      tenantFullName: '',
      tenantPhone: '',
      tenantIdCardNumber: '',
      electricityUnitPrice: 3500,
      waterPricingType: 'fixed',
      waterUnitPrice: 100000
    };
    this.showCheckInModal.set(roomDetail);
  }

  triggerCheckOutFromDetail(contractId: number): void {
    if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng và làm thủ tục trả phòng không?')) return;

    this.contractService.checkOut(contractId).subscribe({
      next: () => {
        this.toastService.show('Trả phòng thành công!', 'success');
        if (this.selectedRoomDetail()) {
          this.propertyService.getLandlordRoomDetail(this.selectedRoomDetail().id).subscribe({
            next: (updated) => this.selectedRoomDetail.set(updated)
          });
        }
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id);
        }
      },
      error: (err) => {
        this.toastService.show(err.error || 'Lỗi trả phòng.', 'error');
      }
    });
  }

  openEditRoomModal(roomDetail: any): void {
    this.editRoomModel = {
      id: roomDetail.id,
      roomNumber: roomDetail.roomNumber,
      price: roomDetail.price,
      area: roomDetail.area,
      maxOccupants: roomDetail.maxOccupants,
      status: roomDetail.status,
      amenities: [...(roomDetail.amenities || [])],
      existingImageUrls: [...(roomDetail.imageUrls || [])],
      newImageBase64s: [],
      newPreviews: []
    };
    this.showEditRoomModal.set(true);
  }

  closeEditRoomModal(): void {
    this.showEditRoomModal.set(false);
  }

  isAmenitySelected(amenity: string): boolean {
    return this.editRoomModel.amenities.includes(amenity);
  }

  toggleAmenitySelection(amenity: string): void {
    if (this.isAmenitySelected(amenity)) {
      this.editRoomModel.amenities = this.editRoomModel.amenities.filter(a => a !== amenity);
    } else {
      this.editRoomModel.amenities.push(amenity);
    }
  }

  removeExistingImage(index: number): void {
    this.editRoomModel.existingImageUrls.splice(index, 1);
  }

  onNewRoomImagesSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.editRoomModel.newPreviews.push(base64);
        this.editRoomModel.newImageBase64s.push(base64);
      };
      reader.readAsDataURL(files[i]);
    }
  }

  removeNewImagePreview(index: number): void {
    this.editRoomModel.newPreviews.splice(index, 1);
    this.editRoomModel.newImageBase64s.splice(index, 1);
  }

  submitEditRoom(): void {
    const payload = {
      roomNumber: this.editRoomModel.roomNumber,
      price: this.editRoomModel.price,
      area: this.editRoomModel.area,
      maxOccupants: this.editRoomModel.maxOccupants,
      status: this.editRoomModel.status,
      amenities: this.editRoomModel.amenities,
      existingImageUrls: this.editRoomModel.existingImageUrls,
      newImageBase64s: this.editRoomModel.newImageBase64s
    };

    this.propertyService.updateRoom(this.editRoomModel.id, payload).subscribe({
      next: (updated) => {
        this.toastService.show('Đã cập nhật thông tin phòng trọ thành công!', 'success');
        this.selectedRoomDetail.set(updated);
        this.showEditRoomModal.set(false);
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id);
        }
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi cập nhật phòng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  onDeleteRoom(roomDetail: any): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ${roomDetail.roomNumber} khỏi khu trọ không?`)) return;

    this.propertyService.deleteRoom(roomDetail.id).subscribe({
      next: () => {
        this.toastService.show(`Đã xóa thành công phòng ${roomDetail.roomNumber}!`, 'success');
        this.closeRoomDetailModal();
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id);
        }
      },
      error: (err) => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi xóa phòng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  addOccupantFromModal(room: any): void {
    this.showRentedActionsModal.set(null);
    const today = new Date().toISOString().substring(0, 10);
    const oneYearLater = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10);

    this.checkInModel = {
      propertyId: this.selectedProperty()?.id || 0,
      propertyTitle: this.selectedProperty()?.title || '',
      roomId: room.id,
      roomNumber: room.roomNumber,
      startDate: today,
      endDate: oneYearLater,
      roomPrice: room.price || 0,
      depositAmount: room.price || 0,
      bedsCount: 1,
      paymentCycle: '1 tháng',
      tenantFullName: '',
      tenantPhone: '',
      tenantIdCardNumber: '',
      electricityUnitPrice: 3500,
      waterPricingType: 'fixed',
      waterUnitPrice: 100000
    };
    this.showCheckInModal.set(room);
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

  // Check-In submission
  closeCheckInModal(): void { this.showCheckInModal.set(null); }
  
  onTenantPhoneInput(event: any): void {
    const phone = event.target.value;
    if (phone && /^0[35789]\d{8}$/.test(phone)) {
      this.contractService.getTenantByPhone(phone).subscribe({
        next: (tenant) => {
          if (tenant) {
            this.checkInModel.tenantFullName = tenant.fullName || '';
            this.checkInModel.tenantIdCardNumber = tenant.cccdNumber || '';
            this.toastService.show(`Tìm thấy thông tin khách thuê: ${tenant.fullName}`, 'success');
          }
        },
        error: () => {
          // Not found is fine, landlord can input new tenant details
        }
      });
    }
  }

  submitCheckIn(): void {
    this.contractService.checkIn(this.checkInModel).subscribe({
      next: () => {
        this.toastService.show('Đã làm thủ tục Check-in nhận phòng thành công!', 'success');
        this.showCheckInModal.set(null);
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id); // refresh room status
        }
      },
      error: (err) => {
        this.toastService.show(err.error || 'Có lỗi xảy ra khi Check-in.', 'error');
      }
    });
  }

  // Check-Out trigger
  closeRentedActionsModal(): void { this.showRentedActionsModal.set(null); }
  triggerCheckOut(contractId: number): void {
    if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng thuê và làm thủ tục trả phòng (Check-out) không?')) return;

    this.contractService.checkOut(contractId).subscribe({
      next: () => {
        this.toastService.show('Làm thủ tục trả phòng thành công! Phòng đã được khôi phục về trạng thái trống.', 'success');
        this.showRentedActionsModal.set(null);
        if (this.selectedProperty()) {
          this.loadPropertyDetails(this.selectedProperty().id); // refresh matrix
        }
      },
      error: (err) => {
        this.toastService.show(err.error || 'Lỗi thực hiện trả phòng.', 'error');
      }
    });
  }
}
