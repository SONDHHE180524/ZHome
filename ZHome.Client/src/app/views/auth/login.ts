import { Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper animate-fade-in">
      <div class="glass-panel auth-card">
        <div class="auth-header">
          <h2>Chào mừng quay lại</h2>
          <p>Đăng nhập vào tài khoản ZHome của bạn</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label for="phone">Số điện thoại</label>
            <input 
              type="text" 
              id="phone" 
              name="phone" 
              [(ngModel)]="phone" 
              #phoneInput="ngModel"
              required 
              pattern="^0[35789]\\d{8}$"
              class="form-control" 
              placeholder="Ví dụ: 0912345678" />
            @if (phoneInput.invalid && (phoneInput.dirty || phoneInput.touched)) {
              <span class="error-text">Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng số 0 và chữ số thứ 2 là 3, 5, 7, 8 hoặc 9).</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              required
              class="form-control" 
              placeholder="Nhập mật khẩu" />
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading()" class="btn btn-primary btn-block">
            @if (isLoading()) {
              Đang đăng nhập...
            } @else {
              Đăng nhập
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Chưa có tài khoản? <a routerLink="/register">Đăng ký ngay</a></p>
        </div>
      </div>
    </div>

    <!-- POPUP THÔNG BÁO NỔI RA NGOÀI MÀN HÌNH (TO RÕ, ĐẸP MẮT) -->
    @if (errorMessage()) {
      <div class="auth-modal-backdrop" (click)="closeErrorModal()">
        <div class="auth-modal-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-icon" (click)="closeErrorModal()" title="Đóng">&times;</button>
          
          <div class="auth-modal-icon-badge" [class.pending]="isPendingApproval()" [class.rejected]="isRejected()" [class.warning]="!isPendingApproval() && !isRejected()">
            @if (isPendingApproval()) {
              <!-- Clock / Hourglass Icon -->
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            } @else if (isRejected()) {
              <!-- Reject / Cross Icon -->
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            } @else {
              <!-- Alert Warning Icon -->
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            }
          </div>

          <h3 class="auth-modal-title">
            @if (isPendingApproval()) {
              Tài Khoản Đang Chờ Xét Duyệt
            } @else if (isRejected()) {
              Tài Khoản Bị Từ Chối Xét Duyệt
            } @else {
              Đăng Nhập Thất Bại
            }
          </h3>

          <div class="auth-modal-message">
            {{ errorMessage() }}
          </div>

          @if (isPendingApproval()) {
            <div class="auth-modal-info-box">
              <span class="info-icon">ℹ️</span>
              <div class="info-text">
                Hồ sơ Chủ trọ của bạn đang được Ban quản trị ZHome xác minh. Quá trình kiểm duyệt thường hoàn tất trong vòng <strong>24 giờ làm việc</strong>. Vui lòng quay lại sau!
              </div>
            </div>
          } @else if (!isRejected()) {
            <div class="auth-modal-info-box">
              <span class="info-icon">💡</span>
              <div class="info-text">
                Vui lòng kiểm tra lại chính xác số điện thoại và mật khẩu của bạn rồi thử đăng nhập lại.
              </div>
            </div>
          }

          <div class="auth-modal-actions">
            <button type="button" class="btn btn-primary btn-modal-confirm" (click)="closeErrorModal()">
              {{ isPendingApproval() ? 'Đã hiểu' : 'Đóng thông báo' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 30px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .auth-header h2 {
      margin-bottom: 8px;
      font-size: 1.8rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.9rem;
    }
    .error-text {
      color: var(--color-danger-light);
      font-size: 0.75rem;
      margin-top: 2px;
    }

    /* Modal thông báo nổi bật ra ngoài toàn màn hình */
    .auth-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.62);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 24px;
      animation: modalFadeIn 0.25s ease-out;
    }

    .auth-modal-card {
      position: relative;
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 520px;
      padding: 40px 36px 32px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.06);
      text-align: center;
      animation: modalScaleUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .modal-close-icon {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      font-size: 1.5rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .modal-close-icon:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: rotate(90deg);
    }

    .auth-modal-icon-badge {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 22px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.09);
      animation: badgeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .auth-modal-icon-badge.pending {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #d97706;
      border: 4px solid #fffbeb;
    }

    .auth-modal-icon-badge.rejected,
    .auth-modal-icon-badge.warning {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #dc2626;
      border: 4px solid #fff1f2;
    }

    .auth-modal-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 14px;
      line-height: 1.35;
    }

    .auth-modal-message {
      font-size: 1.15rem;
      line-height: 1.65;
      color: #334155;
      font-weight: 500;
      margin-bottom: 24px;
      padding: 0 10px;
      word-break: break-word;
    }

    .auth-modal-info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      text-align: left;
      margin-bottom: 26px;
      width: 100%;
    }

    .auth-modal-info-box .info-icon {
      font-size: 1.35rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .auth-modal-info-box .info-text {
      font-size: 0.95rem;
      color: #475569;
      line-height: 1.55;
    }

    .auth-modal-actions {
      width: 100%;
    }

    .btn-modal-confirm {
      width: 100%;
      padding: 14px 28px;
      font-size: 1.08rem;
      font-weight: 700;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.32);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-modal-confirm:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.42);
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleUp {
      from {
        opacity: 0;
        transform: scale(0.88) translateY(24px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes badgeBounce {
      0% { transform: scale(0.6); }
      70% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  phone = '';
  password = '';
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  closeErrorModal(): void {
    this.errorMessage.set(null);
  }

  @HostListener('window:keydown.escape')
  onEscapePress(): void {
    if (this.errorMessage()) {
      this.closeErrorModal();
    }
  }

  isPendingApproval(): boolean {
    const msg = this.errorMessage()?.toLowerCase() || '';
    return msg.includes('chờ xét duyệt') || msg.includes('chờ duyệt');
  }

  isRejected(): boolean {
    const msg = this.errorMessage()?.toLowerCase() || '';
    return msg.includes('từ chối') || msg.includes('khóa');
  }

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ phone: this.phone, password: this.password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastService.show(`Chào mừng quay lại, ${user.fullName}!`, 'success');
        
        // Redirect based on returnUrl or role
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        if (user.role === 'Administrator') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.role === 'Landlord') {
          this.router.navigate(['/landlord/overview']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        let errText = 'Số điện thoại hoặc mật khẩu không chính xác.';
        if (typeof err.error === 'string') {
          errText = err.error;
        } else if (err.error?.message) {
          errText = err.error.message;
        } else if (err.error?.error) {
          errText = err.error.error;
        }
        this.errorMessage.set(errText);
      }
    });
  }
}
