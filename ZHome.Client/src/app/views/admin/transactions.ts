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
          <h1>Lịch Sử Giao Dịch Hệ Thống</h1>
          <p>Quản lý và đối soát toàn bộ dòng tiền giao dịch gói cước chủ trọ với hệ thống và tiền trọ của sinh viên.</p>
        </div>
      </div>

      <!-- Tab Navigation Switcher -->
      <div class="tab-navigation">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'system'"
          (click)="switchTab('system')">
          <span class="tab-icon">💳</span>
          <span>Chủ Trọ Gia Hạn Với Hệ Thống</span>
          @if (systemTransactions().length > 0) {
            <span class="tab-badge">{{ systemTransactions().length }}</span>
          }
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'tenant'"
          (click)="switchTab('tenant')">
          <span class="tab-icon">🏠</span>
          <span>Sinh Viên Với Chủ Trọ (Tiền Trọ)</span>
          @if (transactions().length > 0) {
            <span class="tab-badge secondary">{{ transactions().length }}</span>
          }
        </button>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: GIAO DỊCH CHỦ TRỌ GIA HẠN VỚI HỆ THỐNG (MẶC ĐỊNH) -->
      <!-- ========================================== -->
      @if (activeTab() === 'system') {
        <!-- Filters & Summary Card for System Subscriptions -->
        <div class="toolbar-card">
          <div class="filter-group">
            <div class="filter-item">
              <label>Thời Gian Giao Dịch:</label>
              <div class="date-filter-toggle">
                <button 
                  type="button" 
                  class="btn-toggle" 
                  [class.active]="!allMonths()"
                  (click)="toggleAllMonths(false)">
                  📅 Chỉ Từ Đầu Tháng Này (Tháng 11/2026)
                </button>
                <button 
                  type="button" 
                  class="btn-toggle" 
                  [class.active]="allMonths()"
                  (click)="toggleAllMonths(true)">
                  🌐 Tất Cả Các Tháng
                </button>
              </div>
            </div>

            <div class="filter-item search-item">
              <label>Tìm kiếm mã đơn / Ref / ghi chú:</label>
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
              {{ allMonths() ? 'Tổng Thu Toàn Bộ Gói Cước' : 'Doanh Thu Gói Cước Tháng Này' }}
            </span>
            <strong class="summary-amount">{{ systemTotalRevenue() | number:'1.0-0' }} VNĐ</strong>
            <span class="summary-count">{{ filteredSystemTransactions().length }} giao dịch mua gói thành công</span>
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
            <p>{{ allMonths() ? 'Hệ thống chưa ghi nhận giao dịch chủ trọ mua gói nào.' : 'Chưa có giao dịch mua gói cước nào từ đầu tháng này. Bạn có thể chọn "Tất cả các tháng" để xem lịch sử trước đó.' }}</p>
          </div>
        } @else {
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mã GD (SePay)</th>
                    <th>Mã Đơn Hàng</th>
                    <th>Chủ Trọ / Người Nộp</th>
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
                        <strong class="landlord-name">{{ tx.payerName }}</strong>
                        <div class="text-xs text-muted">{{ tx.payerPhone }}</div>
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
      }

      <!-- ========================================== -->
      <!-- TAB 2: GIAO DỊCH SINH VIÊN VỚI CHỦ TRỌ (MỤC KHÁC) -->
      <!-- ========================================== -->
      @if (activeTab() === 'tenant') {
        <!-- Filters & Summary Card -->
        <div class="toolbar-card">
          <div class="filter-group">
            <div class="filter-item">
              <label>Lọc Theo Nhà Trọ:</label>
              <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyChange($event)" class="form-select">
                <option [value]="0">-- Tất cả nhà trọ hệ thống --</option>
                @for (p of propertyOptions(); track p.id) {
                  <option [value]="p.id">{{ p.title }} ({{ p.landlordName }})</option>
                }
              </select>
            </div>

            <div class="filter-item">
              <label>Tìm kiếm ghi chú / mã GD:</label>
              <input type="text" [(ngModel)]="searchTerm" placeholder="Nhập từ khóa phòng, tên..." class="form-input">
            </div>
          </div>

          <div class="summary-box">
            <span class="summary-label">Tổng Tiền Trọ Sinh Viên Nộp</span>
            <strong class="summary-amount">{{ totalRevenue() | number:'1.0-0' }} VNĐ</strong>
            <span class="summary-count">{{ filteredTransactions().length }} giao dịch thanh toán</span>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Đang tải lịch sử giao dịch sinh viên...</p>
          </div>
        } @else if (filteredTransactions().length === 0) {
          <div class="empty-card">
            <span class="empty-icon">📂</span>
            <h3>Chưa có dữ liệu giao dịch</h3>
            <p>Không tìm thấy lịch sử thanh toán tiền trọ nào phù hợp bộ lọc.</p>
          </div>
        } @else {
          <div class="table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Nhà Trọ</th>
                    <th>Phòng</th>
                    <th>Chủ Trọ</th>
                    <th>Số Tiền (VNĐ)</th>
                    <th>Kỳ Hóa Đơn</th>
                    <th>Nội Dung / Ghi Chú</th>
                    <th>Thời Gian</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of filteredTransactions(); track tx.transactionId) {
                    <tr>
                      <td><strong class="tx-id">#TX-{{ tx.transactionId }}</strong></td>
                      <td>
                        <span class="prop-title">{{ tx.propertyTitle }}</span>
                      </td>
                      <td>
                        <span class="room-tag">Phòng {{ tx.roomNumber }}</span>
                      </td>
                      <td>
                        <span class="landlord-name">{{ tx.landlordName }}</span>
                      </td>
                      <td>
                        <strong class="amount-val">{{ tx.amount | number:'1.0-0' }} đ</strong>
                      </td>
                      <td>Tháng {{ tx.billingMonth }}/{{ tx.billingYear }}</td>
                      <td class="text-muted">{{ tx.note }}</td>
                      <td class="text-sm">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
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

    /* Tab navigation */
    .tab-navigation {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid transparent;
      background: #f8fafc;
      color: #64748b;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .tab-btn.active {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
    }

    .tab-icon {
      font-size: 1.1rem;
    }

    .tab-badge {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .tab-badge.secondary {
      background: #64748b;
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

    .date-filter-toggle {
      display: flex;
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
    }

    .btn-toggle {
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 700;
      border: none;
      background: transparent;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-toggle.active {
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
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

    .form-select, .form-input {
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      min-width: 250px;
      background: #f8fafc;
      outline: none;
    }

    .summary-box {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .summary-box.system-box {
      background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
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

    .prop-title {
      font-weight: 700;
      color: #0f172a;
    }

    .room-tag {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .landlord-name {
      color: #334155;
      font-weight: 600;
    }

    .amount-val {
      color: #15803d;
      font-size: 0.95rem;
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

  // Active Tab: 'system' (Chủ trọ gia hạn với hệ thống) or 'tenant' (Sinh viên với chủ trọ)
  activeTab = signal<'system' | 'tenant'>('system');

  // ==========================================
  // SYSTEM SUBSCRIPTION TRANSACTIONS (TAB 1)
  // ==========================================
  isSystemLoading = signal<boolean>(true);
  systemTransactions = signal<any[]>([]);
  allMonths = signal<boolean>(false); // Mặc định: Chỉ tính từ đầu tháng này!
  systemSearchTerm: string = '';

  filteredSystemTransactions = computed(() => {
    let list = this.systemTransactions();
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

  // ==========================================
  // TENANT BILL TRANSACTIONS (TAB 2)
  // ==========================================
  isLoading = signal<boolean>(false);
  transactions = signal<any[]>([]);
  selectedPropertyId = signal<number>(0);
  searchTerm: string = '';

  propertyOptions = computed(() => {
    const list = this.transactions();
    const map = new Map<number, { id: number; title: string; landlordName: string }>();
    for (const tx of list) {
      if (tx.propertyId && !map.has(tx.propertyId)) {
        map.set(tx.propertyId, {
          id: tx.propertyId,
          title: tx.propertyTitle,
          landlordName: tx.landlordName
        });
      }
    }
    return Array.from(map.values());
  });

  filteredTransactions = computed(() => {
    let list = this.transactions();
    const propId = this.selectedPropertyId();
    if (propId > 0) {
      list = list.filter(tx => tx.propertyId === propId);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(tx =>
        (tx.note && tx.note.toLowerCase().includes(term)) ||
        (tx.propertyTitle && tx.propertyTitle.toLowerCase().includes(term)) ||
        (tx.landlordName && tx.landlordName.toLowerCase().includes(term)) ||
        String(tx.transactionId).includes(term)
      );
    }
    return list;
  });

  totalRevenue = computed(() => {
    return this.filteredTransactions().reduce((sum, tx) => sum + (tx.amount || 0), 0);
  });

  ngOnInit(): void {
    // Load system subscription transactions first (default tab)
    this.loadSystemTransactions();
    // Pre-load tenant transactions in background
    this.loadTenantTransactions();
  }

  switchTab(tab: 'system' | 'tenant'): void {
    this.activeTab.set(tab);
    if (tab === 'system' && this.systemTransactions().length === 0) {
      this.loadSystemTransactions();
    } else if (tab === 'tenant' && this.transactions().length === 0) {
      this.loadTenantTransactions();
    }
  }

  toggleAllMonths(all: boolean): void {
    this.allMonths.set(all);
    this.loadSystemTransactions();
  }

  loadSystemTransactions(): void {
    this.isSystemLoading.set(true);
    this.adminService.getSystemTransactions(this.allMonths()).subscribe({
      next: (data) => {
        this.systemTransactions.set(data || []);
        this.isSystemLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading system transactions:', err);
        this.toastService.show('Không thể tải lịch sử giao dịch chủ trọ.', 'error');
        this.isSystemLoading.set(false);
      }
    });
  }

  loadTenantTransactions(): void {
    this.isLoading.set(true);
    this.adminService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenant transactions:', err);
        this.isLoading.set(false);
      }
    });
  }

  onPropertyChange(val: any): void {
    this.selectedPropertyId.set(Number(val) || 0);
  }
}
