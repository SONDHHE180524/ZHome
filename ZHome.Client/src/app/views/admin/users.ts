import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-workspace animate-fade-in">
      
      <!-- TOP BANNER & ACTION -->
      <div class="header-banner">
        <div class="banner-info">
          <h1>Quản Lý Tài Khoản & Phân Quyền</h1>
          <p>Quản lý người dùng, phân quyền (Admin, Chủ trọ, Người thuê), kiểm soát gói cước và trạng thái xác minh.</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo tài khoản mới
          </button>
        </div>
      </div>

      <!-- KPI METRICS SUMMARY -->
      <div class="kpi-row">
        <div class="kpi-mini-card">
          <div class="kpi-mini-val text-primary">{{ userList().length }}</div>
          <div class="kpi-mini-label">Tổng tài khoản</div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-val text-purple">{{ countRole('Administrator') }}</div>
          <div class="kpi-mini-label">Admin</div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-val text-blue">{{ countRole('Landlord') }}</div>
          <div class="kpi-mini-label">Chủ trọ</div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-val text-emerald">{{ countRole('Tenant') }}</div>
          <div class="kpi-mini-label">Người thuê</div>
        </div>
      </div>

      <!-- SEARCH & FILTER TOOLBAR -->
      <div class="filter-panel">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchKeyword" 
            (keyup.enter)="onSearch()"
            placeholder="Tìm theo Tên, Số điện thoại, Email, CCCD..." 
            class="filter-search-input" />
        </div>

        <div class="filter-group">
          <label>Vai trò:</label>
          <select [(ngModel)]="selectedRoleId" (change)="onSearch()" class="filter-select">
            <option [value]="0">Tất cả vai trò</option>
            @for (r of roles(); track r.id) {
              <option [value]="r.id">{{ getRoleDisplayName(r.roleName) }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <label>Xác minh CCCD:</label>
          <select [(ngModel)]="selectedVerificationStatus" (change)="onSearch()" class="filter-select">
            <option value="All">Tất cả trạng thái</option>
            <option value="Approved">Đã xác minh</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="None">Chưa gửi</option>
            <option value="Rejected">Bị từ chối</option>
          </select>
        </div>

        <button class="btn btn-secondary btn-sm" (click)="resetFilters()" title="Đặt lại bộ lọc">
          Đặt lại
        </button>
      </div>

      <!-- MAIN TABLE SECTION -->
      <div class="table-card">
        @if (isLoading()) {
          <div class="table-loading">
            <div class="spinner"></div>
            <p>Đang tải danh sách tài khoản...</p>
          </div>
        } @else if (userList().length === 0) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
            </svg>
            <h3>Không tìm thấy tài khoản nào</h3>
            <p>Thử điều chỉnh từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th style="min-width: 200px;">Người dùng</th>
                  <th style="min-width: 180px;">Số điện thoại / Email</th>
                  <th style="min-width: 140px;">Vai trò</th>
                  <th style="min-width: 130px;">Xác minh CCCD</th>
                  <th style="min-width: 140px;">Gói cước</th>
                  <th style="min-width: 110px;">Ngày tạo</th>
                  <th class="text-right" style="min-width: 90px;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (u of paginatedUsers(); track u.id) {
                  <tr>
                    <!-- Cột 1: Người dùng -->
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar" [class.avatar-admin]="u.roleName === 'Administrator'" [class.avatar-landlord]="u.roleName === 'Landlord'">
                          {{ getInitials(u.fullName) }}
                        </div>
                        <div class="user-name-col">
                          <strong class="user-fullname">{{ u.fullName }}</strong>
                          <span class="user-id-tag">ID: #{{ u.id }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Cột 2: SĐT & Email (Đơn giản, dễ nhìn) -->
                    <td>
                      <div class="contact-col">
                        <span class="phone-text">{{ u.phone }}</span>
                        <span class="email-text">{{ u.email || 'Chưa cập nhật' }}</span>
                      </div>
                    </td>

                    <!-- Cột 3: Vai trò (Đơn giản: Admin, Chủ trọ, Người thuê) -->
                    <td>
                      <div class="role-cell">
                        <span class="role-badge" [ngClass]="getRoleBadgeClass(u.roleName)">
                          {{ getRoleDisplayName(u.roleName) }}
                        </span>
                        <button class="btn-role-quick" (click)="openRoleModal(u)" title="Đổi quyền">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>

                    <!-- Cột 4: Xác minh CCCD (Đơn giản) -->
                    <td>
                      @if (u.verificationStatus === 'Approved') {
                        <span class="badge-status badge-success">Đã xác minh</span>
                      } @else if (u.verificationStatus === 'Pending') {
                        <span class="badge-status badge-warning">Chờ duyệt</span>
                      } @else if (u.verificationStatus === 'Rejected') {
                        <span class="badge-status badge-danger">Bị từ chối</span>
                      } @else {
                        <span class="badge-status badge-neutral">Chưa gửi</span>
                      }
                      @if (u.cccdNumber) {
                        <div class="cccd-text">{{ u.cccdNumber }}</div>
                      }
                    </td>

                    <!-- Cột 5: Gói cước (Gọn gàng, đơn giản, không bị tràn dòng) -->
                    <td>
                      <span class="pkg-simple-tag" [ngClass]="getSubscriptionBadgeClass(u.subscriptionName)">
                        {{ getSimplePackageName(u.subscriptionName) }}
                      </span>
                    </td>

                    <!-- Cột 6: Ngày tạo -->
                    <td>
                      <span class="date-text">{{ u.createdAt | date:'dd/MM/yyyy' }}</span>
                    </td>

                    <!-- Cột 7: Thao tác -->
                    <td class="text-right">
                      <div class="action-buttons">
                        <button class="btn-action edit" (click)="openEditModal(u)" title="Chỉnh sửa">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        @if (authService.session()?.userId !== u.id) {
                          <button class="btn-action delete" (click)="openDeleteConfirm(u)" title="Xóa tài khoản">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- PHÂN TRANG (PAGINATION BAR) -->
          <div class="pagination-footer">
            <div class="pagination-info">
              Hiển thị <strong>{{ startIndex() }}</strong> - <strong>{{ endIndex() }}</strong> / <strong>{{ userList().length }}</strong> tài khoản
            </div>

            <div class="pagination-controls">
              <div class="page-size-picker">
                <label>Hiển thị:</label>
                <select [ngModel]="pageSize()" (ngModelChange)="changePageSize($event)" class="page-size-select">
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="20">20</option>
                  <option [value]="50">50</option>
                </select>
              </div>

              <div class="page-buttons-group">
                <button 
                  class="page-btn nav-btn" 
                  [disabled]="currentPage() === 1" 
                  (click)="prevPage()" 
                  title="Trang trước">
                  ‹
                </button>

                @for (p of getPageNumbers(); track $index) {
                  @if (p === -1) {
                    <span class="page-dots">...</span>
                  } @else {
                    <button 
                      class="page-btn" 
                      [class.active]="currentPage() === p" 
                      (click)="goToPage(p)">
                      {{ p }}
                    </button>
                  }
                }

                <button 
                  class="page-btn nav-btn" 
                  [disabled]="currentPage() === totalPages()" 
                  (click)="nextPage()" 
                  title="Trang tiếp">
                  ›
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- MODAL: TẠO TÀI KHOẢN MỚI -->
      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Tạo Tài Khoản Mới</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>
            
            <form (ngSubmit)="submitCreateUser()" class="modal-body">
              <div class="form-group">
                <label>Họ và tên <span class="required">*</span></label>
                <input type="text" [(ngModel)]="createForm.fullName" name="fullName" required placeholder="Nhập họ và tên..." class="form-input" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Số điện thoại <span class="required">*</span></label>
                  <input type="tel" [(ngModel)]="createForm.phone" name="phone" required placeholder="03/05/07/08/09..." class="form-input" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="createForm.email" name="email" placeholder="email@gmail.com" class="form-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Mật khẩu <span class="required">*</span></label>
                  <input type="password" [(ngModel)]="createForm.password" name="password" required placeholder="Tối thiểu 6 ký tự..." class="form-input" />
                </div>
                <div class="form-group">
                  <label>Vai trò <span class="required">*</span></label>
                  <select [(ngModel)]="createForm.roleId" name="roleId" class="form-select">
                    @for (r of roles(); track r.id) {
                      <option [value]="r.id">{{ getRoleDisplayName(r.roleName) }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Xác thực CCCD</label>
                  <select [(ngModel)]="createForm.verificationStatus" name="verificationStatus" class="form-select">
                    <option value="None">Chưa xác minh</option>
                    <option value="Approved">Đã xác minh</option>
                    <option value="Pending">Chờ duyệt</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Gói cước</label>
                  <select [(ngModel)]="createForm.subscriptionId" name="subscriptionId" class="form-select">
                    <option [value]="1">Gói Tiêu Chuẩn</option>
                    <option [value]="2">Gói Pro</option>
                    <option [value]="3">Gói Premium</option>
                  </select>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang tạo...' : 'Tạo tài khoản' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: CHỈNH SỬA TÀI KHOẢN -->
      @if (showEditModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Chỉnh Sửa: {{ selectedUser()?.fullName }}</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>
            
            <form (ngSubmit)="submitUpdateUser()" class="modal-body">
              <div class="form-group">
                <label>Họ và tên <span class="required">*</span></label>
                <input type="text" [(ngModel)]="editForm.fullName" name="fullName" required class="form-input" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Số điện thoại <span class="required">*</span></label>
                  <input type="tel" [(ngModel)]="editForm.phone" name="phone" required class="form-input" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="editForm.email" name="email" class="form-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Vai trò <span class="required">*</span></label>
                  <select [(ngModel)]="editForm.roleId" name="roleId" class="form-select">
                    @for (r of roles(); track r.id) {
                      <option [value]="r.id">{{ getRoleDisplayName(r.roleName) }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Trạng thái CCCD</label>
                  <select [(ngModel)]="editForm.verificationStatus" name="verificationStatus" class="form-select">
                    <option value="None">Chưa xác minh</option>
                    <option value="Approved">Đã xác minh</option>
                    <option value="Pending">Chờ duyệt</option>
                    <option value="Rejected">Bị từ chối</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Gói cước</label>
                  <select [(ngModel)]="editForm.subscriptionId" name="subscriptionId" class="form-select">
                    <option [value]="1">Gói Tiêu Chuẩn</option>
                    <option [value]="2">Gói Pro</option>
                    <option [value]="3">Gói Premium</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Mật khẩu mới (Nếu cần đổi)</label>
                  <input type="password" [(ngModel)]="editForm.newPassword" name="newPassword" placeholder="Để trống nếu không đổi..." class="form-input" />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: PHÂN QUYỀN NHANH -->
      @if (showRoleModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card modal-sm animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Đổi Vai Trò Tài Khoản</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>
            
            <div class="modal-body">
              <p>Tài khoản: <strong>{{ selectedUser()?.fullName }}</strong> ({{ selectedUser()?.phone }})</p>
              
              <div class="role-selector-list">
                @for (r of roles(); track r.id) {
                  <label class="role-radio-item" [class.selected]="quickRoleId === r.id">
                    <input type="radio" name="quickRole" [value]="r.id" [(ngModel)]="quickRoleId" />
                    <div class="role-radio-info">
                      <strong class="role-radio-title">{{ getRoleDisplayName(r.roleName) }}</strong>
                      <span class="role-radio-desc">
                        @if (r.roleName === 'Administrator' || r.roleName === 'Admin') {
                          Quyền quản trị toàn bộ hệ thống
                        } @else if (r.roleName === 'Landlord') {
                          Đăng trọ, quản lý phòng, hợp đồng, hóa đơn
                        } @else {
                          Tìm trọ, ghép trọ, xem hóa đơn
                        }
                      </span>
                    </div>
                  </label>
                }
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy</button>
                <button type="button" class="btn btn-primary" (click)="submitQuickRole()" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang cập nhật...' : 'Xác nhận' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: XÁC NHẬN XÓA TÀI KHOẢN -->
      @if (showDeleteModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal-card modal-sm animate-pop" (click)="$event.stopPropagation()">
            <div class="modal-header header-danger">
              <h3>Xác Nhận Xóa Tài Khoản</h3>
              <button class="modal-close-btn" (click)="closeModals()">✕</button>
            </div>
            
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa tài khoản <strong>{{ selectedUser()?.fullName }}</strong> (SĐT: {{ selectedUser()?.phone }}) không?</p>
              <p class="text-danger-notice">⚠️ Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống.</p>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModals()">Hủy bỏ</button>
                <button type="button" class="btn btn-danger" (click)="submitDeleteUser()" [disabled]="isSubmitting()">
                  {{ isSubmitting() ? 'Đang xóa...' : 'Xóa tài khoản' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .users-workspace {
      width: 100%;
    }

    /* HEADER BANNER */
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 24px 30px;
      border-radius: 16px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(15, 23, 42, 0.15);
    }

    .banner-info h1 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 0 4px 0;
      color: #ffffff;
    }

    .banner-info p {
      color: #94a3b8;
      font-size: 0.88rem;
      margin: 0;
      max-width: 650px;
    }

    /* KPI MINI CARDS */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .kpi-mini-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    }

    .kpi-mini-val {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1.1;
    }

    .kpi-mini-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 4px;
    }

    .text-primary { color: #0284c7; }
    .text-purple { color: #7c3aed; }
    .text-blue { color: #2563eb; }
    .text-emerald { color: #059669; }

    /* FILTERS PANEL */
    .filter-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-input-wrap {
      position: relative;
      flex-grow: 1;
      min-width: 240px;
    }

    .filter-search-input {
      width: 100%;
      padding: 9px 12px 9px 36px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
    }

    .filter-search-input:focus {
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      stroke: #64748b;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-group label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      white-space: nowrap;
    }

    .filter-select {
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      outline: none;
      cursor: pointer;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn svg {
      width: 16px;
      height: 16px;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #ef4444;
      color: #ffffff;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-sm {
      padding: 8px 12px;
      font-size: 0.8rem;
    }

    /* TABLE */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .users-table th {
      background: #f8fafc;
      padding: 13px 16px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .users-table td {
      padding: 13px 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.85rem;
      color: #334155;
      vertical-align: middle;
    }

    .users-table tbody tr:hover {
      background: #f8fafc;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #e2e8f0;
    }

    .user-avatar.avatar-admin {
      background: #f3e8ff;
      color: #7e22ce;
      border-color: #d8b4fe;
    }

    .user-avatar.avatar-landlord {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .user-name-col {
      display: flex;
      flex-direction: column;
    }

    .user-fullname {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.88rem;
    }

    .user-id-tag {
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .contact-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .phone-text {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .email-text {
      font-size: 0.76rem;
      color: #64748b;
      word-break: break-all;
    }

    .role-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .role-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .badge-role-admin { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-role-landlord { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .badge-role-tenant { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }

    .btn-role-quick {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.15s;
    }

    .btn-role-quick svg {
      width: 13px;
      height: 13px;
    }

    .btn-role-quick:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .badge-status {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-neutral { background: #f1f5f9; color: #64748b; }

    .cccd-text {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 2px;
      white-space: nowrap;
    }

    /* GÓI CƯỚC ĐƠN GIẢN, GỌN GÀNG */
    .pkg-simple-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .pkg-simple-tag.sub-free {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .pkg-simple-tag.sub-pro {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .pkg-simple-tag.sub-premium {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .date-text {
      font-size: 0.8rem;
      color: #64748b;
      white-space: nowrap;
    }

    .text-right { text-align: right; }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .btn-action svg {
      width: 15px;
      height: 15px;
    }

    .btn-action.edit:hover {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    .btn-action.delete:hover {
      background: #fee2e2;
      color: #ef4444;
      border-color: #fecaca;
    }

    /* PAGINATION BAR */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 14px;
    }

    .pagination-info {
      font-size: 0.82rem;
      color: #64748b;
    }

    .pagination-info strong {
      color: #0f172a;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .page-size-picker {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
    }

    .page-size-select {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      outline: none;
      cursor: pointer;
    }

    .page-buttons-group {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .page-btn {
      min-width: 30px;
      height: 30px;
      padding: 0 6px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .page-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-btn.nav-btn {
      font-size: 1rem;
      font-weight: 700;
    }

    .page-dots {
      padding: 0 4px;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .table-loading, .empty-state {
      padding: 50px 20px;
      text-align: center;
      color: #64748b;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 10px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state svg {
      width: 44px;
      height: 44px;
      stroke: #94a3b8;
      margin-bottom: 10px;
    }

    /* MODAL STYLES */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(3px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .modal-card.modal-sm {
      max-width: 420px;
    }

    .modal-header {
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .modal-header.header-danger {
      background: #fee2e2;
    }

    .modal-header.header-danger h3 {
      color: #b91c1c;
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #64748b;
      cursor: pointer;
      padding: 2px 6px;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 5px;
    }

    .required { color: #ef4444; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.15s;
    }

    .form-input:focus, .form-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }

    .role-selector-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 14px 0;
    }

    .role-radio-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .role-radio-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .role-radio-item.selected {
      background: #eff6ff;
      border-color: #2563eb;
    }

    .role-radio-info {
      display: flex;
      flex-direction: column;
    }

    .role-radio-title {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .role-radio-desc {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }

    .text-danger-notice {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #be123c;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 10px;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  userList = signal<any[]>([]);
  roles = signal<any[]>([]);

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  totalPages = computed(() => {
    const total = this.userList().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  paginatedUsers = computed(() => {
    const list = this.userList();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  startIndex = computed(() => {
    if (this.userList().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.userList().length);
  });

  // Filters
  searchKeyword = '';
  selectedRoleId = 0;
  selectedVerificationStatus = 'All';

  // Modals state
  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  showRoleModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  selectedUser = signal<any>(null);

  // Forms
  createForm = {
    fullName: '',
    phone: '',
    email: '',
    password: '',
    roleId: 2, // Default Landlord
    verificationStatus: 'None',
    subscriptionId: 1
  };

  editForm = {
    fullName: '',
    phone: '',
    email: '',
    roleId: 2,
    verificationStatus: 'None',
    subscriptionId: 1,
    newPassword: ''
  };

  quickRoleId = 2;

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data || []);
      }
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.adminService.getUsers(this.searchKeyword, this.selectedRoleId, this.selectedVerificationStatus).subscribe({
      next: (data) => {
        this.userList.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toastService.show('Không thể tải danh sách tài khoản người dùng.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedRoleId = 0;
    this.selectedVerificationStatus = 'All';
    this.currentPage.set(1);
    this.loadUsers();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  changePageSize(size: any): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  countRole(roleName: string): number {
    return this.userList().filter(u => u.roleName === roleName).length;
  }

  getRoleDisplayName(roleName: string): string {
    if (!roleName) return 'Khách';
    if (roleName === 'Administrator' || roleName === 'Admin') return 'Admin';
    if (roleName === 'Landlord') return 'Chủ trọ';
    if (roleName === 'Tenant') return 'Người thuê';
    return roleName;
  }

  getSimplePackageName(name: string): string {
    if (!name) return 'Tiêu chuẩn';
    const lower = name.toLowerCase();
    if (lower.includes('premium') || lower.includes('toàn năng') || lower.includes('vip')) return 'Gói Premium';
    if (lower.includes('pro') || lower.includes('nâng cao')) return 'Gói Pro';
    return 'Tiêu chuẩn';
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getRoleBadgeClass(roleName: string): string {
    if (roleName === 'Administrator') return 'badge-role-admin';
    if (roleName === 'Landlord') return 'badge-role-landlord';
    return 'badge-role-tenant';
  }

  getSubscriptionBadgeClass(name: string): string {
    if (!name) return 'sub-free';
    const lower = name.toLowerCase();
    if (lower.includes('premium') || lower.includes('toàn năng') || lower.includes('vip')) return 'sub-premium';
    if (lower.includes('pro') || lower.includes('nâng cao')) return 'sub-pro';
    return 'sub-free';
  }

  // Modals operations
  openCreateModal(): void {
    this.createForm = {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      roleId: this.roles().length > 0 ? this.roles()[0].id : 2,
      verificationStatus: 'None',
      subscriptionId: 1
    };
    this.showCreateModal.set(true);
  }

  openEditModal(user: any): void {
    this.selectedUser.set(user);
    this.editForm = {
      fullName: user.fullName,
      phone: user.phone,
      email: user.email || '',
      roleId: user.roleId,
      verificationStatus: user.verificationStatus || 'None',
      subscriptionId: user.subscriptionId || 1,
      newPassword: ''
    };
    this.showEditModal.set(true);
  }

  openRoleModal(user: any): void {
    this.selectedUser.set(user);
    this.quickRoleId = user.roleId;
    this.showRoleModal.set(true);
  }

  openDeleteConfirm(user: any): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showRoleModal.set(false);
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  submitCreateUser(): void {
    if (!this.createForm.fullName.trim() || !this.createForm.phone.trim() || !this.createForm.password.trim()) {
      this.toastService.show('Vui lòng điền đầy đủ các thông tin bắt buộc.', 'info');
      return;
    }

    this.isSubmitting.set(true);
    this.adminService.createUser(this.createForm).subscribe({
      next: () => {
        this.toastService.show('Tạo tài khoản người dùng thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error || 'Lỗi khi tạo tài khoản.', 'error');
      }
    });
  }

  submitUpdateUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    if (!this.editForm.fullName.trim() || !this.editForm.phone.trim()) {
      this.toastService.show('Họ tên và số điện thoại không được để trống.', 'info');
      return;
    }

    this.isSubmitting.set(true);
    this.adminService.updateUser(user.id, this.editForm).subscribe({
      next: () => {
        this.toastService.show('Cập nhật tài khoản thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error || 'Lỗi khi cập nhật tài khoản.', 'error');
      }
    });
  }

  submitQuickRole(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.adminService.assignRole(user.id, this.quickRoleId).subscribe({
      next: (res) => {
        this.toastService.show(res?.message || 'Phân quyền tài khoản thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error || 'Lỗi khi phân quyền vai trò.', 'error');
      }
    });
  }

  submitDeleteUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.toastService.show('Đã xóa tài khoản thành công!', 'success');
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error || 'Không thể xóa tài khoản.', 'error');
      }
    });
  }
}
