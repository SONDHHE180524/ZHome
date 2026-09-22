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
    <div class="profile-page-wrapper animate-fade-in">
      
      <!-- Top Cover Hero Banner -->
      <div class="profile-hero-card">
        <div class="hero-content">
          <div class="avatar-container">
            <div class="avatar-ring">
              <img 
                [src]="avatarPreview() || getImageUrl(profileData()?.avatarUrl) || 'assets/default-avatar.png'" 
                (error)="handleImageError($event)"
                alt="Avatar" 
                class="user-avatar-img" />
              <label for="avatarInput" class="avatar-upload-btn" title="Đổi ảnh đại diện">
                
              </label>
              <input 
                type="file" 
                id="avatarInput" 
                (change)="onFileSelected($event)" 
                accept="image/*" 
                style="display: none;" />
            </div>
          </div>

          <div class="hero-text-info">
            <div class="title-role-row">
              <h2>{{ profileData()?.fullName || 'Người dùng ZHome' }}</h2>
              <span class="role-badge" 
                    [class.badge-admin]="profileData()?.roleName === 'Administrator'"
                    [class.badge-landlord]="profileData()?.roleName === 'Landlord'"
                    [class.badge-tenant]="profileData()?.roleName === 'Tenant'">
                {{ getRoleTitle(profileData()?.roleName) }}
              </span>
              @if (profileData()?.verificationStatus === 'Verified') {
                <span class="verified-badge" title="Đã xác thực CCCD"> Đã xác minh</span>
              } @else {
                <span class="unverified-badge" title="Chưa xác minh CCCD"> Chưa xác thực</span>
              }
            </div>
            
            <div class="hero-sub-details">
              <span> {{ profileData()?.phone }}</span>
              <span>•</span>
              <span>️ {{ profileData()?.email || 'Chưa cập nhật email' }}</span>
              <span>•</span>
              <span> Tham gia: {{ (profileData()?.createdAt | date:'MM/yyyy') || 'Mới tham gia' }}</span>
            </div>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-box text-center py-5">
          <div class="spinner"></div>
          <p class="mt-2 text-muted">Đang tải thông tin hồ sơ cá nhân...</p>
        </div>
      } @else {
        <!-- Main Layout Grid -->
        <div class="profile-main-grid mt-4">
          
          <!-- Navigation Sidebar Card -->
          <div class="profile-sidebar-card">
            <div class="user-summary-box">
              <div class="summary-item">
                <span class="sum-label">ID Tài khoản:</span>
                <span class="sum-value font-mono">#{{ profileData()?.id }}</span>
              </div>
              <div class="summary-item">
                <span class="sum-label">Gói Dịch Vụ:</span>
                <span class="sum-value text-indigo font-bold">{{ profileData()?.subscriptionName || 'Gói Miễn Phí' }}</span>
              </div>
              <div class="summary-item">
                <span class="sum-label">Số CCCD / CMND:</span>
                <span class="sum-value">{{ profileData()?.cccdNumber || 'Chưa cập nhật' }}</span>
              </div>
            </div>

            <!-- Tab Buttons -->
            <div class="profile-nav-menu mt-3">
              <button class="nav-menu-btn" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
                 Thông tin cá nhân
              </button>
              <button class="nav-menu-btn" [class.active]="activeTab() === 'security'" (click)="activeTab.set('security')">
                 Đổi mật khẩu tài khoản
              </button>
              <button class="nav-menu-btn" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
                 Tổng quan & Quyền hạn
              </button>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="profile-content-card">
            
            <!-- TAB 1: EDIT PROFILE INFO -->
            @if (activeTab() === 'info') {
              <div class="tab-pane-container">
                <div class="pane-header">
                  <h3> Chỉnh Sửa Thông Tin Cá Nhân</h3>
                  <p class="text-muted text-sm">Cập nhật họ tên, địa chỉ email và thông tin định danh cá nhân của bạn</p>
                </div>
                <div class="divider my-3"></div>

                <form (ngSubmit)="saveProfile()" #profileForm="ngForm" class="profile-form-body">
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label for="fullName">Họ và tên <span class="required">*</span></label>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        [(ngModel)]="editModel.fullName" 
                        required 
                        #nameModel="ngModel"
                        class="form-control-light" 
                        [class.is-invalid]="nameModel.touched && nameModel.invalid"
                        placeholder="Nhập họ và tên đầy đủ" />
                      @if (nameModel.touched && nameModel.invalid) {
                        <div class="error-text">Họ và tên không được để trống.</div>
                      }
                    </div>

                    <div class="form-group">
                      <label for="email">Địa chỉ Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        [(ngModel)]="editModel.email" 
                        email
                        #emailModel="ngModel"
                        class="form-control-light" 
                        [class.is-invalid]="emailModel.touched && emailModel.invalid"
                        placeholder="example@gmail.com" />
                      @if (emailModel.touched && emailModel.invalid) {
                        <div class="error-text">Email không đúng định dạng.</div>
                      }
                    </div>

                    <div class="form-group">
                      <label for="phone">Số điện thoại đăng nhập (Không thể đổi)</label>
                      <input 
                        type="text" 
                        id="phone"
                        [value]="profileData()?.phone" 
                        disabled 
                        class="form-control-light disabled-bg" />
                    </div>

                    <div class="form-group">
                      <label for="cccdNumber">Số CCCD / CMND (Dùng làm hợp đồng)</label>
                      <input 
                        type="text" 
                        id="cccdNumber" 
                        name="cccdNumber" 
                        [(ngModel)]="editModel.cccdNumber" 
                        pattern="^(\\d{9}|\\d{12})$"
                        #cccdModel="ngModel"
                        class="form-control-light" 
                        placeholder="Nhập 12 số CCCD" />
                      @if (cccdModel.touched && cccdModel.invalid) {
                        <div class="error-text">Số CCCD phải gồm 9 hoặc 12 chữ số.</div>
                      }
                    </div>
                  </div>

                  <div class="form-actions-row mt-4">
                    <button 
                      type="button" 
                      (click)="cancelEdit()" 
                      class="btn btn-secondary-light" 
                      [disabled]="isSaving()">
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-primary-light" 
                      [disabled]="isSaving() || profileForm.invalid">
                      {{ isSaving() ? '⏳ Đang lưu...' : ' Lưu Thay Đổi' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- TAB 2: CHANGE PASSWORD -->
            @if (activeTab() === 'security') {
              <div class="tab-pane-container">
                <div class="pane-header">
                  <h3> Thay Đổi Mật Khẩu Tài Khoản</h3>
                  <p class="text-muted text-sm">Cập nhật mật khẩu thường xuyên để tăng cường tính an toàn cho tài khoản ZHome của bạn</p>
                </div>
                <div class="divider my-3"></div>

                <form (ngSubmit)="submitChangePassword()" #passwordForm="ngForm" class="password-form-body">
                  <div class="form-group mb-3">
                    <label for="oldPassword">Mật khẩu hiện tại <span class="required">*</span></label>
                    <input 
                      type="password" 
                      id="oldPassword" 
                      name="oldPassword" 
                      [(ngModel)]="passwordModel.oldPassword" 
                      required 
                      class="form-control-light max-w-450" 
                      placeholder="Nhập mật khẩu đang sử dụng" />
                  </div>

                  <div class="form-group mb-3">
                    <label for="newPassword">Mật khẩu mới <span class="required">*</span></label>
                    <input 
                      type="password" 
                      id="newPassword" 
                      name="newPassword" 
                      [(ngModel)]="passwordModel.newPassword" 
                      required 
                      minlength="6"
                      #newPassModel="ngModel"
                      class="form-control-light max-w-450" 
                      placeholder="Mật khẩu mới từ 6 ký tự trở lên" />
                    @if (newPassModel.touched && newPassModel.invalid) {
                      <div class="error-text">Mật khẩu mới phải có ít nhất 6 ký tự.</div>
                    }
                  </div>

                  <div class="form-group mb-4">
                    <label for="confirmPassword">Nhập lại mật khẩu mới <span class="required">*</span></label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      [(ngModel)]="passwordModel.confirmPassword" 
                      required 
                      class="form-control-light max-w-450" 
                      placeholder="Nhập lại mật khẩu mới để xác nhận" />
                    @if (passwordModel.confirmPassword && passwordModel.newPassword !== passwordModel.confirmPassword) {
                      <div class="error-text">Mật khẩu xác nhận không khớp với mật khẩu mới.</div>
                    }
                  </div>

                  <div class="form-actions-row">
                    <button 
                      type="submit" 
                      class="btn btn-primary-light" 
                      [disabled]="isChangingPassword() || passwordForm.invalid || passwordModel.newPassword !== passwordModel.confirmPassword">
                      {{ isChangingPassword() ? '⏳ Đang đổi mật khẩu...' : ' Cập Nhật Mật Khẩu Mới' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- TAB 3: OVERVIEW & PRIVILEGES -->
            @if (activeTab() === 'overview') {
              <div class="tab-pane-container">
                <div class="pane-header">
                  <h3> Tổng Quan Tài Khoản & Quyền Hạn</h3>
                  <p class="text-muted text-sm">Các tính năng và đặc quyền tài khoản của bạn trên nền tảng ZHome</p>
                </div>
                <div class="divider my-3"></div>

                <div class="privileges-cards-grid">
                  @if (profileData()?.roleName === 'Landlord') {
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Quản Lý Nhà Trọ & Phòng</h4>
                      <p>Thêm nhà trọ, quản lý sơ đồ phòng trọ, theo dõi danh sách khách thuê và trạng thái từng phòng.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Lập Hợp Đồng Cho Thuê</h4>
                      <p>Tạo hợp đồng thuê phòng, quản lý tiền đặt cọc, thực hiện Check-in / Check-out cho khách trọ.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Tính Tiền Điện Nước & Hóa Đơn</h4>
                      <p>Chốt chỉ số điện nước hàng tháng, tính tổng tiền hóa đơn tự động và gửi thông báo nhắc nợ.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Đăng Tin Tìm Khách Trọ</h4>
                      <p>Đăng bài quảng cáo phòng trọ tiếp cận hàng ngàn sinh viên và người đi làm đang tìm phòng.</p>
                    </div>
                  } @else if (profileData()?.roleName === 'Administrator') {
                    <div class="privilege-card">
                      <span class="priv-icon">️</span>
                      <h4>Quản Trị Hệ Thống</h4>
                      <p>Toàn quyền quản lý tài khoản người dùng, danh sách nhà trọ và cài đặt hệ thống ZHome.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon">️</span>
                      <h4>Duyệt Xác Thực CCCD</h4>
                      <p>Xác minh và kiểm duyệt thông tin nhận diện căn cước công dân của Chủ trọ và Khách thuê.</p>
                    </div>
                  } @else {
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Tìm Phòng Trọ Uy Tín</h4>
                      <p>Tìm kiếm và lọc phòng trọ giá tốt, xem hình ảnh thực tế và liên hệ trực tiếp với chủ trọ.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Ghép Bạn Ở Cùng (Match)</h4>
                      <p>Tạo hồ sơ tính cách, thói quen sinh hoạt và mức ngân sách để ghép bạn ở cùng phù hợp nhất.</p>
                    </div>
                    <div class="privilege-card">
                      <span class="priv-icon"></span>
                      <h4>Thanh Toán VietQR Tiện Lợi</h4>
                      <p>Quét mã QR PayOS thanh toán hóa đơn điện nước phòng trọ trực tiếp và nhanh chóng.</p>
                    </div>
                  }
                </div>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page-wrapper {
      padding: 10px 0 40px 0;
      max-width: 1050px;
      margin: 0 auto;
    }
    .profile-hero-card {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #38bdf8 100%);
      border-radius: 20px;
      padding: 30px;
      color: #ffffff;
      box-shadow: 0 10px 30px rgba(2, 132, 199, 0.25);
      position: relative;
      overflow: hidden;
    }
    .hero-content {
      display: flex;
      align-items: center;
      gap: 24px;
      position: relative;
      z-index: 2;
    }
    @media (max-width: 650px) {
      .hero-content {
        flex-direction: column;
        text-align: center;
      }
    }
    .avatar-ring {
      position: relative;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      padding: 4px;
      background: #ffffff;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    }
    .user-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: #f1f5f9;
    }
    .avatar-upload-btn {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: #0284c7;
      color: #fff;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px solid #ffffff;
      font-size: 0.95rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }
    .avatar-upload-btn:hover {
      transform: scale(1.1);
      background: #0369a1;
    }

    .hero-text-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .title-role-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .title-role-row h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
    }
    .role-badge {
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-admin { background: #ffe4e6; color: #be123c; }
    .badge-landlord { background: #fef3c7; color: #b45309; }
    .badge-tenant { background: #e0f2fe; color: #0369a1; }
    .verified-badge {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      backdrop-filter: blur(4px);
    }
    .unverified-badge {
      background: rgba(254, 243, 199, 0.3);
      color: #fef08a;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .hero-sub-details {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: #e0f2fe;
      flex-wrap: wrap;
    }

    /* Main Grid */
    .profile-main-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
    }
    @media (max-width: 800px) {
      .profile-main-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-sidebar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }
    .user-summary-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .sum-label {
      color: #64748b;
      font-weight: 600;
    }
    .sum-value {
      color: #0f172a;
      font-weight: 700;
    }
    .text-sky { color: #0284c7 !important; }

    .profile-nav-menu {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .nav-menu-btn {
      text-align: left;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .nav-menu-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .nav-menu-btn.active {
      background: #e0e7ff;
      color: #4338ca;
      border-color: #c7d2fe;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    }

    /* Content Area */
    .profile-content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    }
    .pane-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 600px) {
      .form-grid-2 { grid-template-columns: 1fr; }
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .required { color: #e11d48; }
    .form-control-light {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #0f172a;
      background: #ffffff;
      transition: all 0.2s ease;
    }
    .form-control-light:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .disabled-bg {
      background: #f1f5f9 !important;
      color: #64748b !important;
      cursor: not-allowed;
    }
    .max-w-450 { max-width: 450px; }
    .error-text {
      color: #e11d48;
      font-size: 0.78rem;
      margin-top: 4px;
      font-weight: 600;
    }

    .form-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-primary-light {
      background: #4338ca;
      color: #ffffff;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-primary-light:hover {
      background: #3730a3;
    }
    .btn-secondary-light {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      cursor: pointer;
    }

    /* Privileges Grid */
    .privileges-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 650px) {
      .privileges-cards-grid { grid-template-columns: 1fr; }
    }
    .privilege-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
    }
    .priv-icon {
      font-size: 1.8rem;
      display: inline-block;
      margin-bottom: 8px;
    }
    .privilege-card h4 {
      margin: 0 0 6px 0;
      font-size: 1rem;
      font-weight: 800;
      color: #1e1b4b;
    }
    .privilege-card p {
      margin: 0;
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.5;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #cbd5e1;
      border-top-color: #4338ca;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  profileData = signal<any>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isChangingPassword = signal(false);

  activeTab = signal<'info' | 'security' | 'overview'>('info');

  avatarPreview = signal<string>('');
  selectedAvatarBase64 = '';

  editModel = {
    fullName: '',
    email: '',
    cccdNumber: ''
  };

  passwordModel = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
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
          fullName: data.fullName || '',
          email: data.email || '',
          cccdNumber: data.cccdNumber || ''
        };
        this.authService.updateSessionProfile(data.fullName, data.email, data.avatarUrl);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải thông tin cá nhân từ máy chủ.', 'error');
      }
    });
  }

  getRoleTitle(roleName?: string): string {
    switch (roleName) {
      case 'Administrator': return '️ Admin Hệ Thống';
      case 'Landlord': return ' Chủ Trọ';
      case 'Tenant': return ' Khách Thuê Trọ';
      default: return roleName || 'Người dùng';
    }
  }

  getImageUrl(url?: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:5000${url}` : url;
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
      event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23e2e8f0"><circle cx="50" cy="50" r="50"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="40" fill="%2394a3b8"></text></svg>';
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
      cccdNumber: this.editModel.cccdNumber || null,
      avatarBase64: this.selectedAvatarBase64 || null
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.profileData.set(res);
        this.avatarPreview.set('');
        this.selectedAvatarBase64 = '';
        
        this.authService.updateSessionProfile(res.fullName, res.email, res.avatarUrl);
        this.toastService.show('Cập nhật hồ sơ cá nhân thành công!', 'success');
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Có lỗi xảy ra khi lưu.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  submitChangePassword(): void {
    if (!this.passwordModel.oldPassword) {
      this.toastService.show('Vui lòng nhập mật khẩu hiện tại.', 'info');
      return;
    }
    if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
      this.toastService.show('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    this.isChangingPassword.set(true);
    this.authService.changePassword({
      oldPassword: this.passwordModel.oldPassword,
      newPassword: this.passwordModel.newPassword
    }).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        this.passwordModel = { oldPassword: '', newPassword: '', confirmPassword: '' };
        this.toastService.show(res.message || 'Thay đổi mật khẩu thành công!', 'success');
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Mật khẩu cũ không chính xác.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  cancelEdit(): void {
    const data = this.profileData();
    if (data) {
      this.editModel = {
        fullName: data.fullName || '',
        email: data.email || '',
        cccdNumber: data.cccdNumber || ''
      };
      this.avatarPreview.set('');
      this.selectedAvatarBase64 = '';
    }
  }
}
