import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BillService } from '../../services/bill.service';
import { ReportService } from '../../services/report.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tenant-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tenant-bills animate-fade-in">
      <div class="header-row">
        <div>
          <h1>Hộp thư & Thông tin Tiền Trọ</h1>
          <p>Xem hóa đơn thuê trọ, chỉ số điện nước, và thanh toán trực tuyến qua mã QR VietQR SePay</p>
        </div>
      </div>

      <!-- Tab Selection -->
      <div class="tabs-bar mb-4">
        <button (click)="activeTab.set('bills')" class="tab-btn" [class.active]="activeTab() === 'bills'">
           Hóa đơn & Chỉ số Điện Nước
        </button>
        <button (click)="activeTab.set('reports')" class="tab-btn" [class.active]="activeTab() === 'reports'">
          ️ Phản ánh & Báo cáo Sự cố
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
              <div class="glass-panel bill-card" [class.paid-border]="bill.status === 'Paid'" [class.pending-border]="bill.status === 'PendingConfirmation'">
                <div class="bill-header">
                  <div>
                    <h3>Kỳ hóa đơn: Tháng {{ bill.billingMonth }}/{{ bill.billingYear }}</h3>
                    <p class="text-muted">{{ bill.propertyTitle }} • Phòng {{ bill.roomNumber }}</p>
                  </div>
                  <span class="badge" 
                        [class.badge-success]="bill.status === 'Paid'" 
                        [class.badge-warning]="bill.status === 'PendingConfirmation'"
                        [class.badge-danger]="bill.status === 'Unpaid'"
                        [class.badge-info]="bill.status === 'Partial' || bill.status === 'PartialPaid'">
                    @if (bill.status === 'Paid') {
                       Đã xác nhận thanh toán
                    } @else if (bill.status === 'PendingConfirmation') {
                      ⏳ Chờ chủ trọ xác nhận
                    } @else if (bill.status === 'Partial' || bill.status === 'PartialPaid') {
                      Thanh toán một phần
                    } @else {
                      Chưa thanh toán
                    }
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
                    <span>CÒN LẠI CẦN THANH TOÁN</span>
                    <span class="total-val">{{ bill.remainingAmount | number:'1.0-0' }}đ</span>
                  </div>

                  @if (bill.status === 'PendingConfirmation') {
                    <div class="pending-notice mt-3 p-3" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; font-size: 0.85rem; color: #d97706;">
                      <strong>⏳ Đang chờ xác nhận:</strong> Bạn đã gửi thông báo chuyển tiền. Chủ trọ đang kiểm tra tài khoản ngân hàng để xác nhận.
                    </div>
                  }

                  @if (bill.transactions && bill.transactions.length > 0) {
                    <div class="transactions-list mt-3 p-3" style="background: rgba(0,0,0,0.2); border-radius: 8px;">
                      <h4 style="font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Lịch sử thanh toán</h4>
                      @for (tx of bill.transactions; track tx.id) {
                        <div class="tx-item" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                          <span>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                          <span style="color: var(--color-success);">+{{ tx.amount | number:'1.0-0' }}đ</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="bill-actions mt-3 d-flex flex-column gap-2">
                  @if (bill.status === 'Unpaid' || bill.status === 'Partial' || bill.status === 'PartialPaid') {
                    <div class="d-flex gap-2">
                      <button (click)="openPayOSModal(bill)" class="btn btn-primary flex-1 font-bold">
                         Quét QR & Gửi ảnh xác nhận
                      </button>
                      <a [href]="'/bill-print/' + bill.id" target="_blank" class="btn btn-secondary text-sm d-flex align-items-center">
                        ️ In HD
                      </a>
                    </div>
                  } @else if (bill.status === 'PendingConfirmation') {
                    <div class="d-flex gap-2">
                      <button (click)="openPayOSModal(bill)" class="btn btn-warning flex-1 font-bold text-sm" style="color: #78350f;">
                        🔄 Xem QR & Gửi lại ảnh xác nhận
                      </button>
                      <a [href]="'/bill-print/' + bill.id" target="_blank" class="btn btn-secondary text-sm d-flex align-items-center">
                        ️ In HD
                      </a>
                    </div>
                  } @else {
                    <div class="paid-info w-100 d-flex justify-content-between align-items-center">
                      <div>
                        <span class="check-icon"></span>
                        <span>Đã thanh toán đủ & Chủ trọ đã xác nhận</span>
                      </div>
                      <a [href]="'/bill-print/' + bill.id" target="_blank" class="btn btn-secondary btn-sm">
                        ️ In HD
                      </a>
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

            @if (bills().length > 0) {
              <div class="room-info-card-lite mb-3">
                <span class="icon"></span>
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
                {{ isSubmittingReport() ? 'Đang gửi...' : ' Gửi phản ánh ngay' }}
              </button>
            </form>
          </div>

          <!-- Right Col: Reports History List -->
          <div>
            <div class="section-header-row mb-3">
              <h3>Lịch Sử Phản Ánh Sự Cố</h3>
              <button (click)="fetchReports()" class="btn btn-secondary btn-sm"> Tải lại</button>
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
                      <span class="report-item-title">️ {{ rep.title }}</span>
                      <span class="badge" [class.badge-success]="rep.status === 'Resolved'" [class.badge-warning]="rep.status === 'Pending'">
                        {{ rep.status === 'Resolved' ? 'Đã xử lý' : 'Đang chờ xử lý' }}
                      </span>
                    </div>
                    <p class="report-item-content">{{ rep.content }}</p>
                    <div class="report-item-time">{{ rep.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- SePay VietQR Payment Modal -->
      @if (showPayModal()) {
        <div class="modal-backdrop" (click)="closePayOSModal()">
          <div class="modal-card max-w-550" (click)="$event.stopPropagation()" style="background: #ffffff !important; color: #0f172a !important; border-radius: 20px;">
            
            @if (paymentSuccessState(); as success) {
              <!-- SUCCESS TRANSFORMATION VIEW -->
              <div class="payment-success-card text-center p-4">
                <div class="success-icon-badge mb-3" style="display: flex; justify-content: center;">
                  <div style="width: 76px; height: 76px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; border: 3px solid #86efac; box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.25);">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
                <h3 style="color: #15803d !important; font-weight: 800; margin-bottom: 6px;">THANH TOÁN THÀNH CÔNG!</h3>
                <p style="color: #475569 !important; font-size: 0.9rem;">Hóa đơn của bạn đã được ghi nhận thanh toán thành công trên hệ thống ZHome.</p>
                
                <div class="success-details-box my-3 p-3 text-start" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Mã đơn giao dịch:</span>
                    <strong style="color: #15803d; font-family: monospace;">#{{ success.orderCode }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Số tiền đã thanh toán:</span>
                    <strong style="color: #15803d; font-size: 1.1rem;">{{ success.amount | number:'1.0-0' }}đ</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <span style="color: #166534; font-size: 0.85rem; font-weight: 600;">Trạng thái HĐ:</span>
                    <span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 0.78rem; font-weight: 800; padding: 4px 10px; border-radius: 20px;"> THANH TOÁN THÀNH CÔNG</span>
                  </div>
                </div>

                <button class="btn btn-success btn-lg w-100 font-bold cursor-pointer mt-3" style="background: #16a34a !important; border: none; border-radius: 10px; padding: 12px; color: #ffffff !important;" (click)="closePayOSModal()">Hoàn tất & Đóng</button>
              </div>
            } @else {
              <!-- QR DISPLAY & TRANSFER PROOF CONFIRMATION VIEW -->
              <div class="payos-qr-container text-center">
                <div class="payos-header mb-3">
                  <span class="payos-badge"> Cổng thanh toán VietQR & Xác nhận chuyển khoản</span>
                  <h3 class="mt-2 mb-1 text-dark">Quét mã QR & Gửi ảnh xác nhận</h3>
                  <p class="text-muted text-sm mb-0">Hóa đơn Kỳ {{ selectedBill()?.billingMonth }}/{{ selectedBill()?.billingYear }} - Phòng {{ selectedBill()?.roomNumber }}</p>
                </div>

                <!-- Fixed Amount Display Card -->
                <div class="amount-display-card mb-3 p-3 text-center" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px;">
                  <span style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Số tiền cần thanh toán</span>
                  <strong style="color: #dc2626; font-size: 1.65rem; font-weight: 900; letter-spacing: -0.02em;">
                    {{ (selectedBill()?.remainingAmount > 0 ? selectedBill()?.remainingAmount : selectedBill()?.totalAmount) | number:'1.0-0' }}đ
                  </strong>
                </div>

                @if (isCreatingPayment()) {
                  <div class="loading-qr p-5 text-center">
                    <p class="text-muted text-sm">⏳ Đang khởi tạo mã VietQR SePay...</p>
                  </div>
                } @else if (payOSData()) {
                  <div class="qr-display-box my-3">
                    <div class="qr-frame" style="padding: 12px; background: #ffffff; border-radius: 16px; border: 2px solid #10b981; display: inline-block;">
                      <img [src]="payOSData()?.qrCodeUrl" alt="SePay VietQR Code" class="qr-code-img" style="width: 210px; height: 210px; object-fit: contain;">
                    </div>
                    <div class="polling-status mt-2">
                      <span class="spinner-pulse"></span>
                      <span class="text-sm font-medium" style="color: #059669;">Hệ thống tự động chờ nhận tiền hoặc gửi ảnh biên lai bên dưới</span>
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
                           Sao chép
                        </button>
                      </div>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Tên chủ tài khoản:</span>
                      <strong class="text-sm text-uppercase text-dark">{{ payOSData()?.accountName }}</strong>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted text-sm">Số tiền thanh toán:</span>
                      <div class="copy-group">
                        <strong class="text-danger font-bold text-base me-2">{{ payOSData()?.amount | number:'1.0-0' }}đ</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.amount?.toString(), 'Số tiền')">
                           Sao chép
                        </button>
                      </div>
                    </div>
                    <div class="detail-row d-flex justify-content-between align-items-center highlight-content">
                      <span class="text-muted text-sm">Nội dung chuyển khoản:</span>
                      <div class="copy-group">
                        <strong class="text-warning-dark text-sm me-2 font-mono">{{ payOSData()?.description }}</strong>
                        <button class="btn-copy" (click)="copyToClipboard(payOSData()?.description, 'Nội dung chuyển khoản')">
                           Sao chép
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- PROOF IMAGE UPLOAD & CONFIRMATION NOTIFICATION SECTION -->
                  <div class="proof-upload-section text-start p-3 my-3" style="background: #f1f5f9; border: 1.5px dashed #94a3b8; border-radius: 14px;">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin: 0;">
                        📸 Ảnh chụp màn hình chuyển khoản <span style="color: #dc2626;">* (Bắt buộc)</span>
                      </label>
                      @if (proofImagePreview) {
                        <span class="badge badge-success" style="font-size: 0.75rem;">✓ Đã chọn ảnh</span>
                      }
                    </div>
                    <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 10px;">
                      Sau khi chuyển khoản xong, vui lòng đính kèm ảnh chụp biên lai giao dịch thành công để gửi thông báo cho chủ trọ duyệt.
                    </p>

                    <!-- Image Upload Input & Preview -->
                    @if (!proofImagePreview) {
                      <div class="upload-dropzone p-3 text-center" style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px; cursor: pointer;" (click)="fileInput.click()">
                        <input #fileInput type="file" accept="image/*" style="display: none;" (change)="onProofFileSelected($event)">
                        <div style="font-size: 2rem; margin-bottom: 4px;">🖼️</div>
                        <strong style="color: #2563eb; font-size: 0.88rem; display: block;">Nhấn để chọn ảnh chụp chuyển khoản</strong>
                        <span style="color: #94a3b8; font-size: 0.75rem;">Hỗ trợ ảnh PNG, JPG, JPEG (Tối đa 5MB)</span>
                      </div>
                    } @else {
                      <div class="preview-container p-2 text-center" style="background: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1;">
                        <img [src]="proofImagePreview" alt="Minh chứng chuyển khoản" style="max-height: 200px; max-width: 100%; border-radius: 8px; object-fit: contain; margin-bottom: 8px;">
                        <div class="d-flex justify-content-center gap-2">
                          <input #fileInputRe type="file" accept="image/*" style="display: none;" (change)="onProofFileSelected($event)">
                          <button type="button" class="btn btn-secondary btn-sm" (click)="fileInputRe.click()">🔄 Đổi ảnh khác</button>
                          <button type="button" class="btn btn-danger btn-sm" (click)="clearProofFile()">🗑️ Gỡ ảnh</button>
                        </div>
                      </div>
                    }

                    <!-- Optional Note -->
                    <div class="form-group mt-3">
                      <label style="font-weight: 600; font-size: 0.82rem; color: #475569; margin-bottom: 4px; display: block;">
                        Ghi chú thêm (Tùy chọn):
                      </label>
                      <input 
                        type="text" 
                        [(ngModel)]="transferNote" 
                        class="form-control" 
                        style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; width: 100%; font-size: 0.85rem;"
                        placeholder="VD: Em vừa chuyển từ Techcombank lúc 20:45..." />
                    </div>

                    <!-- Pending Re-submit Alert if already pending -->
                    @if (selectedBill()?.status === 'PendingConfirmation') {
                      <div class="alert-info-box mt-3 p-2 text-start" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 0.8rem; color: #b45309;">
                        ⏳ <strong>Đang chờ chủ trọ duyệt:</strong> Hóa đơn này đã được gửi thông báo trước đó. Nếu bạn gửi nhầm ảnh hoặc muốn cập nhật ảnh mới, hãy chọn ảnh và ấn <strong>"Gửi lại thông báo xác nhận"</strong> bên dưới.
                      </div>
                    }

                    <!-- Submit Button -->
                    <div class="mt-3">
                      @if (selectedBill()?.status === 'PendingConfirmation') {
                        <button 
                          type="button" 
                          class="btn btn-warning w-100 font-bold py-2" 
                          style="border-radius: 10px; font-size: 0.95rem; color: #78350f !important;"
                          [disabled]="!proofImageBase64 || isSubmittingNotify()" 
                          (click)="submitTransferProofFromModal()">
                          {{ isSubmittingNotify() ? '⏳ Đang gửi lại...' : '🔄 Gửi lại thông báo xác nhận đã chuyển khoản' }}
                        </button>
                      } @else {
                        <button 
                          type="button" 
                          class="btn btn-primary w-100 font-bold py-2" 
                          style="background: #2563eb !important; border: none; border-radius: 10px; font-size: 0.95rem;"
                          [disabled]="!proofImageBase64 || isSubmittingNotify()" 
                          (click)="submitTransferProofFromModal()">
                          {{ isSubmittingNotify() ? '⏳ Đang gửi thông báo...' : '📤 Gửi thông báo đã chuyển tiền' }}
                        </button>
                      }
                      
                      @if (!proofImageBase64 && !proofImagePreview) {
                        <small style="color: #dc2626; font-size: 0.75rem; display: block; text-align: center; margin-top: 6px;">
                          ⚠️ Cần đính kèm ảnh chụp màn hình chuyển khoản để mở khóa nút gửi thông báo
                        </small>
                      }
                    </div>

                  </div>

                  <div class="modal-actions d-flex justify-content-center mt-3">
                    <button class="btn btn-secondary px-4" (click)="closePayOSModal()">Đóng cửa sổ</button>
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
    .tenant-bills {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .tabs-bar {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }
    .tab-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .bills-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .bill-card {
      padding: 20px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .bill-card.paid-border {
      border-left: 4px solid #10b981;
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
      font-size: 0.9rem;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
    }
    .bill-total-row {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    .paid-info {
      color: #10b981;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.1);
      padding: 8px 12px;
      border-radius: 6px;
    }
    .btn-block {
      width: 100%;
    }
    .flex-1 { flex: 1; }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      padding: 2.2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 550px; width: 100%;
      max-height: 90vh; overflow-y: auto;
    }
    .text-dark { color: #0f172a !important; }
    .payos-badge {
      display: inline-block; background: #ecfdf5; color: #047857;
      font-size: 0.8rem; font-weight: 600; padding: 3px 12px; border-radius: 12px;
    }
    .qr-frame {
      display: inline-block; padding: 12px; background: white;
      border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 2px solid #10b981;
    }
    .qr-code-img { width: 210px; height: 210px; object-fit: contain; }
    .polling-status { display: flex; align-items: center; justify-content: center; gap: 8px; color: #059669; }
    .spinner-pulse {
      width: 10px; height: 10px; background-color: #10b981; border-radius: 50%;
      animation: pulse 1.5s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.5; }
    }
    .transfer-details-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.2rem;
    }
    .highlight-content {
      background: #fffbebf5; padding: 8px 10px; border-radius: 6px; margin-top: 4px; border: 1px dashed #f59e0b;
    }
    .text-warning-dark { color: #d97706; }
    .font-mono { font-family: monospace; letter-spacing: 0.5px; }
    .copy-group { display: flex; align-items: center; }
    .btn-copy {
      background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; cursor: pointer;
      padding: 3px 8px; font-size: 0.78rem; border-radius: 4px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-copy:hover { background: #e2e8f0; color: #1e293b; }
    .test-simulation-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 8px 12px; border-radius: 8px; font-size: 0.82rem;
    }
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
    .room-info-card-lite .icon { font-size: 1.5rem; }
    .section-header-row { display: flex; justify-content: space-between; align-items: center; }
    .reports-history-list {
      display: flex; flex-direction: column; gap: 16px;
      max-height: 520px; overflow-y: auto; padding-right: 5px;
    }
    .report-item-card { padding: 18px; border-left: 3px solid var(--color-primary-light); }
    .report-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 10px; }
    .report-item-title { font-size: 1.05rem; font-weight: 700; color: var(--text-main); }
    .report-item-content { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
    .report-item-time { font-size: 0.75rem; color: var(--text-dark); margin-top: 12px; text-align: right; }
    .loading-state, .empty-state {
      text-align: center; padding: 60px; background: var(--bg-card);
      border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);
    }
    .mt-3 { margin-top: 16px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .my-2 { margin: 8px 0; }
    .my-3 { margin: 12px 0; }
    .text-sm { font-size: 0.88rem; }
    .text-xs { font-size: 0.8rem; }
  `]
})
export class TenantBillsComponent implements OnInit, OnDestroy {
  private readonly billService = inject(BillService);
  private readonly reportService = inject(ReportService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  activeTab = signal<'bills' | 'reports'>('bills');

  bills = signal<any[]>([]);
  isLoading = signal(true);

  reports = signal<any[]>([]);
  isLoadingReports = signal(false);
  isSubmittingReport = signal(false);
  newReport = { title: '', content: '' };

  // PayOS QR & Proof Upload State
  showPayModal = signal<boolean>(false);
  paymentAmountInput: number = 0;
  payOSData = signal<any | null>(null);
  selectedBill = signal<any | null>(null);
  paymentSuccessState = signal<any | null>(null);
  isCreatingPayment = signal(false);
  isSimulating = signal(false);
  private pollingTimer: any = null;

  // Proof Image & Note
  proofImageBase64: string | null = null;
  proofImagePreview: string | null = null;
  transferNote: string = '';
  isSubmittingNotify = signal(false);

  onProofFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.show('Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.show('Kích thước ảnh tối đa là 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.proofImageBase64 = result;
      this.proofImagePreview = result;
    };
    reader.readAsDataURL(file);
  }

  clearProofFile(): void {
    this.proofImageBase64 = null;
    this.proofImagePreview = null;
  }

  submitTransferProofFromModal(): void {
    const bill = this.selectedBill();
    if (!bill) return;

    if (!this.proofImageBase64 && !bill.proofImageUrl) {
      this.toastService.show('Vui lòng tải lên ảnh chụp chuyển khoản trước khi gửi thông báo.', 'error');
      return;
    }

    this.isSubmittingNotify.set(true);
    const remaining = bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount;

    this.billService.notifyTransfer(bill.id, {
      amount: remaining,
      note: this.transferNote.trim(),
      proofImageBase64: this.proofImageBase64 || undefined,
      proofImageUrl: !this.proofImageBase64 ? bill.proofImageUrl : undefined
    }).subscribe({
      next: (res) => {
        this.isSubmittingNotify.set(false);
        this.toastService.show(res.message || 'Đã gửi minh chứng và thông báo chuyển tiền tới chủ trọ!', 'success');
        this.closePayOSModal();
        this.fetchBills();
      },
      error: (err) => {
        this.isSubmittingNotify.set(false);
        this.toastService.show(err.error?.message || 'Có lỗi khi gửi thông báo chuyển tiền.', 'error');
      }
    });
  }

  ngOnInit(): void {
    this.fetchBills();
    this.fetchReports();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  fetchBills(): void {
    this.isLoading.set(true);
    this.billService.getTenantBills().subscribe({
      next: (data) => {
        const getPriority = (status?: string) => {
          if (status === 'PendingConfirmation') return 1;
          if (status === 'Unpaid' || status === 'Partial' || status === 'PartialPaid') return 2;
          if (status === 'Paid') return 3;
          return 2;
        };

        // Calculate remaining amount and sort with pending & unpaid on top, paid at bottom
        const processed = data.map((b: any) => ({
          ...b,
          remainingAmount: Math.max(0, (b.totalAmount || 0) - (b.paidAmount || 0))
        })).sort((a: any, b: any) => {
          const pA = getPriority(a.status);
          const pB = getPriority(b.status);
          if (pA !== pB) return pA - pB;
          if (b.billingYear !== a.billingYear) return (b.billingYear || 0) - (a.billingYear || 0);
          return (b.billingMonth || 0) - (a.billingMonth || 0);
        });

        this.bills.set(processed);
        this.isLoading.set(false);

        // Check if queryParam billId is passed, then auto-open modal for that bill
        const targetBillId = Number(this.route.snapshot.queryParamMap.get('billId'));
        if (targetBillId) {
          const target = processed.find(b => b.id === targetBillId);
          if (target && target.status !== 'Paid') {
            this.openPayOSModal(target);
          }
        }
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
      next: (data: any[]) => {
        this.reports.set(data);
        this.isLoadingReports.set(false);
      },
      error: () => {
        this.isLoadingReports.set(false);
        this.toastService.show('Lỗi tải danh sách phản ánh.', 'error');
      }
    });
  }

  submitReport(): void {
    if (!this.newReport.title || !this.newReport.content) {
      this.toastService.show('Vui lòng điền đầy đủ tiêu đề và nội dung phản ánh.', 'error');
      return;
    }

    this.isSubmittingReport.set(true);
    this.reportService.createReport(this.newReport).subscribe({
      next: (res) => {
        this.toastService.show(res.message || 'Gửi phản ánh sự cố thành công!', 'success');
        this.newReport = { title: '', content: '' };
        this.isSubmittingReport.set(false);
        this.fetchReports();
      },
      error: (err) => {
        this.isSubmittingReport.set(false);
        this.toastService.show(err.error?.message || 'Có lỗi xảy ra khi gửi phản ánh.', 'error');
      }
    });
  }

  openPayOSModal(bill: any): void {
    const remaining = bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount;
    this.selectedBill.set(bill);
    this.paymentAmountInput = remaining;
    this.paymentSuccessState.set(null);
    this.payOSData.set(null);
    this.transferNote = bill.note || '';
    this.proofImageBase64 = null;
    this.proofImagePreview = bill.proofImageUrl ? (bill.proofImageUrl.startsWith('http') ? bill.proofImageUrl : environment.baseUrl + bill.proofImageUrl) : null;
    this.showPayModal.set(true);

    this.createPaymentQR();
  }

  createPaymentQR(): void {
    const bill = this.selectedBill();
    if (!bill) return;

    if (isNaN(this.paymentAmountInput) || this.paymentAmountInput <= 0) {
      this.toastService.show('Vui lòng nhập số tiền thanh toán hợp lệ.', 'error');
      return;
    }

    this.isCreatingPayment.set(true);
    this.billService.createPayOSPayment(bill.id, this.paymentAmountInput).subscribe({
      next: (res) => {
        this.isCreatingPayment.set(false);
        this.payOSData.set(res);
        this.startPolling(res.orderCode);
      },
      error: (err) => {
        this.isCreatingPayment.set(false);
        this.toastService.show(err.error?.message || 'Không thể tạo mã QR thanh toán.', 'error');
      }
    });
  }

  startPolling(orderCode: number): void {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      this.billService.checkOrderStatus(orderCode).subscribe({
        next: (res) => {
          if (res.isPaid) {
            this.stopPolling();
            this.paymentSuccessState.set({
              orderCode: orderCode,
              amount: res.amount || this.payOSData()?.amount,
              billId: this.selectedBill()?.id
            });
            this.toastService.show('🎉 Giao dịch thành công! Hóa đơn đã được ghi nhận thanh toán.', 'success');
            this.fetchBills();
          }
        },
        error: (err) => {
          console.warn('Polling error:', err);
        }
      });
    }, 2000);
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  closePayOSModal(): void {
    this.stopPolling();
    this.showPayModal.set(false);
    this.payOSData.set(null);
    this.selectedBill.set(null);
    this.paymentSuccessState.set(null);
    this.proofImageBase64 = null;
    this.proofImagePreview = null;
  }

  simulatePaymentSuccess(): void {
    const data = this.payOSData();
    if (!data) return;

    this.isSimulating.set(true);
    this.billService.simulatePayOSSuccess(data.orderCode).subscribe({
      next: (res) => {
        this.isSimulating.set(false);
        this.stopPolling();
        this.paymentSuccessState.set({
          orderCode: data.orderCode,
          amount: data.amount,
          billId: this.selectedBill()?.id
        });
        this.toastService.show(res.message || 'Thanh toán hóa đơn thành công!', 'success');
        this.fetchBills();
      },
      error: (err) => {
        this.isSimulating.set(false);
        this.stopPolling();
        this.paymentSuccessState.set({
          orderCode: data.orderCode,
          amount: data.amount,
          billId: this.selectedBill()?.id
        });
        this.toastService.show('Đã ghi nhận thanh toán hóa đơn thành công!', 'success');
        this.fetchBills();
      }
    });
  }

  copyToClipboard(text?: string, label: string = 'Thông tin'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.show(`Đã sao chép ${label}!`, 'info');
    });
  }
}
