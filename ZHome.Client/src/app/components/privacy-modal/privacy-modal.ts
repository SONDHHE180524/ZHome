import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyService, PrivacyTab } from '../../services/privacy.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-privacy-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 1. Floating First-Visit Privacy Notification Banner -->
    @if (privacyService.isBannerVisible()) {
      <div class="privacy-banner-overlay animate-slide-up">
        <div class="privacy-banner-card">
          <div class="banner-icon-col">
            <div class="shield-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
          </div>
          <div class="banner-body" (click)="privacyService.openModal('tenant')" style="cursor: pointer;" title="Nhấn để xem chi tiết điều khoản">
            <div class="banner-title-row">
              <h4 class="banner-title">Thông Báo Điều Khoản Bảo Mật & Dữ Liệu Cá Nhân</h4>
              <span class="compliance-tag">Nghị định 13/2023/NĐ-CP</span>
            </div>
            <p class="banner-desc">
              Chào mừng bạn đến với Cổng ZHome! Nhằm bảo vệ tối đa quyền riêng tư và dữ liệu cá nhân của cả <strong>Khách thuê</strong> (SĐT, nhu cầu ở ghép, CCCD khi làm hợp đồng) và <strong>Chủ trọ</strong> (ảnh xác minh chính chủ, tài khoản ngân hàng), ZHome áp dụng các tiêu chuẩn an toàn bảo mật nghiêm ngặt.
            </p>
          </div>
          <div class="banner-actions">
            <button type="button" class="btn btn-outline-primary btn-sm" (click)="$event.stopPropagation(); privacyService.openModal('tenant')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Xem chi tiết điều khoản
            </button>
            <button type="button" class="btn btn-primary btn-sm btn-accept" (click)="$event.stopPropagation(); acceptConsent()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tôi đồng ý & Tiếp tục
            </button>
            <button type="button" class="banner-close-btn" (click)="$event.stopPropagation(); privacyService.dismissBanner()" title="Đóng thông báo">&times;</button>
          </div>
        </div>
      </div>
    }

    <!-- 2. Detailed Full Privacy Policy Modal -->
    @if (privacyService.isModalOpen()) {
      <div class="privacy-modal-backdrop animate-fade-in" (click)="privacyService.closeModal()">
        <div class="privacy-modal-dialog" (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="modal-header-custom">
            <div class="header-left">
              <div class="header-shield-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div>
                <div class="flex-align-center gap-2">
                  <h3 class="modal-main-title">Điều Khoản Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân</h3>
                  <span class="version-badge">Phiên bản 2.0 (2026)</span>
                </div>
                <p class="modal-sub-title">Căn cứ theo Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ Dữ liệu Cá nhân & Bộ luật Dân sự Việt Nam</p>
              </div>
            </div>
            <button class="modal-close-icon" (click)="privacyService.closeModal()" title="Đóng">&times;</button>
          </div>

          <!-- Tab Navigation -->
          <div class="policy-tabs">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="privacyService.activeTab() === 'tenant'" 
              (click)="privacyService.switchTab('tenant')">
              <span class="tab-icon">👤</span>
              <span>1. Dành Cho Khách Thuê</span>
              <span class="tab-indicator"></span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="privacyService.activeTab() === 'landlord'" 
              (click)="privacyService.switchTab('landlord')">
              <span class="tab-icon">🏠</span>
              <span>2. Dành Cho Chủ Trọ</span>
              <span class="tab-indicator"></span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="privacyService.activeTab() === 'rights'" 
              (click)="privacyService.switchTab('rights')">
              <span class="tab-icon">🛡️</span>
              <span>3. Quyền Lợi & Cam Kết</span>
              <span class="tab-indicator"></span>
            </button>
          </div>

          <!-- Tab Content Area -->
          <div class="policy-content-scroll">

            <!-- TAB 1: KHÁCH THUÊ -->
            @if (privacyService.activeTab() === 'tenant') {
              <div class="tab-panel animate-fade-in">
                <div class="role-intro-box bg-blue-subtle">
                  <div class="intro-icon">📋</div>
                  <div>
                    <strong>Chính sách bảo vệ quyền lợi Khách thuê phòng (Người tìm trọ, Sinh viên, Người đi làm)</strong>
                    <p>ZHome cam kết xây dựng môi trường tìm trọ văn minh, minh bạch, bảo vệ quyền riêng tư và thông tin liên lạc của khách thuê.</p>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">1. Các loại dữ liệu thu thập từ Khách thuê</h5>
                  <div class="grid-2-col">
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot"></span>
                        <strong>Thông tin tài khoản cơ bản</strong>
                      </div>
                      <p>Họ tên, số điện thoại kích hoạt tài khoản, địa chỉ email để nhận thông báo và hóa đơn tiền phòng điện tử.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot"></span>
                        <strong>Căn cước công dân (CCCD/CMND)</strong>
                      </div>
                      <p>Số CCCD chỉ được yêu cầu khi khách thuê chính thức tiến hành ký kết hợp đồng thuê trọ điện tử và hỗ trợ thủ tục đăng ký tạm trú theo luật định.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot"></span>
                        <strong>Nhu cầu tìm phòng & Ghép trọ (AI Match)</strong>
                      </div>
                      <p>Khu vực mong muốn, mức ngân sách, trường đại học, thói quen sinh hoạt (giờ giấc, hút thuốc, thú cưng) để gợi ý bạn cùng phòng tối ưu.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot"></span>
                        <strong>Lịch sử giao dịch & Hóa đơn</strong>
                      </div>
                      <p>Chỉ số điện nước tiêu thụ, tiền phòng hàng tháng và hình ảnh ủy nhiệm chi/biên lai chuyển khoản phục vụ đối soát minh bạch.</p>
                    </div>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">2. Mục đích xử lý & sử dụng thông tin</h5>
                  <ul class="policy-checklist">
                    <li>
                      <span class="check-icon">✓</span>
                      <span><strong>Kết nối trực tiếp:</strong> Hỗ trợ khách thuê liên hệ xem phòng trực tiếp với chủ trọ chính chủ, không qua trung gian môi giới lừa đảo.</span>
                    </li>
                    <li>
                      <span class="check-icon">✓</span>
                      <span><strong>Hợp đồng minh bạch:</strong> Tự động xuất file hợp đồng thuê trọ điện tử có giá trị pháp lý, ghi nhận đầy đủ quyền lợi và tiền cọc.</span>
                    </li>
                    <li>
                      <span class="check-icon">✓</span>
                      <span><strong>Nhắc hẹn & Hóa đơn thông minh:</strong> Tự động gửi thông báo hóa đơn, chỉ số điện nước và biên lai thanh toán hàng tháng.</span>
                    </li>
                  </ul>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">3. Cam kết tuyệt đối từ ZHome đối với Khách thuê</h5>
                  <div class="pledge-banner">
                    <div class="pledge-icon">🔒</div>
                    <div>
                      <strong>KHÔNG chia sẻ, bán dữ liệu số điện thoại cho bất kỳ bên thứ ba nào</strong>
                      <p>ZHome tuyệt đối không cung cấp thông tin liên hệ của bạn cho các đơn vị tiếp thị telesale, quảng cáo rác hay bên cho vay tiêu dùng.</p>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: CHỦ TRỌ -->
            @if (privacyService.activeTab() === 'landlord') {
              <div class="tab-panel animate-fade-in">
                <div class="role-intro-box bg-emerald-subtle">
                  <div class="intro-icon">🏡</div>
                  <div>
                    <strong>Chính sách dành cho Chủ trọ & Đơn vị quản lý kinh doanh nhà trọ</strong>
                    <p>Đảm bảo an toàn thông tin tài chính, tài sản nhà trọ và quy chuẩn xác thực chính chủ trên hệ thống ZHome.</p>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">1. Dữ liệu thu thập & Quy trình cấp Tích Xanh Chính Chủ</h5>
                  <div class="grid-2-col">
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot green-dot"></span>
                        <strong>Hồ sơ CCCD & Cấp Tích Xanh</strong>
                      </div>
                      <p>Chủ trọ cung cấp số CCCD và ảnh 2 mặt CCCD. Dữ liệu này chỉ phục vụ mục đích duy nhất: Quản trị viên đối chiếu và cấp Tích Xanh Xác Minh Chính Chủ, chống lừa đảo giả danh chủ nhà chiếm đoạt tiền cọc.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot green-dot"></span>
                        <strong>Tài khoản ngân hàng & Mã QR nhận tiền</strong>
                      </div>
                      <p>Tên chủ tài khoản, số tài khoản, ngân hàng và ảnh mã QR thanh toán để tự động tạo mã VietQR SePay/PayOS trên hóa đơn hàng tháng cho người thuê.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot green-dot"></span>
                        <strong>Thông tin cơ sở nhà trọ</strong>
                      </div>
                      <p>Địa chỉ, số lượng phòng, giá thuê niêm yết công khai, bảng giá dịch vụ điện nước và hình ảnh thực tế phòng trọ.</p>
                    </div>
                    <div class="info-card">
                      <div class="card-title-row">
                        <span class="bullet-dot green-dot"></span>
                        <strong>Bảo mật lưu trữ trên Supabase Cloud</strong>
                      </div>
                      <p>Toàn bộ ảnh CCCD và dữ liệu nhạy cảm của chủ trọ được mã hóa trên máy chủ Supabase với cơ chế Row-Level Security (RLS), ngăn chặn truy cập trái phép từ internet.</p>
                    </div>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">2. Trách nhiệm bắt buộc của Chủ trọ về Bảo mật thông tin Khách thuê</h5>
                  <div class="warning-box">
                    <div class="warning-icon">⚠️</div>
                    <div>
                      <strong>Nghĩa vụ bảo vệ dữ liệu người thuê phòng:</strong>
                      <ul class="warning-list mt-1">
                        <li>Chủ trọ chỉ được sử dụng thông tin CCCD và danh sách người thuê phòng vào mục đích đăng ký tạm trú, lưu trú với Cơ quan Công an và lập hợp đồng thuê.</li>
                        <li>Nghiêm cấm chia sẻ, phát tán, chụp ảnh thông tin cá nhân của người thuê lên mạng xã hội hoặc cung cấp cho bên khác khi chưa có sự đồng ý của khách.</li>
                        <li>Chủ trọ chịu trách nhiệm toàn diện trước pháp luật nếu cố ý để lộ lọt thông tin của khách thuê gây thiệt hại.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 3: QUYỀN LỢI & CAM KẾT -->
            @if (privacyService.activeTab() === 'rights') {
              <div class="tab-panel animate-fade-in">
                <div class="role-intro-box bg-purple-subtle">
                  <div class="intro-icon">⚖️</div>
                  <div>
                    <strong>Quyền của chủ thể dữ liệu & Biện pháp an ninh hệ thống</strong>
                    <p>Quyền kiểm soát thông tin cá nhân của bạn và các cam kết kỹ thuật bảo mật chuẩn quốc tế từ đội ngũ vận hành ZHome.</p>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">1. Các quyền hợp pháp của bạn đối với dữ liệu</h5>
                  <div class="rights-grid">
                    <div class="right-item">
                      <span class="right-number">01</span>
                      <div>
                        <strong>Quyền được biết & Truy cập:</strong>
                        <p>Xem toàn bộ thông tin tài khoản, hợp đồng và lịch sử giao dịch tại trang Cá nhân.</p>
                      </div>
                    </div>
                    <div class="right-item">
                      <span class="right-number">02</span>
                      <div>
                        <strong>Quyền chỉnh sửa & Cập nhật:</strong>
                        <p>Tự do chỉnh sửa số điện thoại, email, thông tin ngân hàng bất kỳ lúc nào.</p>
                      </div>
                    </div>
                    <div class="right-item">
                      <span class="right-number">03</span>
                      <div>
                        <strong>Quyền yêu cầu xóa bỏ / Hủy tài khoản:</strong>
                        <p>Gửi yêu cầu xóa hoàn toàn dữ liệu cá nhân khi kết thúc hợp đồng thuê hoặc ngừng sử dụng dịch vụ.</p>
                      </div>
                    </div>
                    <div class="right-item">
                      <span class="right-number">04</span>
                      <div>
                        <strong>Quyền khiếu nại & Bảo vệ:</strong>
                        <p>Khiếu nại trực tiếp đến Ban Quản Trị ZHome nếu phát hiện bất kỳ dấu hiệu xâm phạm dữ liệu nào.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">2. Biện pháp kỹ thuật bảo đảm an ninh dữ liệu</h5>
                  <div class="security-badges-row">
                    <div class="sec-badge">
                      <div class="sec-icon">🔐</div>
                      <div>
                        <strong>Mã hóa SSL/TLS 256-bit</strong>
                        <span>Mọi dữ liệu truyền tải giữa trình duyệt và máy chủ đều được mã hóa tuyệt đối.</span>
                      </div>
                    </div>
                    <div class="sec-badge">
                      <div class="sec-icon">🛡️</div>
                      <div>
                        <strong>Lưu trữ bảo mật Supabase Cloud</strong>
                        <span>Hệ thống cơ sở dữ liệu phân tầng hiện đại, tự động sao lưu định kỳ chống thất thoát.</span>
                      </div>
                    </div>
                    <div class="sec-badge">
                      <div class="sec-icon">🔑</div>
                      <div>
                        <strong>Mã hóa mật khẩu BCrypt</strong>
                        <span>Mật khẩu được băm một chiều an toàn, ngay cả Quản trị viên cũng không thể đọc được.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="clause-section">
                  <h5 class="clause-heading">3. Kênh liên hệ tiếp nhận & Xử lý sự cố bảo mật</h5>
                  <div class="contact-box-inner">
                    <p>Mọi thắc mắc hoặc yêu cầu liên quan đến dữ liệu cá nhân, vui lòng liên hệ:</p>
                    <div class="contact-methods">
                      <span>📧 Email: <strong>hotro&#64;zhome.vn</strong></span>
                      <span>☎️ Hotline: <strong>1900 6868</strong> (8h00 - 20h00 hàng ngày)</span>
                      <span>📍 Địa chỉ: <strong>Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="modal-footer-custom">
            <div class="footer-left-status">
              <span class="status-indicator-dot"></span>
              <span>Được bảo vệ bởi ZHome Privacy Shield &bull; Cập nhật ngày 14/10/2026</span>
            </div>
            <div class="footer-action-buttons">
              <button type="button" class="btn btn-secondary btn-sm" (click)="printPolicy()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                In điều khoản
              </button>
              <button type="button" class="btn btn-primary btn-sm btn-accept" (click)="acceptConsent()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Tôi Đã Đọc & Đồng Ý Điều Khoản
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* 1. Floating Bottom Banner Styles */
    .privacy-banner-overlay {
      position: fixed;
      bottom: 24px;
      left: 24px;
      right: 24px;
      max-width: 1080px;
      margin: 0 auto;
      z-index: 9999;
      pointer-events: none;
    }
    .privacy-banner-card {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(37, 99, 235, 0.25);
      border-radius: 16px;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(37, 99, 235, 0.08);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }
    .banner-icon-col {
      flex-shrink: 0;
    }
    .shield-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
    }
    .banner-body {
      flex: 1;
      min-width: 0;
    }
    .banner-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .banner-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .compliance-tag {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .banner-desc {
      font-size: 0.82rem;
      color: #475569;
      line-height: 1.45;
      margin: 0;
    }
    .banner-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .banner-close-btn {
      background: transparent;
      border: none;
      font-size: 1.4rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .banner-close-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    /* 2. Full Modal Styles */
    .privacy-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .privacy-modal-dialog {
      background: #ffffff;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(226, 232, 240, 0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Modal Header */
    .modal-header-custom {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-shield-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      flex-shrink: 0;
    }
    .modal-main-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .modal-sub-title {
      font-size: 0.78rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .version-badge {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .modal-close-icon {
      background: #f1f5f9;
      border: none;
      font-size: 1.4rem;
      line-height: 1;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close-icon:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Policy Tabs */
    .policy-tabs {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 20px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 14px 18px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #2563eb;
    }
    .tab-btn.active {
      color: #2563eb;
      font-weight: 700;
    }
    .tab-indicator {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      border-radius: 3px 3px 0 0;
      transition: all 0.2s;
    }
    .tab-btn.active .tab-indicator {
      background: #2563eb;
    }
    .tab-icon {
      font-size: 1rem;
    }

    /* Policy Scrollable Body */
    .policy-content-scroll {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(90vh - 200px);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .role-intro-box {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: 12px;
      border: 1px solid transparent;
      margin-bottom: 8px;
    }
    .bg-blue-subtle {
      background: #eff6ff;
      border-color: #dbeafe;
      color: #1e40af;
    }
    .bg-emerald-subtle {
      background: #ecfdf5;
      border-color: #d1fae5;
      color: #065f46;
    }
    .bg-purple-subtle {
      background: #f5f3ff;
      border-color: #ede9fe;
      color: #5b21b6;
    }
    .intro-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
    }
    .role-intro-box p {
      font-size: 0.82rem;
      margin: 2px 0 0 0;
      opacity: 0.9;
    }

    .clause-section {
      margin-bottom: 16px;
    }
    .clause-heading {
      font-size: 0.92rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .card-title-row strong {
      font-size: 0.85rem;
      color: #1e293b;
    }
    .bullet-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #2563eb;
      flex-shrink: 0;
    }
    .green-dot {
      background: #059669;
    }
    .info-card p {
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
      margin: 0;
    }

    .policy-checklist {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .policy-checklist li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.83rem;
      color: #334155;
      line-height: 1.45;
    }
    .check-icon {
      background: #ecfdf5;
      color: #059669;
      font-weight: 800;
      font-size: 0.75rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .pledge-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 12px;
      padding: 14px 18px;
    }
    .pledge-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
    }
    .pledge-banner strong {
      color: #b45309;
      font-size: 0.88rem;
      display: block;
      margin-bottom: 2px;
    }
    .pledge-banner p {
      font-size: 0.8rem;
      color: #78350f;
      margin: 0;
    }

    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 12px;
      padding: 14px 18px;
    }
    .warning-icon {
      font-size: 1.6rem;
      flex-shrink: 0;
    }
    .warning-box strong {
      color: #991b1b;
      font-size: 0.88rem;
    }
    .warning-list {
      padding-left: 18px;
      margin: 6px 0 0 0;
      font-size: 0.8rem;
      color: #7f1d1d;
      line-height: 1.45;
    }

    /* Rights Grid */
    .rights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .right-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .right-number {
      font-size: 1.1rem;
      font-weight: 800;
      color: #2563eb;
      line-height: 1;
      background: #eff6ff;
      padding: 6px 8px;
      border-radius: 6px;
    }
    .right-item strong {
      font-size: 0.84rem;
      color: #0f172a;
      display: block;
      margin-bottom: 2px;
    }
    .right-item p {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
    }

    /* Security Badges Row */
    .security-badges-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .sec-badge {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .sec-icon {
      font-size: 1.5rem;
    }
    .sec-badge strong {
      font-size: 0.82rem;
      color: #0f172a;
      display: block;
      margin-bottom: 4px;
    }
    .sec-badge span {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.35;
    }

    .contact-box-inner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
    }
    .contact-box-inner p {
      font-size: 0.82rem;
      color: #475569;
      margin-bottom: 8px;
    }
    .contact-methods {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.8rem;
      color: #1e293b;
    }

    /* Modal Footer */
    .modal-footer-custom {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      gap: 16px;
      flex-wrap: wrap;
    }
    .footer-left-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: #64748b;
    }
    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 0 2px #d1fae5;
    }
    .footer-action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Buttons & Utilities */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    .btn-sm {
      padding: 8px 14px;
      font-size: 0.82rem;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .btn-outline-primary {
      background: #ffffff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }
    .btn-outline-primary:hover {
      background: #eff6ff;
      border-color: #2563eb;
    }
    .btn-secondary {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-accept {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
    }

    .flex-align-center {
      display: flex;
      align-items: center;
    }
    .gap-2 { gap: 8px; }

    /* Animations */
    .animate-slide-up {
      animation: slideUpNotice 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideUpNotice {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeInPolicy 0.2s ease-out forwards;
    }
    @keyframes fadeInPolicy {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      .privacy-banner-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .banner-actions {
        width: 100%;
        justify-content: flex-end;
      }
      .grid-2-col, .rights-grid, .security-badges-row {
        grid-template-columns: 1fr;
      }
      .policy-tabs {
        overflow-x: auto;
      }
    }

    @media print {
      .privacy-banner-overlay, .modal-header-custom .modal-close-icon, .modal-footer-custom {
        display: none !important;
      }
      .privacy-modal-dialog {
        box-shadow: none !important;
        border: none !important;
        max-height: none !important;
      }
      .policy-content-scroll {
        max-height: none !important;
        overflow: visible !important;
      }
    }
  `]
})
export class PrivacyModalComponent {
  public readonly privacyService = inject(PrivacyService);
  private readonly toastService = inject(ToastService);

  acceptConsent(): void {
    this.privacyService.acceptConsent();
    this.toastService.show('Cảm ơn bạn! Đã ghi nhận đồng ý Điều khoản bảo mật ZHome.', 'success');
  }

  printPolicy(): void {
    window.print();
  }
}
