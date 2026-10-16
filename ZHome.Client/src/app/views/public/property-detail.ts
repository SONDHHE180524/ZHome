import { Component, inject, OnInit, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
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
        <a routerLink="/" class="crumb-link">
          <svg class="crumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Trang chủ
        </a>
        <span class="crumb-sep">›</span>
        <a routerLink="/phong-tro" class="crumb-link">Tìm phòng trọ</a>
        <span class="crumb-sep">›</span>
        <span class="crumb-current">{{ prop.propertyTitle }}</span>
      </div>

      <!-- 1. Image Gallery Grid (Click each photo to view details) -->
      @if (getImageList(prop).length > 0) {
        <div class="gallery-grid-container mb-4" [class.single-image]="getImageList(prop).length === 1">
          <div class="gallery-main" (click)="openPhotoAtIndex(0)">
            @if (getImageList(prop)[0]) {
              <img [src]="getImageUrl(getImageList(prop)[0])" alt="Ảnh phòng trọ" class="gallery-img" decoding="async" (load)="$event.target.classList.add('loaded')" (error)="onImageError($event)" />
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
            <button class="btn-all-photos" (click)="$event.stopPropagation(); openPhotoAtIndex(0)">
              <svg class="photo-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Xem tất cả ảnh ({{ getImageList(prop).length }})
            </button>
          </div>

          @if (getImageList(prop).length > 1) {
            <div class="gallery-side-grid">
              @for (imgUrl of getSideImages(prop); track $index) {
                <div class="gallery-sub-item" (click)="openPhotoAtIndex($index + 1)">
                  <img [src]="getImageUrl(imgUrl)" alt="Ảnh chi tiết" class="gallery-img" loading="lazy" decoding="async" (load)="$event.target.classList.add('loaded')" (error)="onImageError($event)" />
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
      }

      <!-- 2. Two-Column Main Content Layout (Left: Info & Description & Amenities, Right: Sticky Booking) -->
      <div class="detail-two-col-layout">
        
        <!-- LEFT COLUMN -->
        <div class="detail-main-col">
          
          <!-- Top Title & Quick Specs Card (Matching Screenshot 2) -->
          <div class="property-header-card glass-panel mb-4">
            <h1 class="property-title-main">{{ prop.propertyTitle }}</h1>
            
            <div class="price-range-line">
              <span class="price-range-text">{{ getPriceRangeText(prop).toLowerCase().startsWith('từ') ? getPriceRangeText(prop) : ('Từ ' + getPriceRangeText(prop)) }} <span class="unit">/tháng</span></span>
            </div>

            <div class="rating-address-line">
              <div class="star-rating-pill">
                <svg class="star-svg" viewBox="0 0 24 24" fill="#f59e0b">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span class="rating-bold">{{ reviewSummary().averageRating || 5.0 }}</span>
                <span class="rating-count">({{ reviewSummary().totalReviews || 0 }})</span>
              </div>
              <span class="meta-dot">·</span>
              <div class="address-meta">
                <svg class="pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{{ prop.address }}</span>
              </div>
            </div>

            <div class="posted-by-line">
              <div class="landlord-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span>Đăng bởi <strong>{{ prop.landlordName || 'Chủ trọ ZHome' }}</strong></span>
            </div>

            <!-- 4 Quick Spec Badges Row (Screenshot 2) -->
            <div class="quick-spec-grid">
              <!-- 1. Loại phòng -->
              <div class="spec-card">
                <div class="spec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/>
                    <line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/>
                    <line x1="8" y1="10" x2="8.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/>
                    <line x1="8" y1="14" x2="8.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>
                  </svg>
                </div>
                <div class="spec-text">
                  <span class="spec-label">Loại phòng</span>
                  <strong class="spec-val">Phòng trọ</strong>
                </div>
              </div>

              <!-- 2. Diện tích -->
              <div class="spec-card">
                <div class="spec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 3L3 21"/><path d="M3 3h18v18H3z"/>
                    <line x1="9" y1="3" x2="9" y2="7"/><line x1="15" y1="3" x2="15" y2="7"/>
                    <line x1="3" y1="9" x2="7" y2="9"/><line x1="3" y1="15" x2="7" y2="15"/>
                  </svg>
                </div>
                <div class="spec-text">
                  <span class="spec-label">Diện tích</span>
                  <strong class="spec-val">{{ getAreaText(prop) }}</strong>
                </div>
              </div>

              <!-- 3. Liên hệ -->
              <div class="spec-card">
                <div class="spec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div class="spec-text">
                  <span class="spec-label">Liên hệ</span>
                  <strong class="spec-val">{{ prop.landlordPhone || '0888 196 666' }}</strong>
                </div>
              </div>

              <!-- 4. Ngày đăng -->
              <div class="spec-card">
                <div class="spec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div class="spec-text">
                  <span class="spec-label">Ngày đăng</span>
                  <strong class="spec-val">{{ getCreatedDate(prop) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Box: Thông tin phòng (Chủ trọ viết - exact match Screenshot 2) -->
          <div class="glass-panel mb-4">
            <h2 class="detail-section-title">Thông tin phòng</h2>
            <div class="landlord-desc-content">
              {{ prop.description || 'Chưa có thông tin mô tả chi tiết từ chủ trọ.' }}
            </div>
          </div>

          <!-- Box: Tiện ích & Dịch vụ (Matching Screenshot 3) -->
          <div class="glass-panel mb-4">
            <div class="amenities-header">
              <div class="title-with-count">
                <h2 class="detail-section-title m-0">Tiện ích & Dịch vụ</h2>
                <span class="amenity-count-badge">{{ allAmenities().length }}</span>
              </div>
              <p class="amenity-subtitle">Các tiện ích và dịch vụ có sẵn tại phòng trọ này</p>
            </div>
            
            <div class="amenity-divider"></div>

            <div class="amenities-cards-grid">
              @for (amenity of displayedAmenities(); track amenity) {
                <div class="amenity-card-item">
                  <div class="amenity-icon-wrapper" [innerHTML]="getAmenityIcon(amenity)"></div>
                  <span class="amenity-name-text">{{ amenity }}</span>
                </div>
              }
            </div>

            @if (allAmenities().length > 9) {
              <div class="amenities-bottom-action">
                <button class="btn-toggle-amenities" (click)="toggleShowAllAmenities()">
                  {{ showAllAmenities() ? 'Thu gọn tiện ích ↑' : 'Xem tất cả ' + allAmenities().length + ' tiện ích →' }}
                </button>
              </div>
            }
          </div>

          <!-- Box: Thông tin cơ bản & Giá dịch vụ -->
          <div class="glass-panel mb-4">
            <h2 class="detail-section-title">Thông tin cơ bản & Giá dịch vụ</h2>
            <div class="basic-info-grid">
              <div class="info-card-item simple-outline">
                <div class="simple-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L10 10l1.5 1.5L9 14l-1.5-1.5L5 15l1.5 1.5L4 19l2 2 3-3-1.5-1.5L10 14l1.5 1.5L14 13l-1.5-1.5L15 9l1.5 1.5L19 8l-1.5-1.5L20 4z"/>
                  </svg>
                </div>
                <div class="info-details">
                  <span class="info-label">Số tiền cọc</span>
                  <strong class="info-value">1 tháng tiền phòng</strong>
                </div>
              </div>

              <div class="info-card-item simple-outline">
                <div class="simple-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div class="info-details">
                  <span class="info-label">Tiền điện</span>
                  <strong class="info-value">3,500đ / kWh</strong>
                </div>
              </div>

              <div class="info-card-item simple-outline">
                <div class="simple-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                  </svg>
                </div>
                <div class="info-details">
                  <span class="info-label">Tiền nước</span>
                  <strong class="info-value">30,000đ / m³ (hoặc 100k/người)</strong>
                </div>
              </div>

              <div class="info-card-item simple-outline">
                <div class="simple-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div class="info-details">
                  <span class="info-label">Vệ sinh & Dịch vụ</span>
                  <strong class="info-value">50,000đ / tháng</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Google Maps Embed -->
          <div class="glass-panel mb-4">
            <h2 class="detail-section-title">Vị trí & Bản đồ Google Maps</h2>
            <p class="text-muted text-sm mb-3">📍 {{ prop.address }}</p>
            <div class="map-container">
              <iframe 
                [src]="getMapUrl(prop.address)" 
                width="100%" 
                height="360" 
                style="border:0; border-radius: 14px;" 
                allowfullscreen="" 
                loading="lazy">
              </iframe>
            </div>
          </div>

          <!-- Reviews Section -->
          <div class="glass-panel review-section-container mb-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h2 class="detail-section-title m-0">Đánh giá & Phản hồi từ khách thuê</h2>
                <p class="text-muted text-sm m-0 mt-1">Đánh giá khách quan từ các cư dân đã và đang sinh sống tại khu trọ này.</p>
              </div>
              <button class="btn-write-review" (click)="openReviewModal()">
                Viết đánh giá
              </button>
            </div>

            <!-- Rating Summary Dashboard Card -->
            <div class="rating-overview-card mb-4">
              <div class="rating-score-block">
                <div class="score-number">{{ reviewSummary().averageRating }}</div>
                <div class="score-stars">
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <span class="star-icon" [class.active-star]="i <= Math.round(reviewSummary().averageRating)">★</span>
                  }
                </div>
                <div class="score-total-count">{{ reviewSummary().totalReviews }} lượt đánh giá</div>
              </div>

              <div class="rating-bars-block">
                @for (star of [5, 4, 3, 2, 1]; track star) {
                  <div class="rating-bar-row">
                    <span class="bar-label">{{ star }} <span class="text-warning">★</span></span>
                    <div class="progress-track">
                      <div class="progress-fill" [style.width.%]="getRatingPercent(getStarBreakdown(star))"></div>
                    </div>
                    <span class="bar-count">{{ getStarBreakdown(star) }}</span>
                  </div>
                }
              </div>

              <div class="rating-trust-badge">
                <div class="trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
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
                <div class="empty-review-icon mb-3">💬</div>
                <h4 class="mb-2">Chưa có đánh giá nào cho khu trọ này</h4>
                <p class="text-muted text-sm mb-3">Bạn đã từng hoặc đang thuê trọ tại đây? Hãy chia sẻ cảm nhận giúp những bạn sinh viên khác nhé!</p>
                <button class="btn-write-review-hero" (click)="openReviewModal()">
                  Hãy là người đầu tiên đánh giá
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
                            <span class="verified-tenant-badge">✓ Đã thuê trọ</span>
                          </div>
                          <span class="reviewer-room text-muted text-xs">Phòng {{ report.roomNumber || 'N/A' }}</span>
                        </div>
                      </div>
                      <div class="review-meta text-end">
                        <div class="star-rating-display">
                          @for (s of [1, 2, 3, 4, 5]; track s) {
                            <span class="star-mini" [class.star-filled]="s <= (report.rating || 5)">★</span>
                          }
                        </div>
                        <span class="review-date text-muted text-xs">{{ report.createdAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                    </div>
                    <div class="review-body">
                      <h4 class="review-item-title">{{ report.title }}</h4>
                      <p class="review-item-content">{{ report.content }}</p>
                    </div>
                    @if (report.landlordReply) {
                      <div class="landlord-reply-card">
                        <div class="reply-header">
                          <span class="reply-badge">Phản hồi từ Chủ trọ</span>
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

          <!-- Other Suggested Properties -->
          @if (otherProperties().length > 0) {
            <div class="glass-panel mb-4">
              <h2 class="detail-section-title">Danh sách khu trọ khác gợi ý</h2>
              <div class="other-props-grid">
                @for (other of otherProperties(); track other.id || other.propertyId) {
                  <div class="other-prop-card" [routerLink]="['/phong-tro-detail', other.id || other.propertyId]">
                    <div class="other-card-img-wrapper">
                      <img [src]="getImageUrl(other.imageUrl || other.propertyImageUrl)" alt="Ảnh trọ" class="other-card-img" (error)="onImageError($event)" />
                      <span class="other-vacant-badge vacant">Còn {{ other.vacantRoomsCount }} phòng</span>
                    </div>
                    <div class="other-card-content">
                      <h4 class="other-card-title text-truncate">{{ other.title || other.propertyTitle }}</h4>
                      <p class="other-card-address text-truncate mb-2">📍 {{ other.address }}</p>
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="other-card-price">{{ other.priceDisplay ? (other.priceDisplay + ' /tháng') : (((other.minPrice || other.price || 1500000) | number:'1.0-0') + ' đ/tháng') }}</span>
                        <span class="btn-detail-sm">Xem chi tiết ›</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- RIGHT COLUMN: Sticky Booking & Contact Card (Matching Screenshot 2) -->
        <div class="detail-sidebar-col">
          <div class="sticky-booking-card">
            
            <!-- Top Contact Buttons Row (Zalo + Phone, Screenshot 2) -->
            <div class="sidebar-contact-row">
              <a [href]="'https://zalo.me/' + prop.landlordPhone" target="_blank" class="btn-sidebar-zalo">
                <svg class="btn-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.25-1.31c1.41.76 3.02 1.19 4.75 1.19 5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                </svg>
                <span>Zalo</span>
              </a>

              <a [href]="'tel:' + prop.landlordPhone" class="btn-sidebar-phone">
                <svg class="btn-svg-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>{{ prop.landlordPhone || '0888 196 666' }}</span>
              </a>
            </div>

            <!-- Price display -->
            <div class="sidebar-price-header">
              <span class="price-val">{{ getPriceRangeText(prop) }}</span>
              <span class="price-unit">/tháng</span>
            </div>

            <!-- Green Trust Banner (Screenshot 2) -->
            <div class="free-tour-banner">
              <svg class="tour-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Xem phòng hoàn toàn miễn phí – không cần thanh toán</span>
            </div>

            <!-- Booking Form -->
            <div class="booking-form-wrap">
              <!-- Ngày xem phòng -->
              <div class="booking-field-group">
                <label class="booking-field-label">
                  <svg class="field-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Chọn ngày</span>
                </label>
                <input type="date" class="booking-input" [min]="todayDateString" [ngModel]="bookingDate()" (ngModelChange)="bookingDate.set($event)" />
                <span class="booking-field-sub">Ngày xem phòng</span>
              </div>

              <!-- Số người đi xem -->
              <div class="booking-field-group">
                <label class="booking-field-label">
                  <svg class="field-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>Số người đi xem</span>
                </label>
                <select class="booking-select" [ngModel]="bookingPeople()" (ngModelChange)="bookingPeople.set($event)">
                  <option [value]="1">1 người đi xem</option>
                  <option [value]="2">2 người đi xem</option>
                  <option [value]="3">3 người đi xem</option>
                  <option [value]="4">4+ người đi xem</option>
                </select>
                <span class="booking-field-sub">Số lượng khách đến xem trọ</span>
              </div>

              <!-- Họ tên & SĐT liên hệ -->
              <div class="booking-field-group">
                <label class="booking-field-label">
                  <svg class="field-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Thông tin liên hệ của bạn</span>
                </label>
                <input type="text" class="booking-input mb-2" placeholder="Họ và tên của bạn" [ngModel]="tenantName()" (ngModelChange)="tenantName.set($event)" />
                <input type="tel" class="booking-input" placeholder="Số điện thoại đón xem phòng *" [ngModel]="tenantPhone()" (ngModelChange)="tenantPhone.set($event)" />
                <span class="booking-field-sub">Chủ trọ sẽ liên hệ qua SĐT này trước giờ hẹn</span>
              </div>

              <!-- Ghi chú thêm -->
              <div class="booking-field-group">
                <input type="text" class="booking-input" placeholder="Ghi chú thêm (vd: đến sau 17h, đi cùng bạn...)" [ngModel]="bookingNote()" (ngModelChange)="bookingNote.set($event)" />
              </div>

              <!-- Phí xem phòng: Miễn phí -->
              <div class="booking-fee-row">
                <span class="fee-label">Phí xem phòng</span>
                <span class="fee-free">Miễn phí</span>
              </div>

              <!-- Primary CTA or Login Prompt -->
              @if (!authService.isLoggedIn()) {
                <div class="booking-auth-required-box">
                  <div class="auth-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div class="auth-text-wrap">
                    <div class="auth-box-title">Cần đăng nhập để đặt lịch</div>
                    <div class="auth-box-desc">Đăng nhập tài khoản ZHome để gửi yêu cầu xem phòng và nhận liên hệ từ chủ trọ.</div>
                  </div>
                </div>

                <button type="button" class="btn-book-tour btn-login-required" (click)="redirectToLogin()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-lock">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  <span>Đăng nhập để đặt lịch xem phòng</span>
                </button>
              } @else if (isPropertyOwner()) {
                <button type="button" class="btn-book-tour btn-disabled-owner" disabled>
                  <span>Bạn là chủ khu trọ này</span>
                </button>
              } @else {
                <button type="button" class="btn-book-tour" (click)="submitBooking()" [disabled]="isSubmittingBooking()">
                  @if (isSubmittingBooking()) {
                    <span>Đang gửi thông báo cho chủ trọ...</span>
                  } @else {
                    <span>Đặt lịch xem phòng</span>
                  }
                </button>
              }
            </div>

          </div>
        </div>

      </div>

      <!-- Lightbox Modal for Photo Details (Click each photo to view details) -->
      @if (showPhotosModal()) {
        <div class="lightbox-backdrop animate-fade-in" (click)="closeAllPhotosModal()">
          <div class="lightbox-container" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="lightbox-header">
              <div class="lightbox-title-wrap">
                <h3 class="lightbox-property-title">{{ prop.propertyTitle }}</h3>
                <span class="lightbox-counter">Ảnh {{ activePhotoIndex() + 1 }} / {{ getImageList(prop).length }}</span>
              </div>
              <button class="lightbox-close-btn" (click)="closeAllPhotosModal()" title="Đóng (Esc)">✕</button>
            </div>

            <!-- Main Display with Prev & Next -->
            <div class="lightbox-display-area">
              <button class="lightbox-nav-btn prev" (click)="prevPhoto()" title="Ảnh trước (Mũi tên trái)">
                ‹
              </button>
              
              <div class="lightbox-image-wrap">
                <img [src]="getImageUrl(getImageList(prop)[activePhotoIndex()])" alt="Ảnh chi tiết phòng trọ" class="lightbox-active-img" (error)="onImageError($event)" />
              </div>

              <button class="lightbox-nav-btn next" (click)="nextPhoto()" title="Ảnh sau (Mũi tên phải)">
                ›
              </button>
            </div>

            <!-- Bottom Thumbnails Strip -->
            <div class="lightbox-thumbs-strip">
              @for (photo of getImageList(prop); track $index) {
                <div class="thumb-cell" [class.active]="$index === activePhotoIndex()" (click)="openPhotoAtIndex($index)">
                  <img [src]="getImageUrl(photo)" alt="Thumb" class="thumb-cell-img" />
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
              <h3 class="m-0">Đánh giá khu trọ</h3>
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
                    <span>Đang gửi...</span>
                  } @else {
                    <span>Gửi đánh giá</span>
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
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .crumb-icon {
      width: 15px;
      height: 15px;
    }
    .crumb-link:hover {
      color: #2563eb;
    }
    .crumb-sep {
      color: #cbd5e1;
      font-size: 1.1rem;
    }
    .crumb-current {
      color: #1e293b;
      font-weight: 600;
      max-width: 450px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 1. Gallery Section */
    .gallery-grid-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 14px;
      height: 440px;
      border-radius: 20px;
      overflow: hidden;
    }
    .gallery-grid-container.single-image {
      grid-template-columns: 1fr;
    }
    .gallery-main {
      position: relative;
      height: 100%;
      cursor: pointer;
      overflow: hidden;
      background: #e2e8f0;
    }
    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }
    .gallery-main:hover .gallery-img,
    .gallery-sub-item:hover .gallery-img {
      transform: scale(1.03);
    }
    .gallery-badge-top {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      gap: 8px;
      z-index: 2;
    }
    .hot-badge-prominent {
      background: linear-gradient(135deg, #ef4444, #f97316);
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
    }
    .hot-flame-icon {
      width: 14px;
      height: 14px;
    }
    .badge-status-prominent {
      padding: 5px 12px;
      border-radius: 30px;
      font-size: 0.8rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(8px);
    }
    .badge-status-prominent.vacant {
      background: rgba(16, 185, 129, 0.9);
      color: white;
    }
    .pulse-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: white;
      animation: pulseAnim 1.5s infinite;
    }
    @keyframes pulseAnim {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.4); }
      100% { opacity: 1; transform: scale(1); }
    }
    .btn-all-photos {
      position: absolute;
      bottom: 14px;
      left: 14px;
      background: rgba(15, 23, 42, 0.78);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 30px;
      padding: 8px 16px;
      font-size: 0.82rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.2s, transform 0.2s;
    }
    .btn-all-photos:hover {
      background: rgba(15, 23, 42, 0.95);
      transform: translateY(-2px);
    }
    .photo-btn-icon {
      width: 14px;
      height: 14px;
    }
    .gallery-side-grid {
      display: grid;
      grid-template-rows: repeat(2, 1fr);
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      height: 100%;
    }
    .gallery-sub-item {
      position: relative;
      cursor: pointer;
      overflow: hidden;
      background: #e2e8f0;
      border-radius: 12px;
    }
    .gallery-overlay-more {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
    }
    .more-count {
      font-size: 1.5rem;
    }
    .more-text {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* 2. Main Two-Column Layout */
    .detail-two-col-layout {
      display: grid;
      grid-template-columns: 1fr 390px;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .detail-two-col-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Glass Panels */
    .glass-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
    }
    .detail-section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
    }

    /* Left Header Card (Screenshot 2) */
    .property-title-main {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin: 0 0 10px 0;
    }
    .price-range-line {
      margin-bottom: 12px;
    }
    .price-range-text {
      color: #2563eb;
      font-size: 1.45rem;
      font-weight: 800;
    }
    .price-range-text .unit {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .rating-address-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.92rem;
      color: #64748b;
      margin-bottom: 12px;
    }
    .star-rating-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .star-svg {
      width: 16px;
      height: 16px;
    }
    .rating-bold {
      font-weight: 700;
      color: #0f172a;
    }
    .rating-count {
      color: #64748b;
    }
    .meta-dot {
      color: #cbd5e1;
      font-weight: 800;
    }
    .address-meta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .pin-svg {
      width: 15px;
      height: 15px;
      color: #ef4444;
      flex-shrink: 0;
    }
    .posted-by-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.92rem;
      color: #475569;
      margin-bottom: 22px;
      padding-top: 10px;
      border-top: 1px dashed #e2e8f0;
    }
    .landlord-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .landlord-icon-box svg {
      width: 16px;
      height: 16px;
    }

    /* 4 Quick Spec Badges Grid (Screenshot 2) */
    .quick-spec-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 768px) {
      .quick-spec-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .spec-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      background: #f8fafc;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .spec-card:hover {
      border-color: #cbd5e1;
    }
    .spec-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .spec-icon svg {
      width: 18px;
      height: 18px;
    }
    .spec-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .spec-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 2px;
    }
    .spec-val {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Landlord Description Box */
    .landlord-desc-content {
      white-space: pre-line;
      font-size: 0.95rem;
      line-height: 1.8;
      color: #334155;
    }

    /* Amenities Box (Screenshot 3) */
    .amenities-header {
      margin-bottom: 12px;
    }
    .title-with-count {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .amenity-count-badge {
      background: #bd6e38;
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 20px;
    }
    .amenity-subtitle {
      font-size: 0.88rem;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .amenity-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 14px 0 20px 0;
    }
    .amenities-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 640px) {
      .amenities-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .amenity-card-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 14px 16px;
      transition: background 0.2s, transform 0.15s;
    }
    .amenity-card-item:hover {
      background: #f1f5f9;
      transform: translateY(-1px);
    }
    .amenity-icon-wrapper {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      flex-shrink: 0;
    }
    .amenity-name-text {
      font-size: 0.92rem;
      font-weight: 600;
      color: #1e293b;
    }
    .amenities-bottom-action {
      margin-top: 18px;
    }
    .btn-toggle-amenities {
      background: white;
      border: 1px solid #e2e8f0;
      color: #2563eb;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-toggle-amenities:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    /* Basic Info Grid */
    .basic-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (max-width: 640px) {
      .basic-info-grid {
        grid-template-columns: 1fr;
      }
    }
    .info-card-item.simple-outline {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .simple-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .simple-icon-wrap svg {
      width: 18px;
      height: 18px;
    }
    .info-details {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    /* RIGHT SIDEBAR: Sticky Booking Card (Matching Screenshot 2) */
    .sticky-booking-card {
      position: sticky;
      top: 86px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.06);
    }
    .sidebar-contact-row {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-sidebar-zalo {
      flex: 1;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 30px;
      padding: 10px 14px;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: background 0.2s, transform 0.15s;
    }
    .btn-sidebar-zalo:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-sidebar-phone {
      flex: 1.5;
      background: white;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      text-decoration: none;
      border-radius: 30px;
      padding: 10px 14px;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: border-color 0.2s, background 0.2s;
    }
    .btn-sidebar-phone:hover {
      border-color: #2563eb;
      color: #2563eb;
      background: #f8fafc;
    }
    .btn-svg-mini {
      width: 16px;
      height: 16px;
    }
    .sidebar-price-header {
      margin-bottom: 12px;
    }
    .sidebar-price-header .price-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
    }
    .sidebar-price-header .price-unit {
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .free-tour-banner {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.82rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
    }
    .tour-check-svg {
      width: 16px;
      height: 16px;
      color: #059669;
      flex-shrink: 0;
    }
    .booking-field-group {
      margin-bottom: 14px;
    }
    .booking-field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .field-icon-svg {
      width: 14px;
      height: 14px;
    }
    .booking-input, .booking-select {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 0.92rem;
      background: #f8fafc;
      outline: none;
      transition: border-color 0.2s;
    }
    .booking-input:focus, .booking-select:focus {
      border-color: #bd6e38;
      background: #ffffff;
    }
    .booking-field-sub {
      font-size: 0.74rem;
      color: #94a3b8;
      margin-top: 3px;
      display: block;
    }
    .booking-fee-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-top: 1px dashed #e2e8f0;
      border-bottom: 1px dashed #e2e8f0;
      margin: 14px 0 18px;
    }
    .fee-label {
      font-size: 0.88rem;
      color: #64748b;
    }
    .fee-free {
      font-weight: 700;
      color: #10b981;
      font-size: 0.95rem;
    }
    .btn-book-tour {
      width: 100%;
      background: #bd6e38;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(189, 110, 56, 0.3);
      transition: background 0.2s, transform 0.1s;
    }
    .btn-book-tour:hover:not(:disabled) {
      background: #a85f2e;
      transform: translateY(-1px);
    }
    .btn-book-tour:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .booking-auth-required-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff8f1;
      border: 1px dashed #f97316;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 14px;
    }
    .auth-icon-wrap {
      color: #ea580c;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .auth-box-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #9a3412;
      margin-bottom: 2px;
    }
    .auth-box-desc {
      font-size: 0.8rem;
      color: #7c2d12;
      line-height: 1.35;
      margin: 0;
    }
    .btn-login-required {
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-login-required:hover {
      background: linear-gradient(135deg, #c2410c 0%, #9a3412 100%);
    }
    .btn-icon-lock {
      width: 18px;
      height: 18px;
      display: inline-block;
      vertical-align: -2px;
    }
    .btn-disabled-owner {
      background: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }

    /* Lightbox Modal (Click each photo to view details) */
    .lightbox-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 29, 0.95);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .lightbox-container {
      width: 100%;
      max-width: 1100px;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
    }
    .lightbox-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      padding-bottom: 14px;
    }
    .lightbox-property-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      color: white;
    }
    .lightbox-counter {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-left: 12px;
    }
    .lightbox-close-btn {
      background: rgba(255, 255, 255, 0.12);
      border: none;
      color: white;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .lightbox-close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    .lightbox-display-area {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 480px;
      max-height: 64vh;
      gap: 16px;
    }
    .lightbox-image-wrap {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .lightbox-active-img {
      max-width: 100%;
      max-height: 62vh;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
      transition: opacity 0.2s ease;
    }
    .lightbox-nav-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: none;
      font-size: 30px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .lightbox-nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    .lightbox-thumbs-strip {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 16px 0 4px;
      justify-content: center;
    }
    .thumb-cell {
      width: 72px;
      height: 52px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      opacity: 0.55;
      border: 2px solid transparent;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .thumb-cell.active {
      opacity: 1;
      border-color: #38bdf8;
      transform: scale(1.08);
    }
    .thumb-cell-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Review Dashboard */
    .rating-overview-card {
      display: grid;
      grid-template-columns: 180px 1fr 220px;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      align-items: center;
    }
    @media (max-width: 768px) {
      .rating-overview-card {
        grid-template-columns: 1fr;
      }
    }
    .rating-score-block {
      text-align: center;
    }
    .score-number {
      font-size: 2.8rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }
    .score-stars {
      color: #f59e0b;
      font-size: 1.2rem;
      margin: 6px 0 4px;
    }
    .score-total-count {
      font-size: 0.8rem;
      color: #64748b;
    }
    .rating-bars-block {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .rating-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }
    .progress-track {
      flex: 1;
      height: 7px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #f59e0b;
      border-radius: 10px;
    }
    .rating-trust-badge {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .trust-icon {
      width: 28px;
      height: 28px;
      color: #2563eb;
      margin: 0 auto 6px;
    }
    .trust-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e40af;
    }
    .trust-desc {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .btn-write-review, .btn-write-review-hero {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 8px 16px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }
    .reviews-list-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .review-card-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .reviewer-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .reviewer-name {
      font-size: 0.92rem;
      color: #0f172a;
    }
    .verified-tenant-badge {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }
    .star-mini.star-filled {
      color: #f59e0b;
    }
    .review-item-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0 0 4px;
      color: #0f172a;
    }
    .review-item-content {
      font-size: 0.9rem;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }

    /* Suggested properties */
    .other-props-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 768px) {
      .other-props-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .other-prop-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .other-prop-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    }
    .other-card-img-wrapper {
      position: relative;
      height: 140px;
    }
    .other-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .other-vacant-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
    }
    .other-card-content {
      padding: 12px;
    }
    .other-card-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .other-card-address {
      font-size: 0.78rem;
      color: #64748b;
    }
    .other-card-price {
      font-size: 0.9rem;
      font-weight: 700;
      color: #2563eb;
    }
    .btn-detail-sm {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      position: relative;
      max-width: 540px;
      width: 100%;
    }
    .modal-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
    }
    .stars-interactive-picker {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    .btn-star-pick {
      background: none;
      border: none;
      font-size: 2rem;
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.2s;
    }
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
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly propertyService = inject(PropertyService);
  public readonly toastService = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  public readonly authService = inject(AuthService);
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

  // Photo Lightbox signals
  showPhotosModal = signal(false);
  activePhotoIndex = signal(0);

  // Amenities signals
  showAllAmenities = signal(false);

  // Booking signals
  todayDateString: string = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  bookingDate = signal<string>(this.todayDateString);
  bookingPeople = signal<number>(1);
  bookingTime = signal<string>('09:00');
  tenantName = signal<string>('');
  tenantPhone = signal<string>('');
  bookingNote = signal<string>('');
  isSubmittingBooking = signal<boolean>(false);

  constructor() {
    effect(() => {
      const session = this.authService.session();
      if (session) {
        if (session.fullName && !this.tenantName()) this.tenantName.set(session.fullName);
        if (session.phone && !this.tenantPhone()) this.tenantPhone.set(session.phone);
      }
    });
  }

  isPropertyOwner = computed(() => {
    const prop = this.property();
    const session = this.authService.session();
    if (!prop || !session) return false;
    const landlordId = prop.landlordId ?? prop.LandlordId;
    return landlordId && Number(session.userId) === Number(landlordId);
  });

  redirectToLogin(): void {
    const prop = this.property();
    const propId = prop?.id || prop?.propertyId || prop?.PropertyId;
    this.toastService.show('Vui lòng đăng nhập để đặt lịch xem phòng', 'info');
    this.router.navigate(['/login'], {
      queryParams: propId ? { returnUrl: `/phong-tro-detail/${propId}` } : {}
    });
  }

  // Amenities computed
  allAmenities = computed<string[]>(() => {
    const prop = this.property();
    if (!prop) return [];
    const set = new Set<string>();
    if (prop.amenities && Array.isArray(prop.amenities)) {
      prop.amenities.forEach((a: string) => { if (a && a.trim()) set.add(a.trim()); });
    }
    if (prop.rooms && Array.isArray(prop.rooms)) {
      prop.rooms.forEach((r: any) => {
        if (r.amenities && Array.isArray(r.amenities)) {
          r.amenities.forEach((a: string) => { if (a && a.trim()) set.add(a.trim()); });
        }
      });
    }
    if (set.size === 0) {
      return [
        'Phòng tắm', 'Máy giặt', 'Tủ lạnh', 'Wifi',
        'Bãi để xe riêng', 'Vệ sinh trong', 'Bình nóng lạnh',
        'Tủ áo quần', 'Thang máy', 'Camera an ninh', 'Điều hòa'
      ];
    }
    return Array.from(set);
  });

  displayedAmenities = computed<string[]>(() => {
    const list = this.allAmenities();
    if (this.showAllAmenities() || list.length <= 9) {
      return list;
    }
    return list.slice(0, 9);
  });

  toggleShowAllAmenities(): void {
    this.showAllAmenities.set(!this.showAllAmenities());
  }

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

    // Pre-fill user information if logged in
    if (this.authService.isLoggedIn()) {
      const session = this.authService.session();
      if (session) {
        if (session.fullName) this.tenantName.set(session.fullName);
        if (session.phone) this.tenantPhone.set(session.phone);
      }
    }
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

  getStarBreakdown(star: number): number {
    const b = this.reviewSummary()?.ratingBreakdown;
    if (!b) return 0;
    if (star === 5) return b.five || 0;
    if (star === 4) return b.four || 0;
    if (star === 3) return b.three || 0;
    if (star === 2) return b.two || 0;
    if (star === 1) return b.one || 0;
    return 0;
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

  // Gallery and Photos List
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
    return list.slice(1, 5);
  }

  getRemainingCount(prop: any): number {
    const list = this.getImageList(prop);
    if (!list || list.length <= 5) return 0;
    return list.length - 5;
  }

  // Photo Lightbox Viewer
  openPhotoAtIndex(index: number): void {
    const list = this.getImageList(this.property());
    if (index >= 0 && index < list.length) {
      this.activePhotoIndex.set(index);
    } else {
      this.activePhotoIndex.set(0);
    }
    this.showPhotosModal.set(true);
  }

  nextPhoto(): void {
    const list = this.getImageList(this.property());
    if (list.length <= 1) return;
    this.activePhotoIndex.update(i => (i + 1) % list.length);
  }

  prevPhoto(): void {
    const list = this.getImageList(this.property());
    if (list.length <= 1) return;
    this.activePhotoIndex.update(i => (i - 1 + list.length) % list.length);
  }

  closeAllPhotosModal(): void {
    this.showPhotosModal.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.showPhotosModal()) return;
    if (event.key === 'ArrowRight') {
      this.nextPhoto();
    } else if (event.key === 'ArrowLeft') {
      this.prevPhoto();
    } else if (event.key === 'Escape') {
      this.closeAllPhotosModal();
    }
  }

  // Booking action
  submitBooking(): void {
    const prop = this.property();
    if (!prop) return;

    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để đặt lịch xem phòng', 'info');
      this.redirectToLogin();
      return;
    }

    if (this.isPropertyOwner()) {
      this.toastService.show('Bạn là chủ khu trọ này, không thể tự đặt lịch xem phòng.', 'error');
      return;
    }

    if (!this.bookingDate()) {
      this.toastService.show('Vui lòng chọn ngày bạn muốn đi xem phòng', 'error');
      return;
    }

    const phone = this.tenantPhone().trim() || this.authService.session()?.phone;
    if (!phone) {
      this.toastService.show('Vui lòng nhập số điện thoại để chủ trọ liên hệ đón bạn', 'error');
      return;
    }

    this.isSubmittingBooking.set(true);
    const payload = {
      viewingDate: this.bookingDate(),
      viewingTime: this.bookingTime(),
      numberOfPeople: Number(this.bookingPeople()) || 1,
      tenantName: this.tenantName().trim() || this.authService.session()?.fullName || 'Khách thuê',
      tenantPhone: phone,
      note: this.bookingNote().trim()
    };

    this.propertyService.bookViewing(prop.id || prop.propertyId, payload).subscribe({
      next: (res: any) => {
        this.isSubmittingBooking.set(false);
        this.toastService.show(res?.message || 'Đặt lịch xem phòng thành công! Đã gửi thông báo cho chủ trọ.', 'success');
        this.bookingNote.set('');
      },
      error: (err: any) => {
        this.isSubmittingBooking.set(false);
        if (err.status === 401) {
          this.toastService.show('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          this.redirectToLogin();
          return;
        }
        const msg = err.error?.message || err.error || 'Có lỗi khi đặt lịch xem phòng. Vui lòng thử lại sau.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  // SVG Amenity Icons Mapper (Screenshot 3)
  getAmenityIcon(name: string): SafeHtml {
    const lower = (name || '').toLowerCase();
    let svg = '';

    if (lower.includes('phòng tắm') || lower.includes('tắm')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4z"/><path d="M12 4v6"/><circle cx="12" cy="13" r="1"/></svg>`;
    } else if (lower.includes('máy giặt') || lower.includes('giặt')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><circle cx="12" cy="13" r="5"/><circle cx="12" cy="13" r="2"/><circle cx="8" cy="5" r="1"/></svg>`;
    } else if (lower.includes('tủ lạnh')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="8" y1="6" x2="8" y2="8"/><line x1="8" y1="14" x2="8" y2="17"/></svg>`;
    } else if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('internet')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
    } else if (lower.includes('xe') || lower.includes('đỗ') || lower.includes('bãi')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 16V8h4a2 2 0 1 1 0 4H9"/></svg>`;
    } else if (lower.includes('vệ sinh') || lower.includes('wc') || lower.includes('khép kín')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M6 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
    } else if (lower.includes('nóng lạnh') || lower.includes('bình')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M7 6h10a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a4 4 0 0 1 4-4z"/><circle cx="12" cy="14" r="2"/></svg>`;
    } else if (lower.includes('tủ') || lower.includes('quần áo')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="9" y1="12" x2="9" y2="14"/><line x1="15" y1="12" x2="15" y2="14"/></svg>`;
    } else if (lower.includes('thang máy')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><polyline points="9 10 12 7 15 10"/><polyline points="9 14 12 17 15 14"/></svg>`;
    } else if (lower.includes('camera')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
    } else if (lower.includes('điều hòa')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"/><line x1="6" y1="19" x2="8" y2="16"/><line x1="12" y1="19" x2="12" y2="16"/><line x1="18" y1="19" x2="16" y2="16"/></svg>`;
    } else if (lower.includes('ban công') || lower.includes('sân phơi')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v10H4z"/><line x1="8" y1="10" x2="8" y2="20"/><line x1="12" y1="10" x2="12" y2="20"/><line x1="16" y1="10" x2="16" y2="20"/></svg>`;
    } else if (lower.includes('bếp') || lower.includes('nấu')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="2" ry="2"/><circle cx="8" cy="11" r="2"/><circle cx="16" cy="11" r="2"/><line x1="3" y1="17" x2="21" y2="17"/></svg>`;
    } else if (lower.includes('giường') || lower.includes('nệm')) {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><circle cx="6" cy="8" r="2"/></svg>`;
    } else {
      svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  // Price formatting
  getMinPrice(prop: any): number {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return 0;
    const prices = prop.rooms.map((r: any) => r.price).filter((p: number) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  getMaxPrice(prop: any): number {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return 0;
    const prices = prop.rooms.map((r: any) => r.price).filter((p: number) => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 0;
  }

  getPriceRangeText(prop: any): string {
    if (!prop) return '2 triệu';
    const min = this.getMinPrice(prop);
    const max = this.getMaxPrice(prop);
    if (min <= 0 && max <= 0) return '2 triệu';

    const formatPart = (val: number): string => {
      if (val <= 0) return '0 đ';
      if (val >= 1000000) {
        const millions = val / 1000000;
        const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1).replace('.', ',');
        return `${formatted} triệu`;
      }
      return `${val.toLocaleString('vi-VN')} đ`;
    };

    if (min > 0 && max > 0 && min < max) {
      return `từ ${formatPart(min)} đến ${formatPart(max)}`;
    }
    return formatPart(min > 0 ? min : max);
  }

  getMinPriceText(prop: any): string {
    return this.getPriceRangeText(prop);
  }

  getAreaText(prop: any): string {
    if (!prop || !prop.rooms || prop.rooms.length === 0) return '25 m²';
    const areas = prop.rooms.map((r: any) => r.area).filter((a: number) => a > 0);
    if (areas.length === 0) return '25 m²';
    const minArea = Math.min(...areas);
    const maxArea = Math.max(...areas);
    if (minArea === maxArea) return `${minArea} m²`;
    return `${minArea} - ${maxArea} m²`;
  }

  getCreatedDate(prop: any): string {
    if (prop?.createdAt) {
      const d = new Date(prop.createdAt);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    return '11/9/2026';
  }

  getMapUrl(address: string): SafeResourceUrl {
    const query = encodeURIComponent(address || 'Hà Nội');
    const url = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Image handling
  defaultPropertyImage = '/media/properties/0919919919_639275077481748600.jpg';

  getImageUrl(url?: string): string {
    if (!url) return this.getImageUrl(this.defaultPropertyImage);
    if (url.includes(',')) {
      url = url.split(',')[0].trim();
    }
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/assets/') || url.startsWith('assets/')) {
      return url.startsWith('/') ? url : `/${url}`;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseUrl}${cleanUrl}`;
  }

  onImageError(event: any) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.classList.add('loaded');
      const fallback = this.getImageUrl(this.defaultPropertyImage);
      if (target.src !== fallback) {
        target.src = fallback;
      } else {
        target.src = '/assets/default-room.jpg';
      }
    }
  }

  // Reviews modal
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
}
