import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landlord-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bills-container animate-fade-in">
      <div class="header-row">
        <div>
          <h1>Hóa Đơn & Quản Lý Công Nợ</h1>
          <p>Xem danh sách hóa đơn tiện ích, theo dõi nợ đọng, in biên lai, và gửi nhắc nợ qua Zalo</p>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="glass-panel filters-panel">
        <div class="filter-flex">
          <div class="status-tabs">
            <button 
              (click)="filterStatus('All')" 
              [class.active]="selectedStatus() === 'All'" 
              class="tab-btn">Tất cả</button>
            <button 
              (click)="filterStatus('Unpaid')" 
              [class.active]="selectedStatus() === 'Unpaid'" 
              class="tab-btn btn-tab-danger">Chưa thanh toán</button>
            <button 
              (click)="filterStatus('Paid')" 
              [class.active]="selectedStatus() === 'Paid'" 
              class="tab-btn btn-tab-success">Đã thanh toán</button>
          </div>
        </div>
      </div>

      <!-- Bills List Table -->
      @if (isLoading()) {
        <div class="loading-state mt-4">Đang tải danh sách hóa đơn...</div>
      } @else if (filteredBills().length === 0) {
        <div class="empty-state mt-4">
          <p>Không tìm thấy hóa đơn nào phù hợp với bộ lọc.</p>
        </div>
      } @else {
        <div class="glass-panel mt-4 animate-fade-in">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hóa Đơn</th>
                  <th>Phòng</th>
                  <th>Khách Thuê</th>
                  <th>Tiền Phòng</th>
                  <th>Điện (Usage)</th>
                  <th>Nước (Usage)</th>
                  <th>Dịch Vụ</th>
                  <th>Khấu Trừ</th>
                  <th>Tổng Tiền</th>
                  <th>Đã Thu</th>
                  <th>Còn Lại</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                @for (bill of filteredBills(); track bill.id) {
                  <tr>
                    <td class="font-semibold">Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</td>
                    <td class="font-bold text-white">P.{{ bill.roomNumber }}</td>
                    <td>{{ bill.tenantName }}</td>
                    <td>{{ bill.roomFee | number:'1.0-0' }}đ</td>
                    <td>
                      {{ bill.electricityFee | number:'1.0-0' }}đ
                      <span class="cell-sub">({{ bill.electricityNewReading - bill.electricityOldReading }} kWh)</span>
                    </td>
                    <td>
                      {{ bill.waterFee | number:'1.0-0' }}đ
                      <span class="cell-sub">({{ bill.waterNewReading - bill.waterOldReading }} m³)</span>
                    </td>
                    <td>{{ bill.serviceFee | number:'1.0-0' }}đ</td>
                    <td class="text-rose">-{{ bill.repairDeduction | number:'1.0-0' }}đ</td>
                    <td class="font-bold text-white">{{ bill.totalAmount | number:'1.0-0' }}đ</td>
                    <td class="text-success">{{ bill.paidAmount | number:'1.0-0' }}đ</td>
                    <td class="text-danger">{{ bill.remainingAmount | number:'1.0-0' }}đ</td>
                    <td>
                      <span class="badge" 
                            [class.badge-success]="bill.status === 'Paid'" 
                            [class.badge-warning]="bill.status === 'Partial'"
                            [class.badge-danger]="bill.status === 'Unpaid'">
                        {{ bill.status === 'Paid' ? 'Đã thu đủ' : bill.status === 'Partial' ? 'Thu một phần' : 'Chưa thu' }}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button (click)="viewInvoice(bill)" class="btn btn-secondary btn-action-sm">🔍 Xem</button>
                        
                        @if (bill.status !== 'Paid') {
                          <button (click)="markAsPaid(bill.id, bill.remainingAmount)" class="btn btn-success btn-action-sm">✓ Thu tiền</button>
                          <button (click)="sendEmail(bill.id)" class="btn btn-info btn-action-sm">✉️ Email</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Detailed Receipt Modal (US05 Preview & Print) -->
      @if (activeInvoice(); as bill) {
        <div class="modal-backdrop" (click)="closeInvoice()">
          <div class="glass-panel modal-card max-w-600 print-card" (click)="$event.stopPropagation()">
            <button (click)="closeInvoice()" class="modal-close-btn">&times;</button>
            
            <div id="printable-receipt" class="receipt-content">
              <div class="receipt-header">
                <h2>HÓA ĐƠN TIỀN NHÀ</h2>
                <p class="receipt-subtitle">ZHome Boarding Management System</p>
                <p class="receipt-date">Khu trọ: {{ bill.propertyTitle }} • Phòng: {{ bill.roomNumber }}</p>
                <p class="receipt-period">Kỳ hóa đơn: Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</p>
              </div>

              <div class="receipt-divider"></div>

              <div class="receipt-info-row">
                <span><strong>Khách thuê:</strong> {{ bill.tenantName }}</span>
                <span><strong>Số điện thoại:</strong> {{ bill.tenantPhone }}</span>
              </div>

              <div class="receipt-table-container">
                <table class="receipt-table">
                  <thead>
                    <tr>
                      <th>Khoản Mục</th>
                      <th>Chỉ Số Cũ</th>
                      <th>Chỉ Số Mới</th>
                      <th>Sử Dụng</th>
                      <th>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tiền phòng cố định</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td class="text-right">{{ bill.roomFee | number:'1.0-0' }}đ</td>
                    </tr>
                    <tr>
                      <td>Tiền điện</td>
                      <td>{{ bill.electricityOldReading }}</td>
                      <td>{{ bill.electricityNewReading }}</td>
                      <td>{{ bill.electricityNewReading - bill.electricityOldReading }} kWh</td>
                      <td class="text-right">{{ bill.electricityFee | number:'1.0-0' }}đ</td>
                    </tr>
                    <tr>
                      <td>Tiền nước</td>
                      <td>{{ bill.waterOldReading }}</td>
                      <td>{{ bill.waterNewReading }}</td>
                      <td>{{ bill.waterNewReading - bill.waterOldReading }} m³</td>
                      <td class="text-right">{{ bill.waterFee | number:'1.0-0' }}đ</td>
                    </tr>
                    <tr>
                      <td>Phí dịch vụ chung</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td class="text-right">{{ bill.serviceFee | number:'1.0-0' }}đ</td>
                    </tr>
                    @if (bill.repairDeduction > 0) {
                      <tr>
                        <td class="text-danger">Khấu trừ chủ trọ chịu</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td class="text-right text-danger">-{{ bill.repairDeduction | number:'1.0-0' }}đ</td>
                      </tr>
                    }
                    <tr class="receipt-total-row">
                      <td colspan="4">TỔNG CỘNG</td>
                      <td class="text-right text-total">{{ bill.totalAmount | number:'1.0-0' }}đ</td>
                    </tr>
                    <tr class="receipt-paid-row">
                      <td colspan="4" class="text-success">ĐÃ THANH TOÁN</td>
                      <td class="text-right text-success">{{ bill.paidAmount | number:'1.0-0' }}đ</td>
                    </tr>
                    <tr class="receipt-remaining-row">
                      <td colspan="4" class="text-danger">CÒN LẠI</td>
                      <td class="text-right text-danger">{{ bill.remainingAmount | number:'1.0-0' }}đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              @if (bill.transactions && bill.transactions.length > 0) {
                <div class="transactions-section mt-3">
                  <h5>Lịch Sử Thu Tiền</h5>
                  <table class="table-sm">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Người nộp / Ghi chú</th>
                        <th>Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tx of bill.transactions; track tx.id) {
                        <tr>
                          <td>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                          <td>{{ tx.tenantName }}</td>
                          <td class="text-success">+{{ tx.amount | number:'1.0-0' }}đ</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="receipt-footer">
                <p>Trạng thái hóa đơn: <strong>{{ bill.status === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN' }}</strong></p>
                @if (bill.paidAt) {
                  <p class="paid-date-text">Thanh toán vào: {{ bill.paidAt | date:'dd/MM/yyyy HH:mm' }}</p>
                }
                <p class="receipt-thank">Cảm ơn quý khách đã thuê trọ tại ZHome!</p>
              </div>
            </div>

            <div class="modal-actions mt-4 no-print">
              <button (click)="closeInvoice()" class="btn btn-secondary">Đóng</button>
              @if (bill.status === 'Unpaid') {
                <button (click)="sendEmail(bill.id)" class="btn btn-info">✉️ Gửi Thông Báo Email</button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Simulated Email Notification Modal -->
      @if (emailPayloadSim(); as sim) {
        <div class="modal-backdrop" (click)="closeEmailModal()">
          <div class="glass-panel modal-card max-w-600" (click)="$event.stopPropagation()">
            <button (click)="closeEmailModal()" class="modal-close-btn">&times;</button>
            <div class="email-success-header">
              <span class="email-logo">✉️</span>
              <h3>Hệ Thống Gửi Email Hóa Đơn ZHome</h3>
            </div>
            
            <div class="email-payload-body mt-3">
              <div class="alert-success-box" [style.border-left]="sim.smtpSuccess ? '4px solid #10b981' : '4px solid #ef4444'" [style.background]="sim.smtpSuccess ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'" [style.color]="sim.smtpSuccess ? '#10b981' : '#e11d48'">
                <strong>{{ sim.message }}</strong>
                <p>Phương thức gửi: {{ sim.smtpDetails }}</p>
              </div>

              <!-- Premium Webmail Client UI Mockup -->
              <div class="email-client-mockup">
                <div class="email-client-header">
                  <div class="email-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
                  <div class="email-subject-line">Subject: {{ sim.sentPayload.subject }}</div>
                </div>
                <div class="email-meta-info">
                  <div><strong>Từ:</strong> {{ sim.sentPayload.senderEmail }}</div>
                  <div><strong>Đến:</strong> {{ sim.sentPayload.recipientEmail }} (Khách thuê: {{ sim.recipient }})</div>
                  <div><strong>Thời gian:</strong> {{ sim.sentPayload.timestamp | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
                
                <!-- Email HTML preview box -->
                <div class="email-body-preview" [innerHTML]="sim.sentPayload.body">
                </div>
              </div>

              <div class="payload-field mt-3">
                <label>Gói tin API gửi đi (JSON)</label>
                <pre class="json-box">{{ sim.sentPayload | json }}</pre>
              </div>
            </div>

            <div class="modal-actions mt-4">
              <button (click)="closeEmailModal()" class="btn btn-primary btn-block">Hoàn tất</button>
            </div>
          </div>
        </div>
      }

      <!-- Premium Pro Modal -->
      @if (showPremiumProModal()) {
        <div class="modal-backdrop" (click)="showPremiumProModal.set(false)">
          <div class="glass-panel modal-card text-center max-w-500" (click)="$event.stopPropagation()">
            <div class="premium-icon mb-4" style="font-size: 3rem;">🚀</div>
            <h2 class="mb-3" style="color: var(--primary);">Nâng Cấp Gói Nâng Cao</h2>
            <p class="text-muted mb-4">Tính năng "Gửi Email Tự Động" yêu cầu gói Nâng Cao (Premium Pro). Bạn có muốn nâng cấp để trải nghiệm tính năng này không?</p>
            <div class="modal-actions justify-content-center">
              <button class="btn btn-secondary" (click)="showPremiumProModal.set(false)">Đóng</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-row {
      margin-bottom: 25px;
    }
    .filters-panel {
      padding: 16px 24px;
    }
    .status-tabs {
      display: flex;
      gap: 12px;
    }
    .tab-btn {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }
    .tab-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.15);
    }
    .tab-btn.active {
      background: var(--grad-primary);
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
    }
    .btn-tab-success.active {
      background: var(--grad-success);
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
    }
    .btn-tab-danger.active {
      background: var(--grad-danger);
      box-shadow: 0 4px 10px rgba(244, 63, 94, 0.25);
    }
    
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-white { color: var(--text-main); }
    .text-rose { color: var(--color-danger-light); }
    
    .cell-sub {
      display: block;
      font-size: 0.75rem;
      color: var(--text-dark);
      margin-top: 2px;
    }

    .row-actions {
      display: flex;
      gap: 8px;
    }
    .btn-action-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    /* Modal printable receipt card styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      padding: 30px;
      position: relative;
    }
    .max-w-600 { max-width: 600px; }
    .max-w-500 { max-width: 500px; }
    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0,0,0,0.05);
      border: none;
      color: var(--text-main);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .modal-close-btn:hover { background: var(--color-danger); }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    /* Receipt Styles */
    .receipt-content {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 24px;
      color: #0f172a;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .receipt-header h2 {
      font-size: 1.5rem;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .receipt-subtitle {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-primary-light);
    }
    .receipt-date, .receipt-period {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .receipt-divider {
      height: 1px;
      background: rgba(255,255,255,0.08);
      border-bottom: 1px dashed rgba(255,255,255,0.08);
      margin: 16px 0;
    }
    .receipt-info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .receipt-table {
      width: 100%;
    }
    .receipt-table th {
      padding: 10px;
      font-size: 0.8rem;
    }
    .receipt-table td {
      padding: 10px;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .text-right { text-align: right; }
    .text-danger { color: var(--color-danger-light); }
    .receipt-total-row td {
      border-top: 1px solid rgba(0,0,0,0.1);
      font-weight: 700;
      color: #0f172a;
      padding-top: 16px;
    }
    .text-total {
      font-size: 1.15rem;
      color: var(--color-primary-light) !important;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 30px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .receipt-thank {
      margin-top: 15px;
      font-style: italic;
      color: var(--text-dark);
    }
    .paid-date-text {
      color: var(--color-success-light);
      font-size: 0.8rem;
      margin-top: 2px;
    }
    
    /* Simulated Zalo Layout */
    .zalo-success-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 15px;
    }
    .zalo-logo {
      font-size: 2.2rem;
      background: rgba(99,102,241,0.1);
      padding: 8px;
      border-radius: var(--radius-sm);
    }
    .alert-success-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      color: var(--color-success-light);
      padding: 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 15px;
    }
    .payload-field label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    .val-box {
      background: rgba(0,0,0,0.02);
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--text-main);
      margin-top: 4px;
    }
    .msg-text {
      line-height: 1.5;
      font-size: 0.85rem;
    }
    .json-box {
      background: #0d111a;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
      font-family: monospace;
      font-size: 0.75rem;
      color: #cbd5e1;
      overflow-x: auto;
      max-height: 150px;
      margin-top: 4px;
    }

    /* Simulated Email Layout */
    .email-success-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 15px;
    }
    .email-logo {
      font-size: 2.2rem;
      background: rgba(99,102,241,0.1);
      padding: 8px;
      border-radius: var(--radius-sm);
    }
    .alert-success-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      color: var(--color-success-light);
      padding: 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 15px;
    }
    .payload-field label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    .val-box {
      background: rgba(0,0,0,0.02);
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--text-main);
      margin-top: 4px;
    }
    .json-box {
      background: #0d111a;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
      font-family: monospace;
      font-size: 0.75rem;
      color: #cbd5e1;
      overflow-x: auto;
      max-height: 150px;
      margin-top: 4px;
    }

    /* Premium Email Client UI Mockup styles */
    .email-client-mockup {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin: 15px 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      color: #334155;
    }
    .email-client-header {
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .email-dots {
      display: flex;
      gap: 6px;
    }
    .email-dots .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .email-dots .dot.red { background: #ef4444; }
    .email-dots .dot.yellow { background: #f59e0b; }
    .email-dots .dot.green { background: #10b981; }
    
    .email-subject-line {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }
    .email-meta-info {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 16px;
      font-size: 0.8rem;
      line-height: 1.6;
      color: #475569;
      text-align: left;
    }
    .email-body-preview {
      padding: 20px;
      background: #ffffff;
      max-height: 350px;
      overflow-y: auto;
    }

    @media print {
      body * { visibility: hidden; }
      #printable-receipt, #printable-receipt * { visibility: visible; }
      #printable-receipt {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: #ffffff !important;
        color: #000000 !important;
        border: none;
      }
      .receipt-content {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .receipt-table td, .receipt-table th {
        color: #000000 !important;
        border-color: #e2e8f0 !important;
      }
      .text-total {
        color: #000000 !important;
      }
      .no-print { display: none !important; }
    }
    .mt-4 { margin-top: 24px; }
    .mt-3 { margin-top: 16px; }
    .mt-2 { margin-top: 8px; }
    .my-2 { margin: 8px 0; }
  `]
})
export class LandlordBillsComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  bills = signal<any[]>([]);
  isLoading = signal(true);
  selectedStatus = signal<string>('All');

  // Modal control states
  activeInvoice = signal<any | null>(null);
  emailPayloadSim = signal<any | null>(null);
  showPremiumProModal = signal(false);

  // Filter signal mapping
  filteredBills = signal<any[]>([]);

  ngOnInit(): void {
    this.fetchBills();
  }

  fetchBills(): void {
    this.isLoading.set(true);
    this.billService.getLandlordBills().subscribe({
      next: (data) => {
        this.bills.set(data);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách hóa đơn từ máy chủ.', 'error');
      }
    });
  }

  filterStatus(status: string): void {
    this.selectedStatus.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const status = this.selectedStatus();
    const all = this.bills();
    if (status === 'All') {
      this.filteredBills.set(all);
    } else {
      this.filteredBills.set(all.filter(b => b.status === status));
    }
  }

  markAsPaid(billId: number, maxAmount: number): void {
    const input = window.prompt(`Nhập số tiền đã thu (Tối đa: ${maxAmount}):`, maxAmount.toString());
    if (!input) return;

    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0 || amount > maxAmount) {
      this.toastService.show('Số tiền không hợp lệ. Phải lớn hơn 0 và không vượt quá số còn lại.', 'error');
      return;
    }

    this.billService.payBill(billId, amount).subscribe({
      next: () => {
        this.toastService.show('Đã cập nhật số tiền thu thành công!', 'success');
        this.fetchBills(); // reload status
        
        // If active invoice modal is open, we can refresh it or close it. 
        // Best to just refresh the list which will update the view if we fetch again.
        // Wait, fetchBills will fetch again, but active invoice is a copy.
        if (this.activeInvoice()?.id === billId) {
            this.billService.getBillById(billId).subscribe(b => {
                this.activeInvoice.set(b);
            });
        }
      },
      error: () => {
        this.toastService.show('Có lỗi xảy ra khi cập nhật hóa đơn.', 'error');
      }
    });
  }

  sendEmail(billId: number): void {
    if (!this.authService.isPremiumPro()) {
      this.showPremiumProModal.set(true);
      return;
    }
    this.billService.sendEmailNotification(billId).subscribe({
      next: (res) => {
        this.emailPayloadSim.set(res);
        if (res.smtpSuccess) {
          this.toastService.show(res.message, 'success');
        } else {
          this.toastService.show(res.message, 'info');
        }
      },
      error: () => {
        this.toastService.show('Không thể gửi email thông báo.', 'error');
      }
    });
  }

  copyMessage(msg: string): void {
    navigator.clipboard.writeText(msg).then(() => {
      this.toastService.show('Đã sao chép liên kết hóa đơn vào bộ nhớ tạm!', 'success');
    }).catch(() => {
      this.toastService.show('Lỗi sao chép.', 'error');
    });
  }

  viewInvoice(bill: any): void {
    this.activeInvoice.set(bill);
  }

  closeInvoice(): void {
    this.activeInvoice.set(null);
  }

  closeEmailModal(): void {
    this.emailPayloadSim.set(null);
  }
}
