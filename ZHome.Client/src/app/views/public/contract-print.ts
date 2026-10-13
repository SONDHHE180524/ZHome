import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-contract-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="print-page-wrapper">
      
      <!-- Top Action Bar (Hidden when printing/exporting PDF) -->
      <div class="actions-panel no-print">
        <button (click)="goBack()" class="btn-action-back">
          ← Quay lại
        </button>
        <div class="d-flex gap-2">
          <button (click)="exportWord()" class="btn-action-word">
            📥 Tải File Word (.doc)
          </button>
          <button (click)="printContract()" class="btn-action-print">
            🖨️ Xuất / In File PDF Hợp Đồng (A4)
          </button>
        </div>
      </div>

      <!-- Loading & Error States -->
      @if (isLoading()) {
        <div class="status-msg">
          <div class="spinner"></div>
          <p>Đang tải văn bản hợp đồng pháp lý...</p>
        </div>
      } @else if (errorMsg(); as error) {
        <div class="status-msg error-box">
          <p class="error-title">⚠️ Không tìm thấy hợp đồng</p>
          <p>{{ error }}</p>
          <button routerLink="/" class="btn-action-back mt-3">Về Trang Chủ</button>
        </div>
      } @else if (contract(); as doc) {
        
        <!-- Printable Contract Paper (Standard A4 Format) -->
        <div class="contract-paper-card animate-fade-in" id="printableLegalContract">
          
          <!-- Certified Notarized Seal Stamp -->
          <div class="certified-stamp">
            <div class="stamp-inner">
              <span class="stamp-top">XÁC THỰC PHÁP LÝ</span>
              <span class="stamp-logo">ZHOME</span>
              <span class="stamp-sub">HỢP ĐỒNG ĐIỆN TỬ</span>
              <span class="stamp-date">{{ doc.startDate | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Quốc hiệu & Tiêu ngữ -->
          <div class="header-national text-center mb-3">
            <h3 class="country-title m-0">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
            <p class="country-motto m-0 mt-1">Độc lập - Tự do - Hạnh phúc</p>
            <div class="motto-divider">-----------------</div>
          </div>

          <!-- Tiêu đề Hợp đồng -->
          <div class="header-doc text-center mb-4">
            <h2 class="contract-doc-title m-0">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h2>
            <p class="legal-basis m-0 mt-2">
              <em>Hôm nay, ngày {{ doc.startDate | date:'dd' }} tháng {{ doc.startDate | date:'MM' }} năm {{ doc.startDate | date:'yyyy' }}; tại địa chỉ: {{ doc.propertyAddress || doc.propertyTitle }}</em>
            </p>
          </div>

          <div class="contract-body">
            <p class="intro-parties"><strong>Chúng tôi gồm:</strong></p>

            <!-- 1. BÊN A -->
            <div class="party-block">
              <p class="party-title"><strong>1. Đại diện bên cho thuê phòng trọ (Bên A):</strong></p>
              <div class="party-details">
                <p>Ông/bà: <strong class="text-uppercase">{{ doc.landlordFullName }}</strong></p>
                <p>Nơi đăng ký HK thường trú: <strong>{{ doc.propertyAddress || 'Đăng ký theo CCCD / Thường trú hợp pháp' }}</strong></p>
                <p>CMND/CCCD số: <strong>{{ doc.landlordCccd || '075189005448' }}</strong></p>
                <p>Số điện thoại liên hệ: <strong>{{ doc.landlordPhone }}</strong></p>
              </div>
            </div>

            <!-- 2. BÊN B -->
            <div class="party-block mt-3">
              <p class="party-title"><strong>2. Bên thuê phòng trọ (Bên B):</strong></p>
              <div class="party-details">
                <p>Ông/bà: <strong class="text-uppercase">{{ doc.tenantFullName }}</strong></p>
                <p>Nơi đăng ký HK thường trú: <strong>Đăng ký theo CCCD / Thường trú hợp pháp</strong></p>
                <p>CMND/CCCD số: <strong>{{ doc.tenantCccd || 'Chưa cập nhật' }}</strong></p>
                <p>Số điện thoại liên hệ: <strong>{{ doc.tenantPhone }}</strong></p>
              </div>
            </div>

            <!-- NỘI DUNG THỎA THUẬN -->
            <div class="agreement-content mt-4">
              <p class="agreement-intro"><em>Sau khi bàn bạc trên tinh thần dân chủ, hai bên cùng có lợi, cùng thống nhất các điều khoản sau:</em></p>

              <div class="clause-item">
                <strong>Điều 1 (Đối tượng hợp đồng):</strong> Bên A đồng ý cho bên B thuê <strong>01 phòng ở (Phòng số {{ doc.roomNumber }})</strong> tại địa chỉ: <strong>{{ doc.propertyAddress || doc.propertyTitle }}</strong> (Diện tích phòng: <strong>{{ doc.area || 20 }} m²</strong>).
              </div>

              <div class="clause-item">
                <strong>Điều 2 (Giá thuê & Thanh toán):</strong>
                <ul>
                  <li>Giá thuê phòng: <strong>{{ doc.roomPrice | number:'1.0-0' }} VNĐ / tháng</strong> (Bằng chữ: <em>{{ getMoneyInWords(doc.roomPrice) }}</em>).</li>
                  <li>Hình thức thanh toán: <strong>Thanh toán theo chu kỳ 1 tháng</strong> vào đầu mỗi kỳ thanh toán (trước ngày 05 hàng tháng).</li>
                  <li>Tiền điện: <strong>3.500 VNĐ / kWh</strong> tính theo chỉ số công tơ điện tử thực tế, thanh toán vào cuối các tháng.</li>
                  <li>Tiền nước: <strong>100.000 VNĐ / người / tháng</strong> (hoặc tính theo chỉ số đồng hồ nước riêng).</li>
                  <li>Tiền đặt cọc: <strong>{{ (doc.depositAmount || doc.roomPrice) | number:'1.0-0' }} VNĐ</strong> (Bằng chữ: <em>{{ getMoneyInWords(doc.depositAmount || doc.roomPrice) }}</em>). Bên A giữ và cam kết hoàn trả đầy đủ cho Bên B khi kết thúc hợp đồng đúng thỏa thuận.</li>
                </ul>
              </div>

              <div class="clause-item">
                <strong>Điều 3 (Thời hạn thuê):</strong> Hợp đồng có giá trị kể từ ngày <strong>{{ doc.startDate | date:'dd/MM/yyyy' }}</strong> đến ngày <strong>{{ doc.endDate | date:'dd/MM/yyyy' }}</strong>.
              </div>

              <div class="clause-item">
                <strong>Điều 4 (Trách nhiệm của Bên A):</strong>
                <ul>
                  <li>Tạo mọi điều kiện thuận lợi và hợp pháp để Bên B thực hiện hợp đồng.</li>
                  <li>Cung cấp đầy đủ hạ tầng điện, nước, đường truyền internet wifi cho Bên B sử dụng liên tục.</li>
                  <li>Bảo đảm quyền sử dụng trọn vẹn, riêng tư và an ninh của Bên B đối với phòng thuê.</li>
                </ul>
              </div>

              <div class="clause-item">
                <strong>Điều 5 (Trách nhiệm của Bên B):</strong>
                <ul>
                  <li>Thanh toán đầy đủ và đúng hạn tiền thuê phòng và các chi phí dịch vụ phát sinh hàng tháng.</li>
                  <li>Bảo quản trang thiết bị và cơ sở vật chất ban đầu được bàn giao. Làm hỏng phải bồi thường hoặc tự sửa chữa.</li>
                  <li>Không được tự ý sửa chữa, đục phá kết cấu phòng trọ khi chưa có sự đồng ý bằng văn bản của Bên A.</li>
                  <li>Giữ gìn vệ sinh chung, nếp sống văn minh và an ninh trật tự trong khu trọ. Chấp hành đầy đủ quy định của pháp luật và chính quyền địa phương.</li>
                </ul>
              </div>

              <div class="clause-item">
                <strong>Điều 6 (Điều khoản thi hành):</strong>
                <ul>
                  <li>Nếu một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải thông báo bằng văn bản hoặc qua ứng dụng cho bên kia trước ít nhất <strong>30 ngày</strong>.</li>
                  <li>Bên A hoàn trả 100% tiền đặt cọc khi Bên B bàn giao lại phòng nguyên trạng và hoàn tất các khoản thanh toán.</li>
                  <li>Hợp đồng được lập thành văn bản điện tử và ký kết trên nền tảng ZHome, các bên công nhận giá trị pháp lý tương đương văn bản giấy.</li>
                </ul>
              </div>
            </div>

            <!-- CHỮ KÝ 2 BÊN -->
            <div class="signatures-grid mt-5">
              <div class="sig-col text-center">
                <p class="sig-role"><strong>ĐẠI DIỆN BÊN B (BÊN THUÊ)</strong></p>
                <p class="sig-sub"><em>(Ký, ghi rõ họ tên)</em></p>
                <div class="sig-space"></div>
                <p class="sig-name"><strong>{{ doc.tenantFullName }}</strong></p>
              </div>

              <div class="sig-col text-center">
                <p class="sig-role"><strong>ĐẠI DIỆN BÊN A (CHO THUÊ)</strong></p>
                <p class="sig-sub"><em>(Ký, ghi rõ họ tên)</em></p>
                <div class="sig-space"></div>
                <p class="sig-name"><strong>{{ doc.landlordFullName }}</strong></p>
              </div>
            </div>

            <!-- Chân trang pháp lý -->
            <div class="contract-footer mt-5 text-center text-muted">
              <small>Hệ thống Quản lý & Kết nối trọ ZHome • Mã hợp đồng: #CTR-{{ doc.contractId || doc.id || '2026' }} • Chứng thực điện tử</small>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .print-page-wrapper {
      min-height: 100vh;
      background: #f1f5f9;
      padding: 30px 20px;
      font-family: 'Times New Roman', Times, serif;
      color: #111827;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .actions-panel {
      width: 100%;
      max-width: 820px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .btn-action-back {
      padding: 10px 18px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #475569;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action-back:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-action-word {
      padding: 10px 18px;
      background: #ffffff;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action-word:hover {
      background: #eff6ff;
    }

    .btn-action-print {
      padding: 10px 22px;
      background: #2563eb;
      border: 1px solid #1d4ed8;
      border-radius: 8px;
      color: #ffffff;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }
    .btn-action-print:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .contract-paper-card {
      width: 100%;
      max-width: 820px;
      background: #ffffff;
      padding: 50px 60px;
      border-radius: 4px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      line-height: 1.5;
    }

    .country-title {
      font-size: 1.15rem;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .country-motto {
      font-size: 1rem;
      font-weight: bold;
    }
    .motto-divider {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: -2px;
    }

    .contract-doc-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #0f172a;
    }
    .legal-basis {
      font-size: 0.95rem;
      color: #334155;
    }

    .party-title {
      font-size: 1.05rem;
      margin-bottom: 4px;
    }
    .party-details {
      padding-left: 20px;
    }
    .party-details p {
      margin: 3px 0;
    }

    .clause-item {
      margin-bottom: 12px;
      text-align: justify;
    }
    .clause-item ul {
      margin: 4px 0 0 20px;
      padding-left: 0;
    }
    .clause-item li {
      margin-bottom: 4px;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      page-break-inside: avoid;
    }
    .sig-role {
      font-size: 1rem;
      margin-bottom: 2px;
    }
    .sig-sub {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0;
    }
    .sig-space {
      height: 90px;
    }
    .sig-name {
      font-size: 1.05rem;
      border-top: 1px dotted #cbd5e1;
      padding-top: 6px;
      display: inline-block;
      min-width: 180px;
    }

    .certified-stamp {
      position: absolute;
      top: 35px;
      right: 40px;
      width: 125px;
      height: 125px;
      border: 3px dashed #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-12deg);
      opacity: 0.85;
      pointer-events: none;
      user-select: none;
    }
    .stamp-inner {
      text-align: center;
      color: #dc2626;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .stamp-top {
      font-size: 0.55rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .stamp-logo {
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 1px 0;
    }
    .stamp-sub {
      font-size: 0.55rem;
      font-weight: bold;
    }
    .stamp-date {
      font-size: 0.55rem;
      margin-top: 2px;
    }

    .status-msg {
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      font-family: system-ui, sans-serif;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Print Stylesheet */
    @media print {
      body, html {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-page-wrapper {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .contract-paper-card {
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm 20mm;
      }
    }
  `]
})
export class ContractPrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractService);

  isLoading = signal(true);
  errorMsg = signal<string | null>(null);
  contract = signal<any | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || isNaN(Number(id))) {
      this.errorMsg.set('Mã định danh hợp đồng không hợp lệ.');
      this.isLoading.set(false);
      return;
    }

    this.contractService.getLegalContractDocument(Number(id)).subscribe({
      next: (data) => {
        this.contract.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Không thể tải dữ liệu hợp đồng hoặc bạn không có quyền xem văn bản này.');
        this.isLoading.set(false);
      }
    });
  }

  printContract(): void {
    window.print();
  }

  goBack(): void {
    window.history.back();
  }

  getMoneyInWords(amount: number): string {
    if (!amount || isNaN(amount)) return 'Không đồng';
    const defaultMap: Record<number, string> = {
      1000000: 'Một triệu đồng',
      1200000: 'Một triệu hai trăm nghìn đồng',
      1300000: 'Một triệu ba trăm nghìn đồng',
      1400000: 'Một triệu bốn trăm nghìn đồng',
      1500000: 'Một triệu năm trăm nghìn đồng',
      1600000: 'Một triệu sáu trăm nghìn đồng',
      1700000: 'Một triệu bảy trăm nghìn đồng',
      1800000: 'Một triệu tám trăm nghìn đồng',
      1900000: 'Một triệu chín trăm nghìn đồng',
      2000000: 'Hai triệu đồng',
      2200000: 'Hai triệu hai trăm nghìn đồng',
      2500000: 'Hai triệu năm trăm nghìn đồng',
      3000000: 'Ba triệu đồng',
      3500000: 'Ba triệu năm trăm nghìn đồng',
      4000000: 'Bốn triệu đồng',
      5000000: 'Năm triệu đồng'
    };
    if (defaultMap[amount]) return defaultMap[amount];
    return Number(amount).toLocaleString('vi-VN') + ' đồng';
  }

  exportWord(): void {
    const doc = this.contract();
    const content = document.getElementById('printableLegalContract')?.innerHTML;
    if (!content) return;
    const tenantName = doc?.tenantFullName || 'KhachThue';
    const roomNumber = doc?.roomNumber || 'Phong';
    const fileName = `HopDongThue_${roomNumber}_${tenantName.replace(/\s+/g, '_')}.doc`;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hợp Đồng Thuê Phòng Trọ</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          h2, h3, h4, h5 { text-align: center; margin: 6px 0; }
          p { margin: 4px 0; }
          .text-center { text-align: center; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = url;
    link.download = fileName;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
