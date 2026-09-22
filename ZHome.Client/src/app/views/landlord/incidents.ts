import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { PropertyService } from '../../services/property.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landlord-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landlord-incidents-container animate-fade-in">
      
      <!-- Top Title Header -->
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 class="main-page-title m-0">PHẢN ÁNH SỰ CỐ TỪ KHÁCH THUÊ</h2>
            <p class="text-muted text-sm m-0 mt-1">Tiếp nhận, theo dõi và xử lý các yêu cầu sửa chữa, báo hỏng hóc phòng trọ từ người thuê.</p>
          </div>
          <button (click)="fetchIncidents()" class="btn-refresh" [disabled]="isLoading()">
            Làm mới
          </button>
        </div>
      </div>

      <!-- Stats Summary KPI Cards -->
      <div class="stats-grid mb-4">
        <div class="stat-card stat-pending" (click)="selectedStatusFilter.set('Pending')" [class.active-stat]="selectedStatusFilter() === 'Pending'">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Chờ tiếp nhận</span>
            <strong class="stat-value text-amber">{{ pendingCount() }}</strong>
          </div>
        </div>
        <div class="stat-card stat-processing" (click)="selectedStatusFilter.set('Processing')" [class.active-stat]="selectedStatusFilter() === 'Processing'">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Đang xử lý</span>
            <strong class="stat-value text-blue">{{ processingCount() }}</strong>
          </div>
        </div>
        <div class="stat-card stat-resolved" (click)="selectedStatusFilter.set('Resolved')" [class.active-stat]="selectedStatusFilter() === 'Resolved'">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Đã giải quyết</span>
            <strong class="stat-value text-green">{{ resolvedCount() }}</strong>
          </div>
        </div>
        <div class="stat-card stat-total" (click)="selectedStatusFilter.set('All')" [class.active-stat]="selectedStatusFilter() === 'All'">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Tổng số đơn sự cố</span>
            <strong class="stat-value text-dark">{{ totalCount() }}</strong>
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="filter-card mb-4">
        <div class="filter-row">
          <!-- Property Filter -->
          <div class="filter-group">
            <label class="filter-label">Nhà trọ:</label>
            <select [ngModel]="selectedPropertyFilter()" (ngModelChange)="selectedPropertyFilter.set($event)" class="form-select-custom">
              <option value="All">-- Tất cả khu trọ --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.title">{{ p.title }}</option>
              }
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <label class="filter-label">Trạng thái:</label>
            <select [ngModel]="selectedStatusFilter()" (ngModelChange)="selectedStatusFilter.set($event)" class="form-select-custom">
              <option value="All">Tất cả trạng thái</option>
              <option value="Pending">Chờ tiếp nhận</option>
              <option value="Processing">Đang xử lý</option>
              <option value="Resolved">Đã giải quyết</option>
            </select>
          </div>

          <!-- Search Box -->
          <div class="filter-group flex-1">
            <label class="filter-label">Tìm kiếm:</label>
            <div class="search-input-wrapper">
              <span class="search-icon"></span>
              <input 
                type="text" 
                [ngModel]="searchQuery()" 
                (ngModelChange)="searchQuery.set($event)" 
                placeholder="Tìm theo số phòng, tên khách, số điện thoại, vấn đề..." 
                class="form-control-custom search-box" />
            </div>
          </div>
        </div>
      </div>

      <!-- Incidents List Area -->
      @if (isLoading()) {
        <div class="loading-state py-5 text-center">
          <div class="spinner mb-2"></div>
          <p class="text-muted">Đang tải danh sách phản ánh sự cố...</p>
        </div>
      } @else if (filteredIncidents().length === 0) {
        <div class="empty-state py-5 text-center">
          <span class="empty-icon"></span>
          <h4 class="font-bold text-dark mb-1">Hiện không có sự cố nào!</h4>
          <p class="text-muted text-sm">Tất cả các phòng đều đang hoạt động tốt hoặc không có đơn báo sự cố khớp với bộ lọc.</p>
        </div>
      } @else {
        <div class="incidents-list">
          @for (item of filteredIncidents(); track item.id) {
            <div class="incident-card" [class.incident-pending]="item.status === 'Pending'" [class.incident-processing]="item.status === 'Processing'" [class.incident-resolved]="item.status === 'Resolved'">
              
              <!-- Card Header -->
              <div class="incident-header">
                <div class="incident-title-area">
                  <span class="incident-icon">️</span>
                  <div>
                    <h3 class="incident-title">{{ item.title }}</h3>
                    <div class="incident-meta-tags">
                      <span class="meta-tag tag-prop">{{ item.propertyTitle || 'Nhà trọ' }}</span>
                      <span class="meta-tag tag-room">Phòng {{ item.roomNumber || 'N/A' }}</span>
                      <span class="meta-tag tag-tenant">{{ item.tenantName }}</span>
                      @if (item.tenantPhone) {
                        <a [href]="'tel:' + item.tenantPhone" class="meta-tag tag-phone">{{ item.tenantPhone }}</a>
                      }
                    </div>
                  </div>
                </div>

                <div class="incident-status-area text-end">
                  <span class="status-badge" [class.badge-pending]="item.status === 'Pending'" [class.badge-processing]="item.status === 'Processing'" [class.badge-resolved]="item.status === 'Resolved'">
                    {{ getStatusLabel(item.status) }}
                  </span>
                  <div class="incident-time">{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
              </div>

              <!-- Card Content Description -->
              <div class="incident-content-box">
                <p class="incident-desc-text">{{ item.content }}</p>
              </div>

              <!-- Landlord Reply / Resolution Note if any -->
              @if (item.landlordReply) {
                <div class="landlord-note-box">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <strong class="text-teal text-sm">Phản hồi từ chủ trọ:</strong>
                    <span class="text-xs text-muted">({{ item.repliedAt | date:'dd/MM/yyyy HH:mm' }})</span>
                  </div>
                  <p class="m-0 text-sm text-dark">{{ item.landlordReply }}</p>
                </div>
              }

              <!-- Inline Reply Form -->
              @if (replyingToId() === item.id) {
                <div class="inline-reply-box mt-3">
                  <label class="form-label-custom mb-1 font-bold">Nội dung phản hồi / thông báo giải quyết:</label>
                  <textarea 
                    [(ngModel)]="replyMessage" 
                    rows="3" 
                    class="form-control-custom" 
                    placeholder="Ví dụ: Đã hẹn thợ sửa chữa lúc 15h chiều nay / Đã thay bóng đèn mới..."></textarea>
                  <div class="d-flex justify-content-end gap-2 mt-2">
                    <button type="button" (click)="cancelReply()" class="btn-sm-cancel">Hủy</button>
                    <button type="button" (click)="submitReply(item.id)" [disabled]="isSubmitting() || !replyMessage.trim()" class="btn-sm-submit">
                      {{ isSubmitting() ? 'Đang gửi...' : 'Gửi phản hồi cho khách' }}
                    </button>
                  </div>
                </div>
              }

              <!-- Action Buttons Toolbar -->
              <div class="incident-actions-footer">
                <div class="d-flex gap-2 flex-wrap">
                  @if (item.status === 'Pending') {
                    <button (click)="updateStatus(item.id, 'Processing')" class="btn-action btn-start-proc">
                      Bắt đầu xử lý
                    </button>
                    <button (click)="updateStatus(item.id, 'Resolved')" class="btn-action btn-resolve">
                      Đã xử lý xong
                    </button>
                  } @else if (item.status === 'Processing') {
                    <button (click)="updateStatus(item.id, 'Resolved')" class="btn-action btn-resolve">
                      Đã xử lý xong
                    </button>
                    <button (click)="updateStatus(item.id, 'Pending')" class="btn-action btn-revert">
                      ↩️ Chuyển về Chờ xử lý
                    </button>
                  } @else if (item.status === 'Resolved') {
                    <span class="resolved-note-tag">Đã giải quyết hoàn tất</span>
                    <button (click)="updateStatus(item.id, 'Processing')" class="btn-action btn-reopen">
                      Mở lại sự cố
                    </button>
                  }
                </div>

                <div>
                  @if (replyingToId() !== item.id) {
                    <button (click)="startReply(item.id, item.landlordReply)" class="btn-action btn-reply">
                      {{ item.landlordReply ? 'Sửa phản hồi' : 'Viết phản hồi' }}
                    </button>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .landlord-incidents-container {
      max-width: 1100px;
      margin: 0 auto;
    }

    .main-page-title {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .btn-refresh {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-refresh:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    /* KPI STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .stat-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .stat-card.active-stat {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .stat-icon {
      font-size: 1.8rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 1.4rem;
      font-weight: 900;
    }
    .text-amber { color: #d97706; }
    .text-blue { color: #2563eb; }
    .text-green { color: #16a34a; }
    .text-dark { color: #0f172a; }

    /* FILTERS TOOLBAR */
    .filter-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .filter-row {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .filter-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }
    .form-select-custom, .form-control-custom {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      color: #1e293b;
      outline: none;
      background: #ffffff;
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .search-box {
      padding-left: 32px;
      width: 100%;
    }

    /* INCIDENT CARDS */
    .incidents-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .incident-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      transition: all 0.2s ease;
    }
    .incident-card:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.06);
    }
    .incident-pending {
      border-left: 5px solid #f59e0b;
    }
    .incident-processing {
      border-left: 5px solid #3b82f6;
    }
    .incident-resolved {
      border-left: 5px solid #10b981;
      opacity: 0.92;
    }

    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      gap: 14px;
    }
    .incident-title-area {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .incident-icon {
      font-size: 1.5rem;
      background: #f1f5f9;
      padding: 8px;
      border-radius: 10px;
      line-height: 1;
    }
    .incident-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .incident-meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .meta-tag {
      font-size: 0.76rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .tag-prop { background: #e0f2fe; color: #0369a1; }
    .tag-room { background: #ede9fe; color: #5b21b6; }
    .tag-tenant { background: #f1f5f9; color: #334155; }
    .tag-phone { background: #dcfce7; color: #15803d; text-decoration: none; font-weight: 700; }
    .tag-phone:hover { text-decoration: underline; }

    .status-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .badge-pending { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-processing { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-resolved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

    .incident-time {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .incident-content-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    .incident-desc-text {
      font-size: 0.9rem;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      white-space: pre-line;
    }

    .landlord-note-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }
    .text-teal { color: #0d9488; }

    .inline-reply-box {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .btn-sm-cancel {
      background: #e2e8f0;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }
    .btn-sm-submit {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .incident-actions-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
    }
    .btn-action {
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-start-proc { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .btn-start-proc:hover { background: #dbeafe; }
    .btn-resolve { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .btn-resolve:hover { background: #bbf7d0; }
    .btn-revert { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-revert:hover { background: #e2e8f0; }
    .btn-reopen { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .btn-reopen:hover { background: #fde68a; }
    .btn-reply { background: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; }
    .btn-reply:hover { background: #eff6ff; border-color: #93c5fd; }
    .resolved-note-tag {
      font-size: 0.8rem;
      font-weight: 700;
      color: #15803d;
      padding: 4px 8px;
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
export class LandlordIncidentsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private propertyService = inject(PropertyService);

  allIncidents = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  isLoading = signal(true);

  // Filters
  selectedPropertyFilter = signal<string>('All');
  selectedStatusFilter = signal<string>('All');
  searchQuery = signal<string>('');

  // Inline Reply state
  replyingToId = signal<number | null>(null);
  replyMessage = '';
  isSubmitting = signal(false);

  // Computed KPI Counts
  incidentItems = computed(() => {
    // Only items that have no rating (Rating is null or 0)
    return this.allIncidents().filter(i => !i.rating);
  });

  pendingCount = computed(() => this.incidentItems().filter(i => i.status === 'Pending').length);
  processingCount = computed(() => this.incidentItems().filter(i => i.status === 'Processing').length);
  resolvedCount = computed(() => this.incidentItems().filter(i => i.status === 'Resolved').length);
  totalCount = computed(() => this.incidentItems().length);

  // Computed Filtered List
  filteredIncidents = computed(() => {
    let list = this.incidentItems();
    const prop = this.selectedPropertyFilter();
    const status = this.selectedStatusFilter();
    const query = this.searchQuery().toLowerCase().trim();

    if (prop !== 'All') {
      list = list.filter(i => i.propertyTitle === prop);
    }

    if (status !== 'All') {
      list = list.filter(i => i.status === status);
    }

    if (query) {
      list = list.filter(i => 
        (i.title && i.title.toLowerCase().includes(query)) ||
        (i.content && i.content.toLowerCase().includes(query)) ||
        (i.roomNumber && i.roomNumber.toLowerCase().includes(query)) ||
        (i.tenantName && i.tenantName.toLowerCase().includes(query)) ||
        (i.tenantPhone && i.tenantPhone.includes(query))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.fetchProperties();
    this.fetchIncidents();
  }

  fetchProperties(): void {
    this.propertyService.getProperties().subscribe({
      next: (props) => this.propertyList.set(props),
      error: () => {}
    });
  }

  fetchIncidents(): void {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/report/all`).subscribe({
      next: (data) => {
        this.allIncidents.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Lỗi tải danh sách sự cố.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Chờ tiếp nhận';
      case 'Processing': return 'Đang xử lý';
      case 'Resolved': return 'Đã giải quyết';
      default: return status || 'Chờ tiếp nhận';
    }
  }

  updateStatus(incidentId: number, status: string): void {
    this.http.put(`${environment.apiUrl}/report/${incidentId}/status`, { status }).subscribe({
      next: () => {
        this.toastService.show(`Đã cập nhật trạng thái sự cố: ${this.getStatusLabel(status)}`, 'success');
        this.fetchIncidents();
      },
      error: () => {
        this.toastService.show('Lỗi cập nhật trạng thái sự cố.', 'error');
      }
    });
  }

  startReply(incidentId: number, currentReply?: string): void {
    this.replyingToId.set(incidentId);
    this.replyMessage = currentReply || '';
  }

  cancelReply(): void {
    this.replyingToId.set(null);
    this.replyMessage = '';
  }

  submitReply(incidentId: number): void {
    if (!this.replyMessage.trim()) return;

    this.isSubmitting.set(true);
    this.http.put(`${environment.apiUrl}/report/${incidentId}/reply`, { replyContent: this.replyMessage }).subscribe({
      next: () => {
        this.toastService.show('Đã gửi phản hồi cho khách thuê thành công!', 'success');
        this.isSubmitting.set(false);
        this.cancelReply();
        this.fetchIncidents();
      },
      error: () => {
        this.toastService.show('Lỗi khi gửi phản hồi.', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}
