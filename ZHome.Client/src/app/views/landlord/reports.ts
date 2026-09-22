import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { PropertyService } from '../../services/property.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landlord-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landlord-reports-container animate-fade-in">
      
      <!-- Page Header -->
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 class="main-page-title m-0">PHẢN ÁNH & ĐÁNH GIÁ KHU TRỌ</h2>
            <p class="text-muted text-sm m-0 mt-1">Nơi tiếp nhận các đánh giá, phản hồi về chất lượng phòng và dịch vụ từ khách thuê trọ của bạn.</p>
          </div>
          <button (click)="fetchReports()" class="btn-refresh" [disabled]="isLoading()">
            Làm mới
          </button>
        </div>
      </div>

      <!-- Stats Overview Cards -->
      <div class="stats-grid mb-4">
        <div class="stat-card">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Điểm trung bình</span>
            <strong class="stat-value text-amber">{{ averageRating() }} / 5.0</strong>
          </div>
        </div>

        <div class="stat-card" (click)="selectedRatingFilter.set(5)" [class.active-stat]="selectedRatingFilter() === 5">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Đánh giá 5 sao</span>
            <strong class="stat-value text-green">{{ fiveStarCount() }}</strong>
          </div>
        </div>

        <div class="stat-card" (click)="selectedRatingFilter.set(4)" [class.active-stat]="selectedRatingFilter() === 4">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Cần phản hồi (&lt; 5 sao)</span>
            <strong class="stat-value text-danger">{{ needsReplyCount() }}</strong>
          </div>
        </div>

        <div class="stat-card" (click)="selectedRatingFilter.set(0)" [class.active-stat]="selectedRatingFilter() === 0">
          <div class="stat-icon"></div>
          <div class="stat-info">
            <span class="stat-label">Tổng lượt đánh giá</span>
            <strong class="stat-value text-dark">{{ totalReviewsCount() }}</strong>
          </div>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-card mb-4">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Khu trọ:</label>
            <select [ngModel]="selectedPropertyFilter()" (ngModelChange)="selectedPropertyFilter.set($event)" class="form-select-custom">
              <option value="All">-- Tất cả khu trọ --</option>
              @for (p of propertyList(); track p.id) {
                <option [value]="p.title">{{ p.title }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Lọc theo số sao:</label>
            <select [ngModel]="selectedRatingFilter()" (ngModelChange)="selectedRatingFilter.set(+$event)" class="form-select-custom">
              <option [value]="0">Tất cả số sao</option>
              <option [value]="5">5 sao</option>
              <option [value]="4">4 sao</option>
              <option [value]="3">3 sao</option>
              <option [value]="2">2 sao</option>
              <option [value]="1">1 sao</option>
            </select>
          </div>

          <div class="filter-group flex-1">
            <label class="filter-label">Tìm kiếm:</label>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)" 
              placeholder="Tìm theo tên khách, phòng, nội dung đánh giá..." 
              class="form-control-custom" />
          </div>
        </div>
      </div>

      <!-- Reviews list -->
      @if (isLoading()) {
        <div class="loading-state py-5 text-center">
          <div class="spinner mb-2"></div>
          <p class="text-muted">Đang tải danh sách phản ánh đánh giá...</p>
        </div>
      } @else if (filteredReviews().length === 0) {
        <div class="empty-state py-5 text-center">
          <span class="empty-icon"></span>
          <h4 class="font-bold text-dark mb-1">Chưa có đánh giá nào</h4>
          <p class="text-muted text-sm">Chưa có khách thuê nào gửi phản ánh đánh giá cho các phòng trọ theo bộ lọc này.</p>
        </div>
      } @else {
        <div class="reports-list">
          @for (report of filteredReviews(); track report.id) {
            <div class="report-card" [class.needs-reply]="report.rating < 5 && !report.landlordReply">
              
              <div class="report-header">
                <div class="report-title-area">
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h3 class="report-title m-0">{{ report.title || 'Đánh giá chất lượng phòng trọ' }}</h3>
                    <span class="rating-stars" [title]="report.rating + ' sao'">
                      @for (i of [1, 2, 3, 4, 5]; track i) {
                        <span class="star" [class.filled]="i <= (report.rating || 5)"></span>
                      }
                    </span>
                  </div>
                  <div class="meta-tags-line">
                    <span class="meta-tag tag-prop">{{ report.propertyTitle || 'Nhà trọ' }}</span>
                    <span class="meta-tag tag-room">Phòng {{ report.roomNumber || 'N/A' }}</span>
                    <span class="meta-tag tag-tenant">{{ report.tenantName }}</span>
                    @if (report.tenantPhone) {
                      <span class="meta-tag tag-phone">{{ report.tenantPhone }}</span>
                    }
                  </div>
                </div>

                <div class="report-meta text-end">
                  <span class="date">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="report-content-box">
                <p class="report-text">{{ report.content }}</p>
              </div>

              <div class="report-actions-box">
                @if (report.rating < 5 && !report.landlordReply) {
                  <div class="alert alert-warning">
                    <strong>Đánh giá dưới 5 sao:</strong> Hệ thống khuyến nghị chủ trọ phản hồi lịch sự và cam kết khắc phục để nâng cao uy tín cho khu trọ.
                  </div>

                  @if (replyingTo() === report.id) {
                    <div class="reply-form mt-2">
                      <label class="form-label-custom font-bold">Nội dung phản hồi của bạn:</label>
                      <textarea [(ngModel)]="replyContent" placeholder="Nhập nội dung phản hồi / cam kết khắc phục của bạn..." rows="3" class="form-control-custom mb-2"></textarea>
                      <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-secondary btn-sm" (click)="cancelReply()">Hủy</button>
                        <button class="btn btn-primary btn-sm" (click)="submitReply(report.id)" [disabled]="isSubmitting() || !replyContent.trim()">
                          {{ isSubmitting() ? 'Đang gửi...' : 'Gửi phản hồi cho khách' }}
                        </button>
                      </div>
                    </div>
                  } @else {
                    <button class="btn btn-primary btn-sm mt-1" (click)="startReply(report.id)">
                      ️ Viết phản hồi / Cam kết khắc phục
                    </button>
                  }
                } @else if (report.landlordReply) {
                  <div class="reply-content-box">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong class="text-teal text-sm">Phản hồi từ chủ trọ:</strong>
                      <span class="reply-date">{{ report.repliedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p class="m-0 text-sm text-dark">{{ report.landlordReply }}</p>
                  </div>
                }
              </div>

            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .landlord-reports-container {
      max-width: 1100px;
      margin: 0 auto;
    }

    .main-page-title {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
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
    }
    .btn-refresh:hover { background: #f1f5f9; }

    /* KPI STATS */
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
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .stat-card.active-stat { border-color: #2563eb; background: #eff6ff; }
    .stat-icon { font-size: 1.8rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 1.4rem; font-weight: 900; }
    .text-amber { color: #d97706; }
    .text-green { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .text-dark { color: #0f172a; }

    /* FILTER */
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
    .filter-group { display: flex; flex-direction: column; gap: 5px; }
    .filter-label { font-size: 0.8rem; font-weight: 700; color: #475569; }
    .form-select-custom, .form-control-custom {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      color: #1e293b;
      outline: none;
      background: #ffffff;
    }

    /* REVIEWS LIST */
    .reports-list { display: flex; flex-direction: column; gap: 16px; }
    .report-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }
    .report-card.needs-reply { border-left: 5px solid #ef4444; }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .report-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .meta-tags-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .meta-tag { font-size: 0.76rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .tag-prop { background: #e0f2fe; color: #0369a1; }
    .tag-room { background: #ede9fe; color: #5b21b6; }
    .tag-tenant { background: #f1f5f9; color: #334155; }
    .tag-phone { background: #f8fafc; color: #64748b; }

    .rating-stars {
      color: #cbd5e1;
      font-size: 1.1rem;
      letter-spacing: 2px;
    }
    .star.filled { color: #f59e0b; }
    .date { font-size: 0.8rem; color: #94a3b8; }

    .report-content-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .report-text {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #1e293b;
      white-space: pre-line;
    }

    .alert {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 10px;
    }
    .alert-warning {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .reply-content-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
    }
    .text-teal { color: #0d9488; }
    .reply-date { font-size: 0.75rem; color: #64748b; }

    .btn {
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #2563eb; color: #ffffff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }
    .btn-sm { padding: 6px 14px; font-size: 0.8rem; }

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
export class LandlordReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private propertyService = inject(PropertyService);

  allReports = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  isLoading = signal(true);

  // Filters
  selectedPropertyFilter = signal<string>('All');
  selectedRatingFilter = signal<number>(0);
  searchQuery = signal<string>('');

  replyingTo = signal<number | null>(null);
  replyContent = '';
  isSubmitting = signal(false);

  // Computed Review items (only items that have a rating)
  reviewItems = computed(() => {
    return this.allReports().filter(r => r.rating && r.rating > 0);
  });

  averageRating = computed(() => {
    const list = this.reviewItems();
    if (list.length === 0) return '5.0';
    const sum = list.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / list.length).toFixed(1);
  });

  fiveStarCount = computed(() => this.reviewItems().filter(r => r.rating === 5).length);
  needsReplyCount = computed(() => this.reviewItems().filter(r => r.rating < 5 && !r.landlordReply).length);
  totalReviewsCount = computed(() => this.reviewItems().length);

  // Computed Filtered list
  filteredReviews = computed(() => {
    let list = this.reviewItems();
    const prop = this.selectedPropertyFilter();
    const star = this.selectedRatingFilter();
    const query = this.searchQuery().toLowerCase().trim();

    if (prop !== 'All') {
      list = list.filter(r => r.propertyTitle === prop);
    }

    if (star > 0) {
      list = list.filter(r => r.rating === star);
    }

    if (query) {
      list = list.filter(r => 
        (r.title && r.title.toLowerCase().includes(query)) ||
        (r.content && r.content.toLowerCase().includes(query)) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(query)) ||
        (r.tenantName && r.tenantName.toLowerCase().includes(query))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.fetchProperties();
    this.fetchReports();
  }

  fetchProperties(): void {
    this.propertyService.getProperties().subscribe({
      next: (props) => this.propertyList.set(props),
      error: () => {}
    });
  }

  fetchReports(): void {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/report/all`).subscribe({
      next: (data) => {
        this.allReports.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Lỗi tải danh sách phản ánh đánh giá', 'error');
        this.isLoading.set(false);
      }
    });
  }

  startReply(reportId: number): void {
    this.replyingTo.set(reportId);
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyContent = '';
  }

  submitReply(reportId: number): void {
    if (!this.replyContent.trim()) return;
    
    this.isSubmitting.set(true);
    this.http.put(`${environment.apiUrl}/report/${reportId}/reply`, { replyContent: this.replyContent }).subscribe({
      next: () => {
        this.toastService.show('Đã gửi phản hồi thành công!', 'success');
        this.isSubmitting.set(false);
        this.cancelReply();
        this.fetchReports();
      },
      error: () => {
        this.toastService.show('Lỗi khi gửi phản hồi', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}
