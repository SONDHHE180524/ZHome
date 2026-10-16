import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
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
              <img [src]="getImageUrl(getImageList(prop)[0])" alt="Ảnh đại diện khu trọ" class="gallery-img" decoding="async" (load)="$event.target.classList.add('loaded')" (error)="onImageError($event)" />
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
                  <img [src]="getImageUrl(imgUrl)" alt="Ảnh bổ sung" class="gallery-img" loading="lazy" decoding="async" (load)="$event.target.classList.add('loaded')" (error)="onImageError($event)" />
                  
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
            <span class="price-label">Giá thuê</span>
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

      <!-- 6. Feedback & Reviews Section (Review System) -->
      <div class="glass-panel review-section-container mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h3 class="section-title m-0"><i class="fas fa-star text-warning me-2"></i>Đánh giá & Phản hồi từ khách thuê</h3>
            <p class="text-muted text-sm m-0 mt-1">Đánh giá khách quan từ các cư dân đã và đang sinh sống tại khu trọ này.</p>
          </div>
          <button class="btn-write-review" (click)="openReviewModal()">
            <i class="fas fa-pen-nib me-2"></i>Viết đánh giá
          </button>
        </div>

        <!-- Rating Summary Dashboard Card -->
        <div class="rating-overview-card mb-4">
          <!-- Left: Big Score & Stars -->
          <div class="rating-score-block">
            <div class="score-number">{{ reviewSummary().averageRating }}</div>
            <div class="score-stars">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <span class="star-icon" [class.active-star]="i <= Math.round(reviewSummary().averageRating)">★</span>
              }
            </div>
            <div class="score-total-count">{{ reviewSummary().totalReviews }} lượt đánh giá</div>
          </div>

          <!-- Middle: Progress Bars Distribution -->
          <div class="rating-bars-block">
            <div class="rating-bar-row">
              <span class="bar-label">5 <span class="text-warning">★</span></span>
              <div class="progress-track">
                <div class="progress-fill fill-5" [style.width.%]="getRatingPercent(reviewSummary()?.ratingBreakdown?.five || 0)"></div>
              </div>
              <span class="bar-count">{{ reviewSummary()?.ratingBreakdown?.five || 0 }}</span>
            </div>
            <div class="rating-bar-row">
              <span class="bar-label">4 <span class="text-warning">★</span></span>
              <div class="progress-track">
                <div class="progress-fill fill-4" [style.width.%]="getRatingPercent(reviewSummary()?.ratingBreakdown?.four || 0)"></div>
              </div>
              <span class="bar-count">{{ reviewSummary()?.ratingBreakdown?.four || 0 }}</span>
            </div>
            <div class="rating-bar-row">
              <span class="bar-label">3 <span class="text-warning">★</span></span>
              <div class="progress-track">
                <div class="progress-fill fill-3" [style.width.%]="getRatingPercent(reviewSummary()?.ratingBreakdown?.three || 0)"></div>
              </div>
              <span class="bar-count">{{ reviewSummary()?.ratingBreakdown?.three || 0 }}</span>
            </div>
            <div class="rating-bar-row">
              <span class="bar-label">2 <span class="text-warning">★</span></span>
              <div class="progress-track">
                <div class="progress-fill fill-2" [style.width.%]="getRatingPercent(reviewSummary()?.ratingBreakdown?.two || 0)"></div>
              </div>
              <span class="bar-count">{{ reviewSummary()?.ratingBreakdown?.two || 0 }}</span>
            </div>
            <div class="rating-bar-row">
              <span class="bar-label">1 <span class="text-warning">★</span></span>
              <div class="progress-track">
                <div class="progress-fill fill-1" [style.width.%]="getRatingPercent(reviewSummary()?.ratingBreakdown?.one || 0)"></div>
              </div>
              <span class="bar-count">{{ reviewSummary()?.ratingBreakdown?.one || 0 }}</span>
            </div>
          </div>

          <!-- Right: Trust Badge -->
          <div class="rating-trust-badge">
            <div class="trust-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="trust-title">Xác thực 100%</div>
            <div class="trust-desc">Chỉ những khách thuê có hợp đồng tại khu trọ mới được phép gửi đánh giá.</div>
          </div>
        </div>

        @if (isLoadingReports()) {
          <div class="text-center py-5 text-muted">
            <div class="spinner mb-2"></div>
            <p>Đang tải danh sách đánh giá...</p>
          </div>
        } @else if (reports().length === 0) {
          <div class="empty-reviews-state text-center py-5">
            <div class="empty-review-icon mb-3"><i class="fas fa-comment-dots"></i></div>
            <h4 class="mb-2">Chưa có đánh giá nào cho khu trọ này</h4>
            <p class="text-muted text-sm mb-3">Bạn đã từng hoặc đang thuê trọ tại đây? Hãy chia sẻ cảm nhận và đánh giá giúp những bạn sinh viên khác nhé!</p>
            <button class="btn-write-review-hero" (click)="openReviewModal()">
              <i class="fas fa-pen-nib me-2"></i>Hãy là người đầu tiên đánh giá
            </button>
          </div>
        } @else {
          <div class="reviews-list-grid">
            @for (report of reports(); track report.id) {
              <div class="review-card-item">
                <div class="review-header">
                  <div class="reviewer-info">
                    <div class="reviewer-avatar">
                      {{ (report.tenantName || 'K').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="reviewer-name-line">
                        <strong class="reviewer-name">{{ report.tenantName }}</strong>
                        <span class="verified-tenant-badge">
                          <i class="fas fa-check-circle"></i> Đã thuê trọ
                        </span>
                      </div>
                      <span class="reviewer-room text-muted text-xs">
                        <i class="fas fa-door-open me-1"></i>Phòng {{ report.roomNumber || 'N/A' }}
                      </span>
                    </div>
                  </div>
                  <div class="review-meta text-end">
                    <div class="star-rating-display">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <span class="star-mini" [class.star-filled]="s <= (report.rating || 5)">★</span>
                      }
                    </div>
                    <span class="review-date text-muted text-xs">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>

                <div class="review-body">
                  <h4 class="review-item-title">{{ report.title }}</h4>
                  <p class="review-item-content">{{ report.content }}</p>
                </div>

                @if (report.landlordReply) {
                  <div class="landlord-reply-card">
                    <div class="reply-header">
                      <span class="reply-badge"><i class="fas fa-reply me-1"></i>Phản hồi từ Chủ trọ</span>
                      @if (report.repliedAt) {
                        <span class="reply-time text-muted text-xs">{{ report.repliedAt | date:'dd/MM/yyyy' }}</span>
                      }
                    </div>
                    <p class="reply-content mb-0">{{ report.landlordReply }}</p>
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
                    <span class="other-card-price">{{ other.priceDisplay ? (other.priceDisplay + ' /tháng') : (((other.minPrice || other.price || 1500000) | number:'1.0-0') + ' đ/tháng') }}</span>
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

      <!-- Review Submission Modal -->
      @if (showReviewModal()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeReviewModal()">
          <div class="glass-panel modal-card review-modal-card" (click)="$event.stopPropagation()">
            <button class="modal-close-btn" (click)="closeReviewModal()">&times;</button>
            <div class="modal-header-block mb-3">
              <h3 class="m-0"><i class="fas fa-star text-warning me-2"></i>Đánh giá khu trọ</h3>
              <p class="text-muted text-sm m-0 mt-1">{{ prop.propertyTitle }}</p>
            </div>

            <div class="modal-body-block">
              <!-- Star Selector -->
              <div class="star-input-group mb-4 text-center">
                <label class="form-label d-block mb-2 font-semibold">Bạn đánh giá khu trọ này mấy sao?</label>
                <div class="stars-interactive-picker">
                  @for (s of [1, 2, 3, 4, 5]; track s) {
                    <button type="button" class="btn-star-pick" [class.picked]="s <= newReviewRating()" (click)="setReviewRating(s)">
                      ★
                    </button>
                  }
                </div>
                <div class="star-rating-hint text-sm font-semibold mt-1">
                  @if (newReviewRating() === 5) { <span class="text-success">Rất tuyệt vời (5/5 sao)</span> }
                  @else if (newReviewRating() === 4) { <span class="text-primary">Tốt & hài lòng (4/5 sao)</span> }
                  @else if (newReviewRating() === 3) { <span class="text-warning">Bình thường (3/5 sao)</span> }
                  @else if (newReviewRating() === 2) { <span class="text-danger">Kém, cần cải thiện (2/5 sao)</span> }
                  @else { <span class="text-danger">Rất tệ (1/5 sao)</span> }
                </div>
              </div>

              <!-- Title -->
              <div class="form-group mb-3">
                <label class="form-label font-semibold">Tiêu đề đánh giá <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [ngModel]="newReviewTitle()" (ngModelChange)="newReviewTitle.set($event)" placeholder="Ví dụ: Phòng sạch sẽ, an ninh tốt, chủ trọ thân thiện..." />
              </div>

              <!-- Content -->
              <div class="form-group mb-4">
                <label class="form-label font-semibold">Chi tiết cảm nhận / góp ý <span class="text-danger">*</span></label>
                <textarea class="form-control" rows="4" [ngModel]="newReviewContent()" (ngModelChange)="newReviewContent.set($event)" placeholder="Chia sẻ chi tiết về tiện ích, an ninh, điện nước, thái độ quản lý... để cộng đồng sinh viên có góc nhìn thực tế nhất"></textarea>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary px-4" (click)="closeReviewModal()" [disabled]="isSubmittingReview()">
                  Hủy bỏ
                </button>
                <button type="button" class="btn btn-primary-submit px-4" (click)="submitReview()" [disabled]="isSubmittingReview()">
                  @if (isSubmittingReview()) {
                    <i class="fas fa-spinner fa-spin me-2"></i>Đang gửi...
                  } @else {
                    <i class="fas fa-paper-plane me-2"></i>Gửi đánh giá
                  }
                </button>
              </div>
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
      background: #f1f5f9;
    }
    .gallery-sub-item {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: pointer;
      background: #f1f5f9;
    }
    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s ease;
    }
    .gallery-img.loaded {
      opacity: 1;
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
    /* Review System Styles */
    .review-section-container {
      padding: 24px;
    }
    .btn-write-review {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }
    .btn-write-review:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
    }
    .btn-write-review-hero {
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: background 0.2s;
    }
    .btn-write-review-hero:hover {
      background: #1d4ed8;
    }
    .rating-overview-card {
      display: grid;
      grid-template-columns: 220px 1fr 240px;
      gap: 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      align-items: center;
    }
    @media (max-width: 860px) {
      .rating-overview-card {
        grid-template-columns: 1fr;
      }
    }
    .rating-score-block {
      text-align: center;
      border-right: 1px solid #e2e8f0;
      padding-right: 20px;
    }
    @media (max-width: 860px) {
      .rating-score-block {
        border-right: none;
        padding-right: 0;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
      }
    }
    .score-number {
      font-size: 3.4rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 8px;
    }
    .score-stars {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-bottom: 6px;
      font-size: 1.25rem;
    }
    .star-icon {
      color: #cbd5e1;
    }
    .star-icon.active-star {
      color: #f59e0b;
    }
    .score-total-count {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
    .rating-bars-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .rating-bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
    }
    .bar-label {
      width: 32px;
      color: #475569;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .progress-track {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.4s ease;
    }
    .fill-5 { background: #10b981; }
    .fill-4 { background: #3b82f6; }
    .fill-3 { background: #f59e0b; }
    .fill-2 { background: #f97316; }
    .fill-1 { background: #ef4444; }
    .bar-count {
      width: 24px;
      text-align: right;
      color: #64748b;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .rating-trust-badge {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .trust-icon {
      font-size: 1.6rem;
      color: #10b981;
      margin-bottom: 6px;
    }
    .trust-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .trust-desc {
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.4;
    }
    .reviews-list-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .review-card-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      transition: box-shadow 0.2s;
    }
    .review-card-item:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .reviewer-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .reviewer-name-line {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .reviewer-name {
      color: #0f172a;
      font-size: 0.98rem;
    }
    .verified-tenant-badge {
      font-size: 0.72rem;
      background: #ecfdf5;
      color: #059669;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .reviewer-room {
      margin-top: 2px;
    }
    .star-rating-display {
      font-size: 1rem;
      margin-bottom: 3px;
    }
    .star-mini {
      color: #e2e8f0;
      margin-left: 2px;
    }
    .star-mini.star-filled {
      color: #f59e0b;
    }
    .review-item-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px;
    }
    .review-item-content {
      color: #334155;
      font-size: 0.93rem;
      line-height: 1.6;
      margin: 0;
    }
    .landlord-reply-card {
      margin-top: 14px;
      background: #f1f5f9;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .reply-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .reply-badge {
      font-weight: 700;
      font-size: 0.85rem;
      color: #1e40af;
    }
    .reply-content {
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.5;
    }
    .empty-review-icon {
      font-size: 3rem;
      color: #cbd5e1;
    }
    .review-modal-card {
      max-width: 560px;
    }
    .stars-interactive-picker {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 10px 0;
    }
    .btn-star-pick {
      background: none;
      border: none;
      font-size: 2.2rem;
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0 4px;
      line-height: 1;
    }
    .btn-star-pick:hover,
    .btn-star-pick.picked {
      color: #f59e0b;
      transform: scale(1.15);
    }
    .btn-primary-submit {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary-submit:hover {
      background: #1d4ed8;
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);

  readonly Math = Math;

  property = signal<any | null>(null);
  reports = signal<any[]>([]);
  reviewSummary = signal<any>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 }
  });
  showReviewModal = signal(false);
  newReviewRating = signal(5);
  newReviewTitle = signal('Đánh giá trải nghiệm tại khu trọ');
  newReviewContent = signal('');
  isSubmittingReview = signal(false);
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
        if (Array.isArray(data)) {
          this.reports.set(data);
          const total = data.length;
          const avg = total > 0 ? data.reduce((acc, r) => acc + (r.rating || 5), 0) / total : 5.0;
          this.reviewSummary.set({
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: total,
            ratingBreakdown: {
              five: data.filter(r => r.rating === 5).length,
              four: data.filter(r => r.rating === 4).length,
              three: data.filter(r => r.rating === 3).length,
              two: data.filter(r => r.rating === 2).length,
              one: data.filter(r => r.rating === 1).length
            }
          });
        } else if (data && data.reviews) {
          this.reports.set(data.reviews);
          this.reviewSummary.set(data);
        }
        this.isLoadingReports.set(false);
      },
      error: () => {
        this.isLoadingReports.set(false);
      }
    });
  }

  openReviewModal() {
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để viết đánh giá khu trọ', 'info');
      this.router.navigate(['/login']);
      return;
    }
    this.newReviewRating.set(5);
    this.newReviewTitle.set('Đánh giá trải nghiệm tại khu trọ');
    this.newReviewContent.set('');
    this.showReviewModal.set(true);
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
  }

  setReviewRating(stars: number) {
    this.newReviewRating.set(stars);
  }

  submitReview() {
    const prop = this.property();
    if (!prop) return;

    if (!this.newReviewTitle().trim() || !this.newReviewContent().trim()) {
      this.toastService.show('Vui lòng nhập đầy đủ tiêu đề và nội dung đánh giá', 'info');
      return;
    }

    this.isSubmittingReview.set(true);
    const propId = prop.id || prop.propertyId;
    this.reportService.createReport({
      propertyId: propId,
      rating: this.newReviewRating(),
      title: this.newReviewTitle(),
      content: this.newReviewContent()
    }).subscribe({
      next: (res: any) => {
        this.isSubmittingReview.set(false);
        this.toastService.show(res?.message || 'Đánh giá đã được gửi thành công!', 'success');
        this.closeReviewModal();
        this.fetchReports(propId);
      },
      error: (err: any) => {
        this.isSubmittingReview.set(false);
        const msg = err.error?.message || err.error || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng kiểm tra lại.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  getRatingPercent(count: number): number {
    const total = this.reviewSummary()?.totalReviews || 0;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
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
                minPrice: item.minPrice ?? item.price,
                maxPrice: item.maxPrice ?? item.price,
                priceDisplay: item.priceDisplay || item.PriceDisplay,
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
    const rawList: string[] = [];
    if (prop?.imageUrls && prop.imageUrls.length > 0) {
      for (const u of prop.imageUrls) {
        if (typeof u === 'string' && u.includes(',')) {
          rawList.push(...u.split(',').map((s: string) => s.trim()).filter(Boolean));
        } else if (u) {
          rawList.push(u);
        }
      }
    }
    if (prop?.propertyImageUrl) {
      if (typeof prop.propertyImageUrl === 'string' && prop.propertyImageUrl.includes(',')) {
        rawList.push(...prop.propertyImageUrl.split(',').map((s: string) => s.trim()).filter(Boolean));
      } else {
        rawList.push(prop.propertyImageUrl);
      }
    }

    const unique = Array.from(new Set(rawList.filter(Boolean)));
    const hasCustomImages = unique.some(u => u.includes('/media/') || u.startsWith('data:'));
    if (hasCustomImages) {
      // If custom uploaded images exist, exclude stock Unsplash mock images
      const filtered = unique.filter(u => !u.includes('images.unsplash.com'));
      if (filtered.length > 0) return filtered;
    }
    if (unique.length === 0) {
      return [this.defaultPropertyImage];
    }
    return unique;
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

  defaultPropertyImage = '/media/properties/0919919919_639275077481748600.jpg';

  getImageUrl(url?: string): string {
    if (!url) return this.defaultPropertyImage;
    if (url.includes(',')) {
      url = url.split(',')[0].trim();
    }
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${environment.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onImageError(event: any) {
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.add('loaded');
      const subItem = target.closest('.gallery-sub-item');
      if (subItem) {
        (subItem as HTMLElement).style.display = 'none';
        return;
      }
      const lightboxWrapper = target.closest('.lightbox-img-wrapper');
      if (lightboxWrapper) {
        (lightboxWrapper as HTMLElement).style.display = 'none';
        return;
      }
      (target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="%23f1f5f9"><rect width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="20" font-family="sans-serif">Hình ảnh đang cập nhật</text></svg>';
    }
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
    const maxPrice = this.getMaxPrice(prop);
    
    const formatPart = (val: number): string => {
      if (val <= 0) return '0 đ';
      if (val >= 1000000) {
        const millions = val / 1000000;
        const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1).replace('.', ',');
        return `${formatted} triệu`;
      }
      return `${val.toLocaleString('vi-VN')}đ`;
    };

    if (minPrice > 0 && maxPrice > 0 && minPrice < maxPrice) {
      return `từ ${formatPart(minPrice)} đến ${formatPart(maxPrice)}/tháng`;
    }
    if (minPrice > 0) {
      return `${formatPart(minPrice)}/tháng`;
    }
    return '1,5 triệu/tháng';
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
