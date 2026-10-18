import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PrivacyService } from '../../services/privacy.service';

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
            <label for="fullName">Họ và tên <span class="required-star">*</span></label>
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
                <span class="error-text">Họ tên chỉ được chứa chữ cái và khoảng trắng.</span>
              }
            }
          </div>

          <div class="form-group">
            <label for="phone">Số điện thoại <span class="required-star">*</span></label>
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
            <label for="email">Địa chỉ Email (Nhận mã xác thực) <span class="required-star">*</span></label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              #emailInput="ngModel"
              required 
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
              class="form-control" 
              placeholder="Ví dụ: name@gmail.com" />
            @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
              @if (emailInput.errors?.['required']) {
                <span class="error-text">Email bắt buộc phải nhập để nhận mã xác thực.</span>
              } @else {
                <span class="error-text">Địa chỉ email không đúng định dạng.</span>
              }
            }
            <span class="field-hint">Mã xác thực OTP gồm 6 chữ số sẽ được gửi về email này để tạo tài khoản.</span>
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu <span class="required-star">*</span></label>
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
            <label for="confirmPassword">Nhập lại mật khẩu <span class="required-star">*</span></label>
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
              <label for="cccdNumber">Số CCCD (Căn cước công dân) <span class="required-star">*</span></label>
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
                <label>Ảnh mặt trước CCCD <span class="required-star">*</span></label>
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
                      <span>Chọn mặt trước</span>
                    }
                  </label>
                </div>
              </div>

              <div class="form-group flex-1">
                <label>Ảnh mặt sau CCCD <span class="required-star">*</span></label>
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
                      <span>Chọn mặt sau</span>
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

          <div class="terms-policy-note">
            Bằng việc nhấn Đăng ký, bạn đồng ý với 
            <a href="javascript:void(0)" (click)="privacyService.openModal(roleName === 'Landlord' ? 'landlord' : 'tenant')">
              Điều khoản bảo mật & dữ liệu
            </a> của ZHome.
          </div>

          <button type="submit" [disabled]="registerForm.invalid || password !== confirmPassword || (roleName === 'Landlord' && (!cccdFrontBase64() || !cccdBackBase64())) || isLoading()" class="btn btn-primary btn-block">
            @if (isLoading()) {
              Đang gửi mã xác thực...
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

    <!-- MODAL NHẬP MÃ XÁC THỰC EMAIL (OTP) -->
    @if (showOtpModal()) {
      <div class="otp-modal-backdrop animate-fade-in" (click)="$event.stopPropagation()">
        <div class="otp-modal-card animate-scale-up">
          <button type="button" class="modal-close-icon" (click)="closeOtpModal()" title="Đóng">&times;</button>
          
          <div class="otp-icon-badge">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>

          <h3 class="otp-modal-title">Xác thực địa chỉ Email</h3>
          <p class="otp-modal-desc">
            Hệ thống đã gửi mã xác thực <strong>6 chữ số</strong> đến:
            <br/><span class="otp-target-email">{{ email }}</span>
          </p>

          <div class="otp-input-container">
            <label for="otpCodeInput" class="otp-label">Nhập 6 số mã xác thực</label>
            <input 
              type="text" 
              id="otpCodeInput" 
              maxlength="6" 
              [(ngModel)]="otpCode" 
              (input)="onOtpInput($event)"
              placeholder="••••••" 
              class="otp-digit-field" 
              autocomplete="one-time-code"
              autofocus />
          </div>

          @if (otpErrorMessage()) {
            <div class="alert-error" style="margin-top: 12px;">{{ otpErrorMessage() }}</div>
          }

          <div class="otp-action-group">
            <button 
              type="button" 
              (click)="confirmRegister()" 
              [disabled]="otpCode.length !== 6 || isSubmittingOtp()" 
              class="btn btn-primary btn-block">
              @if (isSubmittingOtp()) {
                Đang xác thực & tạo tài khoản...
              } @else {
                Xác nhận & Hoàn tất
              }
            </button>

            <div class="otp-resend-box">
              @if (resendCooldown() > 0) {
                <span class="resend-countdown">Gửi lại mã sau <strong>{{ resendCooldown() }}s</strong></span>
              } @else {
                <button type="button" class="btn-resend" (click)="resendOtp()" [disabled]="isResendingOtp()">
                  @if (isResendingOtp()) {
                    Đang gửi lại...
                  } @else {
                    Gửi lại mã xác thực
                  }
                </button>
              }
              <span class="resend-dot">•</span>
              <button type="button" class="btn-change-email" (click)="closeOtpModal()">
                Đổi lại email
              </button>
            </div>
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
    .required-star {
      color: #ef4444;
      font-weight: bold;
    }
    .field-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 3px;
      display: block;
      line-height: 1.35;
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
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 2px;
    }
    .alert-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      text-align: center;
    }
    .terms-policy-note {
      margin: 4px 0 10px 0;
      font-size: 0.8rem;
      color: #94a3b8;
      text-align: center;
      line-height: 1.4;
    }
    .terms-policy-note a {
      color: #3b82f6;
      text-decoration: underline;
      font-weight: 600;
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

    /* POPUP OTP MODAL */
    .otp-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .otp-modal-card {
      position: relative;
      background: #ffffff;
      border-radius: 20px;
      padding: 36px 30px;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .modal-close-icon {
      position: absolute;
      top: 14px;
      right: 16px;
      background: none;
      border: none;
      font-size: 1.8rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .modal-close-icon:hover {
      color: #0f172a;
    }
    .otp-icon-badge {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.15);
    }
    .otp-modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px;
    }
    .otp-modal-desc {
      font-size: 0.92rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .otp-target-email {
      font-weight: 700;
      color: #2563eb;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 4px;
    }
    .otp-input-container {
      margin-bottom: 12px;
    }
    .otp-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      display: block;
      margin-bottom: 8px;
    }
    .otp-digit-field {
      width: 100%;
      height: 56px;
      font-size: 2rem;
      letter-spacing: 12px;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      color: #1e293b;
      background: #f8fafc;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      outline: none;
      transition: all 0.25s ease;
    }
    .otp-digit-field:focus {
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
    }
    .otp-action-group {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .otp-resend-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 0.85rem;
      margin-top: 6px;
    }
    .resend-countdown {
      color: #64748b;
    }
    .resend-countdown strong {
      color: #ef4444;
    }
    .btn-resend {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      font-size: 0.85rem;
    }
    .btn-resend:hover {
      color: #1d4ed8;
    }
    .btn-resend:disabled {
      color: #94a3b8;
      cursor: not-allowed;
      text-decoration: none;
    }
    .resend-dot {
      color: #cbd5e1;
    }
    .btn-change-email {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0;
      font-size: 0.85rem;
    }
    .btn-change-email:hover {
      color: #0f172a;
      text-decoration: underline;
    }
    .animate-scale-up {
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.92);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class RegisterComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  public readonly privacyService = inject(PrivacyService);
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

  // OTP Verification state
  showOtpModal = signal(false);
  otpCode = '';
  otpErrorMessage = signal<string | null>(null);
  isSubmittingOtp = signal(false);
  isResendingOtp = signal(false);
  resendCooldown = signal(0);
  private timerInterval: any = null;

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  onFileSelected(event: any, type: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.show('Vui lòng chọn tệp định dạng hình ảnh hợp lệ.', 'error');
      input.value = '';
      return;
    }

    this.compressImage(file, 1600, 0.85)
      .then((compressedBase64) => {
        if (type === 'front') {
          this.cccdFrontBase64.set(compressedBase64);
          this.cccdFrontPreview.set(compressedBase64);
        } else {
          this.cccdBackBase64.set(compressedBase64);
          this.cccdBackPreview.set(compressedBase64);
        }
      })
      .catch(() => {
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
      })
      .finally(() => {
        input.value = '';
      });
  }

  private compressImage(file: File, maxDimension: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target.result);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  setRole(role: string): void {
    this.roleName = role;
  }

  onOtpInput(event: any): void {
    // Chỉ cho phép nhập chữ số, tối đa 6 ký tự
    const val = (event.target.value || '').replace(/\D/g, '').slice(0, 6);
    this.otpCode = val;
    event.target.value = val;
    this.otpErrorMessage.set(null);
  }

  closeOtpModal(): void {
    this.showOtpModal.set(false);
    this.otpCode = '';
    this.otpErrorMessage.set(null);
  }

  private startResendTimer(): void {
    this.clearResendTimer();
    this.resendCooldown.set(60);
    this.timerInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearResendTimer();
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Bước 1: Gửi mã OTP xác thực về Email thật
  onSubmit(): void {
    if (!this.email || !this.email.trim()) {
      this.toastService.show('Vui lòng nhập địa chỉ email để nhận mã xác thực.', 'error');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.sendOtp({
      email: this.email.trim(),
      phone: this.phone.trim()
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.showOtpModal.set(true);
        this.otpCode = ''; // Để trống ô nhập để người dùng mở Gmail lấy mã nhập vào
        this.otpErrorMessage.set(null);
        this.startResendTimer();
        this.toastService.show(res?.message || 'Mã xác thực 6 số đã được gửi tới email của bạn!', 'success');
      },
      error: (err) => {
        this.isLoading.set(false);
        const errText = this.extractErrorMessage(err, 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.');
        this.errorMessage.set(errText);
        this.toastService.show(errText, 'error');
      }
    });
  }

  // Gửi lại mã xác thực
  resendOtp(): void {
    if (this.resendCooldown() > 0 || this.isResendingOtp()) return;

    this.isResendingOtp.set(true);
    this.otpErrorMessage.set(null);

    this.authService.sendOtp({
      email: this.email.trim(),
      phone: this.phone.trim()
    }).subscribe({
      next: (res: any) => {
        this.isResendingOtp.set(false);
        this.otpCode = ''; // Để trống ô nhập
        this.startResendTimer();
        this.toastService.show(res?.message || 'Đã gửi lại mã xác thực mới đến email của bạn!', 'success');
      },
      error: (err) => {
        this.isResendingOtp.set(false);
        const errText = this.extractErrorMessage(err, 'Gửi lại mã thất bại.');
        this.otpErrorMessage.set(errText);
        this.toastService.show(errText, 'error');
      }
    });
  }

  // Bước 2: Nhập mã xác nhận OTP và hoàn tất tạo tài khoản
  confirmRegister(): void {
    if (this.otpCode.length !== 6) {
      this.otpErrorMessage.set('Vui lòng nhập đủ 6 chữ số mã xác thực.');
      return;
    }

    this.isSubmittingOtp.set(true);
    this.otpErrorMessage.set(null);

    const payload: any = {
      fullName: this.fullName.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      otpCode: this.otpCode.trim(),
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
      next: (res: any) => {
        this.isSubmittingOtp.set(false);
        this.showOtpModal.set(false);
        const successMsg = res?.message || 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.';
        this.toastService.show(successMsg, 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmittingOtp.set(false);
        const errText = this.extractErrorMessage(err, 'Xác thực mã thất bại hoặc thông tin chưa hợp lệ.');
        this.otpErrorMessage.set(errText);
        this.toastService.show(errText, 'error');
      }
    });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (typeof err.error === 'string') {
      return err.error;
    } else if (err.error?.message) {
      return err.error.message;
    } else if (err.error?.error) {
      return err.error.error;
    }
    return fallback;
  }
}
