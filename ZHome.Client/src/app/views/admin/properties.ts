import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

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
                <img [src]="prop.imageUrl || 'assets/images/default-property.jpg'" [alt]="prop.title" (error)="onImgError($event)" />
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

                <button class="btn btn-outline" (click)="toggleRoomsDetail(prop.propertyId)">
                  {{ expandedPropertyId() === prop.propertyId ? '▲ Ẩn danh sách phòng' : '▼ Xem chi tiết phòng (' + prop.rooms.length + ')' }}
                </button>
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
  `]
})
export class AdminPropertiesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(true);
  properties = signal<any[]>([]);
  selectedLandlordId = signal<number>(0);
  expandedPropertyId = signal<number | null>(null);
  searchTerm: string = '';

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
        this.properties.set(data);
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

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';
  }
}
