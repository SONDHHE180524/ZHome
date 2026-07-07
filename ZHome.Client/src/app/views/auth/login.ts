import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
              <span class="error-text">Số điện thoại Việt Nam 10 chữ số không hợp lệ.</span>
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

          @if (errorMessage()) {
            <div class="alert-error">{{ errorMessage() }}</div>
          }

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
    .alert-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: var(--color-danger-light);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  phone = '';
  password = '';
  
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ phone: this.phone, password: this.password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastService.show(`Chào mừng quay lại, ${user.fullName}!`, 'success');
        
        // Redirect based on role
        if (user.role === 'Landlord' || user.role === 'Administrator') {
          this.router.navigate(['/landlord/overview']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errText = err.error || 'Số điện thoại hoặc mật khẩu không chính xác.';
        this.errorMessage.set(errText);
        this.toastService.show(errText, 'error');
      }
    });
  }
}
