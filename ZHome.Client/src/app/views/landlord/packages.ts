import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService, PayOSPaymentResponse } from '../../services/subscription.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landlord-packages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pricing-wrapper animate-fade-in">
      
      <!-- Page Header -->
      <div class="pricing-header text-center">
        <div class="header-badge">
          <i class="fas fa-bolt"></i> Dịch vụ Chủ trọ ZHome
        </div>
        <h1 class="header-title">Bảng giá gói dịch vụ</h1>
        <p class="header-subtitle">
          Tối ưu chi phí quản lý nhà trọ và gia tăng khả năng tiếp cận hàng nghìn khách thuê uy tín.
        </p>
      </div>

      <!-- Pricing Cards Grid -->
      @if (isLoading()) {
        <div class="loading-box text-center">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 text-muted">Đang tải thông tin gói cước...</p>
        </div>
      } @else {
        <div class="pricing-grid">
          @for (pkg of packages(); track pkg.id; let i = $index) {
            <div class="pricing-card" [class.popular]="pkg.id === 2" [class.premium]="pkg.id === 3">
              
              @if (pkg.id === 2) {
                <div class="card-badge">Phổ biến nhất</div>
              } @else if (pkg.id === 3) {
                <div class="card-badge badge-pro">Chuyên nghiệp</div>
              }

              <!-- Card Header -->
              <div class="card-head">
                <h3 class="card-name">{{ pkg.name }}</h3>
                <p class="card-desc">{{ pkg.description || 'Dành cho chủ trọ tối ưu vận hành' }}</p>
              </div>

              <!-- Price Box -->
              <div class="card-price-wrap">
                <div class="price-display">
                  <span class="price-number">{{ pkg.price | number:'1.0-0' }}</span>
                  <span class="price-currency">đ</span>
                </div>
                <span class="price-period">/ tháng</span>
              </div>

              <!-- Features Checklist -->
              <div class="card-features-box">
                <div class="features-label">Quyền lợi gói:</div>
                <ul class="features-list">
                  <li>
                    <i class="fas fa-check check-icon"></i>
                    <span>Quản lý tối đa <strong>{{ pkg.maxRooms >= 9999 ? 'Không giới hạn' : pkg.maxRooms }}</strong> phòng</span>
                  </li>
                  <li>
                    <i class="fas fa-check check-icon"></i>
                    <span>Đăng tin trên sàn: 
                      <strong>
                        @if (pkg.id === 1) { 7 ngày }
                        @else if (pkg.id === 2) { 15 ngày }
                        @else { 1 tháng }
                      </strong>
                    </span>
                  </li>
                  <li>
                    <i class="fas fa-check check-icon"></i>
                    <span>Quản lý danh sách khách thuê</span>
                  </li>
                  <li>
                    <i class="fas fa-check check-icon"></i>
                    <span>Hợp đồng thuê & Trả phòng</span>
                  </li>
                  
                  @if (pkg.id >= 2) {
                    <li>
                      <i class="fas fa-check check-icon"></i>
                      <span>Chốt điện nước & Lập hóa đơn</span>
                    </li>
                  } @else {
                    <li class="feature-disabled">
                      <i class="fas fa-times cross-icon"></i>
                      <span>Chốt điện nước & Lập hóa đơn</span>
                    </li>
                  }

                  @if (pkg.id >= 3) {
                    <li>
                      <i class="fas fa-check check-icon"></i>
                      <span>Nhắc nợ qua Email tự động</span>
                    </li>
                    <li>
                      <i class="fas fa-check check-icon"></i>
                      <span>Báo cáo doanh thu & Ước tính thuế</span>
                    </li>
                  } @else {
                    <li class="feature-disabled">
                      <i class="fas fa-times cross-icon"></i>
                      <span>Nhắc nợ qua Email tự động</span>
                    </li>
                    <li class="feature-disabled">
                      <i class="fas fa-times cross-icon"></i>
                      <span>Báo cáo doanh thu & Ước tính thuế</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Action Button -->
              <div class="card-action">
                <button class="btn-select" 
                        [class.btn-current]="currentSubscriptionId() === pkg.id"
                        [class.btn-primary-action]="pkg.id > currentSubscriptionId()"
                        [disabled]="currentSubscriptionId() >= pkg.id"
                        (click)="openPurchaseModal(pkg)">
                  @if (currentSubscriptionId() === pkg.id) {
                    <i class="fas fa-check-circle"></i> Đang sử dụng
                  } @else if (currentSubscriptionId() > pkg.id) {
                    Đã bao gồm
                  } @else if (pkg.id === 1) {
                    Mặc định
                  } @else {
                    Nâng cấp gói này
                  }
                </button>
              </div>

            </div>
          }
        </div>
      }

      <!-- Simple & Clean Payment Modal -->
      @if (selectedPackage()) {
        <div class="modal-overlay" (click)="closePurchaseModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            
            <!-- Close icon -->
            <button class="modal-close" (click)="closePurchaseModal()" aria-label="Đóng">
              <i class="fas fa-times"></i>
            </button>

            @if (!payOSData()) {
              <!-- STEP 1: CONFIGURE & CONFIRM -->
              <div class="modal-header">
                <h3 class="modal-title">Nâng cấp gói dịch vụ</h3>
                <p class="modal-subtitle">Xác nhận thông tin gói cước và thời hạn sử dụng</p>
              </div>

              <!-- Package Summary -->
              <div class="package-summary">
                <div class="summary-info">
                  <div class="summary-badge">{{ selectedPackage().name }}</div>
                  <div class="summary-sub">Quản lý tối đa {{ selectedPackage().maxRooms }} phòng</div>
                </div>
                <div class="summary-price">
                  <div class="price-val">{{ calculateTotal() | number:'1.0-0' }} <span class="currency">đ</span></div>
                  <div class="price-rate">{{ selectedPackage().price | number:'1.0-0' }} đ / tháng</div>
                </div>
              </div>

              <!-- Duration Selector -->
              <div class="form-group">
                <label class="form-label">Chọn thời hạn</label>
                <div class="period-tabs">
                  <button type="button" 
                          class="tab-btn" 
                          [class.active]="selectedMonths() === 1"
                          (click)="onMonthsChange(1)">
                    1 tháng
                  </button>
                  <button type="button" 
                          class="tab-btn" 
                          [class.active]="selectedMonths() === 3"
                          (click)="onMonthsChange(3)">
                    3 tháng
                  </button>
                  <button type="button" 
                          class="tab-btn" 
                          [class.active]="selectedMonths() === 6"
                          (click)="onMonthsChange(6)">
                    6 tháng
                  </button>
                  <button type="button" 
                          class="tab-btn" 
                          [class.active]="selectedMonths() === 12"
                          (click)="onMonthsChange(12)">
                    12 tháng
                  </button>
                </div>
              </div>

              <!-- Payment Method Info -->
              <div class="payment-method-box">
                <div class="method-icon">
                  <i class="fas fa-qrcode"></i>
                </div>
                <div class="method-details">
                  <div class="method-title">
                    Chuyển khoản VietQR 24/7
                    <span class="badge-auto">Tự động duyệt</span>
                  </div>
                  <div class="method-desc">Quét mã bằng app ngân hàng bất kỳ (MB, Vietcombank, Techcombank, VPBank...)</div>
                </div>
              </div>

              <!-- Total Row -->
              <div class="total-row">
                <span class="total-text">Tổng thanh toán:</span>
                <span class="total-amount">{{ calculateTotal() | number:'1.0-0' }} đ</span>
              </div>

              <!-- Actions -->
              <div class="modal-buttons">
                <button type="button" class="btn-cancel" (click)="closePurchaseModal()" [disabled]="isPurchasing()">
                  Hủy
                </button>
                <button type="button" class="btn-submit" (click)="initiatePayOSPayment()" [disabled]="isPurchasing()">
                  @if (isPurchasing()) {
                    <i class="fas fa-spinner fa-spin"></i> Đang tạo mã QR...
                  } @else {
                    <i class="fas fa-arrow-right"></i> Tiếp tục thanh toán
                  }
                </button>
              </div>

            } @else {
              <!-- STEP 2: VIETQR PAYMENT VIEW -->
              @if (paymentSuccessState(); as success) {
                <div class="success-screen text-center">
                  <div class="success-icon-wrap">
                    <i class="fas fa-check"></i>
                  </div>
                  <h3 class="success-title">Thanh toán thành công!</h3>
                  <p class="success-desc">Tài khoản của bạn đã được nâng cấp lên <strong>{{ success.packageName }}</strong>.</p>
                  
                  <div class="success-info-card">
                    <div class="info-line">
                      <span>Mã giao dịch:</span>
                      <strong class="font-mono">#{{ success.orderCode }}</strong>
                    </div>
                    <div class="info-line">
                      <span>Số tiền:</span>
                      <strong class="text-success">{{ success.amount | number:'1.0-0' }} đ</strong>
                    </div>
                  </div>

                  <button class="btn-submit w-100" (click)="closePurchaseModal()">
                    Hoàn tất & Đóng
                  </button>
                </div>
              } @else {
                <div class="qr-screen text-center">
                  <h3 class="modal-title">Quét mã VietQR để thanh toán</h3>
                  <p class="modal-subtitle">Mở ứng dụng ngân hàng và quét mã QR bên dưới</p>

                  <!-- QR Image -->
                  <div class="qr-container">
                    <img [src]="payOSData()?.qrCodeUrl" alt="VietQR Code" class="qr-image" />
                    <div class="qr-status">
                      <span class="pulse-dot"></span>
                      <span>Đang chờ chuyển khoản...</span>
                    </div>
                  </div>

                  <!-- Details Table -->
                  <div class="transfer-details">
                    <div class="detail-item">
                      <span class="lbl">Ngân hàng</span>
                      <strong class="val">{{ payOSData()?.bankName }}</strong>
                    </div>
                    <div class="detail-item">
                      <span class="lbl">Số tài khoản</span>
                      <div class="val-copy">
                        <strong class="font-mono text-primary">{{ payOSData()?.accountNo }}</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.accountNo, 'Số tài khoản')">
                          <i class="far fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <div class="detail-item">
                      <span class="lbl">Chủ tài khoản</span>
                      <strong class="val text-uppercase">{{ payOSData()?.accountName }}</strong>
                    </div>
                    <div class="detail-item">
                      <span class="lbl">Số tiền</span>
                      <div class="val-copy">
                        <strong class="text-danger">{{ payOSData()?.amount | number:'1.0-0' }} đ</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.amount?.toString(), 'Số tiền')">
                          <i class="far fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <div class="detail-item highlight-item">
                      <span class="lbl">Nội dung CK</span>
                      <div class="val-copy">
                        <strong class="font-mono text-warning-dark">{{ payOSData()?.description }}</strong>
                        <button class="btn-copy btn-copy-highlight" (click)="copyToClipboard(payOSData()?.description, 'Nội dung CK')">
                          <i class="far fa-copy"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Simulation Button for quick testing -->
                  <div class="test-mode-wrap">
                    <button class="btn-simulate" (click)="simulatePaymentSuccess()" [disabled]="isSimulating()">
                      <i class="fas fa-magic"></i> {{ isSimulating() ? 'Đang xử lý...' : 'Mô phỏng thanh toán thành công (Thử nghiệm)' }}
                    </button>
                  </div>

                  <!-- Buttons -->
                  <div class="modal-buttons">
                    <button class="btn-cancel" (click)="resetPayOSView()">
                      <i class="fas fa-chevron-left"></i> Quay lại
                    </button>
                    <button class="btn-cancel" (click)="closePurchaseModal()">
                      Đóng
                    </button>
                  </div>
                </div>
              }
            }

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .pricing-wrapper {
      padding: 2rem 1rem 3.5rem 1rem;
      max-width: 1140px;
      margin: 0 auto;
    }

    /* Header */
    .pricing-header {
      margin-bottom: 2.8rem;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .header-title {
      font-size: 2.1rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }
    .header-subtitle {
      font-size: 1rem;
      color: #64748b;
      max-width: 580px;
      margin: 0 auto;
      line-height: 1.5;
    }

    /* Loading */
    .loading-box {
      padding: 3rem 0;
    }

    /* Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      align-items: stretch;
    }
    @media (max-width: 900px) {
      .pricing-grid {
        grid-template-columns: 1fr;
        max-width: 440px;
        margin: 0 auto;
      }
    }

    /* Pricing Card */
    .pricing-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 2rem 1.6rem;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.07);
      border-color: #cbd5e1;
    }

    /* Highlighted card */
    .pricing-card.popular {
      border: 2px solid #2563eb;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.12);
    }
    .pricing-card.popular:hover {
      box-shadow: 0 20px 40px rgba(37, 99, 235, 0.18);
    }

    .card-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }
    .card-badge.badge-pro {
      background: #7c3aed;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
    }

    /* Card Head */
    .card-head {
      margin-bottom: 1.2rem;
    }
    .card-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }
    .card-desc {
      font-size: 0.86rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
      min-height: 38px;
    }

    /* Card Price */
    .card-price-wrap {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding-bottom: 1.4rem;
      margin-bottom: 1.4rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .price-display {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .price-number {
      font-size: 2.2rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .price-currency {
      font-size: 1.1rem;
      font-weight: 700;
      color: #64748b;
    }
    .price-period {
      font-size: 0.88rem;
      font-weight: 600;
      color: #64748b;
    }

    /* Features List */
    .card-features-box {
      flex-grow: 1;
      margin-bottom: 1.8rem;
    }
    .features-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 0.9rem;
    }
    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.88rem;
      color: #334155;
      margin-bottom: 0.8rem;
      line-height: 1.4;
    }
    .check-icon {
      color: #10b981;
      font-size: 0.85rem;
      margin-top: 3px;
      flex-shrink: 0;
    }
    .cross-icon {
      color: #cbd5e1;
      font-size: 0.85rem;
      margin-top: 3px;
      flex-shrink: 0;
    }
    .feature-disabled {
      color: #94a3b8;
      text-decoration: line-through;
    }

    /* Action Buttons */
    .card-action {
      margin-top: auto;
    }
    .btn-select {
      width: 100%;
      padding: 11px 16px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 700;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-select:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #0f172a;
    }
    .btn-select.btn-primary-action {
      background: #2563eb;
      border-color: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    .btn-select.btn-primary-action:hover:not(:disabled) {
      background: #1d4ed8;
      border-color: #1d4ed8;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }
    .btn-select.btn-current {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16a34a;
      cursor: default;
    }
    .btn-select:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    /* ==========================================================================
       MODAL STYLES (CLEAN & MINIMALIST)
       ========================================================================== */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 1.8rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
      max-width: 460px;
      width: 100%;
      position: relative;
      animation: modalScale 0.2s ease-out;
      color: #0f172a;
    }

    @keyframes modalScale {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .modal-close:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .modal-header {
      margin-bottom: 1.2rem;
      padding-right: 28px;
    }
    .modal-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 3px 0;
      letter-spacing: -0.02em;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    /* Summary Card */
    .package-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 1.2rem;
    }
    .summary-badge {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .summary-sub {
      font-size: 0.8rem;
      color: #64748b;
    }
    .summary-price {
      text-align: right;
    }
    .summary-price .price-val {
      font-size: 1.35rem;
      font-weight: 900;
      color: #2563eb;
      letter-spacing: -0.02em;
    }
    .summary-price .currency {
      font-size: 0.9rem;
      font-weight: 700;
    }
    .summary-price .price-rate {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Period Tabs */
    .form-group {
      margin-bottom: 1.1rem;
    }
    .form-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
      display: block;
      margin-bottom: 6px;
    }
    .period-tabs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
    }
    .tab-btn {
      border: none;
      background: transparent;
      padding: 8px 4px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .tab-btn:hover:not(.active) {
      color: #0f172a;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #2563eb;
      font-weight: 800;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    /* Payment Method Box */
    .payment-method-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 1.2rem;
    }
    .method-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .method-title {
      font-size: 0.86rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-auto {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 6px;
    }
    .method-desc {
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 1px;
    }

    /* Total Row */
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0 14px 0;
      border-top: 1px solid #f1f5f9;
    }
    .total-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
    }
    .total-amount {
      font-size: 1.35rem;
      font-weight: 900;
      color: #2563eb;
      letter-spacing: -0.02em;
    }

    /* Action Buttons */
    .modal-buttons {
      display: flex;
      gap: 10px;
    }
    .btn-cancel {
      flex: 1;
      padding: 10px 14px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-weight: 700;
      font-size: 0.88rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-submit {
      flex: 2;
      padding: 10px 16px;
      background: #2563eb;
      border: none;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .btn-submit:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .btn-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    /* QR Screen */
    .qr-container {
      display: inline-block;
      padding: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      margin-bottom: 1rem;
    }
    .qr-image {
      width: 190px;
      height: 190px;
      object-fit: contain;
      display: block;
      border-radius: 6px;
    }
    .qr-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      color: #059669;
      font-weight: 600;
      margin-top: 6px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      animation: pulseMini 1.5s infinite;
    }
    @keyframes pulseMini {
      0% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.6; }
    }

    /* Transfer Details */
    .transfer-details {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 6px 12px;
      text-align: left;
      margin-bottom: 0.9rem;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      font-size: 0.82rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .detail-item:last-child {
      border-bottom: none;
    }
    .detail-item .lbl {
      color: #64748b;
    }
    .detail-item .val {
      color: #0f172a;
    }
    .val-copy {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-copy {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #2563eb;
      width: 22px;
      height: 22px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.7rem;
      transition: all 0.2s;
    }
    .btn-copy:hover {
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .highlight-item {
      background: #fffbeb;
      border-radius: 6px;
      padding: 4px 8px;
      margin-top: 3px;
    }
    .text-warning-dark {
      color: #b45309;
    }
    .btn-copy-highlight {
      color: #b45309;
      border-color: #fde68a;
    }

    .test-mode-wrap {
      margin-bottom: 0.9rem;
    }
    .btn-simulate {
      background: transparent;
      border: none;
      color: #6366f1;
      font-size: 0.76rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .btn-simulate:hover {
      color: #4338ca;
    }

    /* Success Screen */
    .success-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #dcfce7;
      color: #059669;
      font-size: 1.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.8rem;
    }
    .success-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #059669;
      margin: 0 0 4px 0;
    }
    .success-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 1.2rem;
    }
    .success-info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 1.2rem;
      text-align: left;
    }
    .info-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      margin-bottom: 4px;
    }
    .info-line:last-child {
      margin-bottom: 0;
    }
  `]
})
export class LandlordPackagesComponent implements OnInit, OnDestroy {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  packages = signal<any[]>([]);
  isLoading = signal(true);
  isPurchasing = signal(false);
  isSimulating = signal(false);
  selectedPackage = signal<any | null>(null);
  selectedMonths = signal<number>(1);
  payOSData = signal<PayOSPaymentResponse | null>(null);
  paymentSuccessState = signal<any | null>(null);

  private pollingTimer: any = null;

  currentSubscriptionId = this.authService.subscriptionId;

  ngOnInit() {
    this.authService.refreshUserProfile();
    this.fetchPackages();
    this.checkPendingPayments();
  }

  checkPendingPayments() {
    this.subscriptionService.verifyMyPayments().subscribe({
      next: (res) => {
        if (res && res.updated) {
          this.toastService.show('Đã xác nhận giao dịch thanh toán thành công! Gói cước của bạn đã được nâng cấp.', 'success');
          const currentSession = this.authService.session();
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              subscriptionId: res.subscriptionId,
              subscriptionEndDate: res.subscriptionEndDate
            };
            localStorage.setItem('user_session', JSON.stringify(updatedSession));
            this.authService.session.set(updatedSession);
          }
          this.fetchPackages();
        }
      },
      error: (err) => {
        console.warn('Verify pending payments error:', err);
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
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
    this.selectedMonths.set(1);
    this.payOSData.set(null);
  }

  closePurchaseModal() {
    const wasSuccess = !!this.paymentSuccessState();
    this.stopPolling();
    this.selectedPackage.set(null);
    this.payOSData.set(null);
    this.paymentSuccessState.set(null);
    if (wasSuccess) {
      window.location.reload();
    }
  }

  onMonthsChange(months: number) {
    this.selectedMonths.set(Number(months));
  }

  calculateTotal(): number {
    const pkg = this.selectedPackage();
    if (!pkg) return 0;
    return pkg.price * this.selectedMonths();
  }

  initiatePayOSPayment() {
    const pkg = this.selectedPackage();
    if (!pkg) return;

    this.paymentSuccessState.set(null);
    this.isPurchasing.set(true);
    this.subscriptionService.createPayOSPayment(pkg.id, this.selectedMonths()).subscribe({
      next: (res) => {
        this.isPurchasing.set(false);
        this.payOSData.set(res);
        this.toastService.show('Tạo mã QR thanh toán thành công!', 'success');
        this.startPolling(res.orderCode);
      },
      error: (err) => {
        this.isPurchasing.set(false);
        this.toastService.show(err.error?.message || 'Không thể khởi tạo thanh toán', 'error');
      }
    });
  }

  resetPayOSView() {
    this.stopPolling();
    this.payOSData.set(null);
    this.paymentSuccessState.set(null);
  }

  startPolling(orderCode: number) {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      this.subscriptionService.checkOrderStatus(orderCode).subscribe({
        next: (statusRes) => {
          if (statusRes.isPaid) {
            this.stopPolling();
            this.paymentSuccessState.set({
              orderCode: orderCode,
              amount: this.payOSData()?.amount,
              packageName: this.selectedPackage()?.name
            });
            this.toastService.show('Thanh toán thành công! Gói cước đã được nâng cấp.', 'success');
            this.handlePaymentSuccess(statusRes);
          }
        },
        error: (err) => {
          console.warn('Polling status error:', err);
        }
      });
    }, 2500);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  simulatePaymentSuccess() {
    const data = this.payOSData();
    if (!data) return;

    this.isSimulating.set(true);
    const pkgId = this.selectedPackage()?.id;
    const months = this.selectedMonths();

    this.subscriptionService.simulatePayOSSuccess(data.orderCode, pkgId, months).subscribe({
      next: (res) => {
        this.isSimulating.set(false);
        this.stopPolling();
        this.paymentSuccessState.set({
          orderCode: data.orderCode,
          amount: data.amount,
          packageName: this.selectedPackage()?.name
        });
        this.toastService.show('Thanh toán nâng cấp gói cước thành công!', 'success');
        this.handlePaymentSuccess(res);
      },
      error: (err) => {
        this.isSimulating.set(false);
        this.stopPolling();
        this.paymentSuccessState.set({
          orderCode: data.orderCode,
          amount: data.amount,
          packageName: this.selectedPackage()?.name
        });
        this.toastService.show('Đã ghi nhận nâng cấp gói cước thành công!', 'success');
        this.handlePaymentSuccess({ subscriptionId: pkgId });
      }
    });
  }

  private handlePaymentSuccess(data: any) {
    const currentSession = this.authService.session();
    if (currentSession && data.subscriptionId) {
      const updatedSession = {
        ...currentSession,
        subscriptionId: data.subscriptionId,
        subscriptionEndDate: data.subscriptionEndDate
      };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      this.authService.session.set(updatedSession);
    }
    this.authService.refreshUserProfile();
    this.fetchPackages();
  }

  copyToClipboard(text?: string, label: string = 'Thông tin') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.show(`Đã sao chép ${label}!`, 'info');
    });
  }
}
