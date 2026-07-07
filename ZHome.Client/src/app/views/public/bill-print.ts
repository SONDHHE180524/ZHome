import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BillService } from '../../services/bill.service';

@Component({
  selector: 'app-bill-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="print-page-wrapper">
      
      <!-- Top Actions (Hidden on Print) -->
      <div class="actions-panel no-print">
        <button routerLink="/tenant/bills" class="btn-action-back">
          ← Trở lại danh sách
        </button>
        <button (click)="printInvoice()" class="btn-action-print">
          🖨️ In Hóa Đơn (A4 / K80)
        </button>
      </div>

      <!-- Main Receipt Container -->
      @if (isLoading()) {
        <div class="status-msg">
          <div class="spinner"></div>
          <p>Đang tải hóa đơn điện tử...</p>
        </div>
      } @else if (errorMsg(); as error) {
        <div class="status-msg error-box">
          <p class="error-title">⚠️ Lỗi truy xuất hóa đơn</p>
          <p>{{ error }}</p>
          <button routerLink="/" class="btn-action-back mt-3">Về Trang Chủ</button>
        </div>
      } @else if (bill(); as item) {
        <div class="receipt-card animate-fade-in">
          
          <!-- Certified Notarized Stamp (CSS) -->
          <div class="certified-stamp">
            <div class="stamp-inner">
              <span class="stamp-top">CÔNG CHỨNG SỐ HÓA</span>
              <span class="stamp-logo">ZHOME</span>
              <span class="stamp-phone">0964339980</span>
              <span class="stamp-date">{{ item.paidAt ? 'ĐÃ THU TIỀN' : 'CHỜ THANH TOÁN' }}</span>
            </div>
          </div>

          <!-- Supermarket Header -->
          <div class="receipt-header">
            <div class="zhome-logo-box">
              <span class="logo-z">Z</span>
              <span class="logo-text">ZHome</span>
            </div>
            <h1 class="receipt-title">HÓA ĐƠN THANH TOÁN</h1>
            <p class="receipt-subtitle">HỆ THỐNG QUẢN LÝ NHÀ TRỌ THÔNG MINH</p>
            <p class="receipt-phone">Zalo OA Support: 0964.339.980</p>
          </div>

          <div class="receipt-divider-thick"></div>

          <!-- Invoice Meta Info -->
          <div class="meta-section">
            <div class="meta-row">
              <span class="meta-label">Khu trọ:</span>
              <span class="meta-val font-bold text-upper">{{ item.propertyTitle }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Phòng số:</span>
              <span class="meta-val font-bold">P.{{ item.roomNumber }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Khách hàng:</span>
              <span class="meta-val">{{ item.tenantName }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Số điện thoại:</span>
              <span class="meta-val">{{ item.tenantPhone }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Kỳ hóa đơn:</span>
              <span class="meta-val font-bold text-primary">Tháng {{ item.billingMonth }}/{{ item.billingYear }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Trạng thái:</span>
              <span class="meta-val status-badge" [class.paid]="item.status === 'Paid'">
                {{ item.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
              </span>
            </div>
          </div>

          <div class="receipt-divider-dashed"></div>

          <!-- Items Table -->
          <div class="receipt-items-container">
            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="col-item">KHOẢN MỤC / CHỈ SỐ</th>
                  <th class="col-qty text-right">LƯỢNG</th>
                  <th class="col-price text-right font-mono">Đ.GIÁ</th>
                  <th class="col-total text-right font-mono">THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. Room Fee -->
                <tr>
                  <td class="col-item font-bold">Tiền thuê phòng</td>
                  <td class="col-qty text-right">1</td>
                  <td class="col-price text-right font-mono">{{ item.roomFee | number:'1.0-0' }}</td>
                  <td class="col-total text-right font-mono font-bold">{{ item.roomFee | number:'1.0-0' }}</td>
                </tr>

                <!-- 2. Electricity Fee -->
                <tr>
                  <td class="col-item">
                    <span class="item-name font-bold">Tiền điện tiêu thụ</span>
                    <span class="item-desc">(Cũ: {{ item.electricityOldReading | number:'1.0-1' }} - Mới: {{ item.electricityNewReading | number:'1.0-1' }})</span>
                  </td>
                  <td class="col-qty text-right font-mono">{{ item.electricityNewReading - item.electricityOldReading | number:'1.0-1' }}</td>
                  <td class="col-price text-right font-mono">3.000</td>
                  <td class="col-total text-right font-mono">{{ item.electricityFee | number:'1.0-0' }}</td>
                </tr>

                <!-- 3. Water Fee -->
                <tr>
                  <td class="col-item">
                    <span class="item-name font-bold">Tiền nước tiêu thụ</span>
                    <span class="item-desc">(Cũ: {{ item.waterOldReading | number:'1.0-1' }} - Mới: {{ item.waterNewReading | number:'1.0-1' }})</span>
                  </td>
                  <td class="col-qty text-right font-mono">{{ item.waterNewReading - item.waterOldReading | number:'1.0-1' }}</td>
                  <td class="col-price text-right font-mono">10.000</td>
                  <td class="col-total text-right font-mono">{{ item.waterFee | number:'1.0-0' }}</td>
                </tr>

                <!-- 4. Service Fee -->
                <tr>
                  <td class="col-item font-bold">Phí dịch vụ chung</td>
                  <td class="col-qty text-right">1</td>
                  <td class="col-price text-right font-mono">50.000</td>
                  <td class="col-total text-right font-mono">{{ item.serviceFee | number:'1.0-0' }}</td>
                </tr>

                <!-- 5. Repair Deduction (If exists) -->
                @if (item.repairDeduction > 0) {
                  <tr class="deduction-row">
                    <td class="col-item text-danger">Khấu trừ chủ trọ chịu</td>
                    <td class="col-qty text-right">1</td>
                    <td class="col-price text-right font-mono text-danger">-{{ item.repairDeduction | number:'1.0-0' }}</td>
                    <td class="col-total text-right font-mono text-danger font-bold">-{{ item.repairDeduction | number:'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="receipt-divider-dashed"></div>

          <!-- Total Calculation -->
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">CỘNG TIỀN MỤC:</span>
              <span class="total-val font-mono">{{ item.roomFee + item.electricityFee + item.waterFee + item.serviceFee | number:'1.0-0' }}đ</span>
            </div>
            <div class="total-row">
              <span class="total-label">TỔNG KHẤU TRỪ:</span>
              <span class="total-val font-mono text-danger">-{{ item.repairDeduction | number:'1.0-0' }}đ</span>
            </div>
            
            <div class="receipt-divider-dashed mt-2 mb-2"></div>
            
            <div class="grand-total-row">
              <span class="grand-label">TỔNG THANH TOÁN (VND):</span>
              <span class="grand-val font-mono">{{ item.totalAmount | number:'1.0-0' }}đ</span>
            </div>
          </div>

          <div class="receipt-divider-thick"></div>

          <!-- Payment QR & Barcode Section -->
          <div class="payment-qr-section">
            <p class="payment-hint">QUÉT MÃ ĐỂ THANH TOÁN QUA MOBILE BANKING / ZALO PAY</p>
            <div class="barcode-container">
              <!-- Render a beautiful barcode using CSS stripes -->
              <div class="css-barcode">
                <div class="stripe s-w"></div><div class="stripe s-b"></div><div class="stripe s-w"></div><div class="stripe s-b"></div>
                <div class="stripe s-w"></div><div class="stripe s-b-double"></div><div class="stripe s-w"></div><div class="stripe s-b"></div>
                <div class="stripe s-w-double"></div><div class="stripe s-b"></div><div class="stripe s-w"></div><div class="stripe s-b-double"></div>
                <div class="stripe s-w"></div><div class="stripe s-b"></div><div class="stripe s-w"></div><div class="stripe s-b"></div>
                <div class="stripe s-w-double"></div><div class="stripe s-b-double"></div><div class="stripe s-w"></div><div class="stripe s-b"></div>
                <div class="stripe s-w"></div><div class="stripe s-b"></div><div class="stripe s-w-double"></div><div class="stripe s-b"></div>
                <div class="stripe s-w"></div><div class="stripe s-b"></div><div class="stripe s-w"></div><div class="stripe s-b-double"></div>
              </div>
              <span class="barcode-text">MB-ZHOME-{{ item.id }}-{{ item.billingMonth }}{{ item.billingYear }}</span>
            </div>

            <!-- Certified ZHome Stamp Detail -->
            <div class="certification-footer-box">
              <p class="cert-text">
                🛡️ <strong>ZHome Verification System</strong> <br>
                Hóa đơn này được bảo chứng bởi Công ty Cổ phần Quản lý Trọ ZHome. <br>
                Mã số công chứng số hóa: <strong>ZH-{{ item.id }}-{{ item.billingMonth }}{{ item.billingYear }}-NT</strong>
              </p>
            </div>
          </div>

          <div class="receipt-divider-dashed"></div>

          <!-- Footer Thank You -->
          <div class="receipt-footer">
            <p class="thank-you-msg">CẢM ƠN QUÝ KHÁCH ĐÃ ĐỒNG HÀNH CÙNG ZHOME!</p>
            <p class="website-info">Mọi chi tiết xin liên hệ Hotline: 0964.339.980</p>
            <p class="print-time">Thời gian in: {{ currentPrintTime | date:'dd/MM/yyyy HH:mm:ss' }}</p>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .print-page-wrapper {
      min-height: 100vh;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 15px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #334155;
    }

    /* Actions Panel */
    .actions-panel {
      width: 100%;
      max-width: 400px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .btn-action-back {
      flex: 1;
      padding: 10px 16px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: #e2e8f0;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      text-align: center;
    }
    .btn-action-back:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.2);
    }
    .btn-action-print {
      flex: 1.2;
      padding: 10px 16px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      transition: all 0.2s ease;
    }
    .btn-action-print:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
    }

    /* Receipt Styling - Thermal Paper Simulation */
    .receipt-card {
      width: 100%;
      max-width: 400px;
      background: #ffffff;
      padding: 35px 25px 25px 25px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Certified Stamp Design */
    .certified-stamp {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 96px;
      height: 96px;
      border: 3px double #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-15deg);
      opacity: 0.8;
      pointer-events: none;
      z-index: 10;
    }
    .stamp-inner {
      width: 82px;
      height: 82px;
      border: 1px solid #ef4444;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2px;
      box-sizing: border-box;
      color: #ef4444;
      font-weight: 800;
      text-align: center;
    }
    .stamp-top {
      font-size: 6.5px;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .stamp-logo {
      font-size: 13px;
      letter-spacing: 1px;
      font-family: 'Impact', 'Arial Black', sans-serif;
      border-bottom: 1.5px solid #ef4444;
      line-height: 1.2;
    }
    .stamp-phone {
      font-size: 6px;
      margin-top: 1px;
    }
    .stamp-date {
      font-size: 7.5px;
      background: #ef4444;
      color: #ffffff;
      padding: 1px 4px;
      border-radius: 2px;
      margin-top: 3px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    /* Receipt Header */
    .receipt-header {
      text-align: center;
      margin-bottom: 18px;
    }
    .zhome-logo-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .logo-z {
      width: 22px;
      height: 22px;
      background: #6366f1;
      color: #ffffff;
      font-weight: 900;
      font-size: 14px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-text {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .receipt-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0 2px 0;
      letter-spacing: 0.5px;
    }
    .receipt-subtitle {
      font-size: 0.65rem;
      color: #64748b;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .receipt-phone {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }

    /* Dividers */
    .receipt-divider-thick {
      height: 3px;
      border-top: 3px double #334155;
      margin: 12px 0;
    }
    .receipt-divider-dashed {
      border-top: 1px dashed #64748b;
      margin: 12px 0;
    }

    /* Meta section */
    .meta-section {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.82rem;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
    }
    .meta-label {
      color: #64748b;
    }
    .meta-val {
      color: #1e293b;
      text-align: right;
    }
    .font-bold { font-weight: 700; }
    .text-upper { text-transform: uppercase; }
    .text-primary { color: #4f46e5; }
    
    .status-badge {
      font-weight: 700;
      color: #f43f5e;
    }
    .status-badge.paid {
      color: #10b981;
    }

    /* Table grid */
    .receipt-items-container {
      margin-top: 10px;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
    }
    .receipt-table th {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
      border-bottom: 1.5px solid #334155;
      padding: 6px 0;
      text-transform: uppercase;
    }
    .receipt-table td {
      padding: 8px 0;
      font-size: 0.78rem;
      vertical-align: top;
      border-bottom: 0.5px solid #f1f5f9;
    }
    .col-item {
      text-align: left;
      width: 48%;
    }
    .col-qty {
      width: 12%;
    }
    .col-price {
      width: 18%;
    }
    .col-total {
      width: 22%;
    }
    .item-desc {
      display: block;
      font-size: 0.68rem;
      color: #64748b;
      margin-top: 2px;
    }
    .text-right { text-align: right; }
    .font-mono { font-family: 'SFMono-Regular', Consolas, "Liberation Mono", Menlo, Courier, monospace; }
    .text-danger { color: #e11d48; }
    .deduction-row td {
      background: #fff5f5;
    }

    /* Totals section */
    .total-section {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.8rem;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      padding: 4px 0;
    }

    /* QR / Barcode styling */
    .payment-qr-section {
      text-align: center;
      padding: 10px 0;
    }
    .payment-hint {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .barcode-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 10px 0;
      background: #fafafa;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #f1f5f9;
    }
    .css-barcode {
      display: flex;
      height: 38px;
      width: 260px;
      background: white;
    }
    .stripe {
      height: 100%;
    }
    .s-w { width: 3px; background: white; }
    .s-w-double { width: 6px; background: white; }
    .s-b { width: 2px; background: black; }
    .s-b-double { width: 5px; background: black; }
    
    .barcode-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.68rem;
      letter-spacing: 2px;
      color: #0f172a;
      margin-top: 6px;
      font-weight: bold;
    }

    .certification-footer-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: left;
      margin-top: 15px;
    }
    .cert-text {
      font-size: 0.68rem;
      color: #475569;
      line-height: 1.4;
      margin: 0;
    }

    /* Footer styling */
    .receipt-footer {
      text-align: center;
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 8px;
    }
    .thank-you-msg {
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .website-info {
      margin-bottom: 2px;
    }
    .print-time {
      font-size: 0.65rem;
      color: #94a3b8;
      margin-top: 6px;
    }

    /* Status Box Views */
    .status-msg {
      max-width: 400px;
      width: 100%;
      background: #ffffff;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      box-sizing: border-box;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3.5px solid #cbd5e1;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-box {
      border-top: 4px solid #ef4444;
    }
    .error-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 8px;
    }

    .mt-3 { margin-top: 16px; }
    .mt-2 { margin-top: 8px; }
    .mb-2 { margin-bottom: 8px; }

    /* PRINT SPECIFIC STYLES */
    @media print {
      body, .print-page-wrapper {
        background: white !important;
        padding: 0 !important;
        min-height: auto !important;
      }
      .no-print {
        display: none !important;
      }
      .receipt-card {
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        padding: 10px !important;
      }
      .certified-stamp {
        opacity: 0.95 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .stamp-inner {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .stamp-date {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .logo-z {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .status-badge.paid {
        color: #059669 !important;
      }
    }
  `]
})
export class BillPrintComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly route = inject(ActivatedRoute);

  bill = signal<any | null>(null);
  isLoading = signal(true);
  errorMsg = signal<string | null>(null);
  currentPrintTime = new Date();

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMsg.set('Không có mã hóa đơn hợp lệ trong đường dẫn.');
      this.isLoading.set(false);
      return;
    }

    const billId = Number(idParam);
    if (isNaN(billId)) {
      this.errorMsg.set('Mã hóa đơn không đúng định dạng số.');
      this.isLoading.set(false);
      return;
    }

    this.fetchBill(billId);
  }

  fetchBill(billId: number): void {
    this.isLoading.set(true);
    this.billService.getBillById(billId).subscribe({
      next: (data) => {
        this.bill.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('Không tìm thấy hóa đơn này hoặc bạn không có quyền xem hóa đơn này.');
      }
    });
  }

  printInvoice(): void {
    window.print();
  }
}
