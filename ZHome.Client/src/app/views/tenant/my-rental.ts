import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService } from '../../services/contract.service';
import { BillService } from '../../services/bill.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-tenant-rental',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tenant-rental animate-fade-in">
      <div class="header-row" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1>Trọ của tôi</h1>
          <p>Quản lý thông tin căn hộ đang thuê, thông tin chủ trọ, hợp đồng và chi tiết tiền điện nước tháng này</p>
        </div>
        @if (rentalsList().length > 1 && selectedContractId()) {
          <button class="btn-outline" (click)="goBackToList()">⬅ Quay lại danh sách</button>
        }
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Đang tải thông tin trọ của bạn...</p>
        </div>
      } @else if (errorMsg()) {
        <div class="empty-state error-panel">
          <span class="icon">⚠️</span>
          <h3>Không tìm thấy dữ liệu</h3>
          <p>{{ errorMsg() }}</p>
        </div>
      } @else if (rentalsList().length > 1 && !selectedContractId()) {
        <!-- LIST VIEW -->
        <div class="rentals-list-grid">
          @for (r of rentalsList(); track r.contractId) {
            <div class="rental-list-card glass-panel" (click)="selectRental(r.contractId)">
              <div class="home-icon-small">🏠</div>
              <div class="rental-list-info">
                <h3>Phòng {{ r.roomNumber }}</h3>
                <p>{{ r.propertyTitle }}</p>
                <span class="text-muted text-xs">📍 {{ r.propertyAddress }}</span>
              </div>
              <div class="rental-list-price">
                <strong>{{ r.roomPrice | number:'1.0-0' }}đ / tháng</strong>
                <span class="text-xs text-muted">Bắt đầu từ: {{ r.startDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          }
        </div>
      } @else if (rental(); as data) {
        <div class="rental-grid">
          
          <!-- Left Column: Room & Landlord Info -->
          <div class="left-col">
            <!-- Property & Room Header Banner Card -->
            <div class="glass-panel room-hero-card">
              <div class="hero-header">
                <span class="home-icon">🏠</span>
                <div class="hero-titles">
                  <h2>Phòng {{ data.roomNumber }}</h2>
                  <p class="property-title">
                    {{ data.propertyTitle }}
                    @if (data.isVerifiedTick) {
                      <span class="verified-tick" title="Khu trọ chính chủ đã xác minh">✅</span>
                    }
                  </p>
                </div>
              </div>
              
              <div class="hero-details">
                <div class="hero-detail-item">
                  <span class="label">Diện tích</span>
                  <span class="value">{{ data.area }} m²</span>
                </div>
                <div class="hero-detail-item">
                  <span class="label">Giá gốc của phòng</span>
                  <span class="value">{{ data.originalRoomPrice | number:'1.0-0' }}đ</span>
                </div>
                <div class="hero-detail-item">
                  <span class="label">Giá của bạn (đã chia sẻ)</span>
                  <span class="value highlight">{{ data.roomPrice | number:'1.0-0' }}đ / tháng</span>
                </div>
              </div>
              @if (canReport(data.startDate)) {
                <div class="mt-3 text-right">
                  <button class="btn-outline-primary btn-sm" (click)="openReportModal()">⭐ Đánh giá trọ</button>
                </div>
              }
            </div>

            <!-- Contract details -->
            <div class="glass-panel info-section mt-4">
              <h3>📄 Hợp đồng thuê</h3>
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Mã hợp đồng:</span>
                  <span class="info-value font-mono">#CON-{{ data.contractId }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ngày bắt đầu:</span>
                  <span class="info-value">{{ data.startDate | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ngày kết thúc:</span>
                  <span class="info-value">{{ data.endDate | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Trạng thái hợp đồng:</span>
                  <span class="badge badge-success">Đang hiệu lực</span>
                </div>
              </div>

              @if (data.amenities && data.amenities.length > 0) {
                <div class="amenities-container mt-3">
                  <span class="info-label d-block mb-2">Tiện ích phòng trọ:</span>
                  <div class="amenities-tags">
                    @for (amenity of data.amenities; track amenity) {
                      <span class="amenity-tag">✨ {{ amenity }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Landlord details -->
            <div class="glass-panel info-section mt-4">
              <h3>🧑‍💼 Thông tin chủ trọ</h3>
              <div class="landlord-card">
                <div class="avatar-circle">
                  {{ data.landlordName.charAt(0) }}
                </div>
                <div class="landlord-info">
                  <h4>{{ data.landlordName }}</h4>
                  <p class="text-muted">Chủ sở hữu khu trọ</p>
                </div>
              </div>
              
              <div class="info-list mt-3">
                <div class="info-row">
                  <span class="info-label">Số điện thoại:</span>
                  <a href="tel:{{ data.landlordPhone }}" class="info-value contact-link">📞 {{ data.landlordPhone }}</a>
                </div>
                @if (data.landlordEmail) {
                  <div class="info-row">
                    <span class="info-label">Hòm thư điện tử:</span>
                    <a href="mailto:{{ data.landlordEmail }}" class="info-value contact-link">✉️ {{ data.landlordEmail }}</a>
                  </div>
                }
                <div class="info-row">
                  <span class="info-label">Địa chỉ khu trọ:</span>
                  <span class="info-value address-value">📍 {{ data.propertyAddress }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Current Month Billing -->
          <div class="right-col">
            <div class="glass-panel current-bill-card">
              <div class="bill-card-header">
                <div>
                  <h3>⚡ Chỉ số & Chi phí tháng này</h3>
                  @if (data.latestBill) {
                    <p class="text-muted">Cập nhật kỳ hóa đơn Tháng {{ data.latestBill.billingMonth }}/{{ data.latestBill.billingYear }}</p>
                  } @else {
                    <p class="text-muted">Chưa phát sinh hóa đơn nào cho tháng này</p>
                  }
                </div>
                @if (data.latestBill) {
                  <span class="badge" [class.badge-success]="data.latestBill.status === 'Paid'" [class.badge-danger]="data.latestBill.status === 'Unpaid'">
                    {{ data.latestBill.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                  </span>
                }
              </div>

              @if (data.latestBill; as bill) {
                <div class="bill-card-body mt-4">
                  <!-- Rent row -->
                  <div class="cost-row">
                    <div class="cost-details">
                      <span class="cost-icon">🏠</span>
                      <div>
                        <strong>Tiền phòng cố định</strong>
                        <p class="text-xs text-muted">Giá thuê được phân bổ theo hợp đồng</p>
                      </div>
                    </div>
                    <span class="cost-amount">{{ bill.roomFee | number:'1.0-0' }}đ</span>
                  </div>

                  <!-- Electricity row -->
                  <div class="cost-row">
                    <div class="cost-details">
                      <span class="cost-icon">⚡</span>
                      <div>
                        <strong>Tiền điện tiêu thụ</strong>
                        <p class="text-xs text-muted">Chỉ số: {{ bill.electricityOldReading }} ➔ {{ bill.electricityNewReading }} ({{ bill.electricityNewReading - bill.electricityOldReading }} kWh) x 3.000đ</p>
                      </div>
                    </div>
                    <span class="cost-amount text-primary-color">{{ bill.electricityFee | number:'1.0-0' }}đ</span>
                  </div>

                  <!-- Water row -->
                  <div class="cost-row">
                    <div class="cost-details">
                      <span class="cost-icon">💧</span>
                      <div>
                        <strong>Tiền nước tiêu thụ</strong>
                        <p class="text-xs text-muted">Chỉ số: {{ bill.waterOldReading }} ➔ {{ bill.waterNewReading }} ({{ bill.waterNewReading - bill.waterOldReading }} m³) x 10.000đ</p>
                      </div>
                    </div>
                    <span class="cost-amount text-primary-color">{{ bill.waterFee | number:'1.0-0' }}đ</span>
                  </div>

                  <!-- Services row -->
                  <div class="cost-row">
                    <div class="cost-details">
                      <span class="cost-icon">🧹</span>
                      <div>
                        <strong>Phí dịch vụ chung</strong>
                        <p class="text-xs text-muted">Vệ sinh, internet, bảo vệ khu nhà</p>
                      </div>
                    </div>
                    <span class="cost-amount">{{ bill.serviceFee | number:'1.0-0' }}đ</span>
                  </div>

                  <!-- Repair Deduction if any -->
                  @if (bill.repairDeduction > 0) {
                    <div class="cost-row deduction">
                      <div class="cost-details">
                        <span class="cost-icon text-success">🛠️</span>
                        <div>
                          <strong class="text-success">Khấu trừ sửa chữa</strong>
                          <p class="text-xs text-muted text-success">Chủ trọ hỗ trợ chi phí bảo trì</p>
                        </div>
                      </div>
                      <span class="cost-amount text-success">-{{ bill.repairDeduction | number:'1.0-0' }}đ</span>
                    </div>
                  }

                  <div class="divider my-4"></div>

                  <div class="grand-total-row">
                    <div>
                      <span class="total-label">TỔNG SỐ TIỀN HÓA ĐƠN</span>
                      <p class="text-xs text-muted">Hạn đóng tiền theo quy định của chủ nhà</p>
                    </div>
                    <span class="total-amount">{{ bill.totalAmount | number:'1.0-0' }}đ</span>
                  </div>

                  <div class="grand-total-row mt-2" style="background: rgba(16,185,129,0.1); border-left: 4px solid var(--color-success);">
                    <div>
                      <span class="total-label" style="color: var(--color-success);">ĐÃ THANH TOÁN</span>
                    </div>
                    <span class="total-amount" style="color: var(--color-success);">{{ bill.paidAmount | number:'1.0-0' }}đ</span>
                  </div>

                  <div class="grand-total-row mt-2" style="background: rgba(239,68,68,0.1); border-left: 4px solid var(--color-danger);">
                    <div>
                      <span class="total-label" style="color: var(--color-danger);">CÒN LẠI</span>
                    </div>
                    <span class="total-amount" style="color: var(--color-danger);">{{ bill.remainingAmount | number:'1.0-0' }}đ</span>
                  </div>

                  @if (bill.transactions && bill.transactions.length > 0) {
                    <div class="transactions-list mt-3 p-3" style="background: rgba(0,0,0,0.02); border-radius: 8px;">
                      <h4 style="font-size: 13px; text-transform: uppercase; margin-bottom: 8px; color: var(--text-dark);">Lịch sử thanh toán</h4>
                      @for (tx of bill.transactions; track tx.id) {
                        <div class="tx-item" style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(0,0,0,0.05); color: var(--text-main);">
                          <span>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }} - {{ tx.tenantName }}</span>
                          <span style="color: var(--color-success); font-weight: 600;">+{{ tx.amount | number:'1.0-0' }}đ</span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Actions -->
                  <div class="bill-action-btn mt-4">
                    @if (bill.status !== 'Paid') {
                      <button (click)="payCurrentBill(bill.id, bill.remainingAmount)" class="btn btn-primary btn-block btn-lg">
                        💳 Thanh toán trực tuyến ngay
                      </button>
                    } @else {
                      <div class="payment-success-box">
                        <span class="check-mark">✓</span>
                        <div>
                          <strong>Đã thanh toán thành công</strong>
                          <p class="text-xs text-muted">Vào lúc {{ bill.paidAt | date:'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="empty-bill-state mt-4">
                  <span class="icon">📅</span>
                  <p>Hợp đồng của bạn chưa có chỉ số điện nước hoặc hóa đơn tiền trọ tháng này.</p>
                  <p class="text-muted text-xs">Vui lòng đợi chủ nhà cập nhật chỉ số và chốt hóa đơn.</p>
                </div>
              }
            </div>
          </div>

        </div>
      }

      <!-- Report Modal -->
      @if (isReportModalOpen()) {
        <div class="modal-backdrop fade-in" (click)="closeReportModal()">
          <div class="modal-content scale-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Đánh giá trải nghiệm trọ</h2>
              <button class="close-btn" (click)="closeReportModal()">×</button>
            </div>
            <div class="modal-body">
              <p class="text-muted mb-3" style="color: #666;">Vui lòng để lại đánh giá của bạn về phòng trọ này sau một thời gian trải nghiệm.</p>
              
              <div class="form-group mb-3">
                <label>Đánh giá (Sao)</label>
                <div class="star-rating">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="star" [class.active]="star <= reportRating()" (click)="reportRating.set(star)">★</span>
                  }
                </div>
                @if (reportRating() < 5) {
                  <p style="color: #d97706; font-size: 0.85rem; margin-top: 5px;">
                    ⚠️ Đánh giá dưới 5 sao sẽ được gửi trực tiếp đến Chủ trọ dưới dạng yêu cầu khắc phục. Chủ trọ bắt buộc phải phản hồi lại ý kiến của bạn.
                  </p>
                }
              </div>
              
              <div class="form-group mb-3">
                <label>Tiêu đề</label>
                <input type="text" class="form-control" [value]="reportTitle()" (input)="reportTitle.set($any($event.target).value)" placeholder="Ví dụ: Phòng sạch sẽ, chủ nhà nhiệt tình">
              </div>

              <div class="form-group mb-3">
                <label>Nội dung đánh giá</label>
                <textarea class="form-control" rows="4" [value]="reportContent()" (input)="reportContent.set($any($event.target).value)" placeholder="Chia sẻ thêm chi tiết về trải nghiệm của bạn..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" style="color: #333; border-color: #ddd;" (click)="closeReportModal()">Hủy</button>
              <button class="btn btn-primary" style="padding: 8px 16px;" (click)="submitReport()">Gửi đánh giá</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tenant-rental {
      padding: 10px 0;
    }
    .header-row {
      margin-bottom: 30px;
    }
    .rentals-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .rental-list-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      padding: 24px;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-card);
    }
    .rental-list-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.4);
    }
    .home-icon-small {
      font-size: 2.5rem;
      background: rgba(168, 85, 247, 0.1);
      width: max-content;
      padding: 16px;
      border-radius: 50%;
      margin-bottom: 4px;
    }
    .rental-list-info {
      width: 100%;
    }
    .rental-list-info h3 {
      margin: 0 0 6px 0;
      color: var(--color-primary-light);
      font-size: 1.4rem;
    }
    .rental-list-info p {
      margin: 0 0 6px 0;
      font-weight: 600;
      color: var(--text-main);
      font-size: 1.1rem;
      word-break: break-word;
    }
    .rental-list-info .text-muted {
      display: block;
      margin-top: 4px;
      word-break: break-word;
    }
    .rental-list-price {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px dashed var(--border-color);
    }
    .rental-list-price strong {
      color: var(--color-primary-light);
      font-size: 1.25rem;
      margin-bottom: 4px;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--color-primary);
      color: var(--color-primary-light);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      font-weight: 600;
    }
    .btn-outline:hover {
      background: rgba(168, 85, 247, 0.1);
    }

    .rental-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 30px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .rental-grid {
        grid-template-columns: 1fr;
      }
    }

    .room-hero-card {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%);
      border: 1px solid rgba(168, 85, 247, 0.2);
      padding: 24px;
    }
    .hero-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .home-icon {
      font-size: 2.5rem;
      background: rgba(168, 85, 247, 0.2);
      padding: 12px;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
    }
    .hero-titles h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(to right, #f472b6, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .property-title {
      margin: 4px 0 0 0;
      color: var(--text-main);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .verified-tick {
      font-size: 1rem;
    }
    .hero-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      background: rgba(0, 0, 0, 0.2);
      padding: 16px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .hero-detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hero-detail-item .label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hero-detail-item .value {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text-main);
    }
    .hero-detail-item .value.highlight {
      color: var(--color-primary-light);
    }

    .info-section {
      padding: 24px;
    }
    .info-section h3 {
      font-size: 1.15rem;
      margin-top: 0;
      margin-bottom: 16px;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }
    .info-label {
      color: var(--text-muted);
      font-weight: 500;
    }
    .info-value {
      color: var(--text-main);
      font-weight: 600;
    }
    .font-mono {
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    .amenities-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .amenity-tag {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .landlord-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      padding: 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      margin-bottom: 16px;
    }
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
    }
    .landlord-info h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .contact-link {
      text-decoration: none;
      transition: var(--transition);
    }
    .contact-link:hover {
      color: var(--color-primary-light);
    }
    .address-value {
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }

    .current-bill-card {
      padding: 24px;
      border-top: 4px solid var(--color-primary);
    }
    .bill-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 16px;
    }
    .bill-card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .cost-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .cost-row.deduction {
      background: rgba(16, 185, 129, 0.02);
      padding: 12px 8px;
      border-radius: var(--radius-sm);
      margin: 4px 0;
    }
    .cost-details {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cost-icon {
      font-size: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cost-amount {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text-main);
    }
    .text-primary-color {
      color: var(--color-primary-light);
    }
    .text-success {
      color: var(--color-success-light) !important;
    }
    .divider {
      height: 1px;
      background: var(--border-color);
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }
    .total-label {
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--text-main);
    }
    .grand-total-row .total-amount {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--color-primary-light);
      text-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
    }
    
    .btn-lg {
      padding: 14px 28px;
      font-size: 1.05rem;
      font-weight: 700;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
      transition: var(--transition);
    }
    .btn-lg:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
    }
    .btn-block {
      width: 100%;
    }
    
    .payment-success-box {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: var(--radius-md);
      padding: 16px;
    }
    .check-mark {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-success);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .payment-success-box strong {
      color: var(--color-success-light);
      font-size: 1rem;
    }
    
    .empty-bill-state, .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      border-radius: var(--radius-md);
    }
    .empty-bill-state .icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--color-primary-light);
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error-panel {
      border: 1px solid rgba(239, 68, 68, 0.2);
      background: rgba(239, 68, 68, 0.02);
    }
    .error-panel .icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }
    .d-block { display: block; }
    .mb-2 { margin-bottom: 8px; }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: var(--radius-md);
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      color: #333;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #eee;
    }
    .modal-header h2 { margin: 0; font-size: 1.3rem; color: #333; font-weight: 700; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
    .modal-body { padding: 24px; }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
      display: flex; justify-content: flex-end; gap: 12px;
    }
    .form-group { margin-bottom: 16px; text-align: left; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.95rem; color: #444; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.95rem; }
    .star-rating { display: flex; gap: 8px; font-size: 2.2rem; cursor: pointer; justify-content: center; margin: 10px 0;}
    .star { color: #ddd; transition: color 0.2s; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .star.active { color: #fbbf24; }
    .star:hover { color: #fbbf24; }
    .btn-outline-primary {
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid var(--color-primary-light);
      color: var(--color-primary-light);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-outline-primary:hover {
      background: var(--color-primary-light);
      color: white;
    }
    .text-right { text-align: right; }
    .mb-3 { margin-bottom: 16px; }
  `]
})
export class MyRentalComponent implements OnInit {
  private readonly contractService = inject(ContractService);
  private readonly billService = inject(BillService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);

  rental = signal<any>(null);
  rentalsList = signal<any[]>([]);
  selectedContractId = signal<number | null>(null);
  isLoading = signal(true);
  errorMsg = signal<string>('');
  
  isReportModalOpen = signal(false);
  reportTitle = signal('');
  reportContent = signal('');
  reportRating = signal(5);

  ngOnInit(): void {
    this.fetchMyRentals();
  }

  fetchMyRentals(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.contractService.getMyRentals().subscribe({
      next: (list) => {
        this.rentalsList.set(list);
        if (list.length === 0) {
          this.isLoading.set(false);
          this.errorMsg.set('Bạn hiện tại không có hợp đồng thuê trọ nào đang hoạt động.');
        } else if (list.length === 1) {
          this.selectRental(list[0].contractId);
        } else {
          // Has multiple rentals, let user select
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.toastService.show('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.errorMsg.set('Lỗi tải danh sách trọ từ máy chủ. Vui lòng thử lại sau.');
          this.toastService.show('Có lỗi xảy ra khi tải danh sách trọ.', 'error');
        }
      }
    });
  }

  selectRental(contractId: number): void {
    this.selectedContractId.set(contractId);
    this.fetchMyRentalDetails(contractId);
  }

  goBackToList(): void {
    this.selectedContractId.set(null);
    this.rental.set(null);
  }

  fetchMyRentalDetails(contractId: number): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.contractService.getMyRental(contractId).subscribe({
      next: (data) => {
        this.rental.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.toastService.show('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (err.status === 404) {
          this.errorMsg.set(err.error || 'Không tìm thấy thông tin hợp đồng này.');
        } else {
          this.errorMsg.set('Lỗi tải thông tin trọ từ máy chủ. Vui lòng thử lại sau.');
          this.toastService.show('Có lỗi xảy ra khi tải thông tin trọ.', 'error');
        }
      }
    });
  }

  payCurrentBill(billId: number, maxAmount: number): void {
    const input = window.prompt(`Nhập số tiền muốn thanh toán (Tối đa: ${maxAmount}):`, maxAmount.toString());
    if (!input) return;

    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0 || amount > maxAmount) {
      this.toastService.show('Số tiền không hợp lệ. Phải lớn hơn 0 và không vượt quá số còn lại.', 'error');
      return;
    }

    if (!confirm(`Bạn có đồng ý thanh toán ${amount}đ cho hóa đơn tháng này không?`)) return;
    
    this.billService.payBill(billId, amount).subscribe({
      next: () => {
        this.toastService.show('Thanh toán hóa đơn thành công!', 'success');
        const id = this.selectedContractId();
        if (id) {
          this.fetchMyRentalDetails(id); // reload data for this specific contract
        }
      },
      error: () => {
        this.toastService.show('Có lỗi xảy ra khi thực hiện thanh toán.', 'error');
      }
    });
  }

  canReport(startDate: string): boolean {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    if (diffTime < 0) return false;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // within 1 month after staying
  }

  openReportModal(): void {
    this.isReportModalOpen.set(true);
    this.reportTitle.set('Đánh giá trải nghiệm thuê trọ');
    this.reportContent.set('');
    this.reportRating.set(5);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }

  submitReport(): void {
    if (!this.reportTitle().trim() || !this.reportContent().trim()) {
      this.toastService.show('Vui lòng nhập đầy đủ tiêu đề và nội dung đánh giá', 'error');
      return;
    }
    
    const req = {
      title: this.reportTitle(),
      content: this.reportContent(),
      contractId: this.selectedContractId() || this.rental()?.contractId,
      rating: this.reportRating()
    };

    this.reportService.createReport(req).subscribe({
      next: () => {
        this.toastService.show('Đánh giá của bạn đã được gửi thành công!', 'success');
        this.closeReportModal();
      },
      error: () => {
        this.toastService.show('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.', 'error');
      }
    });
  }
}
