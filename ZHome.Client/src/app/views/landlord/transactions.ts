import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { BillService } from '../../services/bill.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landlord-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="transactions-container animate-fade-in">
      <div class="header-row mb-4">
        <div>
          <h1>Lịch Sử Giao Dịch</h1>
          <p>Xem toàn bộ biến động số dư và các giao dịch thanh toán</p>
        </div>
      </div>

      <div class="split-layout">
        <!-- Bên trái: Lịch sử sinh viên thanh toán cho chủ trọ -->
        <div class="glass-panel transaction-panel">
          <div class="panel-header">
            <h3><span class="icon">👥</span> Sinh Viên Thanh Toán (Tiền Phòng)</h3>
            <span class="badge badge-success">+ {{ totalTenantPaid() | number:'1.0-0' }}đ (Tổng thu)</span>
          </div>
          
          <div class="transaction-list">
            @if (isLoading()) {
              <div class="text-center p-3 text-muted">Đang tải lịch sử giao dịch...</div>
            } @else if (tenantTransactions().length > 0) {
              @for (tx of tenantTransactions(); track tx.id) {
                <div class="transaction-item">
                  <div class="tx-icon receive">↓</div>
                  <div class="tx-details">
                    <div class="tx-title">{{ tx.title }}</div>
                    <div class="tx-meta">{{ tx.date }} • P.{{ tx.roomNumber }} • {{ tx.method }}</div>
                  </div>
                  <div class="tx-amount positive">+{{ tx.amount | number:'1.0-0' }}đ</div>
                </div>
              }
            } @else {
              <div class="empty-state text-center" style="padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">🤝</div>
                <h4>Chưa có giao dịch thu tiền</h4>
                <p style="font-size: 0.9rem; margin-top: 5px;">Khi sinh viên thanh toán hóa đơn, giao dịch sẽ hiện ở đây.</p>
              </div>
            }
          </div>
        </div>

        <!-- Bên phải: Lịch sử chủ trọ thanh toán gói ZHome -->
        <div class="glass-panel transaction-panel">
          <div class="panel-header">
            <h3><span class="icon">💎</span> Lịch Sử Mua Gói ZHome</h3>
          </div>
          
          <div class="transaction-list">
            @if (subscriptionTransactions().length > 0) {
              @for (tx of subscriptionTransactions(); track tx.id) {
                <div class="transaction-item">
                  <div class="tx-icon spend">↑</div>
                  <div class="tx-details">
                    <div class="tx-title">{{ tx.title }}</div>
                    <div class="tx-meta">{{ tx.date }} • {{ tx.method }}</div>
                    @if (tx.status === 'Success') {
                      <span class="status-badge success">Thành công</span>
                    } @else {
                      <span class="status-badge pending">Đang xử lý</span>
                    }
                  </div>
                  <div class="tx-amount negative">-{{ tx.amount | number:'1.0-0' }}đ</div>
                </div>
              }
            } @else {
              <div class="empty-state text-center" style="padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">🧾</div>
                <h4>Chưa có giao dịch nào</h4>
                <p style="font-size: 0.9rem; margin-top: 5px;">Tài khoản của bạn hiện chưa mua hoặc nâng cấp gói dịch vụ nào.</p>
                <a routerLink="/landlord/packages" class="btn btn-primary btn-sm mt-3" style="margin-top: 15px;">Khám phá các gói cước</a>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .transactions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .mb-4 { margin-bottom: 24px; }
    
    .split-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .split-layout {
        grid-template-columns: 1fr;
      }
    }
    
    .transaction-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 500px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--border-color);
    }
    .panel-header h3 {
      font-size: 1.2rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .transaction-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    
    .transaction-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.4);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }
    .transaction-item:hover {
      background: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .tx-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
      margin-right: 16px;
      flex-shrink: 0;
    }
    .tx-icon.receive {
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-success);
    }
    .tx-icon.spend {
      background: rgba(244, 63, 94, 0.15);
      color: var(--color-danger);
    }
    
    .tx-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .tx-title {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1.05rem;
    }
    .tx-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    
    .tx-amount {
      font-weight: 800;
      font-size: 1.1rem;
      white-space: nowrap;
      margin-left: 10px;
    }
    .tx-amount.positive {
      color: var(--color-success);
    }
    .tx-amount.negative {
      color: var(--color-danger);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      margin-top: 4px;
      width: fit-content;
    }
    .status-badge.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    .status-badge.pending {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
  `]
})
export class LandlordTransactionsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly billService = inject(BillService);

  tenantTransactions = signal<any[]>([]);
  totalTenantPaid = signal<number>(0);
  isLoading = signal(true);

  subscriptionTransactions = signal<any[]>([]);

  ngOnInit() {
    this.fetchTenantTransactions();
    
    const session = this.authService.session();
    if (session && session.subscriptionId && session.subscriptionId > 1) {
      // Dynamic mock: if they actually have a premium package
      const pkgName = session.subscriptionId === 2 ? 'Gói Cơ Bản' : 'Gói Nâng Cao';
      const amount = session.subscriptionId === 2 ? 99000 : 199000;
      
      this.subscriptionTransactions.set([
        { 
          id: 101, 
          title: 'Đăng ký ' + pkgName, 
          date: new Date().toLocaleDateString('vi-VN') + ' 10:00', 
          method: 'Thanh toán trực tuyến', 
          amount: amount, 
          status: 'Success' 
        }
      ]);
    } else {
      this.subscriptionTransactions.set([]);
    }
  }

  fetchTenantTransactions() {
    this.billService.getLandlordBills().subscribe({
      next: (bills) => {
        let allTxs: any[] = [];
        let total = 0;

        const myName = this.authService.userName();

        for (const bill of bills) {
          if (bill.transactions && bill.transactions.length > 0) {
            for (const tx of bill.transactions) {
              // If the landlord logged the payment, the transaction's tenantName might be the landlord's name.
              // We should mask it to show the room number instead.
              let displayName = tx.tenantName || bill.tenantName;
              if (displayName === myName || displayName === 'Khách thuê') {
                displayName = 'Khách thuê phòng ' + bill.roomNumber;
              }

              allTxs.push({
                id: tx.id,
                title: displayName + ' thanh toán tiền',
                date: new Date(tx.createdAt).toLocaleString('vi-VN'),
                roomNumber: bill.roomNumber,
                method: 'Thanh toán',
                amount: tx.amount,
                timestamp: new Date(tx.createdAt).getTime()
              });
              total += tx.amount;
            }
          } else if (bill.paidAmount > 0) {
            // Fallback for bills that are marked as paid but don't have explicit transaction history array
            let displayName = bill.tenantName;
            if (displayName === myName || displayName.startsWith('Phòng')) {
              displayName = 'Khách thuê phòng ' + bill.roomNumber;
            }

            allTxs.push({
              id: 'b_' + bill.id,
              title: displayName + ' thanh toán',
              date: bill.paidAt ? new Date(bill.paidAt).toLocaleString('vi-VN') : 'Kỳ tháng ' + bill.billingMonth + '/' + bill.billingYear,
              roomNumber: bill.roomNumber,
              method: 'Thanh toán',
              amount: bill.paidAmount,
              timestamp: bill.paidAt ? new Date(bill.paidAt).getTime() : 0
            });
            total += bill.paidAmount;
          }
        }
        
        allTxs.sort((a, b) => b.timestamp - a.timestamp);

        this.tenantTransactions.set(allTxs);
        this.totalTenantPaid.set(total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
