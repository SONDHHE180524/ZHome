import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-properties-container animate-fade-in">
      <div class="header-row">
        <div>
          <span class="page-category">Hệ Thống Quản Lý Trung Tâm</span>
          <h1>Quản Lý Tất Cả Nhà Trọ & Phòng Trống</h1>
          <p>Xem toàn bộ danh sách nhà trọ trên hệ thống, phân loại theo chủ trọ và quản lý danh sách phòng trống.</p>
        </div>
      </div>

      <!-- Privacy Protection Banner -->
      <div class="privacy-notice">
        <div class="privacy-icon"></div>
        <div class="privacy-content">
          <strong>Cam Kết Bảo Mật Thông Tin Người Thuê (Data Privacy Compliance)</strong>
          <p>Hệ thống tự động ẩn toàn bộ thông tin cá nhân của khách thuê (Họ tên, SĐT, CCCD, Email) đối với tài khoản Admin để tuân thủ quyền riêng tư dữ liệu cá nhân.</p>
        </div>
      </div>

      <!-- Toolbar Filter -->
      <div class="toolbar-card">
        <div class="search-filter-group">
          <div class="filter-item">
            <label>Lọc theo Chủ Trọ:</label>
            <select [ngModel]="selectedLandlordId()" (ngModelChange)="onLandlordChange($event)" class="form-select">
              <option [value]="0">-- Tất cả chủ trọ --</option>
              @for (l of landlordOptions(); track l.id) {
                <option [value]="l.id">{{ l.name }} ({{ l.phone }})</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label>Tìm kiếm tên trọ / địa chỉ:</label>
            <input type="text" [(ngModel)]="searchTerm" placeholder="Nhập từ khóa tìm kiếm..." class="form-input">
          </div>
        </div>

        <div class="stats-summary">
          <div class="stat-chip">
            <span class="chip-label">Tổng trọ:</span>
            <strong class="chip-val">{{ filteredProperties().length }}</strong>
          </div>
          <div class="stat-chip chip-success">
            <span class="chip-label">Tổng phòng trống:</span>
            <strong class="chip-val">{{ totalVacantRooms() }}</strong>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải danh sách nhà trọ...</p>
        </div>
      } @else if (filteredProperties().length === 0) {
        <div class="empty-card">
          <span class="empty-icon"></span>
          <h3>Không tìm thấy nhà trọ phù hợp</h3>
          <p>Chưa có nhà trọ nào hoặc không có nhà trọ thỏa mãn điều kiện lọc.</p>
        </div>
      } @else {
        <div class="properties-grid">
          @for (prop of filteredProperties(); track prop.propertyId) {
            <div class="property-card">
              <div class="prop-image-box">
                <img [src]="getImageUrl(prop.imageUrl)" [alt]="prop.title" (error)="onImgError($event)" />
                <span class="prop-badge" [class.badge-verified]="prop.isVerifiedTick">
                  {{ prop.isVerifiedTick ? ' Chính chủ' : 'Chưa xác minh' }}
                </span>
              </div>

              <div class="prop-body">
                <h3 class="prop-title">{{ prop.title }}</h3>
                <p class="prop-address"> {{ prop.address }}</p>

                <div class="landlord-info">
                  <div class="avatar-circle"></div>
                  <div>
                    <span class="info-label">Chủ trọ:</span>
                    <strong class="landlord-name">{{ prop.landlordName }}</strong>
                    <span class="landlord-phone">{{ prop.landlordPhone }}</span>
                  </div>
                </div>

                <div class="room-stats-bar">
                  <div class="stat-box">
                    <span class="box-num">{{ prop.totalRooms }}</span>
                    <span class="box-lbl">Tổng phòng</span>
                  </div>
                  <div class="stat-box box-green">
                    <span class="box-num">{{ prop.vacantRooms }}</span>
                    <span class="box-lbl">Phòng trống</span>
                  </div>
                  <div class="stat-box box-amber">
                    <span class="box-num">{{ prop.occupiedRooms }}</span>
                    <span class="box-lbl">Đang thuê</span>
                  </div>
                </div>

                <div class="card-action-bar">
                  <button class="btn btn-outline btn-toggle-rooms" (click)="toggleRoomsDetail(prop.propertyId)">
                    {{ expandedPropertyId() === prop.propertyId ? '▲ Ẩn danh sách' : '▼ DS phòng (' + prop.rooms.length + ')' }}
                  </button>
                  <div class="btn-group-actions">
                    <button class="btn btn-action-edit" (click)="openEditPropertyModal(prop)" title="Chỉnh sửa nhà trọ">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Sửa
                    </button>
                    <button class="btn btn-action-delete" (click)="openDeletePropertyModal(prop)" title="Xóa nhà trọ">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>

              <!-- Expanded Room List -->
              @if (expandedPropertyId() === prop.propertyId) {
                <div class="rooms-detail-panel animate-fade-in">
                  <h4>Danh sách phòng ({{ prop.title }})</h4>
                  
                  <div class="table-responsive">
                    <table class="rooms-table">
                      <thead>
                        <tr>
                          <th>Số phòng</th>
                          <th>Giá thuê</th>
                          <th>Diện tích</th>
                          <th>Sức chứa</th>
                          <th>Trạng thái</th>
                          <th>Quyền riêng tư</th>
                          <th style="text-align: right;">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (room of prop.rooms; track room.roomId) {
                          <tr>
                            <td><strong>Phòng {{ room.roomNumber }}</strong></td>
                            <td class="text-primary"><strong>{{ room.price | number:'1.0-0' }} đ/tháng</strong></td>
                            <td>{{ room.area }} m²</td>
                            <td>Tối đa {{ room.maxOccupants }} người</td>
                            <td>
                              @if (room.status === 'Available') {
                                <span class="badge-status status-available"> Phòng trống</span>
                              } @else {
                                <span class="badge-status status-occupied"> Đang thuê</span>
                              }
                            </td>
                            <td>
                              <span class="privacy-tag" title="Được bảo mật theo chính sách Admin"> Ẩn thông tin thuê</span>
                            </td>
                            <td style="text-align: right;">
                              <div class="room-action-btns">
                                <button class="btn-room-action edit" (click)="openEditRoomModal(prop, room)" title="Sửa thông tin phòng">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                                <button class="btn-room-action delete" (click)="openDeleteRoomModal(prop, room)" title="Xóa phòng này">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- MODAL: CHỈNH SỬA NHÀ TRỌ -->
      @if (showEditPropertyModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-title">
                <h3>Chỉnh Sửa Thông Tin Nhà Trọ</h3>
                <span class="modal-subtitle">ID: #{{ propertyForm.id }} • Chủ trọ: {{ propertyForm.landlordName }}</span>
              </div>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>
            
            <form (ngSubmit)="submitUpdateProperty()" class="modal-body">
              <div class="form-group">
                <label>Tên nhà trọ / Khu trọ <span class="required">*</span></label>
                <input type="text" [(ngModel)]="propertyForm.title" name="propTitle" required class="form-input" placeholder="Nhập tên nhà trọ..." />
              </div>

              <div class="form-group">
                <label>Địa chỉ khu trọ <span class="required">*</span></label>
                <input type="text" [(ngModel)]="propertyForm.address" name="propAddress" required class="form-input" placeholder="Số nhà, ngõ, đường, quận/huyện..." />
              </div>

              <div class="form-group">
                <label>Mô tả chi tiết</label>
                <textarea [(ngModel)]="propertyForm.description" name="propDesc" rows="3" class="form-input form-textarea" placeholder="Mô tả tiện ích, an ninh, vị trí..."></textarea>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="propertyForm.isVerifiedTick" name="isVerifiedTick" />
                  <span>Cấp tích xanh chính chủ (Đã xác minh kiểm duyệt)</span>
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: XÓA NHÀ TRỌ -->
      @if (showDeletePropertyModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card modal-sm animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header header-danger">
              <h3>Xóa Khu Nhà Trọ</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>

            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa nhà trọ: <strong>{{ selectedPropertyForDelete()?.title }}</strong>?</p>
              
              @if (selectedPropertyForDelete()?.occupiedRooms > 0) {
                <div class="danger-alert-box">
                  <div class="danger-alert-icon">⚠️</div>
                  <div class="danger-alert-content">
                    <strong>Không thể xóa nhà trọ!</strong>
                    <p>Khu trọ này hiện đang có <strong>{{ selectedPropertyForDelete()?.occupiedRooms }}</strong> phòng đang có khách thuê. Để bảo vệ quyền lợi người thuê, bạn phải thanh lý toàn bộ hợp đồng thuê trước khi xóa khu trọ!</p>
                  </div>
                </div>
              } @else {
                <p class="text-warning-notice">
                  Lưu ý: Thao tác này sẽ xóa vĩnh viễn nhà trọ và toàn bộ {{ selectedPropertyForDelete()?.totalRooms }} phòng trống thuộc khu trọ này.
                </p>
              }

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button 
                  type="button" 
                  class="btn btn-danger" 
                  [disabled]="isSubmitting() || selectedPropertyForDelete()?.occupiedRooms > 0"
                  (click)="submitDeleteProperty()">
                  {{ isSubmitting() ? 'Đang xóa...' : 'Xác nhận xóa khu trọ' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CHỈNH SỬA PHÒNG TRỌ -->
      @if (showEditRoomModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-title">
                <h3>Chỉnh Sửa Phòng Trọ</h3>
                <span class="modal-subtitle">Thuộc khu trọ: {{ selectedPropertyForRoom()?.title }}</span>
              </div>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>

            <form (ngSubmit)="submitUpdateRoom()" class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Số phòng / Tên phòng <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="roomForm.roomNumber" name="roomNumber" required class="form-input" placeholder="Ví dụ: P.101, 202..." />
                </div>
                <div class="form-group">
                  <label>Giá thuê (VNĐ/tháng) <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="roomForm.price" name="roomPrice" required min="0" step="50000" class="form-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Diện tích (m²) <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="roomForm.area" name="roomArea" required min="1" step="0.5" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Sức chứa tối đa (người) <span class="required">*</span></label>
                  <input type="number" [(ngModel)]="roomForm.maxOccupants" name="roomOccupants" required min="1" max="20" class="form-input" />
                </div>
              </div>

              <div class="form-group">
                <label>Trạng thái phòng</label>
                <select [(ngModel)]="roomForm.status" name="roomStatus" class="form-select">
                  <option value="Available">Phòng trống (Available)</option>
                  <option value="Occupied">Đang thuê (Occupied / Rented)</option>
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang lưu...' : 'Lưu thông tin phòng' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: XÓA PHÒNG TRỌ -->
      @if (showDeleteRoomModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card modal-sm animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header header-danger">
              <h3>Xóa Phòng Trọ</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>

            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa: <strong>Phòng {{ selectedRoomForDelete()?.roomNumber }}</strong> thuộc khu <em>{{ selectedPropertyForRoom()?.title }}</em>?</p>

              @if (selectedRoomForDelete()?.status === 'Occupied' || selectedRoomForDelete()?.status === 'Rented') {
                <div class="danger-alert-box">
                  <div class="danger-alert-icon">⚠️</div>
                  <div class="danger-alert-content">
                    <strong>Không thể xóa phòng đang có khách ở!</strong>
                    <p>Phòng này đang ở trạng thái <strong>Đang thuê</strong>. Bạn không thể xóa phòng khi người thuê đang cư trú hoặc hợp đồng chưa được thanh lý.</p>
                  </div>
                </div>
              } @else {
                <p class="text-warning-notice">
                  Hành động này sẽ xóa hoàn toàn thông tin phòng trọ khỏi hệ thống.
                </p>
              }

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button 
                  type="button" 
                  class="btn btn-danger" 
                  [disabled]="isSubmitting() || selectedRoomForDelete()?.status === 'Occupied' || selectedRoomForDelete()?.status === 'Rented'"
                  (click)="submitDeleteRoom()">
                  {{ isSubmitting() ? 'Đang xóa...' : 'Xác nhận xóa phòng' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-properties-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-category {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #2563eb;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 6px;

    }

    .header-row h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 8px 0 4px;
    }

    .header-row p {
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 24px;
    }

    .privacy-notice {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 28px;
    }

    .privacy-icon {
      font-size: 1.5rem;
    }

    .privacy-content strong {
      color: #15803d;
      font-size: 0.92rem;
      display: block;
      margin-bottom: 2px;
    }

    .privacy-content p {
      color: #166534;
      font-size: 0.85rem;
      margin: 0;
    }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 20px 24px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .search-filter-group {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
      flex: 1;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-item label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }

    .form-select, .form-input {
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      min-width: 220px;
      background: #f8fafc;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .form-select:focus, .form-input:focus {
      border-color: #2563eb;
      background: #ffffff;
    }

    .stats-summary {
      display: flex;
      gap: 12px;
    }

    .stat-chip {
      background: #f1f5f9;
      padding: 8px 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
    }

    .chip-success {
      background: #dcfce7;
      color: #15803d;
    }

    .loading-state, .empty-card {
      text-align: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 28px;
    }

    .property-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .property-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    }

    .prop-image-box {
      position: relative;
      height: 180px;
      background: #f1f5f9;
    }

    .prop-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .prop-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .badge-verified {
      background: #16a34a;
    }

    .prop-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    .prop-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .prop-address {
      font-size: 0.88rem;
      color: #64748b;
      margin: 0;
    }

    .landlord-info {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }

    .avatar-circle {
      width: 38px;
      height: 38px;
      background: #e0e7ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .info-label {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
    }

    .landlord-name {
      font-size: 0.92rem;
      color: #1e293b;
      display: block;
    }

    .landlord-phone {
      font-size: 0.8rem;
      color: #64748b;
    }

    .room-stats-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }

    .box-num {
      font-size: 1.2rem;
      font-weight: 800;
      display: block;
      color: #0f172a;
    }

    .box-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .box-green { background: #f0fdf4; border-color: #bbf7d0; }
    .box-green .box-num { color: #16a34a; }

    .box-amber { background: #fffbeb; border-color: #fde68a; }
    .box-amber .box-num { color: #d97706; }

    .btn-outline {
      background: transparent;
      border: 1px solid #2563eb;
      color: #2563eb;
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-outline:hover {
      background: #eff6ff;
    }

    .rooms-detail-panel {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
    }

    .rooms-detail-panel h4 {
      font-size: 0.98rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .rooms-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .rooms-table th, .rooms-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .rooms-table th {
      font-weight: 700;
      color: #64748b;
      background: #ffffff;
    }

    .text-primary { color: #2563eb; }

    .badge-status {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .status-available { background: #dcfce7; color: #15803d; }
    .status-occupied { background: #fee2e2; color: #b91c1c; }

    .privacy-tag {
      font-size: 0.72rem;
      color: #64748b;
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Property Card Actions */
    .card-action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: 14px;
    }

    .btn-toggle-rooms {
      flex: 1;
      padding: 8px 12px;
      font-size: 0.82rem;
    }

    .btn-group-actions {
      display: flex;
      gap: 6px;
    }

    .btn-action-edit, .btn-action-delete {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 7px 11px;
      font-size: 0.8rem;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;
    }

    .btn-action-edit {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    .btn-action-edit:hover {
      background: #dbeafe;
    }

    .btn-action-delete {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .btn-action-delete:hover {
      background: #fee2e2;
    }

    .btn-action-edit svg, .btn-action-delete svg {
      width: 14px;
      height: 14px;
    }

    /* Room row actions */
    .room-action-btns {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-room-action {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .btn-room-action.edit {
      color: #2563eb;
    }

    .btn-room-action.edit:hover {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .btn-room-action.delete {
      color: #dc2626;
    }

    .btn-room-action.delete:hover {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .btn-room-action svg {
      width: 14px;
      height: 14px;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      box-shadow: 0 20px 35px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-card.modal-sm {
      max-width: 440px;
    }

    .modal-header {
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header-title h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 2px;
      display: block;
    }

    .modal-header.header-danger {
      background: #fee2e2;
    }

    .modal-header.header-danger h3 {
      color: #b91c1c;
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #64748b;
      cursor: pointer;
      padding: 2px 6px;
    }

    .modal-body {
      padding: 20px 24px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-textarea {
      resize: vertical;
      min-height: 75px;
    }

    .required { color: #ef4444; }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #1e293b;
      cursor: pointer;
    }

    .danger-alert-box {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin: 14px 0;
    }

    .danger-alert-icon {
      font-size: 1.3rem;
      line-height: 1;
    }

    .danger-alert-content strong {
      display: block;
      color: #b91c1c;
      font-size: 0.88rem;
      margin-bottom: 4px;
    }

    .danger-alert-content p {
      color: #991b1b;
      font-size: 0.8rem;
      line-height: 1.4;
      margin: 0;
    }

    .text-warning-notice {
      color: #64748b;
      font-size: 0.82rem;
      margin: 12px 0 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }

    .btn {
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #dc2626;
      color: #fff;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-danger:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `]
})
export class AdminPropertiesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  properties = signal<any[]>([]);
  selectedLandlordId = signal<number>(0);
  expandedPropertyId = signal<number | null>(null);
  searchTerm: string = '';

  // Modals state: Properties
  showEditPropertyModal = signal<boolean>(false);
  showDeletePropertyModal = signal<boolean>(false);
  selectedPropertyForDelete = signal<any>(null);
  propertyForm = {
    id: 0,
    title: '',
    address: '',
    description: '',
    isVerifiedTick: false,
    landlordName: ''
  };

  // Modals state: Rooms
  showEditRoomModal = signal<boolean>(false);
  showDeleteRoomModal = signal<boolean>(false);
  selectedPropertyForRoom = signal<any>(null);
  selectedRoomForDelete = signal<any>(null);
  roomForm = {
    id: 0,
    propertyId: 0,
    roomNumber: '',
    price: 0,
    area: 0,
    maxOccupants: 1,
    status: 'Available'
  };

  landlordOptions = computed(() => {
    const list = this.properties();
    const map = new Map<number, { id: number; name: string; phone: string }>();
    for (const p of list) {
      if (p.landlordId && !map.has(p.landlordId)) {
        map.set(p.landlordId, {
          id: p.landlordId,
          name: p.landlordName,
          phone: p.landlordPhone
        });
      }
    }
    return Array.from(map.values());
  });

  filteredProperties = computed(() => {
    let list = this.properties();
    const selectedLId = this.selectedLandlordId();
    if (selectedLId > 0) {
      list = list.filter(p => p.landlordId === selectedLId);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term) ||
        p.landlordName.toLowerCase().includes(term)
      );
    }
    return list;
  });

  totalVacantRooms = computed(() => {
    return this.filteredProperties().reduce((sum, p) => sum + (p.vacantRooms || 0), 0);
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.adminService.getProperties().subscribe({
      next: (data) => {
        this.properties.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching admin properties:', err);
        this.toastService.show('Không thể tải danh sách nhà trọ.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onLandlordChange(val: any): void {
    this.selectedLandlordId.set(Number(val) || 0);
  }

  toggleRoomsDetail(propId: number): void {
    if (this.expandedPropertyId() === propId) {
      this.expandedPropertyId.set(null);
    } else {
      this.expandedPropertyId.set(propId);
    }
  }

  getImageUrl(url?: string): string {
    if (!url) return 'assets/images/default-property.jpg';
    if (url.includes(',')) {
      url = url.split(',')[0].trim();
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onImgError(event: Event): void {

    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('data:image/svg')) {
      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" fill="%23f1f5f9"><rect width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="16" font-family="sans-serif">Chưa có ảnh</text></svg>';
    }
  }

  // Modals operations: Properties
  openEditPropertyModal(prop: any): void {
    this.propertyForm = {
      id: prop.propertyId,
      title: prop.title,
      address: prop.address,
      description: prop.description || '',
      isVerifiedTick: !!prop.isVerifiedTick,
      landlordName: prop.landlordName
    };
    this.showEditPropertyModal.set(true);
  }

  openDeletePropertyModal(prop: any): void {
    this.selectedPropertyForDelete.set(prop);
    this.showDeletePropertyModal.set(true);
  }

  submitUpdateProperty(): void {
    if (!this.propertyForm.title.trim() || !this.propertyForm.address.trim()) {
      this.toastService.show('Tên nhà trọ và địa chỉ không được để trống.', 'info');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      title: this.propertyForm.title.trim(),
      address: this.propertyForm.address.trim(),
      description: this.propertyForm.description?.trim(),
      isVerifiedTick: this.propertyForm.isVerifiedTick
    };

    this.propertyService.updateProperty(this.propertyForm.id, payload).subscribe({
      next: () => {
        this.toastService.show('Cập nhật thông tin nhà trọ thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadProperties();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Lỗi khi cập nhật nhà trọ.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  submitDeleteProperty(): void {
    const prop = this.selectedPropertyForDelete();
    if (!prop) return;

    if (prop.occupiedRooms > 0) {
      this.toastService.show('Không thể xóa khu trọ vì còn phòng đang có khách thuê!', 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.propertyService.deleteProperty(prop.propertyId).subscribe({
      next: () => {
        this.toastService.show('Đã xóa nhà trọ thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadProperties();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Lỗi khi xóa nhà trọ.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  // Modals operations: Rooms
  openEditRoomModal(prop: any, room: any): void {
    this.selectedPropertyForRoom.set(prop);
    this.roomForm = {
      id: room.roomId,
      propertyId: prop.propertyId,
      roomNumber: room.roomNumber,
      price: room.price,
      area: room.area,
      maxOccupants: room.maxOccupants,
      status: room.status
    };
    this.showEditRoomModal.set(true);
  }

  openDeleteRoomModal(prop: any, room: any): void {
    this.selectedPropertyForRoom.set(prop);
    this.selectedRoomForDelete.set(room);
    this.showDeleteRoomModal.set(true);
  }

  submitUpdateRoom(): void {
    if (!this.roomForm.roomNumber.trim()) {
      this.toastService.show('Số phòng không được để trống.', 'info');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      roomNumber: this.roomForm.roomNumber.trim(),
      price: Number(this.roomForm.price),
      area: Number(this.roomForm.area),
      maxOccupants: Number(this.roomForm.maxOccupants),
      status: this.roomForm.status
    };

    this.propertyService.updateRoom(this.roomForm.id, payload).subscribe({
      next: () => {
        this.toastService.show('Cập nhật thông tin phòng thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadProperties();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Lỗi khi cập nhật phòng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  submitDeleteRoom(): void {
    const room = this.selectedRoomForDelete();
    if (!room) return;

    if (room.status === 'Occupied' || room.status === 'Rented') {
      this.toastService.show('Không thể xóa phòng đang có khách thuê!', 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.propertyService.deleteRoom(room.roomId).subscribe({
      next: () => {
        this.toastService.show('Đã xóa phòng trọ thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadProperties();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Lỗi khi xóa phòng trọ.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  closeModals(): void {
    this.showEditPropertyModal.set(false);
    this.showDeletePropertyModal.set(false);
    this.showEditRoomModal.set(false);
    this.showDeleteRoomModal.set(false);
    this.selectedPropertyForDelete.set(null);
    this.selectedPropertyForRoom.set(null);
    this.selectedRoomForDelete.set(null);
  }
}
