import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container animate-fade-in">
      <div class="header-row">
        <div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản, thay đổi họ tên, email và cập nhật ảnh đại diện của bạn</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      } @else {
        <div class="glass-panel profile-card">
          <form (ngSubmit)="saveProfile()" #profileForm="ngForm" class="profile-form">
            <!-- Left section: Avatar upload and info -->
            <div class="avatar-section">
              <div class="avatar-wrapper">
                <img 
                  [src]="avatarPreview() || 'http://localhost:5000' + profileData().avatarUrl || 'assets/default-avatar.png'" 
                  (error)="handleImageError($event)"
                  alt="Avatar" 
                  class="profile-avatar" />
                <label for="avatarInput" class="upload-badge" title="Tải ảnh đại diện mới">
                  📷
                </label>
                <input 
                  type="file" 
                  id="avatarInput" 
                  (change)="onFileSelected($event)" 
                  accept="image/*" 
                  style="display: none;" />
              </div>
              <div class="user-meta mt-3">
                <h2>{{ profileData().fullName }}</h2>
                <span class="badge" 
                      [class.badge-admin]="profileData().roleName === 'Administrator'"
                      [class.badge-landlord]="profileData().roleName === 'Landlord'"
                      [class.badge-tenant]="profileData().roleName === 'Tenant'">
                  {{ profileData().roleName === 'Administrator' ? 'Admin hệ thống' : (profileData().roleName === 'Landlord' ? 'Chủ trọ' : 'Khách thuê') }}
                </span>
                <p class="phone-display mt-2">📞 {{ profileData().phone }}</p>
              </div>
            </div>

            <!-- Right section: Editable fields -->
            <div class="fields-section">
              <h3>Chỉnh sửa thông tin</h3>
              <div class="divider mb-4"></div>

              <div class="form-group">
                <label for="fullName">Họ và tên <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  [(ngModel)]="editModel.fullName" 
                  required 
                  #nameModel="ngModel"
                  class="form-control" 
                  [class.is-invalid]="nameModel.touched && nameModel.invalid"
                  placeholder="Nhập họ và tên đầy đủ" />
                @if (nameModel.touched && nameModel.invalid) {
                  <div class="error-msg">Họ và tên không được để trống.</div>
                }
              </div>

              <div class="form-group mt-3">
                <label for="email">Địa chỉ Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="editModel.email" 
                  email
                  #emailModel="ngModel"
                  class="form-control" 
                  [class.is-invalid]="emailModel.touched && emailModel.invalid"
                  placeholder="name@example.com" />
                @if (emailModel.touched && emailModel.invalid) {
                  <div class="error-msg">Email không đúng định dạng.</div>
                }
              </div>

              <div class="form-group mt-3">
                <label>Số điện thoại tài khoản (Không thể thay đổi)</label>
                <input 
                  type="text" 
                  [value]="profileData().phone" 
                  disabled 
                  class="form-control disabled-input" />
              </div>

              <div class="action-buttons mt-4">
                <button 
                  type="button" 
                  (click)="cancelEdit()" 
                  class="btn btn-secondary" 
                  [disabled]="isSaving()">
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  [disabled]="isSaving() || profileForm.invalid">
                  {{ isSaving() ? 'Đang lưu...' : '💾 Lưu thay đổi' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 10px 0;
      max-width: 900px;
      margin: 0 auto;
    }
    .header-row {
      margin-bottom: 30px;
    }
    .profile-card {
      padding: 30px;
    }
    .profile-form {
      display: grid;
      grid-template-columns: 1fr 1.8fr;
      gap: 40px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .profile-form {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      .avatar-section {
        border-right: none !important;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 24px;
      }
    }

    /* Left avatar styles */
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-right: 20px;
      border-right: 1px solid var(--border-color);
    }
    .avatar-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      padding: 4px;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
    }
    .profile-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: #1e1b4b;
      border: 3px solid #0f172a;
    }
    .upload-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: #a855f7;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      transition: var(--transition);
      border: 2px solid #0f172a;
      font-size: 1rem;
    }
    .upload-badge:hover {
      background: #c084fc;
      transform: scale(1.1);
    }
    .user-meta h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .phone-display {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .badge-admin {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-landlord {
      background: rgba(168, 85, 247, 0.15);
      color: var(--color-primary-light);
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .badge-tenant {
      background: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    /* Right form fields */
    .fields-section h3 {
      margin-top: 0;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .divider {
      height: 1px;
      background: var(--border-color);
    }
    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .required {
      color: #ef4444;
      margin-left: 2px;
    }
    .disabled-input {
      background: rgba(255, 255, 255, 0.02) !important;
      border-color: rgba(255, 255, 255, 0.05);
      color: var(--text-dark);
      cursor: not-allowed;
    }
    .is-invalid {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
    }
    .error-msg {
      color: #f87171;
      font-size: 0.75rem;
      margin-top: 4px;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--color-primary-light);
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-state {
      text-align: center;
      padding: 60px;
    }
    .mt-3 { margin-top: 16px; }
    .mt-4 { margin-top: 24px; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  profileData = signal<any>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  avatarPreview = signal<string>('');
  selectedAvatarBase64 = '';

  editModel = {
    fullName: '',
    email: ''
  };

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.isLoading.set(true);
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profileData.set(data);
        this.editModel = {
          fullName: data.fullName,
          email: data.email ?? ''
        };
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải thông tin cá nhân từ máy chủ.', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.show('Ảnh đại diện không được vượt quá 2MB.', 'info');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.avatarPreview.set(base64);
        this.selectedAvatarBase64 = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  handleImageError(event: any): void {
    if (!event.target.dataset.errorHandled) {
      event.target.dataset.errorHandled = 'true';
      event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23e2e8f0"><circle cx="50" cy="50" r="50"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="40" fill="%2394a3b8">?</text></svg>';
    }
  }

  saveProfile(): void {
    if (!this.editModel.fullName.trim()) {
      this.toastService.show('Họ và tên không được để trống.', 'info');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      fullName: this.editModel.fullName,
      email: this.editModel.email || null,
      avatarBase64: this.selectedAvatarBase64 || null
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.profileData.set(res);
        this.avatarPreview.set('');
        this.selectedAvatarBase64 = '';
        
        // Update user session so the header updates instantly
        this.authService.updateSessionProfile(res.fullName, res.email);
        
        this.toastService.show('Cập nhật hồ sơ cá nhân thành công!', 'success');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.show(err.error || 'Có lỗi xảy ra khi lưu thay đổi.', 'error');
      }
    });
  }

  cancelEdit(): void {
    const data = this.profileData();
    if (data) {
      this.editModel = {
        fullName: data.fullName,
        email: data.email ?? ''
      };
      this.avatarPreview.set('');
      this.selectedAvatarBase64 = '';
    }
  }
}
