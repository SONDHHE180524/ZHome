import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { ReportService } from '../../services/report.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tenant-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tenant-bills animate-fade-in">
      <div class="header-row">
        <div>
          <h1>Hộp thư & Thông tin Tiền Trọ</h1>
          <p>Xem hóa đơn thuê trọ, chỉ số điện nước, và gửi phản ánh sự cố trực tiếp cho chủ nhà</p>
        </div>
      </div>

      <!-- Tab Selection -->
      <div class="tabs-bar mb-4">
        <button (click)="activeTab.set('bills')" class="tab-btn" [class.active]="activeTab() === 'bills'">
          💵 Hóa đơn & Chỉ số Điện Nước
        </button>
        <button (click)="activeTab.set('reports')" class="tab-btn" [class.active]="activeTab() === 'reports'">
          🛠️ Phản ánh & Báo cáo Sự cố
        </button>
      </div>

      <!-- Tab 1: Bills List -->
      @if (activeTab() === 'bills') {
        @if (isLoading()) {
          <div class="loading-state">Đang tải danh sách hóa đơn...</div>
        } @else if (bills().length === 0) {
          <div class="empty-state">
            <p>Tài khoản của bạn chưa phát sinh hóa đơn thuê trọ nào.</p>
          </div>
        } @else {
          <div class="bills-list-grid">
            @for (bill of bills(); track bill.id) {
              <div class="glass-panel bill-card" [class.paid-border]="bill.status === 'Paid'">
                <div class="bill-header">
                  <div>
                    <h3>Kỳ hóa đơn: Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</h3>
                    <p class="text-muted">{{ bill.propertyTitle }} • Phòng {{ bill.roomNumber }}</p>
                  </div>
                  <span class="badge" [class.badge-success]="bill.status === 'Paid'" [class.badge-danger]="bill.status === 'Unpaid'">
                    {{ bill.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                  </span>
                </div>

                <div class="bill-body mt-3">
                  <div class="bill-details-list">
                    <div class="detail-item">
                      <span>Tiền phòng cố định:</span>
                      <span>{{ bill.roomFee | number:'1.0-0' }}đ</span>
                    </div>
                    <div class="detail-item">
                      <span>Chỉ số điện (Số điện):</span>
                      <span class="text-xs">
                        Từ {{ bill.electricityOldReading }} đến {{ bill.electricityNewReading }} 
                        <strong>({{ bill.electricityNewReading - bill.electricityOldReading }} kWh)</strong>
                      </span>
                    </div>
                    <div class="detail-item">
                      <span>Tiền điện tính toán:</span>
                      <span class="text-primary-color font-bold">{{ bill.electricityFee | number:'1.0-0' }}đ</span>
                    </div>
                    <div class="detail-item">
                      <span>Chỉ số nước (Số nước):</span>
                      <span class="text-xs">
                        Từ {{ bill.waterOldReading }} đến {{ bill.waterNewReading }} 
                        <strong>({{ bill.waterNewReading - bill.waterOldReading }} m³)</strong>
                      </span>
                    </div>
                    <div class="detail-item">
                      <span>Tiền nước tính toán:</span>
                      <span class="text-primary-color font-bold">{{ bill.waterFee | number:'1.0-0' }}đ</span>
                    </div>
                    <div class="detail-item">
                      <span>Phí dịch vụ chung:</span>
                      <span>{{ bill.serviceFee | number:'1.0-0' }}đ</span>
                    </div>
                    @if (bill.repairDeduction > 0) {
                      <div class="detail-item text-success">
                        <span>Khấu trừ sửa chữa (Chủ trọ chịu):</span>
                        <span>-{{ bill.repairDeduction | number:'1.0-0' }}đ</span>
                      </div>
                    }
                  </div>
                  
                  <div class="modal-divider my-2"></div>

                  <div class="bill-total-row mt-2" style="font-size: 14px; color: var(--color-success);">
                    <span>ĐÃ THANH TOÁN</span>
                    <span class="total-val">{{ bill.paidAmount | number:'1.0-0' }}đ</span>
                  </div>
                  
                  <div class="bill-total-row mt-2" style="font-size: 16px; color: var(--color-danger);">
                    <span>CÒN LẠI</span>
                    <span class="total-val">{{ bill.remainingAmount | number:'1.0-0' }}đ</span>
                  </div>

                  @if (bill.transactions && bill.transactions.length > 0) {
                    <div class="transactions-list mt-3 p-3" style="background: rgba(0,0,0,0.2); border-radius: 8px;">
                      <h4 style="font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Lịch sử thanh toán</h4>
                      @for (tx of bill.transactions; track tx.id) {
                        <div class="tx-item" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                          <span>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }} - {{ tx.tenantName }}</span>
                          <span style="color: var(--color-success);">+{{ tx.amount | number:'1.0-0' }}đ</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="bill-actions mt-3">
                  @if (bill.status !== 'Paid') {
                    <button (click)="payBill(bill.id, bill.remainingAmount)" class="btn btn-primary btn-block">💳 Thanh toán trực tuyến</button>
                  } @else {
                    <div class="paid-info">
                      <span class="check-icon">✓</span>
                      <span>Đã thanh toán đủ</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Tab 2: Reports & Issues -->
      @if (activeTab() === 'reports') {
        <div class="reports-layout">
          <!-- Left Col: Submit New Report Form -->
          <div class="glass-panel report-form-panel">
            <h3>Báo Cáo Sự Cố Mới</h3>
            <p class="text-muted text-xs mb-3">Thông báo cho chủ nhà về các sự cố hỏng hóc hoặc vấn đề phòng trọ</p>

            <!-- Room info card shortcut if bills exist -->
            @if (bills().length > 0) {
              <div class="room-info-card-lite mb-3">
                <span class="icon">🏠</span>
                <div>
                  <strong>{{ bills()[0].propertyTitle }}</strong>
                  <p class="text-xs text-muted">Phòng {{ bills()[0].roomNumber }} • Chủ trọ sẽ nhận được báo cáo này</p>
                </div>
              </div>
            }

            <form (ngSubmit)="submitReport()">
              <div class="form-group">
                <label for="reportTitle">Vấn đề / Sự cố gặp phải</label>
                <input 
                  type="text" 
                  id="reportTitle" 
                  name="reportTitle" 
                  [(ngModel)]="newReport.title" 
                  required 
                  class="form-control" 
                  placeholder="Ví dụ: Hỏng bóng đèn nhà vệ sinh, Rò nước" />
              </div>
              <div class="form-group">
                <label for="reportContent">Nội dung chi tiết</label>
                <textarea 
                  id="reportContent" 
                  name="reportContent" 
                  [(ngModel)]="newReport.content" 
                  required 
                  rows="4" 
                  class="form-control" 
                  placeholder="Mô tả cụ thể sự cố để chủ trọ nắm thông tin và xử lý..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-block mt-3" [disabled]="isSubmittingReport()">
                {{ isSubmittingReport() ? 'Đang gửi...' : '🚀 Gửi phản ánh ngay' }}
              </button>
            </form>
          </div>

          <!-- Right Col: Reports History List -->
          <div>
            <div class="section-header-row mb-3">
              <h3>Lịch Sử Phản Ánh Sự Cố</h3>
              <button (click)="fetchReports()" class="btn btn-secondary btn-sm">🔄 Tải lại</button>
            </div>

            @if (isLoadingReports()) {
              <div class="loading-state">Đang tải lịch sử phản ánh...</div>
            } @else if (reports().length === 0) {
              <div class="empty-state">
                <p>Bạn chưa gửi bất kỳ phản ánh hay báo cáo sự cố nào.</p>
              </div>
            } @else {
              <div class="reports-history-list">
                @for (rep of reports(); track rep.id) {
                  <div class="glass-panel report-item-card">
                    <div class="report-item-header">
                      <span class="report-item-title">🛠️ {{ rep.title }}</span>
                      <span class="badge" 
                            [class.badge-warning]="rep.status === 'Pending'" 
                            [class.badge-primary]="rep.status === 'Processing'" 
                            [class.badge-success]="rep.status === 'Resolved'">
                        {{ rep.status === 'Pending' ? 'Chờ xử lý' : rep.status === 'Processing' ? 'Đang xử lý' : 'Đã giải quyết' }}
                      </span>
                    </div>
                    <p class="report-item-content">{{ rep.content }}</p>
                    <div class="report-item-time">
                      Gửi ngày: {{ rep.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .header-row {
      margin-bottom: 25px;
    }
    .tabs-bar {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1rem;
      font-weight: 600;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-main);
    }
    .tab-btn.active {
      background: rgba(168, 85, 247, 0.1);
      color: var(--color-primary-light);
      border-bottom: 2px solid var(--color-primary-light);
    }
    
    .bills-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .bill-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-top: 3px solid var(--color-danger);
    }
    .bill-card.paid-border {
      border-top-color: var(--color-success);
    }
    .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .bill-details-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .text-xs { font-size: 0.75rem; }
    .text-success { color: var(--color-success-light) !important; }
    .text-primary-color { color: var(--color-primary-light); }
    .font-bold { font-weight: 700; }
    
    .bill-total-row {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      color: var(--text-main);
      font-size: 1rem;
    }
    .total-val {
      color: var(--color-primary-light);
      font-size: 1.15rem;
    }
    .paid-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--color-success-light);
      font-weight: 600;
      font-size: 0.85rem;
      background: rgba(16, 185, 129, 0.08);
      padding: 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(16, 185, 129, 0.15);
    }
    .check-icon {
      font-size: 1rem;
    }
    .btn-block {
      width: 100%;
    }
    .mt-4 { margin-top: 24px; }
    .mt-3 { margin-top: 16px; }
    .my-2 { margin: 8px 0; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }

    /* Reports layout styles */
    .reports-layout {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 30px;
    }
    @media (max-width: 800px) {
      .reports-layout {
        grid-template-columns: 1fr;
      }
    }
    .report-form-panel {
      padding: 24px;
      height: fit-content;
    }
    .room-info-card-lite {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
    }
    .room-info-card-lite .icon {
      font-size: 1.5rem;
    }
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .reports-history-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 520px;
      overflow-y: auto;
      padding-right: 5px;
    }
    .report-item-card {
      padding: 18px;
      border-left: 3px solid var(--color-primary-light);
    }
    .report-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 10px;
    }
    .report-item-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .report-item-content {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .report-item-time {
      font-size: 0.75rem;
      color: var(--text-dark);
      margin-top: 12px;
      text-align: right;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 60px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
    }
  `]
})
export class TenantBillsComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly reportService = inject(ReportService);
  private readonly toastService = inject(ToastService);

  // General tab state
  activeTab = signal<'bills' | 'reports'>('bills');

  // Bills states
  bills = signal<any[]>([]);
  isLoading = signal(true);

  // Reports states
  reports = signal<any[]>([]);
  isLoadingReports = signal(false);
  isSubmittingReport = signal(false);
  newReport = { title: '', content: '' };

  ngOnInit(): void {
    this.fetchBills();
    this.fetchReports();
  }

  fetchBills(): void {
    this.isLoading.set(true);
    this.billService.getTenantBills().subscribe({
      next: (data) => {
        this.bills.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách hóa đơn từ máy chủ.', 'error');
      }
    });
  }

  fetchReports(): void {
    this.isLoadingReports.set(true);
    this.reportService.getMyReports().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoadingReports.set(false);
      },
      error: () => {
        this.isLoadingReports.set(false);
        this.toastService.show('Lỗi tải danh sách phản ánh sự cố.', 'error');
      }
    });
  }

  submitReport(): void {
    if (!this.newReport.title.trim() || !this.newReport.content.trim()) {
      this.toastService.show('Vui lòng điền đầy đủ tiêu đề và nội dung phản ánh.', 'info');
      return;
    }

    this.isSubmittingReport.set(true);
    this.reportService.createReport(this.newReport).subscribe({
      next: (res) => {
        this.toastService.show(res.message || 'Gửi phản ánh sự cố thành công!', 'success');
        this.newReport = { title: '', content: '' };
        this.isSubmittingReport.set(false);
        this.fetchReports(); // reload reports history
      },
      error: (err) => {
        this.isSubmittingReport.set(false);
        this.toastService.show(err.error?.message || 'Có lỗi xảy ra khi gửi phản ánh.', 'error');
      }
    });
  }

  payBill(billId: number, maxAmount: number): void {
    const input = window.prompt(`Nhập số tiền muốn thanh toán (Tối đa: ${maxAmount}):`, maxAmount.toString());
    if (!input) return;

    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0 || amount > maxAmount) {
      this.toastService.show('Số tiền không hợp lệ. Phải lớn hơn 0 và không vượt quá số còn lại.', 'error');
      return;
    }

    if (!confirm(`Bạn có đồng ý thanh toán ${amount}đ cho hóa đơn này không?`)) return;
    
    this.billService.payBill(billId, amount).subscribe({
      next: () => {
        this.toastService.show('Thanh toán thành công!', 'success');
        this.fetchBills(); // refresh list
      },
      error: () => {
        this.toastService.show('Có lỗi xảy ra khi thực hiện thanh toán.', 'error');
      }
    });
  }
}
