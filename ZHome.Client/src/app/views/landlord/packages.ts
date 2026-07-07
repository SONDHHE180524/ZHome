import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../services/subscription.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landlord-packages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="packages-container animate-fade-in">
      <div class="header-row text-center mb-5">
        <h1>Nâng Cấp Gói Cước ZHome Premium</h1>
        <p class="text-muted">Mở khóa các tính năng quản lý trọ mạnh mẽ giúp bạn tiết kiệm thời gian và tối ưu hóa lợi nhuận.</p>
      </div>

      @if (isLoading()) {
        <div class="text-center mt-5">
          <div class="spinner"></div>
          <p>Đang tải danh sách gói cước...</p>
        </div>
      } @else {
        <div class="pricing-cards">
          @for (pkg of packages(); track pkg.id) {
            <div class="pricing-card" [class.highlight]="pkg.id === 3">
              @if (pkg.id === 3) {
                <div class="popular-badge">Phổ biến nhất</div>
              }
              <h2 class="pkg-title">{{ pkg.name }}</h2>
              <div class="pkg-price">
                <span class="amount">{{ pkg.price | number:'1.0-0' }}đ</span>
                <span class="period">/ tháng</span>
              </div>
              <p class="pkg-desc">{{ pkg.description }}</p>
              <ul class="pkg-features">
                <li><i class="fas fa-check"></i> Quản lý tối đa <strong>{{ pkg.maxRooms >= 9999 ? 'Không giới hạn' : pkg.maxRooms }}</strong> phòng</li>
                <li><i class="fas fa-check"></i> Đăng tin tìm khách thuê</li>
                <li><i class="fas fa-check"></i> Thêm/xem khách thuê phòng</li>
                <li><i class="fas fa-check"></i> Chấm dứt hợp đồng/Trả phòng</li>
                
                @if (pkg.id >= 2) {
                  <li><i class="fas fa-check"></i> Chốt số điện nước & lập hóa đơn</li>
                } @else {
                  <li class="disabled"><i class="fas fa-times"></i> Chốt điện nước & Lập hóa đơn</li>
                }

                @if (pkg.id >= 3) {
                  <li><i class="fas fa-check"></i> Gửi nhắc nợ qua Email tự động</li>
                  <li><i class="fas fa-check"></i> Tham khảo tiền thuế cần phải nộp</li>
                } @else {
                  <li class="disabled"><i class="fas fa-times"></i> Gửi nhắc nợ qua Email tự động</li>
                  <li class="disabled"><i class="fas fa-times"></i> Tham khảo tiền thuế cần phải nộp</li>
                }
              </ul>
              
              <button class="btn w-100" 
                      [class.btn-primary]="pkg.id !== 1" 
                      [class.btn-outline]="pkg.id === 1"
                      [disabled]="currentSubscriptionId() >= pkg.id"
                      (click)="openPurchaseModal(pkg)">
                {{ currentSubscriptionId() === pkg.id ? 'Đang sử dụng' : (currentSubscriptionId() > pkg.id ? 'Đã bao gồm' : (pkg.id === 1 ? 'Mặc định' : 'Nâng cấp ngay')) }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Purchase Modal -->
      @if (selectedPackage()) {
        <div class="modal-backdrop" (click)="closePurchaseModal()">
          <div class="glass-panel modal-card max-w-500" (click)="$event.stopPropagation()">
            <h2 class="mb-3 text-center">Xác nhận thanh toán</h2>
            <div class="purchase-details mb-4">
              <p>Bạn đang chọn nâng cấp lên: <strong>{{ selectedPackage().name }}</strong></p>
              <p>Chi phí: <strong style="color: var(--primary); font-size: 1.2rem;">{{ selectedPackage().price | number:'1.0-0' }}đ / tháng</strong></p>
              <hr class="my-3">
              <p class="text-sm text-muted">
                Hệ thống ZHome sử dụng cổng thanh toán VNPAY an toàn. 
                Khi bạn bấm Xác nhận, hệ thống sẽ mô phỏng quá trình thanh toán thành công và cập nhật gói cước ngay lập tức.
              </p>
            </div>
            <div class="modal-actions justify-content-center">
              <button class="btn btn-secondary" (click)="closePurchaseModal()" [disabled]="isPurchasing()">Hủy</button>
              <button class="btn btn-primary" (click)="confirmPurchase()" [disabled]="isPurchasing()">
                {{ isPurchasing() ? 'Đang xử lý...' : 'Xác nhận thanh toán' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .packages-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .pricing-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
      margin-top: 2rem;
    }
    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem 2rem;
      width: 320px;
      position: relative;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .pricing-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .pricing-card.highlight {
      border: 2px solid var(--primary);
      box-shadow: 0 8px 20px rgba(74, 144, 226, 0.2);
    }
    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .pkg-title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .pkg-price {
      text-align: center;
      margin-bottom: 1rem;
    }
    .pkg-price .amount {
      font-size: 2.8rem;
      font-weight: 700;
      color: var(--primary);
    }
    .pkg-price .period {
      color: var(--text-muted);
    }
    .pkg-desc {
      text-align: center;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
      min-height: 40px;
    }
    .pkg-features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
      flex-grow: 1;
    }
    .pkg-features li {
      margin-bottom: 1.2rem;
      font-size: 1.05rem;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .pkg-features li i.fa-check { color: #10b981; margin-top: 4px; }
    .pkg-features li i.fa-times { color: #ef4444; margin-top: 4px; }
    .pkg-features li.disabled {
      color: var(--text-muted);
      text-decoration: line-through;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .btn-outline:hover {
      background: var(--bg-hover);
    }
    .w-100 { width: 100%; }
    .mb-5 { margin-bottom: 3rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mt-5 { margin-top: 3rem; }
    .my-3 { margin: 1rem 0; }
    .text-center { text-align: center; }
    .justify-content-center { justify-content: center; }
    .text-sm { font-size: 0.9rem; }
  `]
})
export class LandlordPackagesComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  packages = signal<any[]>([]);
  isLoading = signal(true);
  isPurchasing = signal(false);
  selectedPackage = signal<any | null>(null);

  // Computed from authService to know which package the user currently has
  currentSubscriptionId = this.authService.subscriptionId;

  ngOnInit() {
    this.fetchPackages();
  }

  fetchPackages() {
    this.subscriptionService.getPackages().subscribe({
      next: (data) => {
        this.packages.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Lỗi khi tải danh sách gói cước', 'error');
        this.isLoading.set(false);
      }
    });
  }

  openPurchaseModal(pkg: any) {
    this.selectedPackage.set(pkg);
  }

  closePurchaseModal() {
    if (this.isPurchasing()) return;
    this.selectedPackage.set(null);
  }

  confirmPurchase() {
    const pkg = this.selectedPackage();
    if (!pkg) return;

    this.isPurchasing.set(true);
    this.subscriptionService.purchasePackage(pkg.id, 1).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.isPurchasing.set(false);
        this.selectedPackage.set(null);

        // Update user session to reflect new premium status without requiring a relogin
        const currentSession = this.authService.session();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            subscriptionId: res.subscriptionId,
            subscriptionEndDate: res.subscriptionEndDate
          };
          localStorage.setItem('user_session', JSON.stringify(updatedSession));
          // Use bracket notation to access protected/private if needed, or simply let the user logout/login.
          // Wait, authService.session is a writable signal, but we don't have direct access to set.
          // Let's call updateSessionProfile if we can, or just reload the page.
          window.location.reload();
        }
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Có lỗi khi thanh toán', 'error');
        this.isPurchasing.set(false);
      }
    });
  }
}
