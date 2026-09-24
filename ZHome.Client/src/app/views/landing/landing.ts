import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing-container animate-fade-in">
      
      <!-- Government / Enterprise Portal Style Hero Banner -->
      <section class="hero-section">
        <div class="hero-content">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.8rem; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;">
            <span>️ CỔNG THÔNG TIN QUẢN LÝ & TÌM KIẾM TRỌ</span>
          </div>
          <h1 style="color: #0f172a; font-size: 3rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px;">Hệ Thống Nhà Trọ Uy Tín & Chất Lượng </h1>
          <p style="color: #475569; font-size: 1.1rem; max-width: 680px; margin: 0 auto; line-height: 1.6;">Tra cứu phòng trọ chính chủ, đầy đủ tiện nghi, giá niêm yết công khai và được bảo thực trực tiếp bởi ZHome.</p>
          
          <!-- Quick Mode Switcher -->
          <div class="hero-mode-switch-wrapper">
            <button class="hero-mode-badge active" (click)="scrollToSearch()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Tìm phòng trọ</span>
            </button>
            <button class="hero-mode-badge match-btn" (click)="goToMatch()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <span>Sàn ghép trọ & Tìm bạn ở cùng</span>
              <span class="pulse-badge-sm">MỚI</span>
            </button>
          </div>
        </div>
        
        <!-- Floating Search Pill -->
        <div class="search-pill-container glass-panel">
          <div class="search-pill">
            <div class="pill-group search-input-group">
              <input type="text" [(ngModel)]="searchQuery" (input)="onFilterChange()" placeholder="Bạn muốn tìm trọ ở đâu?" />
            </div>
            <div class="pill-divider"></div>
            
            <div class="pill-group select-group">
              <select [(ngModel)]="selectedDistrict" (change)="onDistrictChange()">
                <option value="">Tất cả Quận/Huyện</option>
                @if (urbanDistricts().length > 0) {
                  <optgroup label="── 12 QUẬN NỘI THÀNH ──">
                    @for (d of urbanDistricts(); track d.id) {
                      <option [value]="d.name">Quận {{ d.name }}</option>
                    }
                  </optgroup>
                }
                @if (suburbanDistricts().length > 0) {
                  <optgroup label="── HUYỆN & THỊ XÃ NGOẠI THÀNH ──">
                    @for (d of suburbanDistricts(); track d.id) {
                      <option [value]="d.name">{{ d.type }} {{ d.name }}</option>
                    }
                  </optgroup>
                }
              </select>
            </div>
            <div class="pill-divider"></div>
            
            <div class="pill-group select-group">
              <select [(ngModel)]="selectedWard" (change)="onFilterChange()" [disabled]="!selectedDistrict">
                <option value="">{{ selectedDistrict ? (getSelectedDistrictType(selectedDistrict) === 'Quận' ? 'Tất cả Phường' : 'Tất cả Xã / Thị trấn') : 'Chọn Quận/Huyện trước' }}</option>
                @for (w of wards(); track w.id) {
                  <option [value]="w.name">{{ w.type ? (w.type + ' ' + w.name) : w.name }}</option>
                }
              </select>
            </div>
            <div class="pill-divider"></div>

            <!-- Mức giá Popover -->
            <div class="popover-btn-wrapper">
              <button class="pill-popover-trigger" (click)="togglePricePopover($event)">
                <span class="trigger-icon">$</span>
                <span class="trigger-label">{{ getPriceLabel() }}</span>
                <span class="chevron" [style.transform]="showPricePopover ? 'rotate(180deg)' : 'none'">▼</span>
              </button>
              
              @if (showPricePopover) {
                <div class="filter-popover price-popover animate-fade-in" (click)="$event.stopPropagation()">
                  <div class="popover-inputs-row">
                    <div class="input-col">
                      <label class="popover-label">Giá thấp nhất</label>
                      <input type="number" class="popover-input" [(ngModel)]="minPriceInput" (input)="onPriceInputCustom()" placeholder="0" />
                    </div>
                    <div class="arrow-sep">→</div>
                    <div class="input-col">
                      <label class="popover-label">Giá cao nhất</label>
                      <input type="number" class="popover-input" [(ngModel)]="maxPriceInput" (input)="onPriceInputCustom()" placeholder="10000" />
                    </div>
                  </div>
                  
                  <div class="range-slider-wrapper">
                    <input type="range" min="0" max="50" step="1" [(ngModel)]="sliderValue" (input)="onSliderChange()" class="price-slider" />
                  </div>

                  <div class="popover-options-list">
                    <div class="popover-option" [class.selected]="selectedPriceOption === 'all'" (click)="selectPriceOption('all')">
                      <span>Tất cả mức giá</span>
                      @if (selectedPriceOption === 'all') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedPriceOption === 'under1m'" (click)="selectPriceOption('under1m')">
                      <span>Dưới 1 triệu</span>
                      @if (selectedPriceOption === 'under1m') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedPriceOption === '1to10m'" (click)="selectPriceOption('1to10m')">
                      <span>1 - 10 triệu</span>
                      @if (selectedPriceOption === '1to10m') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedPriceOption === '10to30m'" (click)="selectPriceOption('10to30m')">
                      <span>10 - 30 triệu</span>
                      @if (selectedPriceOption === '10to30m') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedPriceOption === '30to50m'" (click)="selectPriceOption('30to50m')">
                      <span>30 - 50 triệu</span>
                      @if (selectedPriceOption === '30to50m') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedPriceOption === 'over50m'" (click)="selectPriceOption('over50m')">
                      <span>Trên 50 triệu</span>
                      @if (selectedPriceOption === 'over50m') {
                        <span class="check-icon"></span>
                      }
                    </div>
                  </div>

                  <div class="popover-footer">
                    <button class="btn-popover-reset" (click)="resetPriceFilter()"> Đặt lại</button>
                    <button class="btn-popover-apply" (click)="applyPriceFilter()">Tìm ngay</button>
                  </div>
                </div>
              }
            </div>
            <div class="pill-divider"></div>

            <!-- Diện tích Popover -->
            <div class="popover-btn-wrapper">
              <button class="pill-popover-trigger" (click)="toggleAreaPopover($event)">
                <span class="trigger-icon" style="font-size: 0.9rem;">m²</span>
                <span class="trigger-label">{{ getAreaLabel() }}</span>
                <span class="chevron" [style.transform]="showAreaPopover ? 'rotate(180deg)' : 'none'">▼</span>
              </button>
              
              @if (showAreaPopover) {
                <div class="filter-popover area-popover animate-fade-in" (click)="$event.stopPropagation()">
                  <div class="popover-inputs-row">
                    <div class="input-col">
                      <label class="popover-label">Từ (m²)</label>
                      <input type="number" class="popover-input" [(ngModel)]="minAreaInput" (input)="onAreaInputCustom()" placeholder="0" />
                    </div>
                    <div class="arrow-sep">→</div>
                    <div class="input-col">
                      <label class="popover-label">Đến (m²)</label>
                      <input type="number" class="popover-input" [(ngModel)]="maxAreaInput" (input)="onAreaInputCustom()" placeholder="100" />
                    </div>
                  </div>

                  <div class="popover-options-list">
                    <div class="popover-option" [class.selected]="selectedAreaOption === 'all'" (click)="selectAreaOption('all')">
                      <span>Tất cả diện tích</span>
                      @if (selectedAreaOption === 'all') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedAreaOption === 'under20'" (click)="selectAreaOption('under20')">
                      <span>Dưới 20 m²</span>
                      @if (selectedAreaOption === 'under20') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedAreaOption === '20to30'" (click)="selectAreaOption('20to30')">
                      <span>20 - 30 m²</span>
                      @if (selectedAreaOption === '20to30') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedAreaOption === '30to50'" (click)="selectAreaOption('30to50')">
                      <span>30 - 50 m²</span>
                      @if (selectedAreaOption === '30to50') {
                        <span class="check-icon"></span>
                      }
                    </div>
                    <div class="popover-option" [class.selected]="selectedAreaOption === 'over50'" (click)="selectAreaOption('over50')">
                      <span>Trên 50 m²</span>
                      @if (selectedAreaOption === 'over50') {
                        <span class="check-icon"></span>
                      }
                    </div>
                  </div>

                  <div class="popover-footer">
                    <button class="btn-popover-reset" (click)="resetAreaFilter()"> Đặt lại</button>
                    <button class="btn-popover-apply" (click)="applyAreaFilter()">Tìm ngay</button>
                  </div>
                </div>
              }
            </div>
            <div class="pill-divider"></div>

            <div class="pill-group checkbox-group" style="display: flex; align-items: center; gap: 8px; padding-right: 16px;">
              <input type="checkbox" id="verifiedCheck" [(ngModel)]="verifiedHost" (change)="onFilterChange()" style="accent-color: var(--color-primary); cursor: pointer;" />
              <label for="verifiedCheck" style="font-size: 0.9em; font-weight: 600; cursor: pointer; color: var(--text-main); margin: 0; white-space: nowrap;">Đã xác minh</label>
            </div>
            
            <button class="pill-search-btn-orange" (click)="onFilterChange()">
               Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      <!-- Vacant Listings Grid -->
      <section class="listings-section">
        <div class="section-header-row">
          <div class="section-header">
            <h2 style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #ef4444;"></span> Nhà trọ, Phòng trọ nổi bật
            </h2>
            <p class="section-subtitle">Lựa chọn nhà trọ nổi bật & chất lượng tốt nhất dành cho bạn</p>
          </div>
          <button class="btn-view-all" (click)="resetFilters()">View all &rarr;</button>
        </div>

        <!-- Filter Pills (Districts & Amenities) -->
        <div class="category-pills">
          <button class="cat-pill" [class.active]="selectedDistrict === '' && selectedAmenity === ''" (click)="setDistrictFilter(''); selectedAmenity = ''; applyAmenityFilter();">Tất Cả</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Thạch Hoà'" (click)="setDistrictFilter('Thạch Hoà')">Thạch Hoà</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Tân Xã'" (click)="setDistrictFilter('Tân Xã')">Tân Xã</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Bình Yên'" (click)="setDistrictFilter('Bình Yên')">Bình Yên</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Cầu Giấy'" (click)="setDistrictFilter('Cầu Giấy')">Cầu Giấy</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Đống Đa'" (click)="setDistrictFilter('Đống Đa')">Đống Đa</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Thanh Xuân'" (click)="setDistrictFilter('Thanh Xuân')">Thanh Xuân</button>
          <button class="cat-pill" [class.active]="selectedDistrict === 'Nam Từ Liêm'" (click)="setDistrictFilter('Nam Từ Liêm')">Nam Từ Liêm</button>

          <div class="cat-divider"></div>

          <button class="cat-pill" [class.active]="selectedAmenity === 'Điều hòa'" (click)="toggleAmenityFilter('Điều hòa')">️ Điều hòa</button>
          <button class="cat-pill" [class.active]="selectedAmenity === 'Nóng lạnh'" (click)="toggleAmenityFilter('Nóng lạnh')"> Nóng lạnh</button>
          <button class="cat-pill" [class.active]="selectedAmenity === 'Khép kín'" (click)="toggleAmenityFilter('Khép kín')"> Khép kín</button>
          <button class="cat-pill" [class.active]="selectedAmenity === 'Thang máy'" (click)="toggleAmenityFilter('Thang máy')"> Thang máy</button>
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

          @if (groupedProperties().length > 0) {
            <div class="section-header-row" style="margin-top: 48px;">
              <div class="section-header">
                <h2>Toàn bộ nhà trọ </h2>
                <p class="section-subtitle">Khám phá tất cả các lựa chọn nhà trọ uy tín</p>
              </div>
            </div>
            <div class="listings-grid">
              @for (prop of groupedProperties(); track prop.propertyId) {
                <ng-container *ngTemplateOutlet="propertyCard; context: {$implicit: prop}"></ng-container>
              }
            </div>
          }
        }

        <ng-template #propertyCard let-prop>
          <div class="interactive-card property-card" (click)="openPropertyDetail(prop)">
            @if (prop.subscriptionId === 2 || prop.subscriptionId === 3 || prop.isHot) {
              <div class="hot-badge-large">
                <svg class="hot-flame-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.8 2.38-7.05 5.74-8.35.43-.16.9.11.97.56.09.56.32 1.54.89 2.2 1.05 1.21 2.2 1.34 2.9 2.59.8 1.43.25 3.32-.5 4.5 1.5-.7 3.5-2.7 3.5-5.5 0-.4.3-.7.7-.7.3 0 .5.1.7.3C20.3 12.3 21 14.5 21 17c0 4.97-4.03 9-9 9z"/>
                </svg>
                <span>HOT</span>
              </div>
            }

            <div class="property-thumbnail">
              @if (prop.imageUrls && prop.imageUrls.length > 0) {
                <img [src]="getImageUrl(prop.imageUrls[0])" alt="Property Image" class="thumbnail-img" (error)="onImageError($event)" />
              } @else {
                <div class="placeholder-img" [style.background]="getRandomGradient(prop.propertyId)"></div>
              }
              
              <div class="card-overlay-top">
                @if (prop.vacantRoomsCount > 0) {
                  <span class="badge-status-prominent vacant">
                    <span class="pulse-indicator"></span>
                    CÒN TRỐNG ({{ prop.vacantRoomsCount }})
                  </span>
                } @else {
                  <span class="badge-status-prominent full">HẾT PHÒNG</span>
                }
                
                <div class="top-action-icons">
                  <button class="icon-btn-round" title="Xem tổng quan layout">
                    <i class="fas fa-th-large"></i>
                  </button>
                  <button class="icon-btn-round heart-btn" (click)="toggleFavorite(prop, $event)" title="Lưu yêu thích">
                    {{ prop.isFavorite ? '️' : '' }}
                  </button>
                </div>
              </div>
              
              <div class="card-overlay-bottom">
                <span class="view-count-badge">️ {{ prop.viewCount || 9 }}</span>
                <div class="pagination-dots">
                  <span class="dot active"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
            </div>

            <div class="property-info">
              <h3 class="property-title">{{ prop.propertyTitle }}</h3>
              <p class="property-address"><span class="pin-icon"></span> {{ prop.address }}</p>
              
              <div class="property-footer">
                <div class="price-block">
                  <span class="price-value">{{ prop.minRoomPrice | number:'1.0-0' }} đ</span>
                  <span class="price-unit">/tháng</span>
                </div>
                <div class="rating-block">
                  <span class="star-icon"> </span> {{ prop.averageRating | number:'1.1-1' }}
                </div>
              </div>
            </div>
          </div>
        </ng-template>

        <!-- Floating Chat Widget Button -->
        <a href="https://zalo.me" target="_blank" class="floating-chat-btn" title="Hỗ trợ & Chat ngay">
          
        </a>
      </section>

      <!-- SÀN GHÉP TRỌ SINH VIÊN PROMO SECTION -->
      <section class="roommate-promo-section glass-panel">
        <div class="promo-inner-grid">
          <div class="promo-text-content">
            <div class="promo-pill-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px;">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <span>TÍNH NĂNG DÀNH CHO KHÁCH THUÊ</span>
            </div>
            <h2 class="promo-heading">Sàn Ghép Trọ & Tìm Bạn Cùng Phòng Thông Minh</h2>
            <p class="promo-desc">
              Bạn đang tìm bạn cùng phòng hợp tính cách để chia sẻ tiền phòng? Hoặc bạn đã thuê sẵn phòng và cần tìm người vào ở ghép ngay? 
              ZHome Match kết nối sinh viên an toàn, minh bạch với thuật toán khớp lối sống tối ưu.
            </p>

            <div class="promo-features-list">
              <div class="promo-feature-item">
                <div class="f-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div class="f-text">
                  <strong>AI Matchmaker thông minh</strong>
                  <p>Tự động tính độ tương thích theo giờ giấc, thói quen sinh hoạt (ngủ muộn, thuốc lá, thú cưng...)</p>
                </div>
              </div>
              <div class="promo-feature-item">
                <div class="f-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="22" y1="12" x2="18" y2="12"/>
                    <line x1="6" y1="12" x2="2" y2="12"/>
                    <line x1="12" y1="6" x2="12" y2="2"/>
                    <line x1="12" y1="22" x2="12" y2="18"/>
                  </svg>
                </div>
                <div class="f-text">
                  <strong>Sàn tin đăng sinh viên phong phú</strong>
                  <p>Hàng trăm bài đăng tìm bạn ở ghép quanh các trường Bách Khoa, Quốc Gia, FPT, NEU, Xây Dựng...</p>
                </div>
              </div>
              <div class="promo-feature-item">
                <div class="f-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="f-text">
                  <strong>Liên hệ & kết nối trực tiếp</strong>
                  <p>Xem ảnh phòng thực tế, trao đổi trực tiếp qua SĐT và Zalo chính chủ không qua môi giới.</p>
                </div>
              </div>
            </div>

            <div class="promo-actions-group">
              <button (click)="goToMatch('board')" class="btn-promo-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <span>Khám Phá Sàn Ghép Trọ</span>
              </button>
              <button (click)="goToMatch('post')" class="btn-promo-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Đăng Tin Tìm Ở Ghép</span>
              </button>
            </div>
          </div>

          <div class="promo-card-preview">
            <div class="interactive-preview-box">
              <div class="preview-badge-row">
                <span class="p-status-tag has-room">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px;">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  <span>ĐÃ CÓ PHÒNG SẴN</span>
                </span>
                <span class="p-compat-tag">98% TƯƠNG THÍCH</span>
              </div>
              <h3 class="preview-title">Tìm 1 bạn Nam sinh viên ở ghép ngõ 8 Tân Xã, ĐH FPT</h3>
              <div class="preview-meta-row">
                <span>📍 Gần ĐH FPT Hòa Lạc</span>
                <span class="preview-price">1.500.000đ/tháng</span>
              </div>
              <div class="preview-habits-tags">
                <span class="p-tag active">Ngủ muộn</span>
                <span class="p-tag clean">Không hút thuốc</span>
                <span class="p-tag ok">Thú cưng OK</span>
              </div>
              <div class="preview-footer-row">
                <div class="preview-author">
                  <div class="author-avatar-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <strong>Nguyễn Văn An</strong>
                    <span style="font-size: 0.75rem; color: #64748b; display: block;">Sinh viên K18 ĐH FPT</span>
                  </div>
                </div>
                <button (click)="goToMatch('board')" class="btn-preview-contact">Liên hệ</button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
      padding: 64px 20px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      background: radial-gradient(circle at 10% 20%, rgba(254, 243, 199, 0.35) 0%, rgba(239, 246, 255, 0.6) 50%, rgba(255, 255, 255, 1) 100%);
      border-radius: 28px;
      margin-bottom: 10px;
    }
    .hero-content h1 {
      font-size: 3.2rem;
      margin-bottom: 12px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #0f172a;
      line-height: 1.2;
    }
    .hero-content p {
      font-size: 1.15rem;
      color: #475569;
      max-width: 650px;
      margin: 0 auto;
    }

    .search-pill-container {
      padding: 8px 12px;
      border-radius: 99px;
      box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08);
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.9);
      width: 100%;
      max-width: 1120px;
      position: relative;
    }
    .search-pill {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pill-group {
      flex: 1;
      padding: 6px 10px;
      min-width: 0;
    }
    .search-input-group {
      flex: 1.8;
    }
    .pill-divider {
      width: 1px;
      height: 32px;
      background: #e2e8f0;
      flex-shrink: 0;
    }
    .pill-group input[type="text"], .pill-group select {
      width: 100%;
      border: none;
      background: transparent;
      font-size: 0.98rem;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      cursor: pointer;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .pill-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin: 0;
      flex-shrink: 0;
    }
    .pill-group input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    /* Popover Controls */
    .popover-btn-wrapper {
      position: relative;
    }
    .pill-popover-trigger {
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.98rem;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      white-space: nowrap;
    }
    .pill-popover-trigger:hover {
      color: #2563eb;
    }
    .trigger-icon {
      color: #0ea5e9;
      font-weight: 800;
      font-size: 1.05rem;
    }
    .chevron {
      font-size: 0.65rem;
      color: #64748b;
      margin-left: 2px;
      transition: transform 0.2s ease;
    }

    .filter-popover {
      position: absolute;
      top: calc(100% + 14px);
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.15);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 14px;
      text-align: left;
    }
    .price-popover {
      width: 350px;
    }
    .area-popover {
      width: 320px;
    }

    .popover-inputs-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .input-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popover-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
    }
    .popover-input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
      text-align: center;
      outline: none;
      transition: border-color 0.2s;
    }
    .popover-input:focus {
      border-color: #0ea5e9;
    }
    .arrow-sep {
      font-size: 1.1rem;
      color: #64748b;
      margin-bottom: 8px;
    }

    .range-slider-wrapper {
      padding: 4px 0;
    }
    .price-slider {
      width: 100%;
      accent-color: #0ea5e9;
      cursor: pointer;
    }

    .popover-options-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 240px;
      overflow-y: auto;
    }
    .popover-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .popover-option:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .popover-option.selected {
      font-weight: 700;
      color: #0f172a;
    }
    .check-icon {
      width: 20px;
      height: 20px;
      background: #0ea5e9;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .popover-footer {
      display: flex;
      gap: 10px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-popover-reset {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-popover-reset:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-popover-apply {
      flex: 1.2;
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      background: #1d4ed8;
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
    }
    .btn-popover-apply:hover {
      background: #1e40af;
      transform: translateY(-1px);
    }

    .pill-search-btn-orange {
      background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 99px;
      font-weight: 700;
      font-size: 0.98rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 6px 20px rgba(255, 87, 34, 0.35);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-search-btn-orange:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(255, 87, 34, 0.5);
    }

    /* Section Headers */
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .section-header {
      margin-bottom: 0;
    }
    .section-header h2 {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 6px;
      color: #0f172a;
    }
    .section-subtitle {
      color: #64748b;
      font-size: 1.05rem;
    }
    .btn-view-all {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      border-radius: 99px;
      padding: 8px 22px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      cursor: pointer;
      flex-shrink: 0;
    }
    .btn-view-all:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
      transform: translateX(2px);
    }

    /* Category Pills */
    .category-pills {
      display: flex;
      gap: 8px;
      margin-bottom: 32px;
      align-items: center;
      flex-wrap: wrap;
    }
    .cat-pill {
      padding: 8px 20px;
      border-radius: 99px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 600;
      font-size: 0.98rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .cat-pill:hover {
      color: #0f172a;
      background: rgba(241, 245, 249, 0.8);
    }
    .cat-pill.active {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }
    .cat-divider {
      width: 1px;
      height: 20px;
      background: #e2e8f0;
      margin: 0 8px;
    }

    /* Listings Grid & Cards */
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
    @media (max-width: 1200px) {
      .listings-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 850px) {
      .listings-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 550px) {
      .listings-grid { grid-template-columns: 1fr; }
    }
    .property-card {
      padding: 0;
      border: 1px solid rgba(226, 232, 240, 0.9);
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .property-card:hover .thumbnail-img {
      transform: scale(1.05);
    }
    .property-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.12);
      border-color: rgba(203, 213, 225, 0.9);
    }
    .property-thumbnail {
      height: 220px;
      position: relative;
      overflow: hidden;
      margin-bottom: 0;
      border-radius: 20px 20px 0 0;
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
      align-items: center;
      z-index: 2;
    }
    .hot-badge-large {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 10;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%);
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      padding: 5px 12px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      animation: pulseHot 2s infinite ease-in-out;
    }

    @keyframes pulseHot {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45); }
      50% { transform: scale(1.06); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.65); }
    }

    .hot-flame-icon {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }

    .badge-status-prominent {
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .badge-status-prominent.vacant {
      background: #059669;
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
    }

    .badge-status-prominent.full {
      background: #dc2626;
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.4);
    }

    .pulse-indicator {
      width: 7px;
      height: 7px;
      background: #ffffff;
      border-radius: 50%;
      display: inline-block;
      animation: pulseIndicator 1.5s infinite ease-in-out;
    }

    @keyframes pulseIndicator {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
    .top-action-icons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-btn-round {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(6px);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.95rem;
    }
    .icon-btn-round:hover {
      background: #ffffff;
      transform: scale(1.1);
      color: #0f172a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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
      gap: 5px;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px 8px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }
    .dot {
      width: 6px;
      height: 6px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
    }
    .dot.active {
      background: white;
      transform: scale(1.2);
    }
    .view-count-badge {
      background: rgba(0, 0, 0, 0.55);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }

    /* Property Info */
    .property-info {
      padding: 16px 18px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .property-title {
      font-size: 1.12rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .property-address {
      font-size: 0.88rem;
      color: #64748b;
      margin-bottom: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pin-icon {
      font-size: 0.82rem;
      opacity: 0.8;
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
      color: #0f172a;
    }
    .price-unit {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
    .rating-block {
      font-size: 0.88rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .star-icon {
      color: #f59e0b;
    }

    /* Floating Chat Button */
    .floating-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 54px;
      height: 54px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
      z-index: 1000;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .floating-chat-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.5);
    }
    /* Hero Mode Switcher */
    .hero-mode-switch-wrapper {
      display: inline-flex;
      gap: 12px;
      margin-top: 18px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .hero-mode-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 99px;
      font-size: 0.95rem;
      font-weight: 700;
      border: 1.5px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      transition: all 0.25s ease;
    }
    .hero-mode-badge:hover {
      transform: translateY(-2px);
      border-color: #3b82f6;
      color: #1d4ed8;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.15);
    }
    .hero-mode-badge.active {
      background: #1d4ed8;
      color: #ffffff;
      border-color: #1d4ed8;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
    }
    .hero-mode-badge.match-btn {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
    }
    .hero-mode-badge.match-btn:hover {
      background: linear-gradient(135deg, #0369a1, #0284c7);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
    }
    .pulse-badge-sm {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 99px;
      letter-spacing: 0.04em;
    }

    /* Roommate Promo Section */
    .roommate-promo-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ffffff 100%);
      border: 1px solid #bae6fd;
      border-radius: 28px;
      padding: 44px 36px;
      box-shadow: 0 20px 40px -15px rgba(2, 132, 199, 0.12);
      margin-top: 20px;
    }
    .promo-inner-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 36px;
      align-items: center;
    }
    @media (max-width: 900px) {
      .promo-inner-grid { grid-template-columns: 1fr; }
    }
    .promo-pill-label {
      display: inline-block;
      background: #e0f2fe;
      border: 1px solid #7dd3fc;
      color: #0284c7;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .promo-heading {
      font-size: 2.1rem;
      font-weight: 800;
      color: #0c4a6e;
      margin: 0 0 12px 0;
      line-height: 1.25;
    }
    .promo-desc {
      color: #475569;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .promo-features-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 28px;
    }
    .promo-feature-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .promo-feature-item .f-icon {
      font-size: 1.3rem;
      width: 38px;
      height: 38px;
      background: #ffffff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.1);
      flex-shrink: 0;
    }
    .promo-feature-item .f-text strong {
      display: block;
      color: #0f172a;
      font-size: 0.95rem;
      margin-bottom: 2px;
    }
    .promo-feature-item .f-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .promo-actions-group {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }
    .btn-promo-primary {
      background: linear-gradient(135deg, #0284c7, #0284c7);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      padding: 13px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.3);
      transition: all 0.25s ease;
    }
    .btn-promo-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(2, 132, 199, 0.4);
      background: #0369a1;
    }
    .btn-promo-secondary {
      background: #ffffff;
      color: #0284c7;
      border: 1.5px solid #7dd3fc;
      font-weight: 800;
      font-size: 0.95rem;
      padding: 12px 22px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .btn-promo-secondary:hover {
      background: #f0f9ff;
      border-color: #0284c7;
    }

    /* Preview Card Box */
    .interactive-preview-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
      transform: rotate(1deg);
      transition: all 0.3s ease;
    }
    .interactive-preview-box:hover {
      transform: rotate(0deg) scale(1.02);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    }
    .preview-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .p-status-tag {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .p-status-tag.has-room { background: #dcfce7; color: #15803d; }
    .p-compat-tag {
      font-size: 0.75rem;
      font-weight: 800;
      background: #e0f2fe;
      color: #0284c7;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .preview-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.35;
    }
    .preview-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .preview-price {
      color: #0284c7;
      font-weight: 800;
    }
    .preview-habits-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .p-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .p-tag.active { background: #e0f2fe; color: #0369a1; }
    .p-tag.clean { background: #f1f5f9; color: #475569; }
    .p-tag.ok { background: #fef3c7; color: #b45309; }

    .preview-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
    }
    .preview-author {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .author-avatar-badge {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .btn-preview-contact {
      background: #0284c7;
      color: #ffffff;
      border: none;
      font-size: 0.82rem;
      font-weight: 800;
      padding: 7px 16px;
      border-radius: 8px;
      cursor: pointer;
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
  `]
})
export class LandingComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // States
  listings = signal<any[]>([]);
  isLoading = signal(true);
  districts = signal<any[]>([]);
  wards = signal<any[]>([]);

  urbanDistricts = computed(() => this.districts().filter(d => d.type === 'Quận'));
  suburbanDistricts = computed(() => this.districts().filter(d => d.type !== 'Quận'));

  getSelectedDistrictType(districtName: string): string {
    const d = this.districts().find(x => x.name === districtName);
    return d ? (d.type || 'Quận') : 'Quận';
  }
  
  groupedProperties = signal<any[]>([]);
  hotProperties = signal<any[]>([]);
  normalProperties = signal<any[]>([]);
  
  selectedProperty = signal<any | null>(null);

  // Filter Models
  searchQuery = '';
  selectedDistrict = '';
  selectedWard = '';
  verifiedHost = false;
  selectedAmenity = '';

  // Popover controls
  showPricePopover = false;
  showAreaPopover = false;

  // Price filter states
  selectedPriceOption = 'all'; // 'all', 'under1m', '1to10m', '10to30m', '30to50m', 'over50m', 'custom'
  minPrice?: number;
  maxPrice?: number;
  minPriceInput: number | null = 0;
  maxPriceInput: number | null = 10000;
  sliderValue = 50;

  // Area filter states
  selectedAreaOption = 'all'; // 'all', 'under20', '20to30', '30to50', 'over50', 'custom'
  minArea?: number;
  maxArea?: number;
  minAreaInput: number | null = 0;
  maxAreaInput: number | null = 100;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.popover-btn-wrapper')) {
      this.showPricePopover = false;
      this.showAreaPopover = false;
    }
  }

  togglePricePopover(event: MouseEvent): void {
    event.stopPropagation();
    this.showAreaPopover = false;
    this.showPricePopover = !this.showPricePopover;
  }

  toggleAreaPopover(event: MouseEvent): void {
    event.stopPropagation();
    this.showPricePopover = false;
    this.showAreaPopover = !this.showAreaPopover;
  }

  selectPriceOption(option: string): void {
    this.selectedPriceOption = option;
    if (option === 'all') {
      this.minPrice = undefined;
      this.maxPrice = undefined;
      this.minPriceInput = 0;
      this.maxPriceInput = 10000;
    } else if (option === 'under1m') {
      this.minPrice = undefined;
      this.maxPrice = 1000000;
      this.minPriceInput = 0;
      this.maxPriceInput = 1000;
    } else if (option === '1to10m') {
      this.minPrice = 1000000;
      this.maxPrice = 10000000;
      this.minPriceInput = 1000;
      this.maxPriceInput = 10000;
    } else if (option === '10to30m') {
      this.minPrice = 10000000;
      this.maxPrice = 30000000;
      this.minPriceInput = 10000;
      this.maxPriceInput = 30000;
    } else if (option === '30to50m') {
      this.minPrice = 30000000;
      this.maxPrice = 50000000;
      this.minPriceInput = 30000;
      this.maxPriceInput = 50000;
    } else if (option === 'over50m') {
      this.minPrice = 50000000;
      this.maxPrice = undefined;
      this.minPriceInput = 50000;
      this.maxPriceInput = 100000;
    }
  }

  onPriceInputCustom(): void {
    this.selectedPriceOption = 'custom';
    if (this.minPriceInput != null) {
      this.minPrice = this.minPriceInput * 1000;
    } else {
      this.minPrice = undefined;
    }
    if (this.maxPriceInput != null) {
      this.maxPrice = this.maxPriceInput * 1000;
    } else {
      this.maxPrice = undefined;
    }
  }

  onSliderChange(): void {
    this.selectedPriceOption = 'custom';
    this.minPriceInput = 0;
    this.maxPriceInput = this.sliderValue * 1000;
    this.minPrice = undefined;
    this.maxPrice = this.maxPriceInput * 1000;
  }

  applyPriceFilter(): void {
    this.showPricePopover = false;
    this.fetchListings();
  }

  resetPriceFilter(): void {
    this.selectPriceOption('all');
    this.showPricePopover = false;
    this.fetchListings();
  }

  getPriceLabel(): string {
    if (this.selectedPriceOption === 'under1m') return 'Dưới 1 triệu';
    if (this.selectedPriceOption === '1to10m') return '1 - 10 triệu';
    if (this.selectedPriceOption === '10to30m') return '10 - 30 triệu';
    if (this.selectedPriceOption === '30to50m') return '30 - 50 triệu';
    if (this.selectedPriceOption === 'over50m') return 'Trên 50 triệu';
    if (this.minPrice || this.maxPrice) return 'Mức giá chọn lọc';
    return 'Mức giá';
  }

  selectAreaOption(option: string): void {
    this.selectedAreaOption = option;
    if (option === 'all') {
      this.minArea = undefined;
      this.maxArea = undefined;
      this.minAreaInput = 0;
      this.maxAreaInput = 100;
    } else if (option === 'under20') {
      this.minArea = undefined;
      this.maxArea = 20;
      this.minAreaInput = 0;
      this.maxAreaInput = 20;
    } else if (option === '20to30') {
      this.minArea = 20;
      this.maxArea = 30;
      this.minAreaInput = 20;
      this.maxAreaInput = 30;
    } else if (option === '30to50') {
      this.minArea = 30;
      this.maxArea = 50;
      this.minAreaInput = 30;
      this.maxAreaInput = 50;
    } else if (option === 'over50') {
      this.minArea = 50;
      this.maxArea = undefined;
      this.minAreaInput = 50;
      this.maxAreaInput = 200;
    }
  }

  onAreaInputCustom(): void {
    this.selectedAreaOption = 'custom';
    this.minArea = this.minAreaInput != null ? this.minAreaInput : undefined;
    this.maxArea = this.maxAreaInput != null ? this.maxAreaInput : undefined;
  }

  applyAreaFilter(): void {
    this.showAreaPopover = false;
    this.fetchListings();
  }

  resetAreaFilter(): void {
    this.selectAreaOption('all');
    this.showAreaPopover = false;
    this.fetchListings();
  }

  getAreaLabel(): string {
    if (this.selectedAreaOption === 'under20') return 'Dưới 20 m²';
    if (this.selectedAreaOption === '20to30') return '20 - 30 m²';
    if (this.selectedAreaOption === '30to50') return '30 - 50 m²';
    if (this.selectedAreaOption === 'over50') return 'Trên 50 m²';
    if (this.minArea || this.maxArea) return 'Diện tích chọn lọc';
    return 'Diện tích';
  }

  toggleAmenityFilter(amenity: string): void {
    if (this.selectedAmenity === amenity) {
      this.selectedAmenity = '';
    } else {
      this.selectedAmenity = amenity;
    }
    this.applyAmenityFilter();
  }

  applyAmenityFilter(): void {
    const rawList = this.listings();
    if (!this.selectedAmenity) {
      this.groupProperties(rawList);
      return;
    }

    const filtered = rawList.filter(item => {
      if (!item.amenities || item.amenities.length === 0) return false;
      return item.amenities.some((a: string) => a.toLowerCase().includes(this.selectedAmenity.toLowerCase()));
    });
    this.groupProperties(filtered);
  }

  ngOnInit(): void {
    this.fetchDistricts();
    this.fetchListings();
  }

  fetchDistricts(): void {
    this.propertyService.getLocations().subscribe({
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
      ward: this.selectedWard,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      minArea: this.minArea,
      maxArea: this.maxArea,
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
          minRoomPrice: item.price,
          minVacantRoomPrice: Infinity
        });
      }
      const prop = map.get(item.propertyId);
      prop.rooms.push(item);
      if (item.status === 'Available') {
        prop.vacantRoomsCount++;
        if (item.price < prop.minVacantRoomPrice) {
          prop.minVacantRoomPrice = item.price;
        }
      }
      
      if (item.price < prop.minRoomPrice) {
        prop.minRoomPrice = item.price;
      }

      if (prop.totalRooms < prop.rooms.length) {
        prop.totalRooms = prop.rooms.length;
      }
      if (prop.imageUrls.length === 0 && item.imageUrls && item.imageUrls.length > 0) {
        prop.imageUrls = item.imageUrls;
      }
    }
    
    const propsArray = Array.from(map.values()).map(prop => {
      prop.isFavorite = prop.rooms.some((r: any) => r.isFavorite);
      if (prop.vacantRoomsCount > 0 && prop.minVacantRoomPrice !== Infinity) {
        prop.minRoomPrice = prop.minVacantRoomPrice;
      }
      return prop;
    });

    this.groupedProperties.set(propsArray);
    this.applySorting();
  }

  applySorting(): void {
    const currentList = [...this.groupedProperties()];
    
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

  onDistrictChange(): void {
    this.selectedWard = '';
    this.wards.set([]);
    this.onFilterChange();
    if (this.selectedDistrict) {
      const districtObj = this.districts().find(d => d.name === this.selectedDistrict);
      if (districtObj) {
        this.propertyService.getChildren(districtObj.id).subscribe({
          next: (data) => this.wards.set(data),
          error: (err) => console.error(err)
        });
      }
    }
  }

  setDistrictFilter(districtName: string): void {
    this.selectedDistrict = districtName;
    this.onDistrictChange();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.verifiedHost = false;
    this.selectPriceOption('all');
    this.selectAreaOption('all');
    this.wards.set([]);
    this.fetchListings();
  }

  openPropertyDetail(property: any): void {
    if (property?.propertyId) {
      this.router.navigate(['/phong-tro-detail', property.propertyId]);
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `${environment.baseUrl}${url}` : url;
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

  goToMatch(tab: 'board' | 'post' | 'matches' = 'board'): void {
    this.router.navigate(['/tenant/match'], { queryParams: { tab } });
  }

  scrollToSearch(): void {
    const el = document.querySelector('.search-pill-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
