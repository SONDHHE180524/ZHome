import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="activity-workspace animate-fade-in">

      <!-- HEADER BANNER -->
      <div class="header-banner">
        <div>
          <span class="page-category">Hệ Thống Giám Sát & Bảo Mật</span>
          <h1>Nhật Ký Hoạt Động & Kiểm Tra Thời Gian Tài Khoản</h1>
          <p>Theo dõi thời gian hoạt động, lịch sử đăng nhập, thiết bị và các thao tác của từng tài khoản trong hệ thống.</p>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm" (click)="loadLogs()" title="Làm mới dữ liệu">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-blue">📊</div>
          <div>
            <div class="kpi-val">{{ stats().totalActivities }}</div>
            <div class="kpi-lbl">Tổng hoạt động ghi nhận</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-emerald">🟢</div>
          <div>
            <div class="kpi-val text-emerald">{{ stats().todayActivities }}</div>
            <div class="kpi-lbl">Hoạt động hôm nay</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-purple">👥</div>
          <div>
            <div class="kpi-val text-purple">{{ stats().activeUsersToday }}</div>
            <div class="kpi-lbl">Tài khoản hoạt động hôm nay</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">🔑</div>
          <div>
            <div class="kpi-val text-amber">{{ stats().totalLogins }}</div>
            <div class="kpi-lbl">Lượt đăng nhập hệ thống</div>
          </div>
        </div>
      </div>

      <!-- TOOLBAR & FILTERS -->
      <div class="filter-panel">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchKeyword" 
            (keyup.enter)="onSearch()"
            placeholder="Tìm theo người dùng, thao tác, IP, mô tả..." 
            class="filter-search-input" />
        </div>

        <div class="filter-group">
          <label>Vai trò:</label>
          <select [(ngModel)]="selectedRole" (change)="onSearch()" class="filter-select">
            <option value="All">Tất cả vai trò</option>
            <option value="Administrator">Admin</option>
            <option value="Landlord">Chủ trọ</option>
            <option value="Tenant">Người thuê</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Loại hành động:</label>
          <select [(ngModel)]="selectedAction" (change)="onSearch()" class="filter-select">
            <option value="All">Tất cả hành động</option>
            <option value="Đăng nhập">Đăng nhập</option>
            <option value="Đăng ký tài khoản">Đăng ký tài khoản</option>
            <option value="Quản lý nhà trọ">Quản lý nhà trọ</option>
            <option value="Quản trị hệ thống">Quản trị hệ thống</option>
            <option value="Tìm kiếm phòng">Tìm kiếm phòng</option>
          </select>
        </div>

        <button class="btn btn-primary btn-sm" (click)="onSearch()">
          Tìm kiếm
        </button>
        <button class="btn btn-secondary btn-sm" (click)="resetFilters()">
          Đặt lại
        </button>
      </div>

      <!-- LOGS TABLE -->
      <div class="table-card">
        @if (isLoading()) {
          <div class="table-loading">
            <div class="spinner"></div>
            <p>Đang tải nhật ký hoạt động...</p>
          </div>
        } @else if (logsList().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📜</span>
            <h3>Không có bản ghi nhật ký nào</h3>
            <p>Không tìm thấy hoạt động nào phù hợp với bộ lọc tìm kiếm.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="logs-table">
              <thead>
                <tr>
                  <th style="min-width: 170px;">Thời gian</th>
                  <th style="min-width: 200px;">Người dùng</th>
                  <th style="min-width: 130px;">Vai trò</th>
                  <th style="min-width: 170px;">Hành động</th>
                  <th style="min-width: 260px;">Chi tiết hoạt động</th>
                  <th style="min-width: 130px;">Địa chỉ IP</th>
                  <th style="min-width: 160px;">Thiết bị</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logsList(); track log.id) {
                  <tr>
                    <!-- Cột 1: Thời gian -->
                    <td>
                      <div class="time-col">
                        <strong class="time-main">{{ log.createdAt | date:'HH:mm:ss' }}</strong>
                        <span class="date-sub">{{ log.createdAt | date:'dd/MM/yyyy' }}</span>
                        <span class="ago-tag">{{ formatTimeAgo(log.createdAt) }}</span>
                      </div>
                    </td>

                    <!-- Cột 2: Người dùng -->
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar" [class.avatar-admin]="log.userRole === 'Administrator'" [class.avatar-landlord]="log.userRole === 'Landlord'">
                          {{ getInitials(log.userName) }}
                        </div>
                        <div class="user-info-text">
                          <strong class="user-name">{{ log.userName || 'Tài khoản ẩn' }}</strong>
                          <span class="user-id">ID: #{{ log.userId || 'N/A' }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Cột 3: Vai trò -->
                    <td>
                      <span class="role-badge" [ngClass]="getRoleBadgeClass(log.userRole)">
                        {{ getRoleDisplayName(log.userRole) }}
                      </span>
                    </td>

                    <!-- Cột 4: Hành động -->
                    <td>
                      <span class="action-tag" [ngClass]="getActionTagClass(log.action)">
                        <span class="action-icon">{{ getActionIcon(log.action) }}</span>
                        {{ log.action }}
                      </span>
                    </td>

                    <!-- Cột 5: Chi tiết -->
                    <td>
                      <span class="desc-text">{{ log.description || 'Không có mô tả chi tiết' }}</span>
                    </td>

                    <!-- Cột 6: IP -->
                    <td>
                      <code class="ip-code">{{ log.ipAddress || '127.0.0.1' }}</code>
                    </td>

                    <!-- Cột 7: Thiết bị -->
                    <td>
                      <span class="device-text" [title]="log.userAgent || ''">{{ formatDevice(log.userAgent) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- PHÂN TRANG -->
          <div class="pagination-footer">
            <div class="pagination-info">
              Hiển thị <strong>{{ (currentPage() - 1) * pageSize() + 1 }}</strong> - 
              <strong>{{ Math.min(currentPage() * pageSize(), totalItems()) }}</strong> / 
              <strong>{{ totalItems() }}</strong> hoạt động
            </div>

            <div class="pagination-controls">
              <button 
                class="page-btn" 
                [disabled]="currentPage() === 1" 
                (click)="goToPage(currentPage() - 1)">
                ‹ Trước
              </button>
              <span class="page-current">Trang {{ currentPage() }} / {{ totalPages() || 1 }}</span>
              <button 
                class="page-btn" 
                [disabled]="currentPage() >= totalPages()" 
                (click)="goToPage(currentPage() + 1)">
                Sau ›
              </button>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .activity-workspace {
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px;
    }

    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      padding: 24px 28px;
      color: #ffffff;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-category {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .header-banner h1 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 6px 0;
    }

    .header-banner p {
      color: #94a3b8;
      font-size: 0.88rem;
      margin: 0;
    }

    /* KPI METRICS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .icon-blue { background: #eff6ff; }
    .icon-emerald { background: #ecfdf5; }
    .icon-purple { background: #faf5ff; }
    .icon-amber { background: #fefce8; }

    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }

    .kpi-lbl {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 3px;
    }

    .text-emerald { color: #059669; }
    .text-purple { color: #7c3aed; }
    .text-amber { color: #d97706; }

    /* FILTERS */
    .filter-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex-grow: 1;
      min-width: 260px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }

    .filter-search-input {
      width: 100%;
      padding: 9px 12px 9px 36px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
    }

    .filter-search-input:focus {
      border-color: #2563eb;
      background: #ffffff;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
    }

    .filter-select {
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.82rem;
      outline: none;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-sm { padding: 8px 14px; }
    .btn-primary { background: #2563eb; color: #ffffff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }

    /* TABLE */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .logs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .logs-table th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .logs-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      font-size: 0.83rem;
    }

    .logs-table tr:hover {
      background: #fcfdfe;
    }

    .time-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .time-main {
      font-size: 0.85rem;
      color: #0f172a;
    }
    .date-sub {
      font-size: 0.72rem;
      color: #64748b;
    }
    .ago-tag {
      font-size: 0.7rem;
      color: #0284c7;
      font-weight: 600;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-weight: 800;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-avatar.avatar-admin { background: #faf5ff; color: #7c3aed; }
    .user-avatar.avatar-landlord { background: #eff6ff; color: #2563eb; }
    .user-info-text {
      display: flex;
      flex-direction: column;
    }
    .user-name { font-size: 0.83rem; color: #0f172a; }
    .user-id { font-size: 0.7rem; color: #94a3b8; }

    .role-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .badge-role-admin { background: #faf5ff; color: #7c3aed; border: 1px solid #e9d5ff; }
    .badge-role-landlord { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge-role-tenant { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    .action-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .act-login { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .act-prop { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .act-admin { background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .act-other { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .desc-text {
      color: #334155;
      font-size: 0.82rem;
      line-height: 1.4;
      display: block;
      max-width: 320px;
    }

    .ip-code {
      font-family: monospace;
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #475569;
    }

    .device-text {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
      display: block;
    }

    /* PAGINATION */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 12px;
    }
    .pagination-info { font-size: 0.8rem; color: #64748b; }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-btn {
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-current { font-size: 0.8rem; font-weight: 700; color: #334155; }

    .table-loading, .empty-state {
      padding: 40px;
      text-align: center;
    }
    .empty-icon { font-size: 2.2rem; display: block; margin-bottom: 8px; }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class AdminActivityLogsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  Math = Math;

  isLoading = signal(true);
  logsList = signal<any[]>([]);
  totalItems = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);

  stats = signal<any>({
    totalActivities: 0,
    todayActivities: 0,
    activeUsersToday: 0,
    totalLogins: 0
  });

  searchKeyword: string = '';
  selectedRole: string = 'All';
  selectedAction: string = 'All';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.adminService.getActivityLogs({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      role: this.selectedRole,
      action: this.selectedAction,
      keyword: this.searchKeyword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.logsList.set(res.items || []);
        this.totalItems.set(res.totalItems || 0);
        this.totalPages.set(res.totalPages || 1);
        if (res.stats) {
          this.stats.set(res.stats);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Không thể tải nhật ký hoạt động.', 'error');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedRole = 'All';
    this.selectedAction = 'All';
    this.currentPage.set(1);
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs();
    }
  }

  formatTimeAgo(dateStr?: string | Date): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Vừa mới xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getRoleDisplayName(roleName: string): string {
    if (!roleName) return 'Khách';
    if (roleName === 'Administrator' || roleName === 'Admin') return 'Admin';
    if (roleName === 'Landlord') return 'Chủ trọ';
    if (roleName === 'Tenant') return 'Người thuê';
    return roleName;
  }

  getRoleBadgeClass(roleName: string): string {
    if (roleName === 'Administrator') return 'badge-role-admin';
    if (roleName === 'Landlord') return 'badge-role-landlord';
    return 'badge-role-tenant';
  }

  getActionTagClass(action: string): string {
    if (!action) return 'act-other';
    const a = action.toLowerCase();
    if (a.includes('đăng nhập') || a.includes('login')) return 'act-login';
    if (a.includes('nhà trọ') || a.includes('phòng')) return 'act-prop';
    if (a.includes('quản trị') || a.includes('admin')) return 'act-admin';
    return 'act-other';
  }

  getActionIcon(action: string): string {
    if (!action) return '⚡';
    const a = action.toLowerCase();
    if (a.includes('đăng nhập') || a.includes('login')) return '🔑';
    if (a.includes('nhà trọ') || a.includes('phòng')) return '🏢';
    if (a.includes('quản trị') || a.includes('admin')) return '🛡️';
    if (a.includes('đăng ký')) return '👤';
    return '⚡';
  }

  formatDevice(ua?: string): string {
    if (!ua) return 'Web / Desktop';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'Mac OS';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Mobile';
    return 'Trình duyệt web';
  }
}
