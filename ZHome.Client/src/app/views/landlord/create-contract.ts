import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-contract-page animate-fade-in">
      
      <!-- Top Breadcrumb & Action Bar (Hidden during Print) -->
      <div class="no-print">
        <div class="top-nav-bar mb-3">
          <div class="d-flex align-items-center gap-2 text-sm text-muted">
            <a routerLink="/landlord/contracts" class="text-decoration-none text-primary fw-medium">
              <i class="fas fa-arrow-left me-1"></i> Quản lý hợp đồng
            </a>
            <span>/</span>
            <span class="text-secondary fw-semibold">Lập hợp đồng thuê trọ mới</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" (click)="togglePreviewMode()">
              <i class="fas" [class.fa-eye]="!showPreviewOnly()" [class.fa-edit]="showPreviewOnly()"></i>
              {{ showPreviewOnly() ? 'Chỉnh sửa thông tin' : 'Xem bản in hợp đồng' }}
            </button>
            <button type="button" class="btn btn-outline-primary px-3" (click)="exportToWord()">
              <i class="fas fa-file-word text-primary me-1"></i> Xuất file Word (.doc)
            </button>
            <button type="button" class="btn btn-outline-dark px-3" (click)="printContract()">
              <i class="fas fa-print me-1"></i> In hợp đồng
            </button>
            <button type="button" class="btn btn-primary px-4 fw-bold" [disabled]="isSubmitting()" (click)="submitContract()">
              <i class="fas fa-check-circle me-1"></i> {{ isSubmitting() ? 'Đang tạo...' : 'Lưu & Tạo hợp đồng' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Main Layout: Form & Live Legal Document -->
      <div class="contract-workspace-grid" [class.preview-fullscreen]="showPreviewOnly()">
        
        <!-- LEFT COLUMN: INPUT FORM (Hidden when in full preview mode or printing) -->
        <div class="form-container no-print" [class.d-none]="showPreviewOnly()">
          
          <!-- Card 1: Chọn Nhà trọ & Phòng -->
          <div class="contract-card mb-4">
            <div class="card-header-clean">
              <span class="card-badge">1</span>
              <h3 class="card-heading m-0">Chọn Nhà trọ & Phòng trọ</h3>
            </div>
            
            <div class="grid-2-col mb-3">
              <div class="form-group">
                <label class="form-label">Chọn Nhà trọ <span class="text-danger">*</span></label>
                <select [ngModel]="selectedPropertyId()" (ngModelChange)="onPropertyChange($event)" class="form-select">
                  <option [value]="0">-- Chọn nhà trọ --</option>
                  @for (p of propertyList(); track p.id) {
                    <option [value]="p.id">{{ p.title }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Chọn Phòng <span class="text-danger">*</span></label>
                <select [ngModel]="selectedRoomId()" (ngModelChange)="onRoomChange($event)" class="form-select" [disabled]="selectedPropertyId() === 0">
                  <option [value]="0">-- Chọn phòng thuê --</option>
                  @for (r of availableRooms(); track r.id) {
                    <option [value]="r.id">Phòng {{ r.roomNumber }} - {{ formatMoney(r.price) }} / tháng</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Địa chỉ khu trọ (tự động theo nhà trọ)</label>
              <input type="text" [value]="selectedPropertyAddress()" readonly class="form-control readonly-field" placeholder="Địa chỉ nhà trọ sẽ hiển thị ở đây..." />
            </div>
          </div>

          <!-- Card 2: Thông tin Bên A (Chủ cho thuê) -->
          <div class="contract-card mb-4">
            <div class="card-header-clean">
              <span class="card-badge">2</span>
              <h3 class="card-heading m-0">Đại diện Bên A (Bên cho thuê phòng)</h3>
            </div>

            <div class="grid-2-col mb-3">
              <div class="form-group">
                <label class="form-label">Họ và tên Bên A <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="partyA.fullName" class="form-control" placeholder="Ví dụ: Nguyễn Văn A" />
              </div>
              <div class="form-group">
                <label class="form-label">Sinh ngày / Năm sinh</label>
                <input type="text" [(ngModel)]="partyA.birthDate" class="form-control" placeholder="Ví dụ: 15/08/1980" />
              </div>
            </div>

            <div class="grid-3-col mb-3">
              <div class="form-group">
                <label class="form-label">Số CMND/CCCD <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="partyA.idCard" class="form-control" placeholder="12 chữ số CCCD" />
              </div>
              <div class="form-group">
                <label class="form-label">Ngày cấp</label>
                <input type="text" [(ngModel)]="partyA.idCardDate" class="form-control" placeholder="Ví dụ: 10/05/2021" />
              </div>
              <div class="form-group">
                <label class="form-label">Nơi cấp</label>
                <input type="text" [(ngModel)]="partyA.idCardPlace" class="form-control" placeholder="Cục CSQLHC về TTXH" />
              </div>
            </div>

            <div class="grid-2-col">
              <div class="form-group">
                <label class="form-label">Nơi đăng ký HK thường trú</label>
                <input type="text" [(ngModel)]="partyA.permanentAddress" class="form-control" placeholder="Địa chỉ hộ khẩu của chủ nhà" />
              </div>
              <div class="form-group">
                <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="partyA.phone" class="form-control" placeholder="Ví dụ: 0912345678" />
              </div>
            </div>
          </div>

          <!-- Card 3: Thông tin Bên B (Bên thuê phòng trọ) -->
          <div class="contract-card mb-4">
            <div class="card-header-clean">
              <span class="card-badge">3</span>
              <h3 class="card-heading m-0">Đại diện Bên B (Khách thuê phòng trọ)</h3>
            </div>

            <div class="grid-2-col mb-3">
              <div class="form-group">
                <label class="form-label">Số điện thoại khách thuê <span class="text-danger">*</span></label>
                <div class="input-with-icon">
                  <input 
                    type="text" 
                    [(ngModel)]="partyB.phone" 
                    (input)="onTenantPhoneInput($event)" 
                    class="form-control" 
                    placeholder="Nhập SĐT để tự động tra cứu khách cũ..." />
                  <span class="input-icon"><i class="fas fa-search"></i></span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Họ và tên Bên B <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="partyB.fullName" class="form-control" placeholder="Ví dụ: Trần Thị B" />
              </div>
            </div>

            <div class="grid-3-col mb-3">
              <div class="form-group">
                <label class="form-label">Số CMND/CCCD <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="partyB.idCard" class="form-control" placeholder="12 chữ số CCCD" />
              </div>
              <div class="form-group">
                <label class="form-label">Sinh ngày / Năm sinh</label>
                <input type="text" [(ngModel)]="partyB.birthDate" class="form-control" placeholder="Ví dụ: 20/11/2002" />
              </div>
              <div class="form-group">
                <label class="form-label">Ngày cấp & Nơi cấp</label>
                <input type="text" [(ngModel)]="partyB.idCardPlace" class="form-control" placeholder="VD: 15/02/2022 tại Cục CSQLHC" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nơi đăng ký HK thường trú</label>
              <input type="text" [(ngModel)]="partyB.permanentAddress" class="form-control" placeholder="Địa chỉ thường trú theo CCCD của người thuê" />
            </div>
          </div>

          <!-- Card 4: Điều khoản Chi phí & Thời hạn hợp đồng -->
          <div class="contract-card mb-4">
            <div class="card-header-clean">
              <span class="card-badge">4</span>
              <h3 class="card-heading m-0">Thời hạn hợp đồng & Chi phí thanh toán</h3>
            </div>

            <div class="grid-2-col mb-3">
              <div class="form-group">
                <label class="form-label">Ngày bắt đầu hợp đồng <span class="text-danger">*</span></label>
                <input type="date" [(ngModel)]="contractDetails.startDate" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Ngày hết hạn hợp đồng <span class="text-danger">*</span></label>
                <input type="date" [(ngModel)]="contractDetails.endDate" class="form-control" />
              </div>
            </div>

            <div class="grid-2-col mb-3">
              <div class="form-group">
                <label class="form-label">Giá thuê phòng (VNĐ/tháng) <span class="text-danger">*</span></label>
                <input type="number" [(ngModel)]="contractDetails.roomPrice" class="form-control" placeholder="Ví dụ: 2500000" />
                <span class="text-xs text-primary mt-1 d-block">{{ formatMoney(contractDetails.roomPrice) }} / tháng</span>
              </div>
              <div class="form-group">
                <label class="form-label">Tiền đặt cọc (VNĐ) <span class="text-danger">*</span></label>
                <input type="number" [(ngModel)]="contractDetails.depositAmount" class="form-control" placeholder="Ví dụ: 2500000" />
                <span class="text-xs text-success mt-1 d-block">{{ formatMoney(contractDetails.depositAmount) }}</span>
              </div>
            </div>

            <div class="grid-3-col mb-3">
              <div class="form-group">
                <label class="form-label">Hình thức / Chu kỳ</label>
                <select [(ngModel)]="contractDetails.paymentCycle" class="form-select">
                  <option value="1 tháng">1 tháng / lần</option>
                  <option value="3 tháng">3 tháng / lần</option>
                  <option value="6 tháng">6 tháng / lần</option>
                  <option value="12 tháng">12 tháng / lần</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tiền điện (đ/kWh)</label>
                <input type="number" [(ngModel)]="contractDetails.electricityPrice" class="form-control" placeholder="3500" />
              </div>
              <div class="form-group">
                <label class="form-label">Tiền nước</label>
                <input type="text" [(ngModel)]="contractDetails.waterPriceText" class="form-control" placeholder="VD: 100.000 đ/người" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tiền Internet / Wifi & Dịch vụ kèm theo</label>
              <input type="text" [(ngModel)]="contractDetails.otherServices" class="form-control" placeholder="VD: Miễn phí Wifi, rác sinh hoạt 30.000 đ/tháng" />
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: CHUẨN FORM THEO mau-hop-dong-thue-nha-tro-ngan-gon.docx (PRINTABLE DOCUMENT) -->
        <div class="preview-container">
          
          <div class="legal-doc-paper shadow-sm" id="printable-contract-paper">
            
            <!-- QUỐC HIỆU TIÊU NGỮ -->
            <div class="legal-doc-header text-center mb-4">
              <h4 class="country-title fw-bold m-0 text-uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <p class="country-motto fw-semibold m-0 mt-1">Độc lập - Tự do - Hạnh phúc</p>
              <div class="header-line">-----------------</div>
              
              <h2 class="contract-doc-title fw-bold text-uppercase mt-4 mb-2">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
              <p class="contract-date-place italic text-muted">
                Hôm nay, ngày {{ getDay(contractDetails.startDate) }} tháng {{ getMonth(contractDetails.startDate) }} năm {{ getYear(contractDetails.startDate) }}; 
                tại địa chỉ: {{ selectedPropertyAddress() || '................................................' }}
              </p>
            </div>

            <!-- NỘI DUNG CHÚNG TÔI GỒM -->
            <div class="legal-doc-body">
              <p class="fw-bold mb-2">Chúng tôi gồm:</p>

              <!-- 1. BÊN A -->
              <div class="party-block mb-3">
                <p class="party-name fw-bold mb-1">1. Đại diện bên cho thuê phòng trọ (Bên A):</p>
                <div class="party-fields">
                  <p class="mb-1">Ông/bà: <strong class="text-uppercase">{{ partyA.fullName || '................................................' }}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Sinh ngày: {{ partyA.birthDate || '........................' }}</p>
                  <p class="mb-1">Nơi đăng ký HK: {{ partyA.permanentAddress || '................................................................................' }}</p>
                  <p class="mb-1">CMND/CCCD số: <strong>{{ partyA.idCard || '........................' }}</strong> &nbsp;&nbsp;&nbsp;&nbsp; cấp ngày: {{ partyA.idCardDate || '..../..../........' }} &nbsp;&nbsp;&nbsp;&nbsp; tại: {{ partyA.idCardPlace || '........................' }}</p>
                  <p class="mb-1">Số điện thoại: <strong>{{ partyA.phone || '................................................' }}</strong></p>
                </div>
              </div>

              <!-- 2. BÊN B -->
              <div class="party-block mb-3">
                <p class="party-name fw-bold mb-1">2. Bên thuê phòng trọ (Bên B):</p>
                <div class="party-fields">
                  <p class="mb-1">Ông/bà: <strong class="text-uppercase">{{ partyB.fullName || '................................................' }}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Sinh ngày: {{ partyB.birthDate || '........................' }}</p>
                  <p class="mb-1">Nơi đăng ký HK thường trú: {{ partyB.permanentAddress || '................................................................................' }}</p>
                  <p class="mb-1">Số CMND/CCCD: <strong>{{ partyB.idCard || '........................' }}</strong> &nbsp;&nbsp;&nbsp;&nbsp; cấp ngày/nơi cấp: {{ partyB.idCardPlace || '..../..../........ tại ........................' }}</p>
                  <p class="mb-1">Số điện thoại: <strong>{{ partyB.phone || '................................................' }}</strong></p>
                </div>
              </div>

              <!-- THỎA THUẬN CHUNG -->
              <div class="agreement-block mb-3">
                <p class="italic mb-2">Sau khi bàn bạc trên tinh thần dân chủ, hai bên cùng có lợi, cùng thống nhất như sau:</p>
                <p class="mb-1">
                  Bên A đồng ý cho bên B thuê <strong>01 phòng ở (Phòng số {{ selectedRoomNumber() || '...' }})</strong> 
                  tại địa chỉ: <strong>{{ selectedPropertyAddress() || '................................................' }}</strong>
                </p>
                <p class="mb-1">Giá thuê: <strong class="text-primary">{{ formatMoney(contractDetails.roomPrice) }}/tháng</strong>.</p>
                <p class="mb-1">Hình thức thanh toán: <strong>Thanh toán theo chu kỳ {{ contractDetails.paymentCycle }}</strong> vào đầu mỗi kỳ thanh toán.</p>
                <p class="mb-1">Tiền điện: <strong>{{ contractDetails.electricityPrice.toLocaleString('vi-VN') }} đ/kWh</strong> tính theo chỉ số công tơ, thanh toán vào cuối các tháng.</p>
                <p class="mb-1">Tiền nước: <strong>{{ contractDetails.waterPriceText || '100.000 đ/người' }}</strong> thanh toán vào đầu các tháng.</p>
                <p class="mb-1">Dịch vụ khác: {{ contractDetails.otherServices || 'Theo quy định chung của nhà trọ' }}.</p>
                <p class="mb-1">Tiền đặt cọc: <strong>{{ formatMoney(contractDetails.depositAmount) }}</strong> (Bên A giữ và hoàn trả khi thanh lý hợp đồng đúng thỏa thuận).</p>
                <p class="mb-1">
                  Hợp đồng có giá trị kể từ ngày <strong>{{ formatDateVN(contractDetails.startDate) }}</strong> 
                  đến ngày <strong>{{ formatDateVN(contractDetails.endDate) }}</strong>.
                </p>
              </div>

              <!-- TRÁCH NHIỆM CỦA CÁC BÊN -->
              <div class="clauses-block mb-3">
                <h5 class="fw-bold text-uppercase fs-6 mb-2">TRÁCH NHIỆM CỦA CÁC BÊN</h5>
                <p class="fw-bold mb-1">* Trách nhiệm của bên A:</p>
                <ul class="clause-list mb-2">
                  <li>Tạo mọi điều kiện thuận lợi để bên B thực hiện theo hợp đồng.</li>
                  <li>Cung cấp nguồn điện, nước, wifi cho bên B sử dụng.</li>
                </ul>

                <p class="fw-bold mb-1">* Trách nhiệm của bên B:</p>
                <ul class="clause-list mb-2">
                  <li>Thanh toán đầy đủ các khoản tiền theo đúng thỏa thuận.</li>
                  <li>Bảo quản các trang thiết bị và cơ sở vật chất của bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).</li>
                  <li>Không được tự ý sửa chữa, cải tạo cơ sở vật chất khi chưa được sự đồng ý của bên A.</li>
                  <li>Giữ gìn vệ sinh trong và ngoài khuôn viên của phòng trọ.</li>
                  <li>Bên B phải chấp hành mọi quy định của pháp luật Nhà nước và quy định của địa phương.</li>
                  <li>Nếu bên B cho khách ở qua đêm thì phải báo và được sự đồng ý của chủ nhà đồng thời phải chịu trách nhiệm về các hành vi vi phạm pháp luật của khách trong thời gian ở lại.</li>
                </ul>
              </div>

              <!-- TRÁCH NHIỆM CHUNG -->
              <div class="clauses-block mb-4">
                <h5 class="fw-bold text-uppercase fs-6 mb-2">TRÁCH NHIỆM CHUNG</h5>
                <ul class="clause-list">
                  <li>Hai bên phải tạo điều kiện cho nhau thực hiện hợp đồng.</li>
                  <li>Trong thời gian hợp đồng còn hiệu lực nếu bên nào vi phạm các điều khoản đã thỏa thuận thì bên còn lại có quyền đơn phương chấm dứt hợp đồng; nếu sự vi phạm hợp đồng đó gây tổn thất cho bên bị vi phạm hợp đồng thì bên vi phạm hợp đồng phải bồi thường thiệt hại.</li>
                  <li>Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải báo trước cho bên kia ít nhất 30 ngày và hai bên phải có sự thống nhất.</li>
                  <li>Bên A phải trả lại tiền đặt cọc cho bên B khi kết thúc hợp đồng mà không vi phạm các điều khoản.</li>
                  <li>Bên nào vi phạm điều khoản chung thì phải chịu trách nhiệm trước pháp luật.</li>
                  <li>Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản.</li>
                </ul>
              </div>

              <!-- CHỮ KÝ HAI BÊN -->
              <div class="signature-section mt-5">
                <div class="sig-grid">
                  <div class="sig-column text-center">
                    <h5 class="fw-bold mb-1 text-uppercase">ĐẠI DIỆN BÊN B</h5>
                    <p class="text-xs text-muted mb-5 italic">(Ký và ghi rõ họ tên)</p>
                    <div class="sig-space"></div>
                    <strong class="text-uppercase d-block mt-4">{{ partyB.fullName || '' }}</strong>
                  </div>
                  <div class="sig-column text-center">
                    <h5 class="fw-bold mb-1 text-uppercase">ĐẠI DIỆN BÊN A</h5>
                    <p class="text-xs text-muted mb-5 italic">(Ký và ghi rõ họ tên)</p>
                    <div class="sig-space"></div>
                    <strong class="text-uppercase d-block mt-4">{{ partyA.fullName || '' }}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .create-contract-page {
      padding: 1.5rem 1rem 3rem 1rem;
      max-width: 1400px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .top-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 0.9rem 1.4rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex-wrap: wrap;
      gap: 12px;
    }

    .contract-workspace-grid {
      display: grid;
      grid-template-columns: 46% 54%;
      gap: 24px;
      align-items: start;
    }

    .contract-workspace-grid.preview-fullscreen {
      grid-template-columns: 1fr;
    }

    .contract-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem 1.6rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    }

    .card-header-clean {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.2rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.8rem;
    }

    .card-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #2563eb;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .card-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }

    .form-label {
      font-size: 0.86rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
      display: block;
    }

    .form-control, .form-select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.88rem;
      color: #1e293b;
      width: 100%;
      height: 40px;
      background: #ffffff;
      transition: all 0.2s ease;
    }

    .form-control:focus, .form-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      outline: none;
    }

    .readonly-field {
      background: #f8fafc !important;
      color: #64748b !important;
      cursor: not-allowed;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .grid-3-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .input-with-icon {
      position: relative;
    }

    .input-with-icon input {
      padding-right: 32px;
    }

    .input-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }

    /* LEGAL A4 DOCUMENT PAPER STYLING */
    .legal-doc-paper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 2.5rem 2.8rem;
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      font-size: 1.05rem;
      line-height: 1.5;
      min-height: 900px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .header-line {
      font-weight: bold;
      letter-spacing: 2px;
      color: #333333;
    }

    .contract-doc-title {
      color: #000000;
      font-size: 1.45rem;
      letter-spacing: 0.02em;
    }

    .country-title {
      font-size: 1.15rem;
    }

    .country-motto {
      font-size: 1.05rem;
    }

    .clause-list {
      margin: 0;
      padding-left: 20px;
    }

    .clause-list li {
      margin-bottom: 4px;
      text-align: justify;
    }

    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 30px;
    }

    .sig-space {
      height: 65px;
    }

    .italic { font-style: italic; }

    /* PRINT RULES */
    @media print {
      body * {
        visibility: hidden;
      }
      .no-print {
        display: none !important;
      }
      #printable-contract-paper, #printable-contract-paper * {
        visibility: visible;
      }
      #printable-contract-paper {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    }

    @media (max-width: 992px) {
      .contract-workspace-grid {
        grid-template-columns: 1fr;
      }
      .grid-2-col, .grid-3-col {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CreateContractComponent implements OnInit {
  private readonly contractService = inject(ContractService);
  private readonly propertyService = inject(PropertyService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  propertyList = signal<any[]>([]);
  allRooms = signal<any[]>([]);
  selectedPropertyId = signal<number>(0);
  selectedRoomId = signal<number>(0);
  showPreviewOnly = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Bên A (Chủ trọ)
  partyA = {
    fullName: '',
    birthDate: '',
    permanentAddress: '',
    idCard: '',
    idCardDate: '',
    idCardPlace: '',
    phone: ''
  };

  // Bên B (Khách thuê)
  partyB = {
    fullName: '',
    birthDate: '',
    permanentAddress: '',
    idCard: '',
    idCardPlace: '',
    phone: ''
  };

  // Chi tiết hợp đồng
  contractDetails = {
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10),
    roomPrice: 2500000,
    depositAmount: 2500000,
    paymentCycle: '1 tháng',
    electricityPrice: 3500,
    waterPriceText: '100.000 đ/người',
    otherServices: 'Wifi miễn phí, rác sinh hoạt 30.000 đ/tháng'
  };

  availableRooms = computed(() => {
    const propId = this.selectedPropertyId();
    if (!propId) return [];
    return this.allRooms().filter(r => r.propertyId === propId);
  });

  selectedPropertyAddress = computed(() => {
    const prop = this.propertyList().find(p => p.id === this.selectedPropertyId());
    return prop?.address || '';
  });

  selectedRoomNumber = computed(() => {
    const room = this.allRooms().find(r => r.id === this.selectedRoomId());
    return room?.roomNumber || '';
  });

  ngOnInit(): void {
    this.loadLandlordProfile();
    this.loadPropertiesAndRooms();
  }

  loadLandlordProfile(): void {
    const session = this.authService.session();
    this.partyA.fullName = session?.fullName || 'Chủ trọ ZHome';
    this.partyA.phone = session?.phone || '';
    this.partyA.idCard = (session as any)?.cccdNumber || '';
  }

  loadPropertiesAndRooms(): void {
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        this.propertyList.set(properties);
        const rooms: any[] = [];
        for (const p of properties) {
          if (p.rooms) {
            for (const r of p.rooms) {
              rooms.push({
                ...r,
                propertyId: p.id,
                propertyTitle: p.title,
                propertyAddress: p.address
              });
            }
          }
        }
        this.allRooms.set(rooms);

        // Process query parameters (propertyId, roomId)
        this.route.queryParams.subscribe(params => {
          if (params['propertyId']) {
            const pId = Number(params['propertyId']);
            this.selectedPropertyId.set(pId);
          } else if (properties.length > 0) {
            this.selectedPropertyId.set(properties[0].id);
          }

          if (params['roomId']) {
            const rId = Number(params['roomId']);
            this.selectedRoomId.set(rId);
            this.onRoomChange(rId);
          } else {
            const roomsForProp = this.availableRooms();
            if (roomsForProp.length > 0) {
              this.onRoomChange(roomsForProp[0].id);
            }
          }
        });
      },
      error: () => this.toastService.show('Lỗi tải danh sách phòng trọ.', 'error')
    });
  }

  onPropertyChange(propId: any): void {
    const id = Number(propId);
    this.selectedPropertyId.set(id);
    const rooms = this.allRooms().filter(r => r.propertyId === id);
    if (rooms.length > 0) {
      this.onRoomChange(rooms[0].id);
    } else {
      this.selectedRoomId.set(0);
    }
  }

  onRoomChange(roomId: any): void {
    const id = Number(roomId);
    this.selectedRoomId.set(id);
    const room = this.allRooms().find(r => r.id === id);
    if (room) {
      this.contractDetails.roomPrice = room.price || 2500000;
      this.contractDetails.depositAmount = room.deposit || room.price || 2500000;
      if (room.paymentCycle) {
        this.contractDetails.paymentCycle = room.paymentCycle;
      }
    }
  }

  onTenantPhoneInput(event: any): void {
    const phone = event.target?.value?.trim() || '';
    if (phone && /^0[35789]\d{8}$/.test(phone)) {
      this.contractService.getTenantByPhone(phone).subscribe({
        next: (tenant) => {
          if (tenant) {
            this.partyB.fullName = tenant.fullName || this.partyB.fullName;
            this.partyB.idCard = tenant.cccdNumber || this.partyB.idCard;
            this.toastService.show(`Tìm thấy thông tin khách: ${tenant.fullName}`, 'success');
          }
        },
        error: () => {}
      });
    }
  }

  togglePreviewMode(): void {
    this.showPreviewOnly.update(v => !v);
  }

  printContract(): void {
    window.print();
  }

  exportToWord(): void {
    const content = document.getElementById('printable-contract-paper')?.innerHTML;
    if (!content) {
      this.toastService.show('Không tìm thấy nội dung hợp đồng để xuất.', 'error');
      return;
    }

    const tenantName = this.partyB.fullName.trim() || 'KhachThue';
    const roomNum = this.selectedRoomNumber() || 'PhongTro';
    const fileName = `HopDongThueTro_${roomNum}_${tenantName.replace(/\s+/g, '_')}.doc`;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hợp Đồng Thuê Phòng Trọ</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          h2, h4, h5 { text-align: center; margin: 5px 0; }
          p { margin: 4px 0; }
          .text-center { text-align: center; }
          .text-uppercase { text-transform: uppercase; }
          .fw-bold { font-weight: bold; }
          .italic { font-style: italic; }
          .sig-grid { width: 100%; margin-top: 30px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    this.toastService.show(`Đã xuất file Word hợp đồng cho khách ${tenantName}!`, 'success');
  }

  submitContract(): void {
    if (!this.selectedRoomId()) {
      this.toastService.show('Vui lòng chọn phòng trọ!', 'error');
      return;
    }
    if (!this.partyB.fullName.trim() || !this.partyB.phone.trim()) {
      this.toastService.show('Vui lòng nhập họ tên và số điện thoại khách thuê!', 'error');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      roomId: this.selectedRoomId(),
      propertyId: this.selectedPropertyId(),
      propertyTitle: this.propertyList().find(p => p.id === this.selectedPropertyId())?.title || '',
      roomNumber: this.selectedRoomNumber(),
      startDate: this.contractDetails.startDate,
      endDate: this.contractDetails.endDate,
      roomPrice: this.contractDetails.roomPrice,
      depositAmount: this.contractDetails.depositAmount,
      bedsCount: 1,
      paymentCycle: this.contractDetails.paymentCycle,
      tenantFullName: this.partyB.fullName.trim(),
      tenantPhone: this.partyB.phone.trim(),
      tenantIdCardNumber: this.partyB.idCard.trim(),
      electricityUnitPrice: this.contractDetails.electricityPrice,
      waterPricingType: 'fixed',
      waterUnitPrice: 100000
    };

    this.contractService.checkIn(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show(`Lập hợp đồng thành công cho phòng ${this.selectedRoomNumber()}!`, 'success');
        this.router.navigate(['/landlord/contracts']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi khi lập hợp đồng.');
        this.toastService.show(msg, 'error');
      }
    });
  }

  formatMoney(val: any): string {
    if (!val) return '0 đ';
    const num = Number(val);
    return isNaN(num) ? '0 đ' : num.toLocaleString('vi-VN') + ' đ';
  }

  formatDateVN(dateStr: string): string {
    if (!dateStr) return '..../..../........';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDay(dateStr: string): string {
    if (!dateStr) return '..';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '..' : String(d.getDate()).padStart(2, '0');
  }

  getMonth(dateStr: string): string {
    if (!dateStr) return '..';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '..' : String(d.getMonth() + 1).padStart(2, '0');
  }

  getYear(dateStr: string): string {
    if (!dateStr) return '....';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '....' : String(d.getFullYear());
  }
}
