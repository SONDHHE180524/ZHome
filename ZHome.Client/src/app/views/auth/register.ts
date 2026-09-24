import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper animate-fade-in">
      <div class="glass-panel auth-card">
        <div class="auth-header">
          <h2>Tạo tài khoản mới</h2>
          <p>Tham gia cùng ZHome để quản lý trọ và tìm ở ghép</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="auth-form">
          
          <!-- Role selector switcher -->
          <div class="form-group">
            <label class="role-group-label">Bạn tham gia với tư cách</label>
            <div class="role-selector">
              <div 
                class="role-option" 
                [class.selected]="roleName === 'Tenant'" 
                (click)="setRole('Tenant')">
                <div class="role-check">
                  <span class="check-circle"></span>
                </div>
                <div class="role-icon-box">
                  <span class="role-icon">🎓</span>
                </div>
                <div class="role-info">
                  <span class="role-title">Sinh viên / Người thuê</span>
                  <span class="role-desc">Tìm phòng & tìm bạn ghép</span>
                </div>
              </div>

              <div 
                class="role-option" 
                [class.selected]="roleName === 'Landlord'" 
                (click)="setRole('Landlord')">
                <div class="role-check">
                  <span class="check-circle"></span>
                </div>
                <div class="role-icon-box">
                  <span class="role-icon">🔑</span>
                </div>
                <div class="role-info">
                  <span class="role-title">Chủ nhà / Cho thuê</span>
                  <span class="role-desc">Đăng tin & quản lý phòng</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="fullName">Họ và tên</label>
            <input 
              type="text" 
              id="fullName" 
              name="fullName" 
              [(ngModel)]="fullName" 
              #fullNameInput="ngModel"
              required 
              pattern="^[a-zA-Z\\sđĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỶỷỸỹỴỵ]+$"
              class="form-control" 
              placeholder="Nhập họ tên đầy đủ" />
            @if (fullNameInput.invalid && (fullNameInput.dirty || fullNameInput.touched)) {
              @if (fullNameInput.errors?.['required']) {
                <span class="error-text">Họ tên bắt buộc phải nhập.</span>
              } @else if (fullNameInput.errors?.['pattern']) {
                <span class="error-text">Họ tên chỉ được chứa chữ cái và khoảng trắng (không chứa ký tự đặc biệt, biểu tượng).</span>
              }
            }
          </div>

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
            <label for="email">Email (Tùy chọn)</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              class="form-control" 
              placeholder="Nhập địa chỉ email" />
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              #passInput="ngModel"
              required 
              minlength="6"
              class="form-control" 
              placeholder="Tối thiểu 6 ký tự" />
            @if (passInput.invalid && (passInput.dirty || passInput.touched)) {
              <span class="error-text">Mật khẩu phải dài ít nhất 6 ký tự.</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Nhập lại mật khẩu</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword" 
              [(ngModel)]="confirmPassword" 
              #confirmPassInput="ngModel"
              required 
              class="form-control" 
              placeholder="Nhập lại mật khẩu để xác nhận" />
            @if (confirmPassInput.invalid && (confirmPassInput.dirty || confirmPassInput.touched)) {
              <span class="error-text">Vui lòng nhập lại mật khẩu.</span>
            } @else if (password !== confirmPassword && (confirmPassInput.dirty || confirmPassInput.touched || passInput.dirty)) {
              <span class="error-text">Mật khẩu nhập lại không khớp.</span>
            }
          </div>

          @if (roleName === 'Landlord') {
            <div class="form-group">
              <label for="cccdNumber">Số CCCD (Căn cước công dân)</label>
              <input 
                type="text" 
                id="cccdNumber" 
                name="cccdNumber" 
                [(ngModel)]="cccdNumber" 
                #cccdNumberInput="ngModel"
                required 
                pattern="^\\d{12}$"
                class="form-control" 
                placeholder="Nhập 12 số CCCD" />
              @if (cccdNumberInput.invalid && (cccdNumberInput.dirty || cccdNumberInput.touched)) {
                <span class="error-text">Số CCCD Việt Nam không hợp lệ (yêu cầu 12 chữ số).</span>
              }
            </div>

            <div class="row-flex">
              <div class="form-group flex-1">
                <label>Ảnh mặt trước CCCD</label>
                <div class="file-upload-wrapper">
                  <input 
                    type="file" 
                    accept="image/*" 
                    (change)="onFileSelected($event, 'front')" 
                    class="file-input-hidden"
                    id="fileFront" />
                  <label for="fileFront" class="file-upload-btn">
                    @if (cccdFrontPreview()) {
                      <img [src]="cccdFrontPreview()" alt="Mặt trước" class="upload-preview" />
                    } @else {
                      <span> Chọn mặt trước</span>
                    }
                  </label>
                </div>
              </div>

              <div class="form-group flex-1">
                <label>Ảnh mặt sau CCCD</label>
                <div class="file-upload-wrapper">
                  <input 
                    type="file" 
                    accept="image/*" 
                    (change)="onFileSelected($event, 'back')" 
                    class="file-input-hidden"
                    id="fileBack" />
                  <label for="fileBack" class="file-upload-btn">
                    @if (cccdBackPreview()) {
                      <img [src]="cccdBackPreview()" alt="Mặt sau" class="upload-preview" />
                    } @else {
                      <span> Chọn mặt sau</span>
                    }
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group checkbox-wrapper">
              <label class="checkbox-label">
                <input type="checkbox" name="sendVerificationRequest" [(ngModel)]="sendVerificationRequest" />
                <span>Gửi yêu cầu xác thực tài khoản chủ trọ đến Admin</span>
              </label>
            </div>
          }

          @if (errorMessage()) {
            <div class="alert-error">{{ errorMessage() }}</div>
          }

          <button type="submit" [disabled]="registerForm.invalid || password !== confirmPassword || (roleName === 'Landlord' && (!cccdFrontBase64() || !cccdBackBase64())) || isLoading()" class="btn btn-primary btn-block">
            @if (isLoading()) {
              Đang đăng ký...
            } @else {
              Đăng ký tài khoản
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Đã có tài khoản? <a routerLink="/login">Đăng nhập</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 40px 0;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
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
    .role-group-label {
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
      font-size: 0.9rem;
      display: block;
    }
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 5px;
    }
    .role-option {
      position: relative;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.25s ease;
      user-select: none;
    }
    .role-option:hover {
      border-color: #60a5fa;
      background: #eff6ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
    }
    .role-option.selected {
      border-color: #2563eb;
      background: #eff6ff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.16);
    }
    .role-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
      transition: all 0.25s ease;
    }
    .role-option.selected .role-icon-box {
      border-color: #93c5fd;
      background: #dbeafe;
      transform: scale(1.06);
    }
    .role-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .role-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #0f172a;
      transition: color 0.25s ease;
    }
    .role-option.selected .role-title {
      color: #1d4ed8;
    }
    .role-desc {
      font-size: 0.72rem;
      color: #64748b;
      line-height: 1.25;
      font-weight: 500;
    }
    .role-option.selected .role-desc {
      color: #2563eb;
    }
    .role-check {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    .check-circle {
      display: block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: #ffffff;
      transition: all 0.25s ease;
    }
    .role-option.selected .check-circle {
      border-color: #2563eb;
      background: #2563eb;
      box-shadow: inset 0 0 0 3px #ffffff;
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
    .row-flex {
      display: flex;
      gap: 12px;
    }
    .flex-1 {
      flex: 1;
    }
    .file-input-hidden {
      display: none;
    }
    .file-upload-btn {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-sm);
      height: 100px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.02);
      transition: var(--transition);
      color: #94a3b8;
      font-size: 0.8rem;
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
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      margin-top: 5px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      text-transform: none;
      font-weight: 500;
      color: #cbd5e1;
      font-size: 0.85rem;
    }
    .checkbox-label input {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }
  `]
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  fullName = '';
  phone = '';
  email = '';
  password = '';
  confirmPassword = '';
  roleName = 'Tenant'; // Default role is Student/Tenant

  // CCCD Verification fields
  cccdNumber = '';
  cccdFrontBase64 = signal('');
  cccdBackBase64 = signal('');
  cccdFrontPreview = signal('');
  cccdBackPreview = signal('');
  sendVerificationRequest = true;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onFileSelected(event: any, type: 'front' | 'back'): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      if (type === 'front') {
        this.cccdFrontBase64.set(base64);
        this.cccdFrontPreview.set(base64);
      } else {
        this.cccdBackBase64.set(base64);
        this.cccdBackPreview.set(base64);
      }
    };
    reader.readAsDataURL(file);
  }

  setRole(role: string): void {
    this.roleName = role;
  }

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: any = {
      fullName: this.fullName,
      phone: this.phone,
      email: this.email || null,
      password: this.password,
      roleName: this.roleName
    };

    if (this.roleName === 'Landlord') {
      payload.cccdNumber = this.cccdNumber;
      payload.cccdFrontBase64 = this.cccdFrontBase64();
      payload.cccdBackBase64 = this.cccdBackBase64();
      payload.sendVerificationRequest = this.sendVerificationRequest;
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.show('Đăng ký tài khoản thành công! Bạn có thể đăng nhập.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        let errText = 'Có lỗi xảy ra trong quá trình đăng ký.';
        if (typeof err.error === 'string') {
          errText = err.error;
        } else if (err.error?.message) {
          errText = err.error.message;
        } else if (err.error?.error) {
          errText = err.error.error;
        }
        this.errorMessage.set(errText);
        this.toastService.show(errText, 'error');
      }
    });
  }
}
