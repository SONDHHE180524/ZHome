import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-transactions-container animate-fade-in">
      <div class="header-row">
        <div>
          <span class="page-category">Hệ Thống Phân Hệ Quản Trị Viên</span>
          <h1>Lịch Sử Giao Dịch Chủ Trọ Với Hệ Thống</h1>
          <p>Đối soát toàn bộ dòng tiền giao dịch mua và gia hạn gói cước nền tảng ZHome của chủ trọ qua cổng SePay theo từng tháng.</p>
        </div>
      </div>

      <!-- Filters & Summary Card -->
      <div class="toolbar-card">
        <div class="filter-group">
          <!-- Month Filter Selector -->
          <div class="filter-item">
            <label>Chọn Kỳ Tháng Đối Soát:</label>
            <div class="month-selector-wrap">
              <select 
                [ngModel]="selectedMonth()" 
                (ngModelChange)="onMonthChange($event)" 
                class="form-select month-select">
                <option value="2026-11">📅 Tháng 11/2026 (Hiện tại)</option>
                <option value="2026-10">📅 Tháng 10/2026</option>
                <option value="2026-09">📅 Tháng 09/2026</option>
                <option value="all">🌐 Tất Cả Các Tháng</option>
              </select>
            </div>
          </div>

          <div class="filter-item search-item">
            <label>Tìm kiếm mã đơn / Ref / gói cước:</label>
            <input 
              type="text" 
              [(ngModel)]="systemSearchTerm" 
              placeholder="Nhập mã ZH, mã Ref, người nộp..." 
              class="form-input">
          </div>

          <div class="filter-item action-item">
            <label>&nbsp;</label>
            <button class="btn btn-refresh" (click)="loadSystemTransactions()" title="Làm mới đối soát SePay">
              🔄 Làm mới
            </button>
          </div>
        </div>

        <div class="summary-box system-box">
          <span class="summary-label">
            {{ getSummaryLabel() }}
          </span>
          <strong class="summary-amount">{{ systemTotalRevenue() | number:'1.0-0' }} VNĐ</strong>
          <span class="summary-count">{{ filteredSystemTransactions().length }} giao dịch thành công</span>
        </div>
      </div>

      @if (isSystemLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang đối soát giao dịch trực tiếp từ cổng SePay...</p>
        </div>
      } @else if (filteredSystemTransactions().length === 0) {
        <div class="empty-card">
          <span class="empty-icon">📂</span>
          <h3>Chưa có giao dịch gia hạn nào</h3>
          <p>Không tìm thấy giao dịch mua gói cước nào trong kỳ {{ getMonthDisplayLabel() }}.</p>
        </div>
      } @else {
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã GD (SePay)</th>
                  <th>Mã Đơn Hàng</th>
                  <th>Người Nộp</th>
                  <th>Gói Cước Đăng Ký</th>
                  <th>Số Tiền (VNĐ)</th>
                  <th>Tài Khoản Thụ Hưởng</th>
                  <th>Nội Dung Chuyển Khoản</th>
                  <th>Thời Gian GD</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of filteredSystemTransactions(); track tx.transactionId) {
                  <tr>
                    <td>
                      <strong class="tx-id">#SP-{{ tx.transactionId }}</strong>
                      <div class="text-xs text-muted">Ref: {{ tx.referenceNumber }}</div>
                    </td>
                    <td>
                      <span class="order-tag">{{ tx.orderCode || 'N/A' }}</span>
                    </td>
                    <td>
                      <strong class="landlord-name">{{ (tx.payerName && !tx.payerName.includes('Admin')) ? tx.payerName : 'Chủ trọ hệ thống' }}</strong>
                      <div class="text-xs text-muted">{{ (tx.payerPhone && !tx.payerPhone.includes('0375')) ? tx.payerPhone : 'Thanh toán SePay' }}</div>
                    </td>
                    <td>
                      <span class="package-badge" [class.package-vip]="tx.amount >= 199000">
                        ⭐ {{ tx.packageName }}
                      </span>
                    </td>
                    <td>
                      <strong class="amount-val primary">{{ tx.amount | number:'1.0-0' }} đ</strong>
                    </td>
                    <td>
                      <span class="bank-tag">{{ tx.bankBrandName }} - {{ tx.accountNumber }}</span>
                      <div class="text-xs text-muted">Admin nhận: NGUYEN THANH TUNG</div>
                    </td>
                    <td>
                      <span class="note-box" [title]="tx.transactionContent">{{ tx.transactionContent }}</span>
                    </td>
                    <td class="text-sm">
                      <strong>{{ tx.transactionDate | date:'dd/MM/yyyy' }}</strong>
                      <div class="text-xs text-muted">{{ tx.transactionDate | date:'HH:mm:ss' }}</div>
                    </td>
                    <td>
                      <span class="badge-success">✓ {{ tx.status }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-transactions-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-category {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #2563eb;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .header-row h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      margin: 8px 0 4px;
    }

    .header-row p {
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 24px;
    }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 24px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .filter-group {
      display: flex;
      gap: 20px;
      align-items: flex-end;
      flex-wrap: wrap;
      flex: 1;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-item label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }

    .month-select {
      padding: 10px 14px;
      border: 2px solid #93c5fd;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e3a8a;
      background: #eff6ff;
      outline: none;
      min-width: 260px;
      cursor: pointer;
    }

    .btn-refresh {
      padding: 10px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      font-size: 0.88rem;
    }

    .btn-refresh:hover {
      background: #e2e8f0;
    }

    .form-input {
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      min-width: 280px;
      background: #f8fafc;
      outline: none;
    }

    .summary-box.system-box {
      background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .summary-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .summary-amount {
      font-size: 1.4rem;
      font-weight: 800;
      color: #4ade80;
    }

    .summary-count {
      font-size: 0.78rem;
      color: #cbd5e1;
    }

    .loading-state, .empty-card {
      text-align: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
    }

    .empty-icon {
      font-size: 2.4rem;
      display: block;
      margin-bottom: 12px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .data-table th, .data-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tx-id {
      color: #2563eb;
    }

    .order-tag {
      background: #f1f5f9;
      color: #0f172a;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .package-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .package-badge.package-vip {
      background: #fef3c7;
      color: #b45309;
    }

    .bank-tag {
      font-size: 0.82rem;
      color: #475569;
      font-weight: 600;
    }

    .note-box {
      display: inline-block;
      max-width: 240px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #64748b;
      font-size: 0.82rem;
    }

    .landlord-name {
      color: #334155;
      font-weight: 600;
    }

    .amount-val.primary {
      color: #2563eb;
      font-size: 1rem;
    }

    .text-muted { color: #64748b; }
    .text-sm { font-size: 0.82rem; color: #64748b; }
    .text-xs { font-size: 0.75rem; }

    .badge-success {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
    }
  `]
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  isSystemLoading = signal<boolean>(true);
  allTransactions = signal<any[]>([]);
  // Mặc định chọn tháng 11/2026
  selectedMonth = signal<string>('2026-11');
  systemSearchTerm: string = '';

  filteredSystemTransactions = computed(() => {
    let list = this.allTransactions();

    // 1. Loại bỏ giao dịch chuyển nhầm theo yêu cầu của Admin:
    // Giao dịch chuyển nhầm: ID 95852409 hoặc Ref 106T26B043KBE6WY (chỉ giữ đúng 2 giao dịch 199k)
    list = list.filter(tx => 
      tx.transactionId !== '95852409' && 
      tx.referenceNumber !== '106T26B043KBE6WY'
    );

    // 2. Lọc theo kỳ tháng được chọn
    const month = this.selectedMonth();
    if (month !== 'all') {
      list = list.filter(tx => {
        if (!tx.transactionDate) return false;
        return String(tx.transactionDate).startsWith(month);
      });
    }

    // 3. Lọc theo từ khóa tìm kiếm
    if (this.systemSearchTerm.trim()) {
      const term = this.systemSearchTerm.toLowerCase();
      list = list.filter(tx =>
        (tx.transactionContent && tx.transactionContent.toLowerCase().includes(term)) ||
        (tx.orderCode && tx.orderCode.toLowerCase().includes(term)) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(term)) ||
        (tx.payerName && tx.payerName.toLowerCase().includes(term)) ||
        (tx.payerPhone && tx.payerPhone.toLowerCase().includes(term)) ||
        (tx.packageName && tx.packageName.toLowerCase().includes(term)) ||
        String(tx.transactionId).includes(term)
      );
    }

    return list;
  });

  systemTotalRevenue = computed(() => {
    return this.filteredSystemTransactions().reduce((sum, tx) => sum + (tx.amount || 0), 0);
  });

  ngOnInit(): void {
    this.loadSystemTransactions();
  }

  onMonthChange(month: string): void {
    this.selectedMonth.set(month || '2026-11');
  }

  getMonthDisplayLabel(): string {
    switch (this.selectedMonth()) {
      case '2026-11': return 'Tháng 11/2026';
      case '2026-10': return 'Tháng 10/2026';
      case '2026-09': return 'Tháng 09/2026';
      default: return 'Tất cả các tháng';
    }
  }

  getSummaryLabel(): string {
    const m = this.selectedMonth();
    if (m === 'all') return 'Tổng Thu Toàn Bộ Các Tháng';
    return `Doanh Thu Gói Cước ${this.getMonthDisplayLabel()}`;
  }

  loadSystemTransactions(): void {
    this.isSystemLoading.set(true);
    // Tải toàn bộ giao dịch để việc lọc theo từng tháng trên giao diện diễn ra tức thì
    this.adminService.getSystemTransactions(true).subscribe({
      next: (data) => {
        this.allTransactions.set(data || []);
        this.isSystemLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading system transactions:', err);
        this.toastService.show('Không thể tải lịch sử giao dịch chủ trọ.', 'error');
        this.isSystemLoading.set(false);
      }
    });
  }
}
