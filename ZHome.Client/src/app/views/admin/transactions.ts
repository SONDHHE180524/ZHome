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
          <span class="page-category">Hệ Thống Quản Lý Trung Tâm</span>
          <h1>Lịch Sử Giao Dịch Hóa Đơn Trọ</h1>
          <p>Theo dõi lịch sử thanh toán tiền phòng, dịch vụ phân loại chi tiết theo từng nhà trọ riêng biệt.</p>
        </div>
      </div>

      <!-- Filters & Summary Card -->
      <div class="toolbar-card">
        <div class="filter-group">
          <div class="filter-item">
            <label>Chọn Nhà Trọ:</label>
            <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyChange($event)" class="form-select">
              <option [value]="0">-- Tất cả nhà trọ hệ thống --</option>
              @for (p of propertyOptions(); track p.id) {
                <option [value]="p.id">{{ p.title }} ({{ p.landlordName }})</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label>Tìm kiếm ghi chú / mã GD:</label>
            <input type="text" [(ngModel)]="searchTerm" placeholder="Nhập từ khóa..." class="form-input">
          </div>
        </div>

        <div class="summary-box">
          <span class="summary-label">Tổng Giao Dịch Phát Sinh</span>
          <strong class="summary-amount">{{ totalRevenue() | number:'1.0-0' }} VNĐ</strong>
          <span class="summary-count">{{ filteredTransactions().length }} giao dịch thành công</span>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải lịch sử giao dịch...</p>
        </div>
      } @else if (filteredTransactions().length === 0) {
        <div class="empty-card">
          <span class="empty-icon"></span>
          <h3>Chưa có dữ liệu giao dịch</h3>
          <p>Không tìm thấy lịch sử thanh toán nào thuộc về nhà trọ đã chọn.</p>
        </div>
      } @else {
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Nhà trọ</th>
                  <th>Phòng</th>
                  <th>Chủ trọ</th>
                  <th>Số tiền (VNĐ)</th>
                  <th>Kỳ hóa đơn</th>
                  <th>Nội dung / Ghi chú</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
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
                      <span class="badge-success"> {{ tx.status }}</span>
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
      margin-bottom: 28px;
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
      align-items: center;
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

    .text-muted { color: #64748b; }
    .text-sm { font-size: 0.82rem; color: #94a3b8; }

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

  isLoading = signal<boolean>(true);
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
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.adminService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading admin transactions:', err);
        this.toastService.show('Không thể tải lịch sử giao dịch.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onPropertyChange(val: any): void {
    this.selectedPropertyId.set(Number(val) || 0);
  }
}
