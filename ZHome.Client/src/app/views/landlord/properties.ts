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
      <div class="header-row">
        <div>
          <h1>Quản Lý Nhà & Phòng Trọ</h1>
          <p>Thiết lập cơ cấu tài sản, phòng cho thuê, và thực hiện check-in cho khách thuê</p>
        </div>
        <div class="actions">
          <button (click)="openAddPropertyModal()" class="btn btn-primary">+ Thêm Khu Trọ Mới</button>
        </div>
      </div>

      <!-- Properties Layout -->
      @if (isLoading()) {
        <div class="loading-state">Đang tải danh sách nhà trọ...</div>
      } @else if (properties().length === 0) {
        <div class="empty-state">
          <p>Bạn chưa có khu trọ nào đăng ký trên hệ thống.</p>
          <button (click)="openAddPropertyModal()" class="btn btn-primary mt-3">Thêm khu trọ ngay</button>
        </div>
      } @else {
        <div class="properties-grid">
          <!-- Property Side Bar List -->
          <div class="glass-panel property-list-sidebar">
            <h3>Danh sách khu trọ</h3>
            <div class="sidebar-list">
              @for (prop of properties(); track prop.id) {
                <div 
                  class="sidebar-item" 
                  [class.active]="selectedProperty()?.id === prop.id"
                  (click)="selectProperty(prop)">
                  @if (prop.imageUrl) {
                    <img [src]="getImageUrl(prop.imageUrl)" alt="Ảnh khu trọ" class="sidebar-prop-img" />
                  } @else {
                    <span class="verified-indicator" [class.verified]="prop.isVerifiedTick">
                      {{ prop.isVerifiedTick ? '🛡️' : '🏠' }}
                    </span>
                  }
                  <div class="item-text">
                    <span class="item-title">{{ prop.title }}</span>
                    <span class="item-sub">{{ prop.address }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Room Matrix Area -->
          <div class="room-matrix-area">
            @if (selectedProperty(); as prop) {
              <div class="glass-panel matrix-details-card">
                <div class="matrix-header">
                  <div>
                    <h2>Sơ đồ phòng: {{ prop.title }}</h2>
                    <p class="text-muted">📍 Địa chỉ: {{ prop.address }}</p>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <input type="file" accept="image/*" class="file-input-hidden" id="editPropImage" (change)="onEditPropertyImage($event, prop)" />
                    <label for="editPropImage" class="btn btn-secondary btn-sm" style="margin: 0; cursor: pointer; display: flex; align-items: center;">📸 Đổi ảnh</label>
                    <button (click)="openAddRoomModal()" class="btn btn-secondary btn-sm">+ Thêm Phòng Mới</button>
                  </div>
                </div>

                <div class="matrix-legend">
                  <span class="legend-item"><span class="color-dot available"></span> Trống (Available)</span>
                  <span class="legend-item"><span class="color-dot rented"></span> Đang thuê (Rented)</span>
                  <span class="legend-item"><span class="color-dot maintenance"></span> Bảo trì (Maintenance)</span>
                </div>

                <div class="matrix-grid">
                  @for (room of prop.rooms; track room.id) {
                    <div 
                      class="matrix-room-card" 
                      [class.room-available]="room.status === 'Available'"
                      [class.room-rented]="room.status === 'Rented'"
                      [class.room-maintenance]="room.status === 'Maintenance'"
                      (click)="onRoomClick(room)">
                      <div class="room-header">
                        <span class="room-label">P.{{ room.roomNumber }}</span>
                        <span class="room-status-badge">{{ getVietnameseStatus(room.status) }}</span>
                      </div>
                      <div class="room-body">
                        <div class="room-price-val">{{ room.price | number:'1.0-0' }}đ</div>
                        <div class="room-area-val">{{ room.area }} m² • Max {{ room.maxOccupants }} người</div>
                      </div>
                    </div>
                  }
                  @if (prop.rooms.length === 0) {
                    <div class="empty-matrix-msg">
                      Khu trọ này chưa được thêm phòng nào. 
                      <a (click)="openAddRoomModal()" class="clickable-text">Thêm phòng ngay!</a>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="glass-panel no-selection-card">
                <span class="empty-icon">👉</span>
                <h3>Vui lòng chọn một khu trọ bên cột trái để xem sơ đồ chi tiết phòng</h3>
              </div>
            }
          </div>
        </div>
      }

      <!-- 1. Add Property Modal -->
      @if (showAddPropertyModal()) {
        <div class="modal-backdrop" (click)="closeAddPropertyModal()">
          <div class="glass-panel modal-card max-w-500" (click)="$event.stopPropagation()">
            <button (click)="closeAddPropertyModal()" class="modal-close-btn">&times;</button>
            <h2>Thêm Khu Trọ Mới</h2>
            <form (ngSubmit)="submitProperty()" class="mt-4">
              <div class="form-group">
                <label for="propTitle">Tên khu trọ/Tòa nhà</label>
                <input type="text" id="propTitle" name="title" [(ngModel)]="newProp.title" required class="form-control" placeholder="Ví dụ: Chung Cư Mini Cầu Giấy Hùng Phát" />
              </div>
              <div class="form-group">
                <label>Địa chỉ chi tiết (Khu vực Hà Nội)</label>
                <div class="address-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
                  <div class="form-group-sub">
                    <label>Số nhà, ngõ/ngách</label>
                    <input type="text" id="propHouseNumber" name="houseNumber" [(ngModel)]="newPropAddress.houseNumber" required class="form-control" placeholder="Số nhà, ngõ..." />
                  </div>
                  <div class="form-group-sub">
                    <label>Tên đường/Thôn</label>
                    <input type="text" id="propStreet" name="street" [(ngModel)]="newPropAddress.street" required class="form-control" placeholder="Tên đường, thôn..." />
                  </div>
                  <div class="form-group-sub">
                    <label>Phường/Xã</label>
                    <input type="text" id="propWard" name="ward" [(ngModel)]="newPropAddress.ward" required class="form-control" placeholder="Phường, Xã..." />
                  </div>
                  <div class="form-group-sub">
                    <label>Quận</label>
                    <select id="propDistrict" name="district" [(ngModel)]="newPropAddress.district" required class="form-control">
                      <option value="">Chọn Quận</option>
                      <option value="Ba Đình">Quận Ba Đình</option>
                      <option value="Bắc Từ Liêm">Quận Bắc Từ Liêm</option>
                      <option value="Cầu Giấy">Quận Cầu Giấy</option>
                      <option value="Đống Đa">Quận Đống Đa</option>
                      <option value="Hà Đông">Quận Hà Đông</option>
                      <option value="Hai Bà Trưng">Quận Hai Bà Trưng</option>
                      <option value="Hoàn Kiếm">Quận Hoàn Kiếm</option>
                      <option value="Hoàng Mai">Quận Hoàng Mai</option>
                      <option value="Long Biên">Quận Long Biên</option>
                      <option value="Nam Từ Liêm">Quận Nam Từ Liêm</option>
                      <option value="Tây Hồ">Quận Tây Hồ</option>
                      <option value="Thanh Xuân">Quận Thanh Xuân</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="propDesc">Mô tả thêm</label>
                <textarea id="propDesc" name="description" [(ngModel)]="newProp.description" class="form-control" rows="3" placeholder="Thông tin về tiện ích chung, gửi xe, bảo vệ..."></textarea>
              </div>
              <div class="form-group" style="margin-top: 15px;">
                <label>Ảnh đại diện khu trọ (Hiển thị trang chủ)</label>
                <div class="file-upload-wrapper" style="margin-top: 5px;">
                  <input 
                    type="file" 
                    accept="image/*" 
                    (change)="onPropertyImageSelected($event)" 
                    class="file-input-hidden"
                    id="propImage" />
                  <label for="propImage" class="file-upload-btn">
                    @if (propImagePreview()) {
                      <img [src]="propImagePreview()" alt="Ảnh khu trọ" class="upload-preview" />
                    } @else {
                      <span>📸 Tải ảnh lên</span>
                    }
                  </label>
                </div>
              </div>
              <div class="modal-actions mt-4">
                <button type="button" (click)="closeAddPropertyModal()" class="btn btn-secondary">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu khu trọ</button>
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

      <!-- 3. Check-in Tenant Modal -->
      @if (showCheckInModal(); as room) {
        <div class="modal-backdrop" (click)="closeCheckInModal()">
          <div class="glass-panel modal-card max-w-600" (click)="$event.stopPropagation()">
            <button (click)="closeCheckInModal()" class="modal-close-btn">&times;</button>
            <h2>Làm Thủ Tục Nhận Phòng (Check-In)</h2>
            <p class="text-muted">Khu trọ: {{ selectedProperty()?.title }} • Phòng: {{ room.roomNumber }}</p>
            
            <form (ngSubmit)="submitCheckIn()" class="mt-3">
              <div class="form-group">
                <label for="tenantName">Họ tên người thuê</label>
                <input type="text" id="tenantName" name="tenantName" [(ngModel)]="checkInModel.tenantFullName" required class="form-control" placeholder="Nhập họ tên đầy đủ" />
              </div>
               <div class="form-group">
                <label for="tenantPhone">Số điện thoại liên hệ</label>
                <input type="text" id="tenantPhone" name="tenantPhone" [(ngModel)]="checkInModel.tenantPhone" (input)="onTenantPhoneInput($event)" required pattern="^0[35789]\\d{8}$" class="form-control" placeholder="Ví dụ: 0912345678" />
              </div>
              <div class="form-group">
                <label for="tenantIdCard">Số CCCD / CMND</label>
                <input type="text" id="tenantIdCard" name="tenantIdCard" [(ngModel)]="checkInModel.tenantIdCardNumber" required pattern="^(\\d{9}|\\d{12})$" class="form-control" placeholder="Nhập 12 số CCCD" />
              </div>
              <div class="row-flex">
                <div class="form-group flex-1">
                  <label for="startDate">Ngày bắt đầu thuê</label>
                  <input type="date" id="startDate" name="startDate" [(ngModel)]="checkInModel.startDate" required class="form-control" />
                </div>
                <div class="form-group flex-1">
                  <label for="endDate">Ngày kết thúc thuê</label>
                  <input type="date" id="endDate" name="endDate" [(ngModel)]="checkInModel.endDate" required class="form-control" />
                </div>
              </div>
              <div class="form-group">
                <label for="rentPrice">Giá thuê chốt hợp đồng (VND/tháng)</label>
                <input type="number" id="rentPrice" name="rentPrice" [(ngModel)]="checkInModel.roomPrice" required class="form-control" />
              </div>
              <div class="modal-actions mt-4">
                <button type="button" (click)="closeCheckInModal()" class="btn btn-secondary">Hủy</button>
                <button type="submit" class="btn btn-success">Đồng ý & Nhận phòng</button>
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
                        <span class="avatar-ph" style="margin: 0; width: 45px; height: 45px; font-size: 1.8rem; border-radius: 50%; background: rgba(255,255,255,0.05); display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">👤</span>
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
                    🔒 Phòng đã đạt số người ở tối đa ({{ room.maxOccupants }}/{{ room.maxOccupants }} người)
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
              <span>🚀 Kích Hoạt Gói Premium</span>
              <button class="close-icon-btn" (click)="showPremiumModal.set(false)">&times;</button>
            </div>
            <div class="brand-modal-body">
              <div class="premium-banner">
                <div class="banner-icon-wrapper">
                  <div class="glow-icon">🚀</div>
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
                      <li>✓ Tối đa 50 phòng</li>
                      <li>✓ Lập hóa đơn điện nước</li>
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
                      <li>✓ Tối đa 150 phòng</li>
                      <li>✓ Gửi nhắc nợ tự động</li>
                      <li>✓ Tham khảo thuế</li>
                    </ul>
                  </div>
                  <button class="btn-upgrade-filled" (click)="navigateToPackages()">Nâng cấp ngay</button>
                </div>
              </div>
            </div>
            <div class="brand-modal-footer">
              <p class="secure-text">✓ Thanh toán an toàn, kích hoạt ngay lập tức.</p>
              <button class="btn-close-text" (click)="showPremiumModal.set(false)">Đóng lại</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
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
      background: rgba(16, 185, 129, 0.05);
      border-color: rgba(16, 185, 129, 0.3);
    }
    .room-available:hover {
      border-color: var(--color-success);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
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
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .room-available .room-status-badge { color: var(--color-success-light); background: rgba(16, 185, 129, 0.15); }
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
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      padding: 30px;
      position: relative;
    }
    .max-w-500 { max-width: 500px; }
    .max-w-600 { max-width: 600px; }
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
  showRentedActionsModal = signal<any | null>(null);
  showPremiumModal = signal(false);

  activeContractsOfRoom = signal<any[]>([]);

  // Form Models
  newPropAddress = { houseNumber: '', street: '', ward: '', district: '' };
  newProp = { title: '', address: '', description: '', imageBase64: '' };
  propImagePreview = signal('');
  newRoom = { roomNumber: '', price: 0, area: 0, maxOccupants: 1 };

  checkInModel = {
    roomId: 0,
    tenantFullName: '',
    tenantPhone: '',
    tenantIdCardNumber: '',
    startDate: '',
    endDate: '',
    roomPrice: 0
  };

  ngOnInit(): void {
    this.fetchProperties();
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

  navigateToPackages() {
    this.showPremiumModal.set(false);
    this.router.navigate(['/landlord/packages']);
  }

  // Add Property handlers
  openAddPropertyModal(): void {
    this.newPropAddress = { houseNumber: '', street: '', ward: '', district: '' };
    this.newProp = { title: '', address: '', description: '', imageBase64: '' };
    this.propImagePreview.set('');
    this.showAddPropertyModal.set(true);
  }
  closeAddPropertyModal(): void {
    this.showAddPropertyModal.set(false);
  }
  submitProperty(): void {
    const { houseNumber, street, ward, district } = this.newPropAddress;
    this.newProp.address = `${houseNumber} ${street}, ${ward}, ${district}, Hà Nội`;

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

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      this.propertyService.updatePropertyImage(prop.id, base64).subscribe({
        next: (res) => {
          this.toastService.show('Đã cập nhật ảnh khu trọ!', 'success');
          prop.imageUrl = res.imageUrl; // Update locally
        },
        error: (err) => {
          this.toastService.show('Không thể cập nhật ảnh: ' + (err.error || 'Lỗi server'), 'error');
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

  // Room Grid clicks handler
  onRoomClick(room: any): void {
    if (room.status === 'Available') {
      // Open Check-In Form
      this.checkInModel = {
        roomId: room.id,
        tenantFullName: '',
        tenantPhone: '',
        tenantIdCardNumber: '',
        startDate: new Date().toISOString().substring(0, 10), // default to today
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10), // default to 1 year lease
        roomPrice: room.price
      };
      this.showCheckInModal.set(room);
    } else if (room.status === 'Rented') {
      // Show details and check-out button
      this.showRentedActionsModal.set(room);
      this.activeContractsOfRoom.set([]);
      // Fetch matching contract details from the database
      this.contractService.getContracts().subscribe({
        next: (contracts) => {
          const matches = contracts.filter(c => c.roomId === room.id && c.status === 'Active');
          this.activeContractsOfRoom.set(matches);
        },
        error: () => {
          this.toastService.show('Lỗi tải thông tin hợp đồng phòng.', 'error');
        }
      });
    }
  }

  addOccupantFromModal(room: any): void {
    this.showRentedActionsModal.set(null);
    this.checkInModel = {
      roomId: room.id,
      tenantFullName: '',
      tenantPhone: '',
      tenantIdCardNumber: '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10),
      roomPrice: room.price
    };
    this.showCheckInModal.set(room);
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
