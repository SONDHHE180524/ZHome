import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verifications-container animate-fade-in">
      <div class="header-row">
        <div>
          <h1>Phê Duyệt & Xác Thực Chủ Trọ</h1>
          <p>Xem danh sách hồ sơ đăng ký chủ nhà, đối chiếu thông tin CCCD và cấp tích xanh xác minh chính chủ</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">Đang tải danh sách yêu cầu xác thực...</div>
      } @else if (verifications().length === 0) {
        <div class="glass-panel empty-state">
          <span class="empty-icon">🎉</span>
          <h3>Không có yêu cầu xác thực nào cần xử lý</h3>
          <p class="text-muted mt-2">Hiện tại toàn bộ hồ sơ chủ trọ đã được giải quyết hoặc chưa có yêu cầu mới.</p>
        </div>
      } @else {
        <div class="glass-panel table-card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Chủ nhà</th>
                  <th>Số điện thoại / Email</th>
                  <th>Số CCCD</th>
                  <th>Ảnh CCCD (Mặt trước / Mặt sau)</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                @for (item of verifications(); track item.userId) {
                  <tr>
                    <td>
                      <div class="landlord-info-cell">
                        <span class="landlord-name-val">{{ item.fullName }}</span>
                        <span class="landlord-date-val">Đăng ký: {{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="contact-cell">
                        <div>📞 {{ item.phone }}</div>
                        <div class="email-val">📧 {{ item.email || 'Không cung cấp' }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="cccd-num-badge">{{ item.cccdNumber }}</span>
                    </td>
                    <td>
                      <div class="cccd-images-cell">
                        <div class="image-thumb-wrapper" (click)="zoomImage('http://localhost:5000' + item.cccdFrontUrl, 'Mặt trước CCCD')">
                          <img [src]="'http://localhost:5000' + item.cccdFrontUrl" alt="Mặt trước" class="cccd-thumb" />
                          <span class="zoom-overlay">🔎 Xem</span>
                        </div>
                        <div class="image-thumb-wrapper" (click)="zoomImage('http://localhost:5000' + item.cccdBackUrl, 'Mặt sau CCCD')">
                          <img [src]="'http://localhost:5000' + item.cccdBackUrl" alt="Mặt sau" class="cccd-thumb" />
                          <span class="zoom-overlay">🔎 Xem</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [class.badge-warning]="item.status === 'Pending'" [class.badge-success]="item.status === 'Approved'" [class.badge-danger]="item.status === 'Rejected'">
                        {{ getStatusLabel(item.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="actions-cell">
                        @if (item.status === 'Pending' || item.status === 'Rejected') {
                          <button (click)="approve(item.userId)" class="btn btn-success btn-xs">Duyệt ✅</button>
                        }
                        @if (item.status === 'Pending' || item.status === 'Approved') {
                          <button (click)="openRejectModal(item.userId)" class="btn btn-danger btn-xs">Từ chối ❌</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Reject Reason Modal -->
      @if (showRejectModal()) {
        <div class="modal-backdrop" (click)="closeRejectModal()">
          <div class="glass-panel modal-card max-w-400" (click)="$event.stopPropagation()">
            <button (click)="closeRejectModal()" class="modal-close-btn">&times;</button>
            <h2>Từ Chối Xác Thực</h2>
            <p class="text-muted mt-1">Vui lòng nhập lý do từ chối yêu cầu xác thực tài khoản chủ trọ này.</p>
            <form (ngSubmit)="submitReject()" class="mt-4">
              <div class="form-group">
                <label for="rejectReason">Lý do từ chối</label>
                <textarea id="rejectReason" name="reason" [(ngModel)]="rejectReason" required class="form-control" rows="4" placeholder="Ví dụ: Ảnh CCCD bị mờ, số CCCD không khớp..."></textarea>
              </div>
              <div class="modal-actions mt-4">
                <button type="button" (click)="closeRejectModal()" class="btn btn-secondary">Hủy</button>
                <button type="submit" class="btn btn-danger" [disabled]="!rejectReason.trim()">Xác nhận từ chối</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Image Viewer Modal -->
      @if (zoomedImageUrl()) {
        <div class="modal-backdrop viewer-backdrop" (click)="closeZoom()">
          <div class="viewer-content-card" (click)="$event.stopPropagation()">
            <button (click)="closeZoom()" class="modal-close-btn">&times;</button>
            <h3 class="viewer-title">{{ zoomedImageTitle() }}</h3>
            <div class="viewer-image-wrapper">
              <img [src]="zoomedImageUrl()" alt="CCCD Zoom" class="viewer-img" />
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .verifications-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .table-container {
      border: none;
      margin-top: 0;
    }
    table {
      background: transparent;
    }
    th {
      background: rgba(255, 255, 255, 0.05);
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      padding: 16px;
    }
    td {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .landlord-info-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .landlord-name-val {
      font-weight: 700;
      color: var(--text-main);
      font-size: 0.95rem;
    }
    .landlord-date-val {
      font-size: 0.75rem;
      color: var(--text-dark);
    }
    .contact-cell {
      font-size: 0.9rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .email-val {
      font-size: 0.8rem;
    }
    .cccd-num-badge {
      font-family: monospace;
      font-size: 0.95rem;
      background: rgba(99, 102, 241, 0.08);
      color: var(--color-primary-light);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .cccd-images-cell {
      display: flex;
      gap: 10px;
    }
    .image-thumb-wrapper {
      width: 80px;
      height: 50px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      position: relative;
      cursor: pointer;
      border: 1px solid var(--border-color);
    }
    .cccd-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition);
    }
    .image-thumb-wrapper:hover .cccd-thumb {
      transform: scale(1.1);
    }
    .zoom-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: var(--transition);
    }
    .image-thumb-wrapper:hover .zoom-overlay {
      opacity: 1;
    }
    .actions-cell {
      display: flex;
      gap: 8px;
    }
    .btn-xs {
      padding: 6px 12px;
      font-size: 0.75rem;
      border-radius: 6px;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 60px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }
    .mt-1 { margin-top: 8px; }
    .mt-2 { margin-top: 16px; }
    .mt-4 { margin-top: 24px; }
    .max-w-400 {
      max-width: 400px;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
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
    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-main);
      border: none;
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
    .modal-close-btn:hover {
      background: var(--color-danger);
      color: #ffffff;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Image Viewer Backdrop */
    .viewer-backdrop {
      background: rgba(0, 0, 0, 0.85);
    }
    .viewer-content-card {
      background: #1e293b;
      padding: 24px;
      border-radius: var(--radius-md);
      position: relative;
      max-width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .viewer-content-card .modal-close-btn {
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.05);
    }
    .viewer-content-card .modal-close-btn:hover {
      background: var(--color-danger);
      color: #ffffff;
    }
    .viewer-title {
      color: #ffffff;
      font-size: 1.1rem;
      margin-right: 40px;
    }
    .viewer-image-wrapper {
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #0f172a;
      border-radius: var(--radius-sm);
      padding: 8px;
    }
    .viewer-img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
    }
  `]
})
export class AdminVerificationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  verifications = signal<any[]>([]);
  isLoading = signal(true);

  // Reject Modal States
  showRejectModal = signal(false);
  rejectUserId = 0;
  rejectReason = '';

  // Image Zoom States
  zoomedImageUrl = signal<string | null>(null);
  zoomedImageTitle = signal('');

  ngOnInit(): void {
    this.fetchRequests();
  }

  fetchRequests(): void {
    this.isLoading.set(true);
    this.adminService.getVerifications().subscribe({
      next: (data) => {
        this.verifications.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách yêu cầu xác thực từ server.', 'error');
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Đang chờ duyệt';
      case 'Approved': return 'Đã xác minh';
      case 'Rejected': return 'Bị từ chối';
      default: return status;
    }
  }

  approve(userId: number): void {
    if (!confirm('Bạn có chắc chắn muốn phê duyệt xác thực tài khoản chủ nhà này?')) return;

    this.adminService.approveVerification(userId).subscribe({
      next: (res) => {
        this.toastService.show(res.message || 'Phê duyệt chủ nhà thành công!', 'success');
        this.fetchRequests();
      },
      error: (err) => {
        const msg = err.error?.message || 'Lỗi phê duyệt yêu cầu.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  openRejectModal(userId: number): void {
    this.rejectUserId = userId;
    this.rejectReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
  }

  submitReject(): void {
    if (!this.rejectReason.trim()) return;

    this.adminService.rejectVerification(this.rejectUserId, this.rejectReason).subscribe({
      next: (res) => {
        this.toastService.show(res.message || 'Đã từ chối xác thực chủ nhà.', 'success');
        this.closeRejectModal();
        this.fetchRequests();
      },
      error: (err) => {
        const msg = err.error?.message || 'Lỗi từ chối yêu cầu.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  zoomImage(url: string, title: string): void {
    this.zoomedImageUrl.set(url);
    this.zoomedImageTitle.set(title);
  }

  closeZoom(): void {
    this.zoomedImageUrl.set(null);
  }
}
