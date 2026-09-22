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
    <div class="packages-container animate-fade-in">
      <div class="header-row text-center mb-4">
        <div class="badge-payos mb-2">
          <i class="fas fa-qrcode"></i> Thanh toán an toàn & tự động qua SePay VietQR
        </div>
        <h1 class="main-title">GÓI COMBO - NÂNG CẤP DỊCH VỤ</h1>
        <p class="subtitle text-muted">Giải pháp xác thực uy tín và quảng bá hiệu quả dành cho chủ trọ</p>
      </div>

      @if (isLoading()) {
        <div class="text-center mt-5">
          <div class="spinner"></div>
          <p>Đang tải danh sách gói cước...</p>
        </div>
      } @else {
        <div class="pricing-cards">
          @for (pkg of packages(); track pkg.id; let i = $index) {
            <div [class]="'pricing-card card-theme-' + ((i % 3) + 1)">
              
              <!-- Card Top Header Row -->
              <div class="card-top-bar">
                <div class="pkg-brand">
                  <span class="theme-icon">
                    @if (i === 0 || pkg.id === 1) { }
                    @else if (i === 1 || pkg.id === 2) { }
                    @else { }
                  </span>
                  <h2 class="pkg-title">{{ pkg.name }}</h2>
                </div>
                <div class="blue-check-badge" title="Dịch vụ xác thực ZHome">
                  <i class="fas fa-check"></i>
                </div>
              </div>

              <!-- Price Box -->
              <div class="pkg-price-box">
                <div class="amount-wrap">
                  <span class="amount">{{ pkg.price | number:'1.0-0' }}</span>
                  <span class="currency">đ</span>
                </div>
                <div class="period">/tháng</div>
              </div>

              <!-- Description -->
              <p class="pkg-desc">{{ pkg.description }}</p>

              <!-- Features List -->
              <ul class="pkg-features">
                <li><i class="fas fa-check"></i> Quản lý tối đa <strong>{{ pkg.maxRooms >= 9999 ? 'Không giới hạn' : pkg.maxRooms }}</strong> phòng</li>
                <li><i class="fas fa-check"></i> Đăng tin trên sàn:
                  <strong>
                    @if (pkg.id === 1) { 7 ngày }
                    @else if (pkg.id === 2) { 15 ngày }
                    @else { 1 tháng }
                  </strong>
                </li>
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
              
              <!-- Action Button -->
              <button class="btn btn-action w-100" 
                      [disabled]="currentSubscriptionId() >= pkg.id"
                      (click)="openPurchaseModal(pkg)">
                {{ currentSubscriptionId() === pkg.id ? 'Đang sử dụng' : (currentSubscriptionId() > pkg.id ? 'Đã bao gồm' : (pkg.id === 1 ? 'Mặc định' : 'Nâng cấp ngay')) }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Purchase / PayOS Modal -->
      @if (selectedPackage()) {
        <div class="modal-backdrop" (click)="closePurchaseModal()">
          <div class="glass-panel modal-card max-w-550" (click)="$event.stopPropagation()">
            
            @if (!payOSData()) {
              <!-- Step 1: Confirmation & Options -->
              <h2 class="mb-3 text-center">Xác nhận thanh toán</h2>
              <div class="purchase-details mb-4">
                <div class="package-summary-box mb-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 class="m-0">{{ selectedPackage().name }}</h3>
                      <span class="text-muted text-sm">Gói dịch vụ dành cho chủ trọ</span>
                    </div>
                    <div class="price-tag">
                      <strong>{{ calculateTotal() | number:'1.0-0' }}đ</strong>
                    </div>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Thời hạn đăng ký:</label>
                  <select class="form-select" [ngModel]="selectedMonths()" (ngModelChange)="onMonthsChange($event)">
                    <option [value]="1">1 tháng ({{ selectedPackage().price | number:'1.0-0' }}đ)</option>
                    <option [value]="3">3 tháng ({{ selectedPackage().price * 3 | number:'1.0-0' }}đ)</option>
                    <option [value]="6">6 tháng ({{ selectedPackage().price * 6 | number:'1.0-0' }}đ)</option>
                    <option [value]="12">12 tháng ({{ selectedPackage().price * 12 | number:'1.0-0' }}đ)</option>
                  </select>
                </div>

                <div class="payment-method-selector mb-3">
                  <label class="form-label">Phương thức thanh toán:</label>
                  <div class="method-card active">
                    <div class="method-icon">
                      <i class="fas fa-qrcode text-success"></i>
                    </div>
                    <div class="method-info">
                      <strong>Thanh toán QR qua SePay / VietQR</strong>
                      <p class="text-xs text-muted mb-0">Quét mã bằng app Ngân hàng (MB, VCB, Techcombank,...)</p>
                    </div>
                    <span class="badge-recommended">Khuyên dùng</span>
                  </div>
                </div>

                <p class="text-xs text-muted text-center">
                  <i class="fas fa-shield-alt text-primary"></i> Giao dịch bảo mật qua SePay. Kích hoạt tự động ngay sau khi chuyển khoản thành công.
                </p>
              </div>

              <div class="modal-actions justify-content-center gap-2">
                <button class="btn btn-secondary" (click)="closePurchaseModal()" [disabled]="isPurchasing()">Hủy</button>
                <button class="btn btn-primary btn-payos" (click)="initiatePayOSPayment()" [disabled]="isPurchasing()">
                  @if (isPurchasing()) {
                    <i class="fas fa-spinner fa-spin"></i> Đang tạo mã QR...
                  } @else {
                    <i class="fas fa-qrcode"></i> Tạo mã QR SePay Thanh toán
                  }
                </button>
              </div>
            } @else {
              <!-- Step 2: SePay QR Display View -->
              @if (paymentSuccessState(); as success) {
                <!-- SUCCESS TRANSFORMATION VIEW -->
                <div class="payment-success-card text-center p-4">
                  <div class="success-icon-badge mb-3" style="font-size: 3.5rem;">🎉</div>
                  <h3 style="color: #15803d !important; font-weight: 800; margin-bottom: 6px;">THANH TOÁN THÀNH CÔNG!</h3>
                  <p style="color: #475569 !important; font-size: 0.9rem;">Gói dịch vụ của bạn đã được nâng cấp thành công trên hệ thống ZHome.</p>
                  
                  <div class="success-details-box my-3 p-3 text-start" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Mã đơn giao dịch:</span>
                      <strong style="color: #15803d; font-family: monospace;">#{{ success.orderCode }}</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Số tiền thanh toán:</span>
                      <strong style="color: #15803d; font-size: 1.1rem;">{{ success.amount | number:'1.0-0' }}đ</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Trạng thái Gói:</span>
                      <span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 0.78rem; font-weight: 800; padding: 4px 10px; border-radius: 20px;">NÂNG CẤP THÀNH CÔNG</span>
                    </div>
                  </div>

                  <button class="btn btn-success btn-lg w-100 font-bold cursor-pointer mt-3" style="background: #16a34a !important; color: #ffffff !important; border: none; border-radius: 10px; padding: 12px;" (click)="closePurchaseModal()">Hoàn tất & Đóng</button>
                </div>
              } @else {
                <div class="payos-qr-container text-center">
                  <div class="payos-header mb-3">
                    <span class="payos-badge"><i class="fas fa-bolt"></i> Cổng thanh toán SePay VietQR</span>
                    <h3 class="mt-2 mb-1 text-dark">Quét mã QR để thanh toán</h3>
                    <p class="text-muted text-sm mb-0">Sử dụng Ứng dụng Ngân hàng hoặc Ví điện tử bất kỳ</p>
                  </div>

                  <div class="qr-display-box my-3">
                    <div class="qr-frame">
                      <img [src]="payOSData()?.qrCodeUrl" alt="SePay VietQR Code" class="qr-code-img">
                    </div>
                    <div class="polling-status mt-2">
                      <span class="spinner-pulse"></span>
                      <span class="text-sm font-medium">Đang chờ bạn quét mã & chuyển khoản...</span>
                    </div>
                  </div>

                  <div class="transfer-details-box text-start mb-3">
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Ngân hàng thụ hưởng:</span>
                      <strong class="text-sm text-dark">{{ payOSData()?.bankName }}</strong>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Số tài khoản:</span>
                      <div class="copy-group">
                        <strong class="text-primary text-sm me-2">{{ payOSData()?.accountNo }}</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.accountNo, 'Số tài khoản')">
                          <i class="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Tên chủ tài khoản:</span>
                      <strong class="text-sm text-uppercase text-dark">{{ payOSData()?.accountName }}</strong>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Số tiền:</span>
                      <div class="copy-group">
                        <strong class="text-danger font-bold text-base me-2">{{ payOSData()?.amount | number:'1.0-0' }}đ</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.amount?.toString(), 'Số tiền')">
                          <i class="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center highlight-content">
                      <span class="text-muted text-sm">Nội dung chuyển khoản:</span>
                      <div class="copy-group">
                        <strong class="text-warning-dark text-sm me-2 font-mono">{{ payOSData()?.description }}</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.description, 'Nội dung chuyển khoản')">
                          <i class="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="modal-actions d-flex gap-2 justify-content-center mt-3">
                    <button class="btn btn-outline" (click)="resetPayOSView()">Quay lại</button>
                    <button class="btn btn-secondary px-4" (click)="closePurchaseModal()">Đóng cửa sổ</button>
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
    .packages-container {
      padding: 1.5rem 1rem;
      max-width: 1240px;
      margin: 0 auto;
    }
    .badge-payos {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .main-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1e293b;
      margin-top: 8px;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 0.95rem;
    }
    
    /* PRICING CARDS ROW - 3 CARDS SIDE BY SIDE */
    .pricing-cards {
      display: flex;
      flex-direction: row;
      gap: 1.5rem;
      justify-content: center;
      align-items: stretch;
      margin-top: 2rem;
      width: 100%;
    }
    @media (max-width: 900px) {
      .pricing-cards {
        flex-direction: column;
      }
    }
    .pricing-card {
      flex: 1 1 0;
      min-width: 0;
      border-radius: 20px;
      padding: 2.2rem 1.6rem;
      position: relative;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    }
    .pricing-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }

    /* CARD THEME 1: LIGHT MINT GREEN */
    .pricing-card.card-theme-1 {
      background: linear-gradient(180deg, #dcfce7 0%, #edfbf2 100%);
      border: 1.5px solid #86efac;
    }
    .pricing-card.card-theme-1 .pkg-title { color: #14532d; }
    .pricing-card.card-theme-1 .btn-action {
      background: #16a34a;
      color: #ffffff;
      border: none;
    }
    .pricing-card.card-theme-1 .btn-action:hover:not(:disabled) {
      background: #15803d;
      box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
    }

    /* CARD THEME 2: LIGHT SOFT BLUE */
    .pricing-card.card-theme-2 {
      background: linear-gradient(180deg, #e0f2fe 0%, #f0f7ff 100%);
      border: 1.5px solid #7dd3fc;
    }
    .pricing-card.card-theme-2 .pkg-title { color: #0c4a6e; }
    .pricing-card.card-theme-2 .btn-action {
      background: #0284c7;
      color: #ffffff;
      border: none;
    }
    .pricing-card.card-theme-2 .btn-action:hover:not(:disabled) {
      background: #0369a1;
      box-shadow: 0 6px 16px rgba(2, 132, 199, 0.3);
    }

    /* CARD THEME 3: LIGHT PEACH / ORANGE */
    .pricing-card.card-theme-3 {
      background: linear-gradient(180deg, #ffedd5 0%, #fff7ed 100%);
      border: 1.5px solid #fdba74;
    }
    .pricing-card.card-theme-3 .pkg-title { color: #7c2d12; }
    .pricing-card.card-theme-3 .btn-action {
      background: #ea580c;
      color: #ffffff;
      border: none;
    }
    .pricing-card.card-theme-3 .btn-action:hover:not(:disabled) {
      background: #c2410c;
      box-shadow: 0 6px 16px rgba(234, 88, 12, 0.3);
    }

    /* CARD TOP BAR */
    .card-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.2rem;
    }
    .pkg-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .theme-icon {
      font-size: 1.25rem;
    }
    .pkg-title {
      font-size: 1.05rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .blue-check-badge {
      width: 24px;
      height: 24px;
      background: #2563eb;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
    }

    /* PRICE BOX */
    .pkg-price-box {
      margin-bottom: 1rem;
    }
    .amount-wrap {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .pkg-price-box .amount {
      font-size: 2.6rem;
      font-weight: 900;
      color: #f97316;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .pkg-price-box .currency {
      font-size: 1.3rem;
      font-weight: 800;
      color: #f97316;
    }
    .pkg-price-box .period {
      color: #ea580c;
      font-size: 0.88rem;
      font-weight: 700;
      margin-top: 4px;
    }

    .pkg-desc {
      color: #475569;
      font-size: 0.88rem;
      line-height: 1.45;
      margin-bottom: 1.5rem;
      min-height: 44px;
    }

    .pkg-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.8rem 0;
      flex-grow: 1;
    }
    .pkg-features li {
      margin-bottom: 0.95rem;
      font-size: 0.92rem;
      color: #334155;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .pkg-features li i.fa-check {
      color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .pkg-features li i.fa-times {
      color: #94a3b8;
      background: rgba(148, 163, 184, 0.15);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .pkg-features li.disabled {
      color: #94a3b8;
      text-decoration: line-through;
    }

    .btn-action {
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      background: #94a3b8 !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .btn-outline:hover {
      background: var(--bg-hover);
    }
    .btn-payos {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      border: none;
      color: white;
      font-weight: 600;
    }
    .btn-payos:hover {
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .max-w-550 {
      max-width: 550px;
      width: 100%;
    }
    .package-summary-box {
      background: rgba(243, 244, 246, 0.5);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem 1.2rem;
    }
    .price-tag strong {
      font-size: 1.4rem;
      color: var(--primary);
    }
    .payment-method-selector .method-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 2px solid #10b981;
      background: rgba(16, 185, 129, 0.05);
      border-radius: 10px;
      position: relative;
    }
    .badge-recommended {
      position: absolute;
      top: -8px;
      right: 12px;
      background: #10b981;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .payos-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 12px;
    }
    .qr-frame {
      display: inline-block;
      padding: 12px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border: 2px solid #10b981;
    }
    .qr-code-img {
      width: 210px;
      height: 210px;
      object-fit: contain;
    }
    .polling-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #059669;
    }
    .spinner-pulse {
      width: 10px;
      height: 10px;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.5; }
    }
    .transfer-details-box {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 10px;
      padding: 1rem 1.2rem;
    }
    .highlight-content {
      background: #fffbebf5;
      padding: 8px 10px;
      border-radius: 6px;
      margin-top: 4px;
      border: 1px dashed #f59e0b;
    }
    .text-warning-dark {
      color: #d97706;
    }
    .font-mono {
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    .copy-group {
      display: flex;
      align-items: center;
    }
    .btn-copy {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 2px 6px;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .btn-copy:hover {
      color: var(--primary);
    }
    .test-simulation-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      padding: 2.2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlideUp {
      from { transform: translateY(20px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .w-100 { width: 100%; }
    .mb-5 { margin-bottom: 3rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mt-5 { margin-top: 3rem; }
    .my-3 { margin: 1rem 0; }
    .text-center { text-align: center; }
    .justify-content-center { justify-content: center; }
    .text-sm { font-size: 0.9rem; }
    .text-xs { font-size: 0.8rem; }
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
        this.toastService.show('Tạo mã QR thanh toán PayOS thành công!', 'success');
        this.startPolling(res.orderCode);
      },
      error: (err) => {
        this.isPurchasing.set(false);
        this.toastService.show(err.error?.message || 'Không thể khởi tạo thanh toán PayOS', 'error');
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
