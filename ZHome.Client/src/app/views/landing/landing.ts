import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing-container animate-fade-in">
      
      <!-- Premium Hero Banner -->
      <section class="hero-section">
        <div class="hero-content">
          <h1>ZHome Lựa Chọn Chỗ Ở Tuyệt Vời 🌿</h1>
          <p>Khám phá ngay các tin trọ HOT nhất, chất lượng, giá tốt tại Hà Nội.</p>
        </div>
        
        <!-- Floating Search Pill -->
        <div class="search-pill-container glass-panel">
          <div class="search-pill">
            <div class="pill-group search-input-group">
              <input type="text" [(ngModel)]="searchQuery" (input)="onFilterChange()" placeholder="Tên nhà, đường..." />
            </div>
            <div class="pill-divider"></div>
            <div class="pill-group select-group">
              <select [(ngModel)]="selectedDistrict" (change)="onFilterChange()">
                <option value="">Tất cả khu vực</option>
                @for (d of districts(); track d.id) {
                  <option [value]="d.name">{{ d.name }}</option>
                }
              </select>
            </div>
            <div class="pill-divider"></div>
            <div class="pill-group select-group">
              <select>
                <option value="">Mức giá</option>
                <option value="1">Dưới 2 triệu</option>
                <option value="2">2 - 4 triệu</option>
                <option value="3">Trên 4 triệu</option>
              </select>
            </div>
            <button class="pill-search-btn" (click)="onFilterChange()">
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      <!-- Vacant Listings Grid -->
      <section class="listings-section">
        <div class="section-header">
          <h2>Lựa chọn chỗ ở HOT</h2>
          <p class="section-subtitle">Lựa chọn chỗ ở HOT mà chúng tôi đề xuất cho bạn</p>
        </div>

        <!-- Filter Pills (Visual UI) -->
        <div class="category-pills">
          <button class="cat-pill" [class.active]="selectedDistrict === ''" (click)="setDistrictFilter('')">Tất Cả</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Cầu Giấy'" (click)="setDistrictFilter('Cầu Giấy')">Cầu Giấy</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Đống Đa'" (click)="setDistrictFilter('Đống Đa')">Đống Đa</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Thanh Xuân'" (click)="setDistrictFilter('Thanh Xuân')">Thanh Xuân</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Nam Từ Liêm'" (click)="setDistrictFilter('Nam Từ Liêm')">Nam Từ Liêm</button>
          <div style="flex: 1;"></div>
          <button class="view-all-btn" (click)="setDistrictFilter('')">View all →</button>
        </div>

        @if (isLoading()) {
          <div class="loading-state">Đang tải danh sách nhà trọ...</div>
        } @else if (groupedProperties().length === 0) {
          <div class="empty-state">
            <p>Không tìm thấy nhà trọ nào có phòng trống phù hợp với bộ lọc của bạn.</p>
            <button (click)="resetFilters()" class="btn btn-secondary">Đặt lại bộ lọc</button>
          </div>
        } @else {
          <div class="listings-grid">
            @for (prop of hotProperties(); track prop.propertyId) {
              <ng-container *ngTemplateOutlet="propertyCard; context: {$implicit: prop}"></ng-container>
            }
          </div>

          @if (normalProperties().length > 0) {
            <div class="section-header" style="margin-top: 40px;">
              <h2>Nhà trọ được đề xuất</h2>
              <p class="section-subtitle">Các lựa chọn nhà trọ khác dành cho bạn</p>
            </div>
            <div class="listings-grid">
              @for (prop of normalProperties(); track prop.propertyId) {
                <ng-container *ngTemplateOutlet="propertyCard; context: {$implicit: prop}"></ng-container>
              }
            </div>
          }
        }

        <ng-template #propertyCard let-prop>
          <div class="interactive-card property-card" (click)="openPropertyDetail(prop)" style="position: relative;">
            @if (prop.subscriptionId === 2 || prop.subscriptionId === 3) {
              <div class="hot-badge">🔥 HOT</div>
            }

            <div class="property-thumbnail">

              @if (prop.imageUrls && prop.imageUrls.length > 0) {
                <img [src]="getImageUrl(prop.imageUrls[0])" alt="Property Image" class="thumbnail-img" (error)="onImageError($event)" />
              } @else {
                <div class="placeholder-img" [style.background]="getRandomGradient(prop.propertyId)"></div>
              }
              
              <div class="card-overlay-top" style="justify-content: flex-end; gap: 8px; align-items: center;">
                @if (prop.vacantRoomsCount > 0) {
                  <span class="badge-pill-mint">Còn phòng</span>
                } @else {
                  <span class="badge-pill-mint" style="background: rgba(225, 29, 72, 0.9);">Hết phòng</span>
                }
                <button class="icon-btn heart-btn" (click)="toggleFavorite(prop, $event)">
                  {{ prop.isFavorite ? '❤️' : '🤍' }}
                </button>
              </div>
              
              <div class="card-overlay-bottom">
                <div class="pagination-dots">
                  <span class="dot active"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <span class="view-count-badge">👁️ {{ prop.viewCount || 0 }}</span>
              </div>
            </div>

            <div class="property-info">
              <h3 class="property-title">{{ prop.propertyTitle }}</h3>
              <p class="property-address"><span class="pin-icon">📍</span> {{ prop.address }}</p>
              
              <div class="property-footer">
                <div class="price-block">
                  <span class="price-value">{{ prop.minRoomPrice | number:'1.0-0' }} đ</span>
                  <span class="price-unit">/tháng</span>
                </div>
                <div class="rating-block">
                  <span class="star-icon">⭐</span> {{ prop.averageRating | number:'1.1-1' }} ({{ prop.reviewCount }})
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>

      <!-- Property Detail Modal -->
      @if (selectedProperty(); as prop) {
        <div class="modal-backdrop animate-fade-in" (click)="closePropertyDetail()">
          <div class="glass-panel modal-card max-w-900" (click)="$event.stopPropagation()">
            <button (click)="closePropertyDetail()" class="modal-close-btn">&times;</button>
            
            <div class="modal-gallery" [style.background]="getRandomGradient(prop.propertyId)">
              @if (prop.imageUrls && prop.imageUrls.length > 0) {
                <img [src]="getImageUrl(prop.imageUrls[0])" alt="Property Gallery Image" class="modal-gallery-img" />
              }
            </div>

            <div class="modal-body">
              <div class="modal-header-row">
                <div class="header-text-block">
                  <h2>{{ prop.propertyTitle }}</h2>
                  <p class="modal-address">📍 {{ prop.address }}</p>
                  @if (prop.isVerifiedTick) {
                    <span class="badge badge-success" style="display: inline-block; margin-top: 8px;">🛡️ Khu trọ chính chủ (Đã xác minh)</span>
                  }
                </div>
                <div class="modal-stats-badges">
                  <span class="badge badge-primary font-bold">Tổng số phòng: {{ prop.totalRooms }}</span>
                  <span class="badge badge-success font-bold" style="margin-left: 8px;">Đang trống: {{ prop.vacantRoomsCount }} phòng</span>
                </div>
              </div>

              <div class="modal-divider"></div>

              <div class="modal-grid">
                <div class="modal-main-content">
                  @if (prop.description) {
                    <div class="mb-4">
                      <strong>Mô tả khu trọ:</strong>
                      <p class="modal-desc">{{ prop.description }}</p>
                    </div>
                  }

                  <h3 class="mb-3">Danh sách phòng</h3>
                  <div class="vacant-rooms-list">
                    @for (room of prop.rooms; track room.roomId) {
                      <div class="vacant-room-item-card">
                        <div class="room-item-header">
                          <span class="room-number-title">🚪 Phòng {{ room.roomNumber }}</span>
                          @if (room.status === 'Available') {
                            <span class="status-badge-vacant">🟢 ĐANG TRỐNG</span>
                          } @else {
                            <span class="status-badge-vacant" style="color: #e11d48;">🔴 ĐÃ ĐẦY</span>
                          }
                        </div>
                        <div class="room-item-specs">
                          <div class="spec-col">
                            <span class="spec-label">Giá thuê</span>
                            <span class="spec-value price-val">{{ room.price | number:'1.0-0' }}đ/tháng</span>
                          </div>
                          <div class="spec-col">
                            <span class="spec-label">Diện tích</span>
                            <span class="spec-value">{{ room.area }} m²</span>
                          </div>
                          <div class="spec-col">
                            <span class="spec-label">Tối đa</span>
                            <span class="spec-value">{{ room.maxOccupants }} người</span>
                          </div>
                        </div>

                        @if (room.amenities && room.amenities.length > 0) {
                          <div class="room-item-amenities">
                            <strong>Tiện ích: </strong>
                            @for (am of room.amenities; track am) {
                              <span class="amenity-badge-lite">{{ am }}</span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <div class="modal-sidebar-info">
                  <div class="landlord-card">
                    <h4>Thông tin liên hệ</h4>
                    <p class="landlord-name">
                      👤 {{ prop.landlordName }}
                      @if (prop.isVerifiedTick) {
                        <span class="verified-tick" title="Chủ nhà đã xác minh">✅</span>
                      }
                    </p>
                    <a href="tel:{{ prop.landlordPhone }}" class="btn btn-primary btn-block mt-3">Gọi điện liên hệ</a>
                    <button class="btn btn-secondary btn-block mt-2" (click)="loadReports(prop.propertyId)" *ngIf="!showReports()">Xem Đánh Giá</button>
                    <button class="btn btn-secondary btn-block mt-2" (click)="showReports.set(false)" *ngIf="showReports()">Đóng Đánh Giá</button>
                  </div>
                </div>
              </div>

              <!-- Reports Section -->
              @if (showReports()) {
                <div class="modal-divider"></div>
                <div class="reports-section mt-4 mb-4">
                  <h3 class="mb-3">Đánh giá từ khách thuê</h3>
                  
                  @if (isLoadingReports()) {
                    <p class="text-muted">Đang tải đánh giá...</p>
                  } @else if (reports().length === 0) {
                    <p class="text-muted">Chưa có đánh giá nào cho khu trọ này.</p>
                  } @else {
                    <div class="reports-list">
                      @for (report of reports(); track report.id) {
                        <div class="report-card mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                          <div class="report-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>{{ report.tenantName }} <span style="color: #64748b; font-size: 0.9em; font-weight: normal;">(Phòng {{ report.roomNumber }})</span></strong>
                            <div class="rating-stars" style="color: #fbbf24;">
                              @for (i of [1, 2, 3, 4, 5]; track i) {
                                <span>{{ i <= (report.rating || 5) ? '★' : '☆' }}</span>
                              }
                            </div>
                          </div>
                          <h5 style="margin: 0 0 5px 0;">{{ report.title }}</h5>
                          <p style="margin: 0; color: #334155; font-size: 0.95em;">{{ report.content }}</p>
                          <div style="font-size: 0.8em; color: #94a3b8; margin-top: 5px;">{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                          
                          @if (report.landlordReply) {
                            <div class="landlord-reply" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                              <strong style="color: #4f46e5;">Phản hồi từ Chủ trọ:</strong>
                              <p style="margin: 4px 0 0 0; font-size: 0.9em; color: #475569;">{{ report.landlordReply }}</p>
                              <div style="font-size: 0.75em; color: #94a3b8; margin-top: 4px;">Đã trả lời lúc: {{ report.repliedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .landing-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    
    /* Hero Section */
    .hero-section {
      text-align: center;
      padding: 60px 0 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }
    .hero-content h1 {
      font-size: 3.5rem;
      margin-bottom: 12px;
      font-weight: 800;
      letter-spacing: -0.04em;
      background: var(--grad-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }
    .hero-content p {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }

    /* Floating Search Pill */
    .search-pill-container {
      padding: 12px;
      border-radius: 99px;
      box-shadow: 0 12px 40px -10px rgba(79, 70, 229, 0.15);
      background: rgba(255, 255, 255, 0.95);
      width: 100%;
      max-width: 850px;
    }
    .search-pill {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill-group {
      flex: 1;
      padding: 4px 16px;
    }
    .search-input-group {
      flex: 1.5;
    }
    .pill-divider {
      width: 1px;
      height: 30px;
      background: var(--border-color);
    }
    .pill-group input, .pill-group select {
      width: 100%;
      border: none;
      background: transparent;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-main);
      outline: none;
      cursor: pointer;
    }
    .pill-group input::placeholder {
      color: var(--text-dark);
      font-weight: 400;
    }
    .pill-search-btn {
      background: var(--color-warning); /* Orange/Amber accent */
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 99px;
      font-weight: 700;
      font-size: 1.05rem;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
    }
    .pill-search-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
      background: #c2410c;
    }

    /* Section Headers */
    .section-header {
      margin-bottom: 24px;
    }
    .section-header h2 {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }
    .section-subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
    }

    /* Category Pills */
    .category-pills {
      display: flex;
      gap: 12px;
      margin-bottom: 30px;
      align-items: center;
      flex-wrap: wrap;
    }
    .cat-pill {
      padding: 10px 24px;
      border-radius: 99px;
      border: 1px solid var(--border-color);
      background: white;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .cat-pill:hover {
      background: rgba(15, 23, 42, 0.02);
      border-color: #cbd5e1;
    }
    .cat-pill.active {
      background: #0f172a;
      color: white;
      border-color: #0f172a;
    }
    .view-all-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      padding: 10px 20px;
      border-radius: 99px;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      transition: var(--transition);
    }
    .view-all-btn:hover {
      background: white;
      border-color: var(--text-dark);
    }

    /* Listings Grid & Cards */
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 24px;
    }
    @media (max-width: 1400px) {
      .listings-grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (max-width: 1100px) {
      .listings-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 800px) {
      .listings-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 500px) {
      .listings-grid { grid-template-columns: 1fr; }
    }
    .property-card {
      padding: 0;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      box-shadow: var(--shadow-sm);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: var(--transition);
    }
    .property-card:hover .thumbnail-img {
      transform: scale(1.05);
    }
    .property-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-lg);
    }
    .property-thumbnail {
      height: 280px;
      position: relative;
      overflow: hidden;
      margin-bottom: 0;
    }
    .thumbnail-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .placeholder-img {
      width: 100%;
      height: 100%;
    }

    /* Card Overlays */
    .card-overlay-top {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 2;
    }
    .badge-pill-mint {
      background: rgba(79, 70, 229, 0.95);
      color: white;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 700;
      backdrop-filter: blur(4px);
    }
    .hot-badge {
      position: absolute;
      top: 0;
      left: 0;
      background: linear-gradient(135deg, #ff0f7b 0%, #f89b29 100%);
      padding: 8px 24px;
      font-size: 1.15rem;
      font-weight: 800;
      color: white;
      z-index: 20;
      border-radius: 20px 0 20px 0;
      box-shadow: 3px 3px 15px rgba(255, 15, 123, 0.4);
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
    }
    .icon-btn {
      background: rgba(0, 0, 0, 0.3);
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: var(--transition);
      font-size: 1rem;
    }
    .icon-btn:hover {
      background: rgba(244, 63, 94, 0.9);
      transform: scale(1.1);
    }

    .card-overlay-bottom {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      z-index: 2;
    }
    .pagination-dots {
      display: flex;
      gap: 6px;
      background: rgba(0,0,0,0.2);
      padding: 4px 8px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }
    .dot {
      width: 6px;
      height: 6px;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
    }
    .dot.active {
      background: white;
      transform: scale(1.2);
    }
    .view-count-badge {
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }

    /* Property Info */
    .property-info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .property-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .property-address {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pin-icon {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .property-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .price-block {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .price-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .price-unit {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .rating-block {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .star-icon {
      color: #fbbf24;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 60px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
    }
    .empty-state button {
      margin-top: 15px;
    }
    
    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 800px;
      padding: 0;
      overflow: hidden;
      position: relative;
    }
    .max-w-900 {
      max-width: 900px;
    }
    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.5);
      color: #ffffff;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: var(--transition);
    }
    .modal-close-btn:hover {
      background: var(--color-danger);
    }
    .modal-gallery {
      height: 250px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .modal-gallery-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
    }
    .modal-body {
      padding: 30px;
    }
    .modal-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .header-text-block h2 {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .modal-address {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .modal-stats-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-divider {
      height: 1px;
      background: var(--border-color);
      margin-bottom: 20px;
    }
    .modal-grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 30px;
    }
    @media (max-width: 600px) {
      .modal-grid {
        grid-template-columns: 1fr;
      }
    }
    .modal-desc {
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.5;
    }
    
    /* Vacant Rooms List */
    .vacant-rooms-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 8px;
    }
    .vacant-room-item-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: var(--transition);
    }
    .vacant-room-item-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-hover);
    }
    .room-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .room-number-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .status-badge-vacant {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--color-success);
      letter-spacing: 0.05em;
    }
    .room-item-specs {
      display: flex;
      gap: 24px;
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 12px;
    }
    .spec-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .spec-label {
      font-size: 0.75rem;
      color: var(--text-dark);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .spec-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .spec-value.price-val {
      font-size: 1.1rem;
      color: var(--color-primary-light);
      font-weight: 700;
    }
    .room-item-amenities {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .amenity-badge-lite {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
    }
    .landlord-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 20px;
      text-align: center;
    }
    .landlord-card h4 {
      margin-bottom: 15px;
      font-size: 0.95rem;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .landlord-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .verified-tick {
      font-size: 0.95rem;
      animation: pulse-badge 2s infinite;
    }
    @keyframes pulse-badge {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .landlord-phone {
      font-size: 1rem;
      color: var(--color-primary-light);
      font-weight: 500;
    }
    .mt-4 { margin-top: 24px; }
    .mt-3 { margin-top: 16px; }
    .mb-3 { margin-bottom: 12px; }
    .font-bold { font-weight: 700; }
  `]
})
export class LandingComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  // States
  listings = signal<any[]>([]);
  isLoading = signal(true);
  districts = signal<any[]>([]);
  
  // Grouped properties computed signal
  groupedProperties = signal<any[]>([]);
  hotProperties = signal<any[]>([]);
  normalProperties = signal<any[]>([]);
  
  selectedProperty = signal<any | null>(null);

  // Reports States
  showReports = signal<boolean>(false);
  isLoadingReports = signal<boolean>(false);
  reports = signal<any[]>([]);

  // Filter Models
  searchQuery = '';
  selectedDistrict = '';
  minPrice?: number;
  maxPrice?: number;
  verifiedHost = false;

  ngOnInit(): void {
    this.fetchDistricts();
    this.fetchListings();
  }

  fetchDistricts(): void {
    this.propertyService.getDistricts().subscribe({
      next: (data) => {
        this.districts.set(data);
      },
      error: (err) => {
        this.toastService.show('Lỗi tải danh sách quận huyện từ server.', 'error');
      }
    });
  }

  fetchListings(): void {
    this.isLoading.set(true);
    this.propertyService.getListings({
      search: this.searchQuery,
      district: this.selectedDistrict,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      verifiedHost: this.verifiedHost
    }).subscribe({
      next: (data) => {
        this.listings.set(data);
        this.groupProperties(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách phòng trống từ server.', 'error');
      }
    });
  }

  groupProperties(list: any[]): void {
    const map = new Map<number, any>();
    for (const item of list) {
      if (!map.has(item.propertyId)) {
        map.set(item.propertyId, {
          propertyId: item.propertyId,
          propertyTitle: item.propertyTitle,
          address: item.address,
          isVerifiedTick: item.isVerifiedTick,
          landlordId: item.landlordId,
          landlordName: item.landlordName,
          landlordPhone: item.landlordPhone,
          description: item.description,
          totalRooms: item.totalRooms || 0,
          viewCount: item.viewCount || 0,
          vacantRoomsCount: 0,
          rooms: [],
          imageUrls: item.propertyImageUrl ? [item.propertyImageUrl] : (item.imageUrls || []),
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
          subscriptionId: item.subscriptionId,
          minRoomPrice: item.price
        });
      }
      const prop = map.get(item.propertyId);
      prop.rooms.push(item);
      if (item.status === 'Available') {
        prop.vacantRoomsCount++;
      }
      
      if (item.price < prop.minRoomPrice) {
        prop.minRoomPrice = item.price;
      }

      // We assume prop.totalRooms is populated from item.totalRooms, which is the property's TotalRooms.
      // If it's smaller than the rooms array length, we fallback to the array length.
      if (prop.totalRooms < prop.rooms.length) {
        prop.totalRooms = prop.rooms.length;
      }
      if (prop.imageUrls.length === 0 && item.imageUrls && item.imageUrls.length > 0) {
        prop.imageUrls = item.imageUrls;
      }
    }
    
    const propsArray = Array.from(map.values()).map(prop => {
      // isFavorite is already populated correctly from API, but we just want to ensure it remains a boolean
      prop.isFavorite = prop.rooms.some((r: any) => r.isFavorite);
      return prop;
    });

    this.groupedProperties.set(propsArray);
    this.applySorting();
  }

  applySorting(): void {
    const currentList = [...this.groupedProperties()];
    
    // Sort everything comprehensively
    currentList.sort((a, b) => {
       const subA = a.subscriptionId || 1;
       const subB = b.subscriptionId || 1;
       if (subB !== subA) return subB - subA; // 3 -> 2 -> 1
       
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       
       if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
       return b.averageRating - a.averageRating;
    });

    this.groupedProperties.set(currentList);

    const premiumProps = currentList.filter(p => p.subscriptionId === 2 || p.subscriptionId === 3);
    const freeProps = currentList.filter(p => p.subscriptionId === 1 || !p.subscriptionId);

    this.hotProperties.set(premiumProps);
    this.normalProperties.set(freeProps);
  }

  toggleFavorite(prop: any, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để lưu tin yêu thích.', 'error');
      return;
    }
    
    const roomId = prop.rooms[0]?.roomId;
    if (!roomId) return;
    
    this.propertyService.toggleFavorite(roomId).subscribe({
      next: (res) => {
        prop.isFavorite = res.isFavorite;
        this.applySorting();
        if (res.isFavorite) {
          this.toastService.show('Đã thêm vào danh sách yêu thích', 'success');
        } else {
          this.toastService.show('Đã bỏ yêu thích', 'success');
        }
      },
      error: () => this.toastService.show('Có lỗi khi lưu yêu thích', 'error')
    });
  }

  onFilterChange(): void {
    this.fetchListings();
  }

  setDistrictFilter(districtName: string): void {
    this.selectedDistrict = districtName;
    this.fetchListings();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDistrict = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.verifiedHost = false;
    this.fetchListings();
  }

  openPropertyDetail(property: any): void {
    property.viewCount = (property.viewCount || 0) + 1;
    this.propertyService.incrementViewCount(property.propertyId).subscribe({
      error: () => console.error('Failed to increment view count')
    });
    this.applySorting();

    this.selectedProperty.set(property);
    this.showReports.set(false);
    this.reports.set([]);
  }

  closePropertyDetail(): void {
    this.selectedProperty.set(null);
    this.showReports.set(false);
    this.reports.set([]);
  }

  loadReports(propertyId: number): void {
    this.showReports.set(true);
    this.isLoadingReports.set(true);
    this.propertyService.getPropertyReports(propertyId).subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoadingReports.set(false);
      },
      error: (err) => {
        this.toastService.show('Không thể tải đánh giá', 'error');
        this.isLoadingReports.set(false);
      }
    });
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:5000${url}` : url;
  }

  getRandomGradient(id: number): string {
    const gradients = [
      'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
      'linear-gradient(135deg, #062f4f 0%, #1e0b36 100%)',
      'linear-gradient(135deg, #0b3c5d 0%, #328cc1 100%)',
      'linear-gradient(135deg, #1d2731 0%, #0b0c10 100%)',
      'linear-gradient(135deg, #3d155f 0%, #df405a 100%)',
      'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    ];
    return gradients[id % gradients.length];
  }
}
