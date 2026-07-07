import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landlord-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landlord-reports-container animate-fade-in">
      <div class="header-section">
        <h2>Quản lý Phản ánh / Đánh giá</h2>
        <p class="text-muted">Xem và phản hồi các đánh giá từ khách thuê trong các khu trọ của bạn.</p>
      </div>

      @if (isLoading()) {
        <div class="loading-state">Đang tải danh sách phản ánh...</div>
      } @else if (reports().length === 0) {
        <div class="empty-state">
          <p>Chưa có phản ánh nào từ khách thuê.</p>
        </div>
      } @else {
        <div class="reports-list">
          @for (report of reports(); track report.id) {
            <div class="report-card" [class.needs-reply]="report.rating < 5 && !report.landlordReply">
              <div class="report-header">
                <div class="report-title">
                  <h3>{{ report.title }}</h3>
                  <span class="tenant-info">Bởi {{ report.tenantName }} - {{ report.tenantPhone }} (Khu: {{ report.roomNumber || 'N/A' }})</span>
                </div>
                <div class="report-meta">
                  <span class="rating-stars" [title]="report.rating + ' sao'">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <span class="star" [class.filled]="i <= (report.rating || 5)">★</span>
                    }
                  </span>
                  <span class="date">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="report-content">
                <p>{{ report.content }}</p>
              </div>

              <div class="report-actions">
                @if (report.rating < 5 && !report.landlordReply) {
                  <div class="alert alert-warning">
                    ⚠️ Đánh giá này dưới 5 sao. Hệ thống yêu cầu bạn bắt buộc phải phản hồi và cam kết khắc phục.
                  </div>
                  <div class="reply-form" *ngIf="replyingTo() === report.id">
                    <textarea [(ngModel)]="replyContent" placeholder="Nhập nội dung phản hồi / cam kết khắc phục của bạn..." rows="3"></textarea>
                    <div class="form-actions mt-2">
                      <button class="btn btn-primary" (click)="submitReply(report.id)" [disabled]="isSubmitting() || !replyContent.trim()">Gửi phản hồi</button>
                      <button class="btn btn-secondary" (click)="cancelReply()">Hủy</button>
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm mt-2" *ngIf="replyingTo() !== report.id" (click)="startReply(report.id)">Viết phản hồi</button>
                } @else if (report.landlordReply) {
                  <div class="reply-content">
                    <strong>Phản hồi của bạn:</strong>
                    <p>{{ report.landlordReply }}</p>
                    <span class="reply-date">Đã phản hồi: {{ report.repliedAt | date:'dd/MM/yyyy HH:mm' }}</span>
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
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 24px;
    }
    .header-section h2 {
      margin-bottom: 8px;
    }
    .text-muted {
      color: var(--text-muted);
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .report-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }
    .report-card.needs-reply {
      border-left: 4px solid #ef4444;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .report-title h3 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
    }
    .tenant-info {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .report-meta {
      text-align: right;
    }
    .rating-stars {
      display: block;
      color: #e2e8f0;
      font-size: 1.1rem;
    }
    .star.filled {
      color: #fbbf24;
    }
    .date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .report-content {
      margin-bottom: 16px;
      color: var(--text-main);
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
    }
    .alert {
      padding: 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    .alert-warning {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .reply-form textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-family: inherit;
      resize: vertical;
    }
    .reply-content {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 12px;
      border-radius: 6px;
    }
    .reply-content p {
      margin: 8px 0;
    }
    .reply-date {
      font-size: 0.8rem;
      color: #0f766e;
    }
    .mt-2 { margin-top: 8px; }
    .form-actions { display: flex; gap: 8px; }
  `]
})
export class LandlordReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  reports = signal<any[]>([]);
  isLoading = signal(true);
  replyingTo = signal<number | null>(null);
  replyContent = '';
  isSubmitting = signal(false);

  ngOnInit() {
    this.fetchReports();
  }

  fetchReports() {
    this.isLoading.set(true);
    this.http.get<any[]>('http://localhost:5000/api/report/all').subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Lỗi tải danh sách phản ánh', 'error');
        this.isLoading.set(false);
      }
    });
  }

  startReply(reportId: number) {
    this.replyingTo.set(reportId);
    this.replyContent = '';
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.replyContent = '';
  }

  submitReply(reportId: number) {
    if (!this.replyContent.trim()) return;
    
    this.isSubmitting.set(true);
    this.http.put(`http://localhost:5000/api/report/${reportId}/reply`, { replyContent: this.replyContent }).subscribe({
      next: () => {
        this.toastService.show('Phản hồi thành công!', 'success');
        this.isSubmitting.set(false);
        this.cancelReply();
        this.fetchReports(); // Reload to get updated data
      },
      error: () => {
        this.toastService.show('Lỗi khi gửi phản hồi', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}
