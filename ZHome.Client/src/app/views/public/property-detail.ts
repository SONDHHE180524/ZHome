import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="detail-page-container animate-fade-in" *ngIf="property() as prop">
      <!-- Breadcrumb Navigation -->
      <div class="breadcrumb-bar mb-4">
        <a routerLink="/" class="crumb-link"><i class="fas fa-home me-1"></i> Trang chủ</a>
        <span class="crumb-sep">&rsaquo;</span>
        <a routerLink="/" class="crumb-link">Tìm phòng trọ</a>
        <span class="crumb-sep">&rsaquo;</span>
        <span class="crumb-current">{{ prop.propertyTitle }}</span>
      </div>

      <!-- 1. Image Gallery Grid (1 Large Featured Left + Up to 4 Small Right with +N overlay) -->
      @if (getImageList(prop).length > 0) {
        <div class="gallery-grid-container mb-4" [class.single-image]="getImageList(prop).length === 1">
          <div class="gallery-main" (click)="openAllPhotosModal()">
            @if (getImageList(prop)[0]) {
              <img [src]="getImageUrl(getImageList(prop)[0])" alt="Ảnh đại diện khu trọ" class="gallery-img" (error)="onImageError($event)" />
            }
            <div class="gallery-badge-top">
              @if (prop.subscriptionId === 2 || prop.subscriptionId === 3 || prop.isHot) {
                <span class="hot-badge-prominent">
                  <svg class="hot-flame-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.8 2.38-7.05 5.74-8.35.43-.16.9.11.97.56.09.56.32 1.54.89 2.2 1.05 1.21 2.2 1.34 2.9 2.59.8 1.43.25 3.32-.5 4.5 1.5-.7 3.5-2.7 3.5-5.5 0-.4.3-.7.7-.7.3 0 .5.1.7.3C20.3 12.3 21 14.5 21 17c0 4.97-4.03 9-9 9z"/>
                  </svg>
                  HOT
                </span>
              }
              @if (prop.vacantRoomsCount > 0) {
                <span class="badge-status-prominent vacant">
                  <span class="pulse-indicator"></span>
                  CÒN TRỐNG ({{ prop.vacantRoomsCount }} phòng)
                </span>
              } @else {
                <span class="badge-status-prominent full">HẾT PHÒNG</span>
              }
            </div>
            <button class="btn-all-photos" (click)="$event.stopPropagation(); openAllPhotosModal()">
              <i class="fas fa-th-large me-1"></i> Xem tất cả ảnh ({{ getImageList(prop).length }})
            </button>
          </div>

          @if (getImageList(prop).length > 1) {
            <div class="gallery-side-grid">
              @for (imgUrl of getSideImages(prop); track $index) {
                <div class="gallery-sub-item" (click)="openAllPhotosModal()">
                  <img [src]="getImageUrl(imgUrl)" alt="Ảnh bổ sung" class="gallery-img" (error)="onImageError($event)" />
                  
                  <!-- +N overlay on the 4th thumbnail if total images > 5 -->
                  @if ($index === 3 && getRemainingCount(prop) > 0) {
                    <div class="gallery-overlay-more">
                      <span class="more-count">+{{ getRemainingCount(prop) }}</span>
                      <span class="more-text">Xem tất cả</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Fallback Banner -->
        <div class="no-images-banner glass-panel mb-4">
          <div class="no-img-icon"><i class="fas fa-camera-retro"></i></div>
          <h4 class="mt-2 mb-1">Chưa có hình ảnh minh họa từ chủ trọ</h4>
          <p class="text-muted text-sm mb-0">Chủ trọ chưa tải lên ảnh minh họa cho khu trọ này. Bạn có thể liên hệ trực tiếp để xem phòng.</p>
        </div>
      }

      <!-- 2. Property Header & Price Bar (With Verified Badge Inline) -->
      <div class="property-header-card glass-panel mb-4">
        <!-- Title & Inline Verified Badge -->
        <div class="mb-3 d-flex align-items-center flex-wrap gap-2">
          <h1 class="property-detail-title m-0 me-2">{{ prop.propertyTitle }}</h1>
          @if (prop.isVerifiedTick) {
            <span class="meta-pill text-verified">
              <i class="fas fa-shield-alt me-1"></i> CHÍNH CHỦ XÁC MINH
            </span>
          }
        </div>

        <!-- Top Price Bar & Action Buttons Row -->
        <div class="price-action-bar">
          <div class="price-start-group">
            <span class="price-label">Giá chỉ từ</span>
            <span class="price-value-highlight">{{ getMinPriceText(prop) }}</span>
          </div>

          <div class="contact-buttons-group">
            <!-- Green Chat button -->
            <a [href]="'https://zalo.me/' + prop.landlordPhone" target="_blank" class="btn-action-chat">
              <i class="fas fa-comment-dots me-1"></i> Chat ngay
            </a>

            <!-- Blue Zalo button -->
            <a [href]="'https://zalo.me/' + prop.landlordPhone" target="_blank" class="btn-action-zalo">
              <i class="fas fa-comment-dots me-1"></i> Chat Zalo
            </a>

            <!-- Orange Phone button with Eye toggle -->
            <div class="phone-reveal-wrapper">
              <a [href]="isPhoneRevealed() ? 'tel:' + prop.landlordPhone : 'javascript:void(0)'" 
                 (click)="togglePhoneReveal($event)" 
                 class="btn-action-phone">
                <i class="fas fa-phone-alt me-1"></i>
                <span>{{ getMaskedPhone(prop.landlordPhone) }}</span>
                
                @if (!isPhoneRevealed()) {
                  <span class="eye-badge">
                    <i class="fas fa-eye me-1"></i> Hiện số
                  </span>
                }
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Basic Information & Service Fees Box (Giá thuê trọ removed) -->
      <div class="glass-panel mb-4">
        <h3 class="section-title mb-3"><i class="fas fa-info-circle text-primary me-2"></i>Thông tin cơ bản & Giá dịch vụ</h3>
        
        <div class="basic-info-grid">
          <!-- Diện tích -->
          <div class="info-card-item simple-outline">
            <div class="simple-icon-wrap"><i class="fas fa-th-large"></i></div>
            <div class="info-details">
              <span class="info-label">Diện tích</span>
              <strong class="info-value">{{ getAreaText(prop) }}</strong>
            </div>
          </div>

          <!-- Số tiền cọc -->
          <div class="info-card-item simple-outline">
            <div class="simple-icon-wrap"><i class="fas fa-key"></i></div>
            <div class="info-details">
              <span class="info-label">Số tiền cọc</span>
              <strong class="info-value">1 tháng tiền phòng</strong>
            </div>
          </div>

          <!-- Tiền điện -->
          <div class="info-card-item simple-outline">
            <div class="simple-icon-wrap"><i class="fas fa-bolt"></i></div>
            <div class="info-details">
              <span class="info-label">Tiền điện</span>
              <strong class="info-value">3,500đ / kWh</strong>
            </div>
          </div>

          <!-- Tiền nước -->
          <div class="info-card-item simple-outline">
            <div class="simple-icon-wrap"><i class="fas fa-tint"></i></div>
            <div class="info-details">
              <span class="info-label">Tiền nước</span>
              <strong class="info-value">30,000đ / m³ (hoặc 100k/người)</strong>
            </div>
          </div>

          <!-- Vệ sinh & Dịch vụ khác -->
          <div class="info-card-item simple-outline">
            <div class="simple-icon-wrap"><i class="fas fa-broom"></i></div>
            <div class="info-details">
              <span class="info-label">Vệ sinh & Dịch vụ khác</span>
              <strong class="info-value">50,000đ / tháng</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Property Description -->
      @if (prop.description) {
        <div class="glass-panel mb-4">
          <h3 class="section-title mb-3"><i class="fas fa-align-left text-primary me-2"></i>Mô tả khu trọ</h3>
          <div class="property-desc-box">
            <p class="property-desc-text">{{ prop.description }}</p>
          </div>
        </div>
      }

      <!-- 5. Google Maps Embed -->
      <div class="glass-panel mb-4">
        <h3 class="section-title mb-3">
          <i class="fas fa-map-marked-alt text-danger me-2"></i>Vị trí & Bản đồ Google Maps
        </h3>
        <p class="text-muted text-sm mb-3"><i class="fas fa-map-pin text-danger me-1"></i> {{ prop.address }}</p>
        <div class="map-container">
          <iframe 
            [src]="getMapUrl(prop.address)" 
            width="100%" 
            height="380" 
            style="border:0; border-radius: 14px;" 
            allowfullscreen="" 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>

      <!-- 6. Feedback & Reviews Section -->
      <div class="glass-panel mb-4">
        <h3 class="section-title mb-3"><i class="fas fa-star text-warning me-2"></i>Feedback & Đánh giá từ khách thuê</h3>
        
        @if (isLoadingReports()) {
          <div class="text-muted p-3 text-center">Đang tải phản hồi...</div>
        } @else if (reports().length === 0) {
          <div class="text-muted p-3 text-center bg-light rounded-3">Chưa có đánh giá nào cho khu trọ này.</div>
        } @else {
          <div class="reports-list">
            @for (report of reports(); track report.id) {
              <div class="report-item-card mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{{ report.tenantName }}</strong> 
                    <span class="text-muted text-sm ms-2">(Phòng {{ report.roomNumber }})</span>
                  </div>
                  <div class="rating-stars">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <span class="star" [class.filled]="i <= (report.rating || 5)"> </span>
                    }
                  </div>
                </div>
                <h5 class="report-title m-0 mb-1">{{ report.title }}</h5>
                <p class="report-text mb-1">{{ report.content }}</p>
                <span class="report-time text-xs text-muted">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>

                @if (report.landlordReply) {
                  <div class="landlord-reply-box mt-2">
                    <strong class="text-primary"><i class="fas fa-reply me-1"></i>Phản hồi từ Chủ trọ:</strong>
                    <p class="reply-text mb-0 mt-1">{{ report.landlordReply }}</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- 7. Other Suggested Properties List (Only vacant properties) -->
      @if (otherProperties().length > 0) {
        <div class="glass-panel mb-4">
          <h3 class="section-title mb-3"><i class="fas fa-building text-sky me-2"></i>Danh sách khu trọ khác gợi ý</h3>
          <div class="other-props-grid">
            @for (other of otherProperties(); track other.id || other.propertyId) {
              <div class="other-prop-card" [routerLink]="['/phong-tro-detail', other.id || other.propertyId]">
                <div class="other-card-img-wrapper">
                  <img [src]="getImageUrl(other.imageUrl || other.propertyImageUrl)" alt="Ảnh trọ" class="other-card-img" (error)="onImageError($event)" />
                  <span class="other-vacant-badge vacant">
                    Còn {{ other.vacantRoomsCount }} phòng
                  </span>
                </div>
                <div class="other-card-content">
                  <h4 class="other-card-title text-truncate">{{ other.title || other.propertyTitle }}</h4>
                  <p class="other-card-address text-truncate mb-2"><i class="fas fa-map-marker-alt text-danger me-1"></i> {{ other.address }}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="other-card-price">{{ (other.minPrice || other.price || 1500000) | number:'1.0-0' }}đ/tháng</span>
                    <span class="btn-detail-sm">Xem chi tiết &rsaquo;</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Lightbox Modal for All Photos -->
      @if (showPhotosModal()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeAllPhotosModal()">
          <div class="glass-panel modal-card max-w-800" (click)="$event.stopPropagation()">
            <button class="modal-close-btn" (click)="closeAllPhotosModal()">&times;</button>
            <h3 class="text-center mb-3">Tất cả ảnh khu trọ ({{ getImageList(prop).length }})</h3>
            <div class="photos-lightbox-grid">
              @for (img of getImageList(prop); track $index) {
                <div class="lightbox-img-wrapper">
                  <img [src]="getImageUrl(img)" alt="Photo" class="lightbox-img" (error)="onImageError($event)" />
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 20px 24px 60px;
    }
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.92rem;
      color: #64748b;
    }
    .crumb-link {
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .crumb-link:hover {
      color: #2563eb;
    }
    .crumb-sep {
      color: #cbd5e1;
    }
    .crumb-current {
      color: #0f172a;
      font-weight: 700;
    }

    /* 1. Gallery Grid (1 Large Left + Up to 4 Small Right) */
    .gallery-grid-container {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 12px;
      height: 440px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }
    .gallery-grid-container.single-image {
      grid-template-columns: 1fr;
    }
    @media (max-width: 900px) {
      .gallery-grid-container {
        grid-template-columns: 1fr;
        height: auto;
      }
    }
    .gallery-main {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: pointer;
    }
    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .gallery-main:hover .gallery-img, .gallery-sub-item:hover .gallery-img {
      transform: scale(1.03);
    }
    .gallery-badge-top {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 2;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .hot-badge-prominent {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%);
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      padding: 6px 14px;
      border-radius: 99px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      animation: pulseHot 2s infinite ease-in-out;
    }
    .hot-flame-icon {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }
    .badge-status-prominent {
      padding: 6px 16px;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }
    .badge-status-prominent.vacant {
      background: #059669;
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);
    }
    .badge-status-prominent.full {
      background: #dc2626;
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.4);
    }
    .pulse-indicator {
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      display: inline-block;
      animation: pulseIndicator 1.5s infinite ease-in-out;
    }
    @keyframes pulseHot {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45); }
      50% { transform: scale(1.06); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.65); }
    }
    @keyframes pulseIndicator {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    .btn-all-photos {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      color: #0f172a;
      padding: 8px 18px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    .btn-all-photos:hover {
      background: #ffffff;
      transform: scale(1.03);
    }

    .gallery-side-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 12px;
      height: 100%;
    }
    .gallery-sub-item {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: pointer;
    }
    .gallery-overlay-more {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
    }
    .gallery-overlay-more:hover {
      background: rgba(15, 23, 42, 0.78);
    }
    .more-count {
      font-size: 1.8rem;
      font-weight: 800;
    }
    .more-text {
      font-size: 0.85rem;
      font-weight: 600;
      opacity: 0.9;
    }

    /* 2. Header Block */
    .property-header-card {
      padding: 24px 28px;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }
    .property-detail-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
    }
    .meta-pill {
      font-size: 0.78rem;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 8px;
      letter-spacing: 0.03em;
    }
    .meta-pill.text-verified {
      background: #ecfdf5;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    /* Price Bar & Action Buttons */
    .price-action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding-top: 4px;
    }
    .price-start-group {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .price-label {
      font-size: 0.95rem;
      color: #64748b;
    }
    .price-value-highlight {
      font-size: 1.75rem;
      font-weight: 900;
      color: #ff5500;
    }

    .contact-buttons-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Green Chat Button */
    .btn-action-chat {
      background: #00c853;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 99px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 200, 83, 0.25);
    }
    .btn-action-chat:hover {
      background: #00a843;
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Blue Zalo Button */
    .btn-action-zalo {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 99px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }
    .btn-action-zalo:hover {
      background: #1d4ed8;
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Orange Phone Button with Eye Masking badge */
    .btn-action-phone {
      background: #ff5500;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 6px 8px 6px 16px;
      border-radius: 99px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(255, 85, 0, 0.25);
    }
    .btn-action-phone:hover {
      background: #e64a00;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .eye-badge {
      background: rgba(255, 255, 255, 0.28);
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 0.78rem;
      font-weight: 700;
    }

    /* 3. Basic Info Grid */
    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .basic-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .info-card-item.simple-outline {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all 0.2s ease;
    }
    .info-card-item.simple-outline:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .simple-icon-wrap {
      font-size: 1.3rem;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 28px;
    }
    .info-details {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
    }
    .info-value {
      font-size: 0.98rem;
      color: #0f172a;
      font-weight: 700;
    }

    /* 4. Description */
    .property-desc-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px 24px;
    }
    .property-desc-text {
      color: #334155;
      line-height: 1.7;
      margin: 0;
      font-size: 0.98rem;
      white-space: pre-line;
    }

    /* 5. Google Maps Embed */
    .map-container {
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
    }

    /* 6. Feedback & Reviews */
    .report-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .rating-stars .star {
      color: #cbd5e1;
    }
    .rating-stars .star.filled {
      color: #f59e0b;
    }
    .landlord-reply-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 12px 16px;
      border-radius: 10px;
    }

    /* 7. Other Suggested Properties List */
    .other-props-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
    .other-prop-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
    }
    .other-prop-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.1);
      border-color: #93c5fd;
    }
    .other-card-img-wrapper {
      position: relative;
      height: 160px;
      overflow: hidden;
    }
    .other-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .other-prop-card:hover .other-card-img {
      transform: scale(1.05);
    }
    .other-vacant-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
    }
    .other-vacant-badge.vacant {
      background: #d1fae5;
      color: #047857;
    }
    .other-card-content {
      padding: 14px 16px;
    }
    .other-card-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .other-card-address {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }
    .other-card-price {
      font-size: 1rem;
      font-weight: 800;
      color: #2563eb;
    }
    .btn-detail-sm {
      font-size: 0.82rem;
      font-weight: 700;
      color: #2563eb;
    }

    /* Lightbox Modal */
    .photos-lightbox-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }
    .lightbox-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      border-radius: 12px;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 800px;
      position: relative;
    }
    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      border: none;
      background: #f1f5f9;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 1.4rem;
      cursor: pointer;
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  property = signal<any | null>(null);
  reports = signal<any[]>([]);
  otherProperties = signal<any[]>([]);
  isLoadingReports = signal(false);
  showPhotosModal = signal(false);
  isPhoneRevealed = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = Number(idStr);
        this.fetchPropertyDetail(id);
        this.fetchReports(id);
        this.fetchOtherProperties(id);
        this.propertyService.incrementViewCount(id).subscribe();
      }
    });
  }

  fetchPropertyDetail(id: number) {
    this.propertyService.getProperty(id).subscribe({
      next: (data) => {
        this.property.set(data);
      },
      error: () => {
        this.toastService.show('Không tìm thấy thông tin khu trọ', 'error');
        this.router.navigate(['/']);
      }
    });
  }

  fetchReports(id: number) {
    this.isLoadingReports.set(true);
    this.propertyService.getPropertyReports(id).subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoadingReports.set(false);
      },
      error: () => {
        this.isLoadingReports.set(false);
      }
    });
  }

  fetchOtherProperties(currentId: number) {
    this.propertyService.getListings({}).subscribe({
      next: (list) => {
        if (Array.isArray(list)) {
          const uniquePropsMap = new Map<number, any>();
          for (const item of list) {
            const pId = item.propertyId || item.PropertyId || item.id || item.Id;
            const vacantCount = item.vacantRoomsCount ?? item.VacantRoomsCount ?? ((item.status === 'Available' || item.Status === 'Available') ? 1 : 0);
            
            if (pId && Number(pId) !== Number(currentId) && vacantCount > 0 && !uniquePropsMap.has(Number(pId))) {
              uniquePropsMap.set(Number(pId), {
                id: pId,
                propertyId: pId,
                title: item.propertyTitle || item.PropertyTitle || item.title || item.Title,
                address: item.address || item.Address,
                price: item.price || item.Price,
                imageUrl: item.propertyImageUrl || item.PropertyImageUrl || item.imageUrl || (item.imageUrls && item.imageUrls[0]),
                vacantRoomsCount: vacantCount
              });
            }
          }
          const filtered = Array.from(uniquePropsMap.values()).slice(0, 4);
          this.otherProperties.set(filtered);
        }
      },
      error: () => {}
    });
  }

  getImageList(prop: any): string[] {
    if (prop?.imageUrls && prop.imageUrls.length > 0) {
      return prop.imageUrls;
    }
    if (prop?.propertyImageUrl) {
      return [prop.propertyImageUrl];
    }
    return [];
  }

  getSideImages(prop: any): string[] {
    const list = this.getImageList(prop);
    if (!list || list.length <= 1) return [];
    return list.slice(1, 5); // Up to 4 side images
  }

  getRemainingCount(prop: any): number {
    const list = this.getImageList(prop);
    if (!list || list.length <= 5) return 0;
    return list.length - 5;
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop';
  }

  getMinPrice(prop: any): number {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return 0;
    const prices = prop.rooms.map((r: any) => r.price);
    return Math.min(...prices);
  }

  getMaxPrice(prop: any): number {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return 0;
    const prices = prop.rooms.map((r: any) => r.price);
    return Math.max(...prices);
  }

  getMinPriceText(prop: any): string {
    const minPrice = this.getMinPrice(prop);
    if (minPrice <= 0) return '1,5 triệu/tháng';
    if (minPrice >= 1000000) {
      const millions = minPrice / 1000000;
      const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1).replace('.', ',');
      return `${formatted} triệu/tháng`;
    }
    return `${minPrice.toLocaleString('vi-VN')}đ/tháng`;
  }

  getAreaText(prop: any): string {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return '20 - 30 m²';
    const areas = prop.rooms.map((r: any) => r.area).filter((a: number) => a > 0);
    if (areas.length === 0) return '20 - 30 m²';
    const minArea = Math.min(...areas);
    const maxArea = Math.max(...areas);
    if (minArea === maxArea) return `${minArea} m²`;
    return `${minArea} - ${maxArea} m²`;
  }

  getMaskedPhone(phone: string): string {
    if (!phone) return '0981 1** ***';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 6) return clean;
    if (this.isPhoneRevealed()) {
      return clean.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    const prefix = clean.substring(0, 5);
    return `${prefix}** ***`;
  }

  togglePhoneReveal(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isPhoneRevealed.set(!this.isPhoneRevealed());
  }

  getCreatedDate(prop: any): string {
    if (prop?.createdAt) {
      const d = new Date(prop.createdAt);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    return '09-10-2025';
  }

  getProvinceText(address: string): string {
    if (!address) return 'Hà Nội';
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
  }

  getMapUrl(address: string): SafeResourceUrl {
    const query = encodeURIComponent(address || 'Hà Nội');
    const url = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openAllPhotosModal() {
    this.showPhotosModal.set(true);
  }

  closeAllPhotosModal() {
    this.showPhotosModal.set(false);
  }
}
