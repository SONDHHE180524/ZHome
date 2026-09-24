import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match.service';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ContractService } from '../../services/contract.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tenant-match',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="match-container animate-fade-in">
      
      <!-- Premium Hero Header Banner -->
      <div class="match-hero-banner">
        <div class="hero-bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
        </div>
        <div class="hero-main-content">
          <div class="hero-badge-pill">
            <svg class="mono-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            <span>CỔNG KẾT NỐI GHÉP TRỌ SINH VIÊN ZHOME</span>
          </div>
          <h1 class="hero-title">Sàn Tìm Bạn Ở Ghép & AI Matchmaker</h1>
          <p class="hero-subtitle">
            Hệ thống kết nối sinh viên tìm bạn cùng phòng uy tín, chi phí minh bạch và tự động khớp lối sống bằng thuật toán thông minh.
          </p>
          
          <div class="hero-stats-row">
            <div class="stat-pill-item">
              <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <span>100% Sinh viên xác thực</span>
            </div>
            <div class="stat-pill-item">
              <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span>Khớp AI độ chính xác cao</span>
            </div>
            <div class="stat-pill-item">
              <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Miễn phí kết nối</span>
            </div>
          </div>
        </div>
        
        <div class="hero-action-box">
          <button (click)="setTab('post')" class="btn-hero-create-post">
            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Đăng Tin Tìm Ở Ghép</span>
          </button>
        </div>
      </div>

      <!-- Segmented Navigation Tabs -->
      <div class="segmented-tabs-wrapper mt-4">
        <div class="tabs-container">
          <button 
            type="button"
            (click)="setTab('board')" 
            [class.active]="activeTab() === 'board'" 
            class="tab-pill-btn">
            <svg class="tab-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>Sàn Tin Đăng Mới Nhất</span>
            <span class="tab-count-badge">{{ publicPosts().length }}</span>
          </button>

          <button 
            type="button"
            (click)="setTab('post')" 
            [class.active]="activeTab() === 'post'" 
            class="tab-pill-btn">
            <svg class="tab-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>Đăng Tin Tìm Bạn Ở Ghép</span>
          </button>

          <button 
            type="button"
            (click)="setTab('matches')" 
            [class.active]="activeTab() === 'matches'" 
            class="tab-pill-btn ai-tab-btn">
            <svg class="tab-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="M5 3v4"/>
              <path d="M19 17v4"/>
              <path d="M3 5h4"/>
              <path d="M17 19h4"/>
            </svg>
            <span>AI Matchmaker</span>
            <span class="ai-sparkle-pill">AI GỢI Ý</span>
          </button>
        </div>
      </div>

      <!-- TAB CONTENT AREA -->
      <div class="tab-content mt-4">
        
        <!-- 1. TAB: PUBLIC ROOMMATE POSTS BOARD -->
        @if (activeTab() === 'board') {
          <div class="board-container animate-fade-in">
            
            <!-- Floating Search Pill Filter Bar -->
            <div class="match-search-section mb-4">
              <div class="search-pill-container glass-panel">
                <div class="search-pill">
                  
                  <!-- 1. Keyword Search -->
                  <div class="pill-group search-input-group">
                    <div class="input-with-icon">
                      <svg class="search-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input 
                        type="text" 
                        [(ngModel)]="filters.search" 
                        (input)="onFilterChange()" 
                        placeholder="Bạn muốn tìm trọ/ở ghép ở đâu?" />
                      @if (filters.search) {
                        <button type="button" class="btn-clear-inline" (click)="filters.search = ''; onFilterChange()">&times;</button>
                      }
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- 2. District Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <select [(ngModel)]="filters.district" (change)="onDistrictChange()">
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
                  </div>

                  <div class="pill-divider"></div>

                  <!-- 3. Ward Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                      </svg>
                      <select [(ngModel)]="filters.ward" (change)="onFilterChange()" [disabled]="!filters.district">
                        <option value="">{{ filters.district ? (getSelectedDistrictType(filters.district) === 'Quận' ? 'Tất cả Phường' : 'Tất cả Xã / Thị trấn') : 'Chọn Quận/Huyện trước' }}</option>
                        @for (w of wards(); track w.id) {
                          <option [value]="w.name">{{ w.type ? (w.type + ' ' + w.name) : w.name }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- 4. Price Popover -->
                  <div class="popover-btn-wrapper">
                    <button type="button" class="pill-popover-trigger" (click)="togglePricePopover($event)">
                      <span class="trigger-icon">$</span>
                      <span class="trigger-label">{{ getPriceLabel() }}</span>
                      <span class="chevron" [style.transform]="showPricePopover ? 'rotate(180deg)' : 'none'">▼</span>
                    </button>

                    @if (showPricePopover) {
                      <div class="filter-popover price-popover animate-fade-in" (click)="$event.stopPropagation()">
                        <div class="popover-inputs-row">
                          <div class="input-col">
                            <label class="popover-label">Từ (VNĐ)</label>
                            <input type="number" class="popover-input" [(ngModel)]="minPriceInput" (input)="onPriceInputCustom()" placeholder="0" />
                          </div>
                          <div class="arrow-sep">→</div>
                          <div class="input-col">
                            <label class="popover-label">Đến (VNĐ)</label>
                            <input type="number" class="popover-input" [(ngModel)]="maxPriceInput" (input)="onPriceInputCustom()" placeholder="10000000" />
                          </div>
                        </div>

                        <div class="range-slider-wrapper">
                          <input type="range" min="0" max="10000000" step="500000" [(ngModel)]="sliderValue" (input)="onSliderChange()" class="price-slider" />
                          <div class="slider-ticks">
                            <span>0đ</span>
                            <span>5 tr</span>
                            <span>10 tr+</span>
                          </div>
                        </div>

                        <div class="popover-options-list">
                          <div class="popover-option" [class.selected]="selectedPriceOption === 'all'" (click)="selectPriceOption('all')">
                            <span>Tất cả mức giá</span>
                            @if (selectedPriceOption === 'all') { <span class="check-icon">✓</span> }
                          </div>
                          <div class="popover-option" [class.selected]="selectedPriceOption === 'under1_5m'" (click)="selectPriceOption('under1_5m')">
                            <span>Dưới 1.5 triệu</span>
                            @if (selectedPriceOption === 'under1_5m') { <span class="check-icon">✓</span> }
                          </div>
                          <div class="popover-option" [class.selected]="selectedPriceOption === '1_5to2_5m'" (click)="selectPriceOption('1_5to2_5m')">
                            <span>1.5 - 2.5 triệu</span>
                            @if (selectedPriceOption === '1_5to2_5m') { <span class="check-icon">✓</span> }
                          </div>
                          <div class="popover-option" [class.selected]="selectedPriceOption === '2_5to4m'" (click)="selectPriceOption('2_5to4m')">
                            <span>2.5 - 4 triệu</span>
                            @if (selectedPriceOption === '2_5to4m') { <span class="check-icon">✓</span> }
                          </div>
                          <div class="popover-option" [class.selected]="selectedPriceOption === '4to6m'" (click)="selectPriceOption('4to6m')">
                            <span>4 - 6 triệu</span>
                            @if (selectedPriceOption === '4to6m') { <span class="check-icon">✓</span> }
                          </div>
                          <div class="popover-option" [class.selected]="selectedPriceOption === 'over6m'" (click)="selectPriceOption('over6m')">
                            <span>Trên 6 triệu</span>
                            @if (selectedPriceOption === 'over6m') { <span class="check-icon">✓</span> }
                          </div>
                        </div>

                        <div class="popover-footer">
                          <button type="button" class="btn-popover-reset" (click)="resetPriceFilter()">Đặt lại</button>
                          <button type="button" class="btn-popover-apply" (click)="applyPriceFilter()">Áp dụng</button>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="pill-divider"></div>

                  <!-- 5. Gender Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                      <select [(ngModel)]="filters.gender" (change)="onFilterChange()">
                        <option value="Any">Tất cả giới tính</option>
                        <option value="Male">Tìm bạn Nam</option>
                        <option value="Female">Tìm bạn Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- 6. Search Trigger & Advanced Filter Button -->
                  <div class="pill-action-group">
                    <button 
                      type="button" 
                      class="btn-advanced-filter-trigger" 
                      [class.has-active]="activeAdvancedFilterCount() > 0"
                      (click)="toggleAdvancedFilter($event)" 
                      title="Bộ lọc chi tiết mở rộng">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"/>
                        <line x1="4" y1="10" x2="4" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12" y2="3"/>
                        <line x1="20" y1="21" x2="20" y2="16"/>
                        <line x1="20" y1="12" x2="20" y2="3"/>
                        <line x1="1" y1="14" x2="7" y2="14"/>
                        <line x1="9" y1="8" x2="15" y2="8"/>
                        <line x1="17" y1="16" x2="23" y2="16"/>
                      </svg>
                      <span>Lọc chi tiết</span>
                      @if (activeAdvancedFilterCount() > 0) {
                        <span class="active-dot-badge">{{ activeAdvancedFilterCount() }}</span>
                      }
                    </button>

                    <button type="button" class="btn-primary-search" (click)="fetchPublicPosts()">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <span>Tìm Kiếm</span>
                    </button>
                  </div>

                </div>
              </div>

              <!-- ADVANCED FILTER EXPANDABLE DRAWER -->
              @if (showAdvancedFilter) {
                <div class="advanced-filter-drawer animate-fade-in mt-3 glass-panel">
                  
                  <div class="adv-drawer-header">
                    <div class="d-flex align-items-center gap-2">
                      <div class="adv-icon-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                        </svg>
                      </div>
                      <h4 class="m-0">Bộ Lọc Chi Tiết Tiêu Chí & Tiện Nghi Ghép Trọ</h4>
                    </div>
                    <button type="button" class="btn-close-drawer" (click)="showAdvancedFilter = false">&times;</button>
                  </div>

                  <div class="adv-drawer-body mt-3">
                    
                    <!-- SECTION 1: TIỆN NGHI PHÒNG TRỌ (18 TIỆN ÍCH) -->
                    <div class="adv-section-block">
                      <div class="section-title-with-toggle">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-badge-num">1</span>
                          <span class="section-main-heading">Tiện nghi phòng trọ (18 tiện ích)</span>
                        </div>
                        <button type="button" class="toggle-all-btn" [class.active]="areAllAmenitiesSelected()" (click)="toggleAllAmenities()">
                          <span class="chk-box-mini">{{ areAllAmenitiesSelected() ? '✓' : '' }}</span>
                          <span>TẤT CẢ</span>
                        </button>
                      </div>

                      <div class="amenities-grid-vip mt-2">
                        @for (item of amenityList; track item.key) {
                          <div 
                            class="amenity-card-item" 
                            [class.checked]="isAmenitySelected(item.label)" 
                            (click)="toggleAmenity(item.label)">
                            <div class="custom-checkbox-box">
                              @if (isAmenitySelected(item.label)) {
                                <span class="chk-mark">✓</span>
                              }
                            </div>
                            <span class="amenity-label-text">{{ item.label }}</span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- SECTION 2: MÔI TRƯỜNG XUNG QUANH -->
                    <div class="adv-section-block mt-4">
                      <div class="section-title-with-toggle">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-badge-num">2</span>
                          <span class="section-main-heading">Môi trường xung quanh</span>
                        </div>
                        <button type="button" class="toggle-all-btn" [class.active]="areAllSurroundingsSelected()" (click)="toggleAllSurroundings()">
                          <span class="chk-box-mini">{{ areAllSurroundingsSelected() ? '✓' : '' }}</span>
                          <span>TẤT CẢ</span>
                        </button>
                      </div>

                      <div class="amenities-grid-vip surroundings-grid mt-2">
                        @for (item of surroundingList; track item.key) {
                          <div 
                            class="amenity-card-item" 
                            [class.checked]="isSurroundingSelected(item.label)" 
                            (click)="toggleSurrounding(item.label)">
                            <div class="custom-checkbox-box">
                              @if (isSurroundingSelected(item.label)) {
                                <span class="chk-mark">✓</span>
                              }
                            </div>
                            <span class="amenity-label-text">{{ item.label }}</span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- SECTION 3: THÔNG TIN NGƯỜI THUÊ & NGÂN SÁCH -->
                    <div class="adv-section-block mt-4">
                      <div class="section-title-with-toggle">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-badge-num">3</span>
                          <span class="section-main-heading">Thông tin người thuê, Số người & Ngân sách chia</span>
                        </div>
                      </div>

                      <div class="adv-inputs-grid-3">
                        
                        <!-- Độ tuổi -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></svg>
                            Độ tuổi
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.ageRange === 'All'" (click)="filters.ageRange = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.ageRange === '18-22'" (click)="filters.ageRange = '18-22'; onFilterChange()">18 - 22 tuổi (SV)</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.ageRange === '23-27'" (click)="filters.ageRange = '23-27'; onFilterChange()">23 - 27 tuổi</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.ageRange === '28-35'" (click)="filters.ageRange = '28-35'; onFilterChange()">28 - 35 tuổi</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.ageRange === '35+'" (click)="filters.ageRange = '35+'; onFilterChange()">Trên 35 tuổi</button>
                          </div>
                        </div>

                        <!-- Nghề nghiệp -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            Nghề nghiệp
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupation === 'All'" (click)="filters.occupation = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupation === 'Sinh viên'" (click)="filters.occupation = 'Sinh viên'; onFilterChange()">Sinh viên</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupation === 'Người đi làm'" (click)="filters.occupation = 'Người đi làm'; onFilterChange()">Người đi làm</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupation === 'Khác'" (click)="filters.occupation = 'Khác'; onFilterChange()">Khác</button>
                          </div>
                        </div>

                        <!-- Ngân sách tối đa/người -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <span style="color:#0284c7; font-weight:900;">$</span>
                            Ngân sách tối đa / người (chia theo đầu người)
                          </label>
                          <div class="adv-input-with-unit">
                            <input 
                              type="number" 
                              class="adv-input-text" 
                              [(ngModel)]="filters.budgetPerPerson" 
                              (input)="onFilterChange()" 
                              placeholder="Ví dụ: 1500000" />
                            <span class="unit-text">đ/người/tháng</span>
                          </div>
                          <div class="adv-quick-budget-pills mt-2">
                            <span class="quick-lbl">Chọn nhanh:</span>
                            <button type="button" class="btn-micro-chip" (click)="filters.budgetPerPerson = 1200000; onFilterChange()">≤ 1.2tr</button>
                            <button type="button" class="btn-micro-chip" (click)="filters.budgetPerPerson = 1800000; onFilterChange()">≤ 1.8tr</button>
                            <button type="button" class="btn-micro-chip" (click)="filters.budgetPerPerson = 2500000; onFilterChange()">≤ 2.5tr</button>
                            <button type="button" class="btn-micro-chip" (click)="filters.budgetPerPerson = null; onFilterChange()">Bỏ chọn</button>
                          </div>
                        </div>

                        <!-- Số người / phòng -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            Số người / phòng
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupantsPerRoom === null" (click)="filters.occupantsPerRoom = null; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupantsPerRoom === 1" (click)="filters.occupantsPerRoom = 1; onFilterChange()">1 người / phòng</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupantsPerRoom === 2" (click)="filters.occupantsPerRoom = 2; onFilterChange()">2 người / phòng</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.occupantsPerRoom === 4" (click)="filters.occupantsPerRoom = 4; onFilterChange()">3 - 4 người / phòng</button>
                          </div>
                        </div>

                        <!-- Thời gian muốn thuê (Chọn nhiều tháng) -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Thời gian muốn thuê (Có thể chọn nhiều)
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="isLeaseTermSelected('Dưới 3 tháng')" (click)="toggleLeaseTerm('Dưới 3 tháng')">Dưới 3 tháng</button>
                            <button type="button" class="adv-opt-pill" [class.active]="isLeaseTermSelected('3 - 6 tháng')" (click)="toggleLeaseTerm('3 - 6 tháng')">3 - 6 tháng</button>
                            <button type="button" class="adv-opt-pill" [class.active]="isLeaseTermSelected('6 - 12 tháng')" (click)="toggleLeaseTerm('6 - 12 tháng')">6 - 12 tháng</button>
                            <button type="button" class="adv-opt-pill" [class.active]="isLeaseTermSelected('Trên 1 năm')" (click)="toggleLeaseTerm('Trên 1 năm')">Trên 1 năm</button>
                          </div>
                        </div>

                        <!-- Thời gian dự kiến bắt đầu ở -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Thời gian dự kiến bắt đầu ở
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.moveInTime === 'All'" (click)="filters.moveInTime = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.moveInTime === 'Ở ngay'" (click)="filters.moveInTime = 'Ở ngay'; onFilterChange()">Vào ở ngay</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.moveInTime === 'Trong tháng này'" (click)="filters.moveInTime = 'Trong tháng này'; onFilterChange()">Trong tháng này</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.moveInTime === 'Tháng tới'" (click)="filters.moveInTime = 'Tháng tới'; onFilterChange()">Tháng tới</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.moveInTime === 'Linh hoạt'" (click)="filters.moveInTime = 'Linh hoạt'; onFilterChange()">Linh hoạt</button>
                          </div>
                        </div>

                      </div>
                    </div>

                    <!-- SECTION 4: TIÊU CHÍ VỀ BẠN Ở GHÉP & LỐI SỐNG -->
                    <div class="adv-section-block mt-4">
                      <div class="section-title-with-toggle">
                        <div class="d-flex align-items-center gap-2">
                          <span class="section-badge-num">4</span>
                          <span class="section-main-heading">Tiêu chí về bạn ở ghép & Lối sống sinh hoạt</span>
                        </div>
                      </div>

                      <div class="adv-inputs-grid-3">
                        
                        <!-- Tính cách -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            Tính cách
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.personality === 'All'" (click)="filters.personality = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.personality === 'Hướng nội'" (click)="filters.personality = 'Hướng nội'; onFilterChange()">Hướng nội (Yên tĩnh)</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.personality === 'Hướng ngoại'" (click)="filters.personality = 'Hướng ngoại'; onFilterChange()">Hướng ngoại (Năng động)</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.personality === 'Hòa đồng'" (click)="filters.personality = 'Hòa đồng'; onFilterChange()">Hòa đồng linh hoạt</button>
                          </div>
                        </div>

                        <!-- Giấc ngủ -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            Thói quen dậy sớm / ngủ muộn
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.sleepLate === null" (click)="filters.sleepLate = null; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.sleepLate === false" (click)="filters.sleepLate = false; onFilterChange()">Dậy sớm / Ngủ sớm (Trước 23h)</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.sleepLate === true" (click)="filters.sleepLate = true; onFilterChange()">Cú đêm / Thức khuya (Sau 0h)</button>
                          </div>
                        </div>

                        <!-- Hút thuốc -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="8" x2="18" y2="8.01"/><path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/></svg>
                            Có hút thuốc không?
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.smoke === null" (click)="filters.smoke = null; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.smoke === false" (click)="filters.smoke = false; onFilterChange()">Không hút thuốc lá / vape</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.smoke === true" (click)="filters.smoke = true; onFilterChange()">Có hút thuốc</button>
                          </div>
                        </div>

                        <!-- Thú cưng -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="15" r="4"/><circle cx="6.5" cy="9.5" r="2"/><circle cx="17.5" cy="9.5" r="2"/></svg>
                            Có nuôi thú cưng không?
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.hasPet === null" (click)="filters.hasPet = null; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.hasPet === true" (click)="filters.hasPet = true; onFilterChange()">Thú cưng OK (Cho phép/Nuôi)</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.hasPet === false" (click)="filters.hasPet = false; onFilterChange()">Không nuôi thú cưng</button>
                          </div>
                        </div>

                        <!-- Nấu ăn -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                            Có thường xuyên nấu ăn không?
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.cookFrequency === 'All'" (click)="filters.cookFrequency = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.cookFrequency === 'Thường xuyên'" (click)="filters.cookFrequency = 'Thường xuyên'; onFilterChange()">Thường xuyên nấu ăn</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.cookFrequency === 'Thỉnh thoảng'" (click)="filters.cookFrequency = 'Thỉnh thoảng'; onFilterChange()">Thỉnh thoảng nấu</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.cookFrequency === 'Không nấu'" (click)="filters.cookFrequency = 'Không nấu'; onFilterChange()">Không nấu ăn (Ăn ngoài)</button>
                          </div>
                        </div>

                        <!-- Đưa bạn bè / người yêu về -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            Có thường xuyên đưa bạn bè/người yêu về không?
                          </label>
                          <div class="adv-pill-options-wrap">
                            <button type="button" class="adv-opt-pill" [class.active]="filters.inviteFriends === 'All'" (click)="filters.inviteFriends = 'All'; onFilterChange()">Tất cả</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.inviteFriends === 'Có thể dẫn về'" (click)="filters.inviteFriends = 'Có thể dẫn về'; onFilterChange()">Thoải mái dẫn về</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.inviteFriends === 'Hạn chế'" (click)="filters.inviteFriends = 'Hạn chế'; onFilterChange()">Hạn chế / Báo trước</button>
                            <button type="button" class="adv-opt-pill" [class.active]="filters.inviteFriends === 'Không dẫn về'" (click)="filters.inviteFriends = 'Không dẫn về'; onFilterChange()">Không dẫn về phòng</button>
                          </div>
                        </div>

                        <!-- Quê quán -->
                        <div class="adv-card">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/></svg>
                            Quê quán / Nơi ở gốc (Không bắt buộc)
                          </label>
                          <input 
                            type="text" 
                            class="adv-input-text" 
                            [(ngModel)]="filters.hometown" 
                            (input)="onFilterChange()" 
                            placeholder="Ví dụ: Nam Định, Nghệ An, Hải Phòng..." />
                        </div>

                        <!-- Tiêu chí khác / Ghi chú -->
                        <div class="adv-card" style="grid-column: span 2;">
                          <label class="adv-label">
                            <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Sở thích hoặc tiêu chí mong muốn khác
                          </label>
                          <input 
                            type="text" 
                            class="adv-input-text" 
                            [(ngModel)]="filters.otherCriteria" 
                            (input)="onFilterChange()" 
                            placeholder="Ví dụ: Thích thể thao, Chơi game, Giữ vệ sinh chung, Thích nghe nhạc..." />
                        </div>

                      </div>
                    </div>

                  </div>

                  <div class="adv-footer mt-4">
                    <button type="button" class="btn-adv-reset" (click)="resetAdvancedFilters()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      <span>Đặt lại tiêu chí chi tiết</span>
                    </button>
                    <button type="button" class="btn-adv-apply" (click)="showAdvancedFilter = false; fetchPublicPosts()">
                      <span>Áp Dụng Tiêu Chí ({{ activeAdvancedFilterCount() }})</span>
                    </button>
                  </div>

                </div>
              }

              <!-- Sub-bar for Quick Chips & Results Summary -->
              <div class="filter-sub-bar mt-3">
                <div class="filter-chips-list">
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasRoom === true" 
                    (click)="setQuickRoomFilter(true)">
                    Đã có phòng
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasRoom === false" 
                    (click)="setQuickRoomFilter(false)">
                    Tìm phòng cùng
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.smoke === false" 
                    (click)="setQuickSmokeFilter(false)">
                    Không hút thuốc
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.sleepLate === false" 
                    (click)="setQuickSleepFilter(false)">
                    Ngủ sớm
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasPet === true" 
                    (click)="setQuickPetFilter(true)">
                    Thú cưng OK
                  </button>
                </div>

                <div class="filter-summary-actions">
                  <span class="results-count-text">Tìm thấy <strong>{{ publicPosts().length }}</strong> bài đăng ở ghép</span>
                  <button class="btn-reset-pill" (click)="resetFilters()" title="Đặt lại bộ lọc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    <span>Đặt lại</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Posts List Feed Grid -->
            @if (isBoardLoading()) {
              <div class="loading-state-sky text-center py-5">
                <div class="spinner-sky"></div>
                <p class="mt-3 font-semibold text-slate-600">Đang tải danh sách bài đăng tìm người ở ghép mới nhất...</p>
              </div>
            } @else if (publicPosts().length === 0) {
              <div class="empty-state-sky text-center py-5">
                <div class="empty-feed-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h3>Chưa có bài đăng nào phù hợp</h3>
                <p class="text-muted">Không tìm thấy bài đăng ở ghép nào phù hợp với bộ lọc hiện tại của bạn.</p>
                <button (click)="resetFilters()" class="btn btn-outline-sky mt-2">Xóa bộ lọc & Xem tất cả</button>
              </div>
            } @else {
              <div class="posts-board-grid">
                @for (post of publicPosts(); track post.id) {
                  <div class="post-card-item" (click)="openPostModal(post)">
                    
                    <!-- Post Image Preview -->
                    <div class="post-card-thumb">
                      @if (post.imageUrl) {
                        <img [src]="getImageUrl(post.imageUrl)" alt="Ảnh phòng trọ" />
                      } @else {
                        <div class="post-card-thumb-placeholder">
                          <svg class="placeholder-svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <span class="placeholder-text">ZHome Ghép Trọ</span>
                        </div>
                      }
                      <span class="room-status-badge" [class.badge-has-room]="post.hasRoom" [class.badge-no-room]="!post.hasRoom">
                        <svg class="mono-badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path *ngIf="post.hasRoom" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <circle *ngIf="!post.hasRoom" cx="11" cy="11" r="8"/>
                          <line *ngIf="!post.hasRoom" x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <span>{{ post.hasRoom ? 'Đã có phòng' : 'Tìm phòng cùng' }}</span>
                      </span>
                    </div>

                    <div class="post-card-content">
                      <div class="post-title-row">
                        <span class="gender-pill" [class.male]="post.gender === 'Male'" [class.female]="post.gender === 'Female'">
                          <svg class="mono-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span>{{ post.gender === 'Male' ? 'Nam' : 'Nữ' }}</span>
                        </span>
                        <h3 class="post-card-title">{{ post.title || 'Tìm bạn sinh viên ở ghép phòng trọ giá tốt' }}</h3>
                      </div>

                      <div class="post-meta-details mt-2">
                        @if (post.university) {
                          <p class="meta-row">
                            <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </svg>
                            <strong>{{ post.university }}</strong>
                          </p>
                        }
                        @if (post.address) {
                          <p class="meta-row">
                            <svg class="meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>{{ post.address }}</span>
                          </p>
                        }
                        <div class="price-showcase-box mt-2">
                          <span class="price-lbl">Ngân sách:</span>
                          <strong class="price-val">{{ (post.budgetMin || post.budgetMax || 0) | number:'1.0-0' }}đ</strong>
                          <span class="price-unit">/người/tháng</span>
                        </div>
                      </div>

                      <!-- Habits tags with minimal monochrome icons -->
                      <div class="habits-tags-row mt-3">
                        <span class="h-tag" [class.h-tag-active]="post.sleepLate">
                          <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path *ngIf="post.sleepLate" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            <circle *ngIf="!post.sleepLate" cx="12" cy="12" r="5"/>
                          </svg>
                          <span>{{ post.sleepLate ? 'Ngủ muộn' : 'Ngủ sớm' }}</span>
                        </span>

                        <span class="h-tag" [class.h-tag-danger]="post.smoke">
                          <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="8" x2="18" y2="8.01"/>
                            <path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/>
                          </svg>
                          <span>{{ post.smoke ? 'Có hút thuốc' : 'Không thuốc' }}</span>
                        </span>

                        <span class="h-tag" [class.h-tag-warning]="post.hasPet">
                          <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="15" r="4"/>
                            <circle cx="6.5" cy="9.5" r="2"/>
                            <circle cx="17.5" cy="9.5" r="2"/>
                          </svg>
                          <span>{{ post.hasPet ? 'Thú cưng OK' : 'Không thú' }}</span>
                        </span>
                      </div>

                      <div class="post-card-footer mt-3">
                        <div class="author-info d-flex align-items-center gap-2">
                          <div class="author-mini-avatar">{{ post.fullName ? post.fullName.charAt(0).toUpperCase() : 'U' }}</div>
                          <div class="author-text-meta">
                            <span class="author-name">{{ post.fullName }}</span>
                            <span class="post-time">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                          </div>
                        </div>
                        <button class="btn btn-action-sky btn-sm" (click)="openPostModal(post); $event.stopPropagation()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span>Xem & Liên Hệ</span>
                        </button>
                      </div>
                    </div>

                  </div>
                }
              </div>
            }

          </div>
        }

        <!-- 2. TAB: CREATE / EDIT ROOMMATE POST FORM -->
        @if (activeTab() === 'post') {
          <div class="post-form-card-vip animate-fade-in max-w-850 margin-auto">
            <div class="form-header-title text-center mb-4">
              <div class="form-badge-top">ĐĂNG TIN MIỄN PHÍ</div>
              <h2>Đăng Tin Tìm Bạn Ở Ghép & Nhận Diện Phòng Trọ</h2>
              <p class="text-muted text-sm max-w-600 mx-auto">
                Tự động đồng bộ các thông tin từ phòng trọ bạn đang ở trên ZHome và thiết lập tiêu chí bạn cùng phòng chuẩn xác nhất!
              </p>
            </div>

            <!-- DETECTED RENTED ROOM BANNER -->
            @if (myRentalInfo()) {
              <div class="detected-room-banner mb-4 animate-scale-up">
                <div class="detected-room-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div class="detected-room-info flex-grow-1">
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <span class="detected-tag">PHÒNG TRỌ ĐANG THUÊ TRÊN ZHOME</span>
                    <span class="detected-room-code">Phòng {{ myRentalInfo().roomNumber }}</span>
                    <span class="badge-status-green">Hợp đồng đang hiệu lực</span>
                  </div>
                  <h4 class="detected-room-title m-0">{{ myRentalInfo().propertyTitle }}</h4>
                  <p class="detected-room-addr m-0 text-muted">
                    <svg class="mono-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ myRentalInfo().propertyAddress }}
                  </p>
                  <div class="detected-room-stats-chips mt-2">
                    <span class="room-stat-chip">💰 Giá phòng: <strong>{{ (myRentalInfo().roomPrice || 0) | number:'1.0-0' }} đ/tháng</strong></span>
                    @if (myRentalInfo().latestBill?.electricityFee) {
                      <span class="room-stat-chip">⚡ Điện: <strong>{{ (myRentalInfo().latestBill.electricityFee || 0) | number:'1.0-0' }} đ</strong></span>
                    }
                    @if (myRentalInfo().latestBill?.waterFee) {
                      <span class="room-stat-chip">💧 Nước: <strong>{{ (myRentalInfo().latestBill.waterFee || 0) | number:'1.0-0' }} đ</strong></span>
                    }
                    @if (myRentalInfo().amenities?.length) {
                      <span class="room-stat-chip">🛋️ Có sẵn {{ myRentalInfo().amenities.length }} tiện nghi</span>
                    }
                  </div>
                </div>
                <div class="detected-room-action">
                  <button type="button" class="btn-sync-room" (click)="applyRentedRoomInfo()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>Áp dụng thông tin phòng này</span>
                  </button>
                </div>
              </div>
            }

            <form (ngSubmit)="submitPostForm()" class="mt-4">
              
              <!-- SECTION 1: THÔNG TIN BÀI ĐĂNG & PHÒNG TRỌ -->
              <div class="form-section-divider">
                <span class="section-num">1</span>
                <span>Thông tin bài đăng & Trạng thái phòng trọ</span>
              </div>

              <!-- Title -->
              <div class="form-group mb-3">
                <label for="postTitle" class="form-label-bold">Tiêu đề bài đăng <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  id="postTitle" 
                  name="title" 
                  [(ngModel)]="postForm.title" 
                  required 
                  class="form-control-modern" 
                  placeholder="Ví dụ: Tìm bạn ở ghép phòng 25m2 gác lửng, ban công thoáng mát, đầy đủ tiện nghi..." />
              </div>

              <!-- Room Status Toggle -->
              <div class="form-group mb-3">
                <label class="form-label-bold">Tình trạng phòng trọ hiện tại <span class="text-danger">*</span></label>
                <div class="room-status-toggle-grid">
                  <div 
                    class="room-status-opt-card" 
                    [class.active]="postForm.hasRoom" 
                    (click)="postForm.hasRoom = true">
                    <div class="status-opt-radio">
                      <span class="radio-dot" *ngIf="postForm.hasRoom"></span>
                    </div>
                    <div class="status-opt-text">
                      <strong>🏢 Đã có sẵn phòng trọ</strong>
                      <span>Bạn đang ở trọ và muốn tìm bạn vào ở cùng để chia sẻ tiền phòng</span>
                    </div>
                  </div>

                  <div 
                    class="room-status-opt-card" 
                    [class.active]="!postForm.hasRoom" 
                    (click)="postForm.hasRoom = false">
                    <div class="status-opt-radio">
                      <span class="radio-dot" *ngIf="!postForm.hasRoom"></span>
                    </div>
                    <div class="status-opt-text">
                      <strong>🔍 Chưa có phòng (Tìm bạn ghép cùng)</strong>
                      <span>Bạn muốn tìm bạn có cùng nhu cầu để cùng đi tìm và thuê phòng mới</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Address: District, Ward, Street/Detail -->
              <div class="form-grid-3 mb-2">
                <div class="form-group">
                  <label class="form-label-bold">Quận / Huyện <span class="text-danger">*</span></label>
                  <select name="postDistrict" [(ngModel)]="postAddressModel.district" (change)="onPostDistrictChange()" class="form-control-modern">
                    <option value="">-- Chọn Quận / Huyện --</option>
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

                <div class="form-group">
                  <label class="form-label-bold">
                    {{ postAddressModel.district ? (getSelectedDistrictType(postAddressModel.district) === 'Quận' ? 'Phường' : 'Xã / Thị trấn') : 'Phường / Xã' }} 
                    <span class="text-danger">*</span>
                  </label>
                  <select name="postWard" [(ngModel)]="postAddressModel.ward" (change)="onPostWardChange()" [disabled]="!postAddressModel.district" class="form-control-modern">
                    <option value="">{{ getWardPlaceholder(postAddressModel.district) }}</option>
                    @for (w of postWards(); track w.id) {
                      <option [value]="w.name">{{ w.type ? (w.type + ' ' + w.name) : w.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label-bold">Tên đường / Số nhà chi tiết</label>
                  <input 
                    type="text" 
                    name="postStreet" 
                    [(ngModel)]="postAddressModel.street" 
                    (input)="onPostStreetChange()" 
                    class="form-control-modern" 
                    placeholder="Ví dụ: Số 12 Ngõ 8 Tân Xã..." />
                </div>
              </div>

              <!-- Live formatted address preview -->
              <div class="address-preview-badge mb-3" *ngIf="postForm.address">
                <div class="address-preview-left">
                  <svg class="preview-map-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span class="preview-label">Địa chỉ sẽ hiển thị:</span>
                </div>
                <div class="preview-val">{{ postForm.address }}, Hà Nội</div>
              </div>

              <!-- Contact Info: Phone & Zalo -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label for="postPhone" class="form-label-bold">Số điện thoại liên hệ <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    id="postPhone" 
                    name="contactPhone" 
                    [(ngModel)]="postForm.contactPhone" 
                    required 
                    class="form-control-modern" 
                    placeholder="Ví dụ: 0987654321" />
                </div>

                <div class="form-group">
                  <label for="postZalo" class="form-label-bold">Số điện thoại Zalo</label>
                  <input 
                    type="text" 
                    id="postZalo" 
                    name="contactZalo" 
                    [(ngModel)]="postForm.contactZalo" 
                    class="form-control-modern" 
                    placeholder="Ví dụ: 0987654321 (để trống nếu giống SĐT)" />
                </div>
              </div>

              <!-- Demographics: Gender, Age, Occupation, Hometown -->
              <div class="form-grid-4-demographics mb-3">
                <div class="form-group">
                  <label class="form-label-bold">Giới tính của bạn</label>
                  <select name="gender" [(ngModel)]="postForm.gender" class="form-control-modern">
                    <option value="Male">Bạn Nam</option>
                    <option value="Female">Bạn Nữ</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label-bold">Độ tuổi của bạn</label>
                  <select name="ageRange" [(ngModel)]="postForm.ageRange" class="form-control-modern">
                    <option value="18-22">18 - 22 tuổi (Sinh viên)</option>
                    <option value="23-27">23 - 27 tuổi</option>
                    <option value="28-35">28 - 35 tuổi</option>
                    <option value="35+">Trên 35 tuổi</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label-bold">Nghề nghiệp của bạn</label>
                  <select name="occupation" [(ngModel)]="postForm.occupation" class="form-control-modern">
                    <option value="Sinh viên">Sinh viên</option>
                    <option value="Người đi làm">Người đi làm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label-bold">Quê quán (Không bắt buộc)</label>
                  <input 
                    type="text" 
                    name="hometown" 
                    [(ngModel)]="postForm.hometown" 
                    class="form-control-modern" 
                    placeholder="Ví dụ: Nghệ An, Hải Phòng..." />
                </div>
              </div>

              <!-- SECTION 2: CHI PHÍ & THỜI HẠN THUÊ (GOM 4 Ô ĐỨNG CẠNH NHAU) -->
              <div class="form-section-divider mt-4">
                <span class="section-num">2</span>
                <span>Ngân sách, Số người, Thời gian ở & Tiền điện nước</span>
              </div>

              <!-- 4 Cards Side-by-Side: Ngân sách/người, Số người/phòng, Bắt đầu ở, Thời gian thuê -->
              <div class="cost-terms-grid-4 mb-3">
                
                <!-- 1. Ngân sách tối đa / người (chia theo đầu người) -->
                <div class="cost-term-card">
                  <label class="cost-term-label">
                    <span class="cost-term-icon text-sky">$</span>
                    Ngân sách / người <span class="text-danger">*</span>
                  </label>
                  <div class="input-with-unit-post">
                    <input 
                      type="number" 
                      name="budgetPerPerson" 
                      [(ngModel)]="postForm.budgetPerPerson" 
                      required 
                      class="form-control-modern" 
                      placeholder="Ví dụ: 1500000" />
                    <span class="unit-badge">đ/người</span>
                  </div>

                  <!-- Live Formatted Money Preview -->
                  <div class="live-money-preview-badge mt-1" *ngIf="postForm.budgetPerPerson">
                    <span class="preview-coin-icon">💵</span>
                    <span class="preview-money-val">{{ formatCurrencyLive(postForm.budgetPerPerson) }} / người / tháng</span>
                  </div>

                  <div class="quick-chip-row mt-2">
                    <button type="button" class="btn-micro-chip" (click)="postForm.budgetPerPerson = 1000000">1.0tr</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.budgetPerPerson = 1500000">1.5tr</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.budgetPerPerson = 2000000">2.0tr</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.budgetPerPerson = 2500000">2.5tr</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.budgetPerPerson = 3000000">3.0tr</button>
                  </div>
                </div>

                <!-- 2. Số người / phòng -->
                <div class="cost-term-card">
                  <label class="cost-term-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Số người / phòng
                  </label>
                  <div class="input-with-unit-post">
                    <input 
                      type="number" 
                      min="1" 
                      max="20" 
                      name="occupantsPerRoom" 
                      [(ngModel)]="postForm.occupantsPerRoom" 
                      class="form-control-modern" 
                      placeholder="Ví dụ: 2" />
                    <span class="unit-badge">người/phòng</span>
                  </div>
                  <div class="quick-chip-row mt-2">
                    <button type="button" class="btn-micro-chip" (click)="postForm.occupantsPerRoom = 1">1 người</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.occupantsPerRoom = 2">2 người</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.occupantsPerRoom = 3">3 người</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.occupantsPerRoom = 4">4 người</button>
                  </div>
                </div>

                <!-- 3. Thời gian dự kiến bắt đầu ở -->
                <div class="cost-term-card">
                  <label class="cost-term-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Dự kiến bắt đầu ở
                  </label>
                  <select name="moveInTime" [(ngModel)]="postForm.moveInTime" class="form-control-modern">
                    <option value="Ở ngay">Vào ở ngay</option>
                    <option value="Trong tháng này">Trong tháng này</option>
                    <option value="Tháng tới">Tháng tới</option>
                    <option value="Linh hoạt">Linh hoạt thỏa thuận</option>
                  </select>
                  <span class="cost-term-hint mt-2">Thời điểm có thể dọn phòng</span>
                </div>

                <!-- 4. Thời gian muốn cho thuê / ở ghép (Có thể chọn nhiều) -->
                <div class="cost-term-card">
                  <label class="cost-term-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Thời hạn thuê (chọn nhiều)
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button 
                      type="button" 
                      class="adv-opt-pill" 
                      [class.active]="isPostLeaseTermSelected('Dưới 3 tháng')" 
                      (click)="togglePostLeaseTerm('Dưới 3 tháng')">
                      &lt; 3th
                    </button>
                    <button 
                      type="button" 
                      class="adv-opt-pill" 
                      [class.active]="isPostLeaseTermSelected('3 - 6 tháng')" 
                      (click)="togglePostLeaseTerm('3 - 6 tháng')">
                      3 - 6th
                    </button>
                    <button 
                      type="button" 
                      class="adv-opt-pill" 
                      [class.active]="isPostLeaseTermSelected('6 - 12 tháng')" 
                      (click)="togglePostLeaseTerm('6 - 12 tháng')">
                      6 - 12th
                    </button>
                    <button 
                      type="button" 
                      class="adv-opt-pill" 
                      [class.active]="isPostLeaseTermSelected('Trên 1 năm')" 
                      (click)="togglePostLeaseTerm('Trên 1 năm')">
                      &gt; 1 năm
                    </button>
                  </div>
                </div>

              </div>

              <!-- Electricity, Water, Service fees (if hasRoom is true) -->
              <div class="form-grid-3 mb-3" *ngIf="postForm.hasRoom">
                
                <!-- Tiền điện -->
                <div class="form-group">
                  <label class="form-label-bold">Tiền điện (đ/kWh)</label>
                  <div class="input-with-unit-post">
                    <input 
                      type="number" 
                      name="electricityFee" 
                      [(ngModel)]="postForm.electricityFee" 
                      class="form-control-modern" 
                      placeholder="Ví dụ: 3500" />
                    <span class="unit-badge">đ/kWh</span>
                  </div>
                  <div class="live-money-preview-badge mt-1" *ngIf="postForm.electricityFee">
                    <span class="preview-coin-icon">⚡</span>
                    <span class="preview-money-val">{{ formatCurrencyLive(postForm.electricityFee) }} / kWh</span>
                  </div>
                  <div class="quick-chip-row mt-1">
                    <button type="button" class="btn-micro-chip" (click)="postForm.electricityFee = 3000">3.000đ</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.electricityFee = 3500">3.500đ</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.electricityFee = 3800">3.800đ</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.electricityFee = 4000">4.000đ</button>
                  </div>
                </div>

                <!-- Tiền nước -->
                <div class="form-group">
                  <label class="form-label-bold">Tiền nước</label>
                  <div class="d-flex gap-2">
                    <div class="input-with-unit-post flex-grow-1">
                      <input 
                        type="number" 
                        name="waterFee" 
                        [(ngModel)]="postForm.waterFee" 
                        class="form-control-modern" 
                        placeholder="Ví dụ: 50000" />
                      <span class="unit-badge">đ</span>
                    </div>
                    <select name="waterFeeType" [(ngModel)]="postForm.waterFeeType" class="form-control-modern" style="width: 140px; flex-shrink: 0;">
                      <option value="per_person">/người/tháng</option>
                      <option value="per_m3">/khối (m³)</option>
                    </select>
                  </div>
                  <div class="live-money-preview-badge mt-1" *ngIf="postForm.waterFee">
                    <span class="preview-coin-icon">💧</span>
                    <span class="preview-money-val">{{ formatCurrencyLive(postForm.waterFee) }} {{ postForm.waterFeeType === 'per_m3' ? '/ khối (m³)' : '/ người / tháng' }}</span>
                  </div>
                  <div class="quick-chip-row mt-1">
                    <button type="button" class="btn-micro-chip" (click)="postForm.waterFee = 30000">30k</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.waterFee = 50000">50k</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.waterFee = 80000">80k</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.waterFee = 100000">100k</button>
                  </div>
                </div>

                <!-- Tiền dịch vụ -->
                <div class="form-group">
                  <label class="form-label-bold">Tiền dịch vụ (Wifi, rác, vệ sinh)</label>
                  <div class="input-with-unit-post">
                    <input 
                      type="number" 
                      name="serviceFee" 
                      [(ngModel)]="postForm.serviceFee" 
                      class="form-control-modern" 
                      placeholder="Ví dụ: 50000" />
                    <span class="unit-badge">đ/người</span>
                  </div>
                  <div class="live-money-preview-badge mt-1" *ngIf="postForm.serviceFee">
                    <span class="preview-coin-icon">🧹</span>
                    <span class="preview-money-val">{{ formatCurrencyLive(postForm.serviceFee) }} / người / tháng</span>
                  </div>
                  <div class="quick-chip-row mt-1">
                    <button type="button" class="btn-micro-chip" (click)="postForm.serviceFee = 30000">30k</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.serviceFee = 50000">50k</button>
                    <button type="button" class="btn-micro-chip" (click)="postForm.serviceFee = 100000">100k</button>
                  </div>
                </div>

              </div>

              <!-- SECTION 3: TIỆN NGHI PHÒNG TRỌ & MÔI TRƯỜNG XUNG QUANH -->
              <div class="form-section-divider mt-4">
                <span class="section-num">3</span>
                <span>Tiện nghi phòng trọ & Môi trường xung quanh</span>
              </div>

              <!-- Amenities with toggle all -->
              <div class="mb-4">
                <div class="section-title-with-toggle mb-2">
                  <span class="sub-sec-heading">🛋️ Tiện nghi phòng trọ (18 tiện ích)</span>
                  <button type="button" class="toggle-all-btn" [class.active]="areAllPostAmenitiesSelected()" (click)="toggleAllPostAmenities()">
                    <span class="chk-box-mini">{{ areAllPostAmenitiesSelected() ? '✓' : '' }}</span>
                    <span>TẤT CẢ</span>
                  </button>
                </div>
                <div class="amenities-grid-vip">
                  @for (item of amenityList; track item.key) {
                    <div 
                      class="amenity-card-item" 
                      [class.checked]="isPostAmenitySelected(item.label)" 
                      (click)="togglePostAmenity(item.label)">
                      <div class="custom-checkbox-box">
                        @if (isPostAmenitySelected(item.label)) {
                          <span class="chk-mark">✓</span>
                        }
                      </div>
                      <span class="amenity-label-text">{{ item.label }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Surroundings with toggle all -->
              <div class="mb-3">
                <div class="section-title-with-toggle mb-2">
                  <span class="sub-sec-heading">🌳 Môi trường xung quanh</span>
                  <button type="button" class="toggle-all-btn" [class.active]="areAllPostSurroundingsSelected()" (click)="toggleAllPostSurroundings()">
                    <span class="chk-box-mini">{{ areAllPostSurroundingsSelected() ? '✓' : '' }}</span>
                    <span>TẤT CẢ</span>
                  </button>
                </div>
                <div class="amenities-grid-vip surroundings-grid">
                  @for (item of surroundingList; track item.key) {
                    <div 
                      class="amenity-card-item" 
                      [class.checked]="isPostSurroundingSelected(item.label)" 
                      (click)="togglePostSurrounding(item.label)">
                      <div class="custom-checkbox-box">
                        @if (isPostSurroundingSelected(item.label)) {
                          <span class="chk-mark">✓</span>
                        }
                      </div>
                      <span class="amenity-label-text">{{ item.label }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- SECTION 4: TIÊU CHÍ VỀ BẠN Ở GHÉP & LỐI SỐNG -->
              <div class="form-section-divider mt-4">
                <span class="section-num">4</span>
                <span>Tiêu chí về bạn ở ghép & Lối sống sinh hoạt</span>
              </div>

              <div class="adv-inputs-grid-3 mb-3">
                
                <!-- Tính cách -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    Tính cách mong muốn
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.personality === 'Hòa đồng'" (click)="postForm.personality = 'Hòa đồng'">Hòa đồng linh hoạt</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.personality === 'Hướng nội'" (click)="postForm.personality = 'Hướng nội'">Hướng nội (Yên tĩnh)</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.personality === 'Hướng ngoại'" (click)="postForm.personality = 'Hướng ngoại'">Hướng ngoại (Năng động)</button>
                  </div>
                </div>

                <!-- Giấc ngủ -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    Thói quen dậy sớm / ngủ muộn
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="!postForm.sleepLate" (click)="postForm.sleepLate = false">Dậy sớm / Ngủ sớm (Trước 23h)</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.sleepLate" (click)="postForm.sleepLate = true">Cú đêm / Thức khuya (Sau 0h)</button>
                  </div>
                </div>

                <!-- Hút thuốc -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="8" x2="18" y2="8.01"/><path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/></svg>
                    Có hút thuốc không?
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="!postForm.smoke" (click)="postForm.smoke = false">Không hút thuốc lá / vape</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.smoke" (click)="postForm.smoke = true">Có hút thuốc</button>
                  </div>
                </div>

                <!-- Thú cưng -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="15" r="4"/><circle cx="6.5" cy="9.5" r="2"/><circle cx="17.5" cy="9.5" r="2"/></svg>
                    Có nuôi thú cưng không?
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="!postForm.hasPet" (click)="postForm.hasPet = false">Không nuôi thú cưng</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.hasPet" (click)="postForm.hasPet = true">Cho phép nuôi / Có thú cưng</button>
                  </div>
                </div>

                <!-- Nấu ăn -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                    Tần suất nấu ăn
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.cookFrequency === 'Thường xuyên'" (click)="postForm.cookFrequency = 'Thường xuyên'">Thường xuyên nấu</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.cookFrequency === 'Thỉnh thoảng'" (click)="postForm.cookFrequency = 'Thỉnh thoảng'">Thỉnh thoảng nấu</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.cookFrequency === 'Không nấu'" (click)="postForm.cookFrequency = 'Không nấu'">Không nấu ăn (Ăn ngoài)</button>
                  </div>
                </div>

                <!-- Đưa bạn bè / người yêu về -->
                <div class="adv-card">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    Đưa bạn bè/người yêu về phòng
                  </label>
                  <div class="adv-pill-options-wrap">
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.inviteFriends === 'Thoải mái'" (click)="postForm.inviteFriends = 'Thoải mái'">Thoải mái dẫn về</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.inviteFriends === 'Hạn chế'" (click)="postForm.inviteFriends = 'Hạn chế'">Hạn chế / Báo trước</button>
                    <button type="button" class="adv-opt-pill" [class.active]="postForm.inviteFriends === 'Không dẫn về'" (click)="postForm.inviteFriends = 'Không dẫn về'">Không dẫn về phòng</button>
                  </div>
                </div>

                <!-- Mục khác: Sở thích hay tiêu chí khác -->
                <div class="adv-card" style="grid-column: 1 / -1;">
                  <label class="adv-label">
                    <svg class="mono-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Sở thích riêng hoặc tiêu chí mong muốn khác
                  </label>
                  <input 
                    type="text" 
                    class="adv-input-text" 
                    [(ngModel)]="postForm.otherCriteria" 
                    name="otherCriteria"
                    placeholder="Ví dụ: Giữ vệ sinh chung sạch sẽ, Thích thể thao/Gym, Yên tĩnh để học bài, Ăn chay, Thích nghe nhạc..." />
                </div>

              </div>

              <!-- SECTION 5: HÌNH ẢNH THỰC TẾ & LỜI GIỚI THIỆU -->
              <div class="form-section-divider mt-4">
                <span class="section-num">5</span>
                <span>Hình ảnh phòng trọ (Chọn nhiều ảnh) & Lời giới thiệu chi tiết</span>
              </div>

              <!-- Multi-Image Upload -->
              <div class="form-group mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label-bold mb-0">Ảnh thực tế phòng trọ (Tối đa 10 ảnh)</label>
                  <span class="text-xs text-muted">Đã chọn: {{ postImages.length }}/10 ảnh</span>
                </div>

                <div class="multi-image-upload-wrapper">
                  <input type="file" multiple accept="image/*" (change)="onPostImagesSelected($event)" class="file-input-hidden" id="postMultiImageFile" />
                  
                  @if (postImages.length > 0) {
                    <div class="post-images-grid">
                      @for (img of postImages; track $index) {
                        <div class="image-thumb-card">
                          <img [src]="getImageUrl(img)" alt="Ảnh phòng" />
                          <span class="thumb-cover-badge" *ngIf="$index === 0">Ảnh chính</span>
                          <button type="button" class="btn-delete-thumb" (click)="removePostImage($index, $event)" title="Xóa ảnh này">✕</button>
                        </div>
                      }
                      
                      @if (postImages.length < 10) {
                        <label for="postMultiImageFile" class="image-add-more-card" title="Chọn thêm ảnh">
                          <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          <span>Thêm ảnh</span>
                        </label>
                      }
                    </div>
                  } @else {
                    <label for="postMultiImageFile" class="image-upload-dropzone-modern">
                      <div class="dropzone-center-content">
                        <svg class="upload-mono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <strong>Tải lên hình ảnh phòng trọ của bạn</strong>
                        <span>Hỗ trợ chọn cùng lúc <strong>nhiều ảnh</strong> (JPG, PNG, WEBP tối đa 10 ảnh)</span>
                        <span class="btn-browse-fake mt-2">Bấm để chọn nhiều ảnh</span>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Description / Notes -->
              <div class="form-group mb-4">
                <label for="postDesc" class="form-label-bold">Lời nhắn thêm & Giới thiệu bản thân / phòng trọ</label>
                <textarea 
                  id="postDesc" 
                  name="description" 
                  rows="4" 
                  [(ngModel)]="postForm.description" 
                  class="form-control-modern" 
                  placeholder="Ghi chú thêm về giờ giấc, thói quen, mong muốn về bạn cùng phòng hoặc tiện ích đặc biệt của phòng..."></textarea>
              </div>

              <div class="submit-btn-wrapper text-center">
                <button type="submit" [disabled]="isSubmittingPost()" class="btn-submit-post-vip">
                  @if (isSubmittingPost()) {
                    <div class="spinner-inline"></div>
                    <span>Đang đăng tin...</span>
                  } @else {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    <span>Hoàn Tất & Đăng Tin Ngay</span>
                  }
                </button>
              </div>

            </form>
          </div>
        }

        <!-- 3. TAB: AI MATCHMAKER -->
        @if (activeTab() === 'matches') {
          <div class="matches-container animate-fade-in">
            
            <div class="ai-banner-card mb-4">
              <div class="ai-banner-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <div class="ai-banner-content">
                <div class="ai-badge-top">THUẬT TOÁN AI MATCHMAKER</div>
                <h2>Gợi Ý Bạn Cùng Phòng Tương Thích Nhất</h2>
                <p>Hệ thống tự động phân tích và so khớp độ tương thích về lối sống (giờ ngủ, hút thuốc, thú cưng, quê quán, mức ngân sách) để tìm ra bạn sinh viên phù hợp nhất với bạn!</p>
              </div>
            </div>

            @if (isMatchingLoading()) {
              <div class="loading-state-sky text-center py-5">
                <div class="spinner-sky"></div>
                <p class="mt-3 font-semibold text-slate-600">ZHome AI đang tính toán phần trăm khớp lối sống...</p>
              </div>
            } @else if (matchSuggestions().length === 0) {
              <div class="empty-state-sky text-center py-5">
                <div class="empty-feed-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6.2 5 7.4V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.6c3-1.2 5-4.1 5-7.4a8 8 0 0 0-8-8z"/>
                  </svg>
                </div>
                <h3>Chưa có bài đăng gợi ý nào</h3>
                <p class="text-muted">Bạn hãy đăng tin ở ghép trước để AI có đủ dữ liệu so sánh và tìm bạn ghép phù hợp nhất nhé!</p>
                <button (click)="setTab('post')" class="btn-submit-post-vip mt-3">Đăng tin tìm bạn ngay</button>
              </div>
            } @else {
              <div class="matches-grid">
                @for (candidate of matchSuggestions(); track candidate.studentId) {
                  <div class="interactive-card candidate-card-sky" (click)="openPostModal(candidate)">
                    
                    <div class="candidate-header-bar">
                      <div class="compat-ring-sky" [class.high-compat]="candidate.matchPercentage >= 80">
                        <span class="compat-val">{{ candidate.matchPercentage }}%</span>
                        <span class="compat-lbl">Match</span>
                      </div>
                      <div class="candidate-name-box">
                        <h3 class="candidate-person-name">{{ candidate.fullName }}</h3>
                        <p class="candidate-person-sub">Quê: {{ candidate.hometown || 'Chưa rõ' }} • {{ candidate.university || 'Sinh viên' }}</p>
                      </div>
                    </div>

                    <div class="divider-light my-2"></div>

                    <div class="candidate-habits-summary">
                      <span class="h-tag" [class.h-tag-active]="candidate.sleepLate">
                        <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path *ngIf="candidate.sleepLate" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                          <circle *ngIf="!candidate.sleepLate" cx="12" cy="12" r="5"/>
                        </svg>
                        <span>{{ candidate.sleepLate ? 'Ngủ muộn' : 'Ngủ sớm' }}</span>
                      </span>
                      <span class="h-tag" [class.h-tag-danger]="candidate.smoke">
                        <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="8" x2="18" y2="8.01"/>
                          <path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/>
                        </svg>
                        <span>{{ candidate.smoke ? 'Hút thuốc' : 'Không thuốc' }}</span>
                      </span>
                      <span class="h-tag" [class.h-tag-warning]="candidate.hasPet">
                        <svg class="mono-tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="15" r="4"/>
                          <circle cx="6.5" cy="9.5" r="2"/>
                        </svg>
                        <span>{{ candidate.hasPet ? 'Thú cưng' : 'Không thú' }}</span>
                      </span>
                    </div>

                    <div class="candidate-budget-range mt-3">
                      <span class="text-xs text-muted">Ngân sách / người:</span>
                      <strong class="text-sky font-bold">{{ (candidate.budgetMin || candidate.budgetMax || 0) | number:'1.0-0' }}đ /người/tháng</strong>
                    </div>

                    <p class="candidate-desc-text mt-2 text-xs text-muted">
                      {{ candidate.description ? (candidate.description | slice:0:90) + '...' : 'Không có lời giới thiệu chi tiết.' }}
                    </p>

                    <button class="btn btn-action-sky btn-block mt-3" (click)="openPostModal(candidate); $event.stopPropagation()">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      <span>Xem Chi Tiết & Liên Hệ</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>

      <!-- REDESIGNED POST DETAIL POPUP MODAL -->
      @if (selectedPost(); as p) {
        @let details = parsePostDetails(p);
        @let images = getPostImages(p);

        <div class="modal-backdrop" (click)="closePostModal()">
          <div class="modal-card max-w-750 post-detail-modal-custom animate-scale-up" (click)="$event.stopPropagation()">
            
            <!-- Modal Header with Badges & Close -->
            <div class="post-modal-header">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="room-status-badge-lg" [class.badge-has-room]="p.hasRoom" [class.badge-no-room]="!p.hasRoom">
                  <svg class="mono-badge-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path *ngIf="p.hasRoom" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <circle *ngIf="!p.hasRoom" cx="11" cy="11" r="8"/>
                    <line *ngIf="!p.hasRoom" x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>{{ p.hasRoom ? 'ĐÃ CÓ PHÒNG SẴN (Tìm người vào ở)' : 'CHƯA CÓ PHÒNG (Tìm người thuê chung)' }}</span>
                </span>
                
                <span class="gender-pill-lg" [class.male]="p.gender === 'Male'" [class.female]="p.gender === 'Female'">
                  <svg class="mono-pill-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>{{ p.gender === 'Male' ? 'Bạn Nam' : 'Bạn Nữ' }}</span>
                </span>
              </div>

              <button (click)="closePostModal()" class="modal-close-btn" title="Đóng cửa sổ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="post-modal-body mt-3">
              
              <!-- 1. Interactive Image Gallery Carousel (If images available) -->
              @if (images.length > 0) {
                <div class="modal-gallery-wrapper mb-3">
                  <div class="gallery-main-img-box">
                    <img [src]="getImageUrl(images[activeModalImgIdx()])" alt="Ảnh phòng trọ" />
                    
                    <!-- Carousel Nav Controls if multiple images -->
                    @if (images.length > 1) {
                      <button type="button" class="carousel-btn prev-btn" (click)="prevModalImg(images.length, $event)" title="Ảnh trước">
                        ‹
                      </button>
                      <button type="button" class="carousel-btn next-btn" (click)="nextModalImg(images.length, $event)" title="Ảnh tiếp theo">
                        ›
                      </button>
                      
                      <div class="gallery-counter-badge">
                        <span>{{ activeModalImgIdx() + 1 }} / {{ images.length }}</span>
                      </div>
                    }
                  </div>

                  <!-- Thumbnails row -->
                  @if (images.length > 1) {
                    <div class="gallery-thumbnails-strip mt-2">
                      @for (img of images; track $index) {
                        <div 
                          class="gallery-thumb-item" 
                          [class.active]="activeModalImgIdx() === $index" 
                          (click)="setModalImg($index, $event)">
                          <img [src]="getImageUrl(img)" alt="Thumbnail" />
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- 2. Post Title -->
              <h2 class="post-detail-main-title">{{ p.title || 'Tìm Bạn Ở Ghép Phòng Trọ' }}</h2>
              
              <!-- 3. Author Information Card -->
              <div class="modal-author-profile-card mb-3">
                <div class="author-avatar-round-lg">{{ p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U' }}</div>
                <div class="author-info-content">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <strong class="author-fullname-text">{{ p.fullName }}</strong>
                    <span class="verified-student-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Xác minh sinh viên</span>
                    </span>
                  </div>
                  
                  <div class="author-meta-pills-row mt-1">
                    <span class="meta-sub-pill" *ngIf="p.university">🏫 {{ p.university }}</span>
                    <span class="meta-sub-pill" *ngIf="p.hometown">🏡 Quê: {{ p.hometown }}</span>
                    <span class="meta-sub-pill" *ngIf="details.bills.occupation">💼 {{ details.bills.occupation }}</span>
                    <span class="meta-sub-pill" *ngIf="details.bills.ageRange">🎂 {{ details.bills.ageRange }}</span>
                  </div>
                </div>
              </div>

              <!-- 4. Key Highlights Metrics Grid (4 Cards) -->
              <div class="modal-metrics-grid mb-3">
                
                <!-- Ngân sách / người -->
                <div class="modal-metric-card budget-card">
                  <div class="metric-icon-box bg-emerald-subtle">
                    <span class="metric-icon-symbol">💵</span>
                  </div>
                  <div class="metric-text-box">
                    <span class="metric-label">Ngân sách / người</span>
                    <strong class="metric-val text-emerald">{{ (p.budgetMin || p.budgetMax || 0) | number:'1.0-0' }}đ <span class="unit-sub">/tháng</span></strong>
                  </div>
                </div>

                <!-- Số người / phòng -->
                <div class="modal-metric-card occupants-card">
                  <div class="metric-icon-box bg-sky-subtle">
                    <span class="metric-icon-symbol">👥</span>
                  </div>
                  <div class="metric-text-box">
                    <span class="metric-label">Số người / phòng</span>
                    <strong class="metric-val text-slate">{{ details.bills.occupants || '2 người' }}</strong>
                  </div>
                </div>

                <!-- Thời hạn thuê -->
                <div class="modal-metric-card lease-card">
                  <div class="metric-icon-box bg-amber-subtle">
                    <span class="metric-icon-symbol">📅</span>
                  </div>
                  <div class="metric-text-box">
                    <span class="metric-label">Thời hạn thuê</span>
                    <strong class="metric-val text-slate">{{ details.bills.leaseTerm || 'Linh hoạt' }}</strong>
                  </div>
                </div>

                <!-- Thời điểm dọn vào -->
                <div class="modal-metric-card movein-card">
                  <div class="metric-icon-box bg-purple-subtle">
                    <span class="metric-icon-symbol">🕒</span>
                  </div>
                  <div class="metric-text-box">
                    <span class="metric-label">Dự kiến dọn vào</span>
                    <strong class="metric-val text-slate">{{ details.bills.moveInTime || 'Vào ở ngay' }}</strong>
                  </div>
                </div>

              </div>

              <!-- 5. Address Card with Google Maps Navigation Link -->
              <div class="modal-address-card mb-3">
                <div class="address-icon-cell">📍</div>
                <div class="address-details-cell">
                  <span class="addr-label">Địa chỉ phòng trọ / Khu vực:</span>
                  <strong class="addr-text">{{ p.address || p.university || 'Khu vực sinh viên, Hà Nội' }}</strong>
                </div>
                <button type="button" class="btn-open-map" (click)="openGoogleMapsSearch(p.address || p.university, $event)" title="Mở bản đồ Google Maps">
                  <span>Xem Bản Đồ ↗</span>
                </button>
              </div>

              <!-- 6. Utility & Living Bills Breakdown (If available) -->
              @if (details.bills.electricity || details.bills.water || details.bills.service) {
                <div class="modal-bills-section mb-3">
                  <h4 class="section-title-clean">⚡ Bảng chi phí điện, nước & dịch vụ</h4>
                  <div class="bills-breakdown-grid">
                    
                    <div class="bill-mini-card" *ngIf="details.bills.electricity">
                      <span class="bill-type-icon">⚡</span>
                      <div>
                        <span class="bill-type-lbl">Tiền điện</span>
                        <strong class="bill-type-val">{{ details.bills.electricity }}</strong>
                      </div>
                    </div>

                    <div class="bill-mini-card" *ngIf="details.bills.water">
                      <span class="bill-type-icon">💧</span>
                      <div>
                        <span class="bill-type-lbl">Tiền nước</span>
                        <strong class="bill-type-val">{{ details.bills.water }}</strong>
                      </div>
                    </div>

                    <div class="bill-mini-card" *ngIf="details.bills.service">
                      <span class="bill-type-icon">🧹</span>
                      <div>
                        <span class="bill-type-lbl">Dịch vụ (Wifi/Rác)</span>
                        <strong class="bill-type-val">{{ details.bills.service }}</strong>
                      </div>
                    </div>

                  </div>
                </div>
              }

              <!-- 7. Habits & Lifestyle Matrix -->
              <div class="modal-habits-section mb-3">
                <h4 class="section-title-clean">🛋️ Thói quen sinh hoạt & Lối sống</h4>
                <div class="habits-cards-grid">
                  
                  <!-- Giờ giấc ngủ -->
                  <div class="habit-item-card" [class.habit-active-sky]="p.sleepLate">
                    <div class="habit-icon-wrap">🌙</div>
                    <div>
                      <span class="habit-key">Giờ giấc ngủ</span>
                      <strong class="habit-val">{{ p.sleepLate ? 'Thường thức muộn (Sau 12h)' : 'Ngủ sớm điều độ' }}</strong>
                    </div>
                  </div>

                  <!-- Hút thuốc lá -->
                  <div class="habit-item-card" [class.habit-danger]="p.smoke" [class.habit-clean]="!p.smoke">
                    <div class="habit-icon-wrap">🚭</div>
                    <div>
                      <span class="habit-key">Hút thuốc lá / Vape</span>
                      <strong class="habit-val">{{ p.smoke ? 'Có hút thuốc' : 'Không hút thuốc' }}</strong>
                    </div>
                  </div>

                  <!-- Thú cưng -->
                  <div class="habit-item-card" [class.habit-warning]="p.hasPet">
                    <div class="habit-icon-wrap">🐾</div>
                    <div>
                      <span class="habit-key">Nuôi thú cưng</span>
                      <strong class="habit-val">{{ p.hasPet ? 'Có nuôi thú cưng' : 'Không nuôi thú cưng' }}</strong>
                    </div>
                  </div>

                  <!-- Nấu ăn -->
                  <div class="habit-item-card" *ngIf="details.bills.cookFrequency">
                    <div class="habit-icon-wrap">🍳</div>
                    <div>
                      <span class="habit-key">Nấu ăn</span>
                      <strong class="habit-val">{{ details.bills.cookFrequency }}</strong>
                    </div>
                  </div>

                  <!-- Dẫn bạn bè về -->
                  <div class="habit-item-card" *ngIf="details.bills.inviteFriends">
                    <div class="habit-icon-wrap">👥</div>
                    <div>
                      <span class="habit-key">Dẫn bạn về phòng</span>
                      <strong class="habit-val">{{ details.bills.inviteFriends }}</strong>
                    </div>
                  </div>

                  <!-- Tính cách -->
                  <div class="habit-item-card" *ngIf="details.bills.personality">
                    <div class="habit-icon-wrap">🎭</div>
                    <div>
                      <span class="habit-key">Tính cách</span>
                      <strong class="habit-val">{{ details.bills.personality }}</strong>
                    </div>
                  </div>

                </div>
              </div>

              <!-- 8. Amenities & Surroundings Tags (If present) -->
              @if (details.amenitiesList.length > 0 || details.surroundingsList.length > 0) {
                <div class="modal-tags-section mb-3">
                  
                  @if (details.amenitiesList.length > 0) {
                    <div class="mb-2">
                      <span class="tags-group-title">🛋️ Tiện nghi phòng trọ:</span>
                      <div class="amenities-chips-wrap mt-1">
                        @for (am of details.amenitiesList; track am) {
                          <span class="amenity-chip-pill">✓ {{ am }}</span>
                        }
                      </div>
                    </div>
                  }

                  @if (details.surroundingsList.length > 0) {
                    <div class="mt-2">
                      <span class="tags-group-title">🌳 Môi trường xung quanh:</span>
                      <div class="amenities-chips-wrap mt-1">
                        @for (sr of details.surroundingsList; track sr) {
                          <span class="surrounding-chip-pill">📍 {{ sr }}</span>
                        }
                      </div>
                    </div>
                  }

                </div>
              }

              <!-- 9. Author's Personal Message (Clean Note) -->
              @if (details.cleanDescription) {
                <div class="modal-message-card mb-3">
                  <div class="message-quote-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-sky">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                    <span class="message-quote-title">Lời nhắn từ người đăng tin:</span>
                  </div>
                  <p class="clean-message-body">{{ details.cleanDescription }}</p>
                </div>
              }

              <!-- 10. Sticky VIP Direct Contact Action Card -->
              <div class="modal-vip-contact-sticky">
                <div class="contact-top-row">
                  <div class="contact-pulse-badge">
                    <span class="pulse-green-dot"></span>
                    <span>LIÊN HỆ TRỰC TIẾP CHÍNH CHỦ</span>
                  </div>
                  <span class="badge-free-100">Miễn phí 100%</span>
                </div>

                <div class="contact-info-strip">
                  <div class="phone-callout-box">
                    <span class="phone-callout-label">Số điện thoại / Zalo:</span>
                    <strong class="phone-callout-num">{{ p.phone || p.contactPhone || 'Chưa cập nhật SĐT' }}</strong>
                  </div>

                  @if (p.phone || p.contactPhone) {
                    <button type="button" class="btn-copy-mini" (click)="copyPhoneNumber(p.phone || p.contactPhone, $event)" title="Sao chép SĐT">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      <span>Sao chép SĐT</span>
                    </button>
                  }
                </div>

                <!-- Action CTA Buttons -->
                <div class="contact-cta-grid mt-3">
                  @if (p.phone || p.contactPhone) {
                    <a href="tel:{{ cleanPhoneNumber(p.phone || p.contactPhone) }}" class="btn-cta-call">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>Gọi Điện Thoại</span>
                    </a>

                    <a href="https://zalo.me/{{ cleanPhoneNumber(details.bills.zalo || p.contactZalo || p.phone || p.contactPhone) }}" target="_blank" class="btn-cta-zalo">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.08L5 22l4.13-1.65c.92.27 1.89.42 2.87.42 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1 13.5h-2v-2h2v2zm0-4h-2V7h2v4.5z"/>
                      </svg>
                      <span>Nhắn Tin Zalo</span>
                    </a>
                  }
                </div>

              </div>

            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .match-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 10px 16px 50px 16px;
    }

    /* MONOCHROME SVGs */
    .mono-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .mono-icon-xs {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
    .mono-icon-sm {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .mono-badge-svg {
      width: 13px;
      height: 13px;
      margin-right: 4px;
      vertical-align: -1px;
    }
    .mono-pill-svg {
      width: 12px;
      height: 12px;
      margin-right: 3px;
      vertical-align: -1px;
    }
    .mono-tag-svg {
      width: 13px;
      height: 13px;
      margin-right: 4px;
      vertical-align: -1px;
    }
    .mono-badge-svg-lg {
      width: 15px;
      height: 15px;
      margin-right: 6px;
      vertical-align: -2px;
    }
    .mono-pill-svg-lg {
      width: 15px;
      height: 15px;
      margin-right: 6px;
      vertical-align: -2px;
    }
    .meta-svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
      color: #64748b;
    }

    /* 1. HERO BANNER */
    .match-hero-banner {
      position: relative;
      background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0284c7 80%, #38bdf8 100%);
      border-radius: 24px;
      padding: 36px 40px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(2, 132, 199, 0.35);
      flex-wrap: wrap;
      gap: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .hero-bg-shapes {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .hero-bg-shapes .shape-1 {
      position: absolute;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
      top: -80px;
      right: 15%;
    }
    .hero-bg-shapes .shape-2 {
      position: absolute;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(255,255,255,0) 70%);
      bottom: -60px;
      left: 5%;
    }
    .hero-main-content {
      position: relative;
      z-index: 2;
      max-width: 680px;
    }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .hero-title {
      font-size: 2.1rem;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }
    .hero-subtitle {
      color: #e0f2fe;
      margin: 0 0 20px 0;
      font-size: 0.98rem;
      line-height: 1.6;
    }
    .hero-stats-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .stat-pill-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #f0f9ff;
    }
    .hero-action-box {
      position: relative;
      z-index: 2;
    }
    .btn-hero-create-post {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #0369a1;
      font-weight: 900;
      font-size: 0.98rem;
      padding: 14px 26px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-hero-create-post:hover {
      transform: translateY(-3px) scale(1.02);
      background: #f0f9ff;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.28);
      color: #0284c7;
    }

    /* 2. SEGMENTED TABS */
    .segmented-tabs-wrapper {
      display: flex;
      justify-content: flex-start;
    }
    .tabs-container {
      display: inline-flex;
      background: #f1f5f9;
      padding: 6px;
      border-radius: 16px;
      gap: 6px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .tab-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      color: #64748b;
      padding: 10px 20px;
      font-size: 0.92rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-pill-btn:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }
    .tab-pill-btn.active {
      background: #ffffff;
      color: #0284c7;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    }
    .tab-btn-svg {
      width: 18px;
      height: 18px;
    }
    .tab-count-badge {
      background: #e0f2fe;
      color: #0284c7;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .ai-tab-btn.active {
      color: #7c3aed;
    }
    .ai-sparkle-pill {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: 99px;
      letter-spacing: 0.04em;
    }

    /* 3. FLOATING SEARCH PILL */
    .match-search-section {
      width: 100%;
    }
    .search-pill-container {
      padding: 8px 12px;
      border-radius: 99px;
      box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.08);
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.9);
      width: 100%;
      position: relative;
    }
    .search-pill {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    @media (max-width: 900px) {
      .search-pill-container {
        border-radius: 20px;
        padding: 12px;
      }
      .search-pill {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      .pill-divider {
        display: none;
      }
    }

    .pill-group {
      flex: 1;
      min-width: 0;
    }
    .search-input-group {
      flex: 1.5;
    }
    .pill-divider {
      width: 1px;
      height: 28px;
      background: #e2e8f0;
      margin: 0 4px;
      flex-shrink: 0;
    }

    .input-with-icon, .select-with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      position: relative;
    }
    .search-prefix-svg, .select-prefix-svg {
      width: 18px;
      height: 18px;
      color: #0284c7;
      flex-shrink: 0;
    }
    .input-with-icon input, .select-with-icon select {
      width: 100%;
      border: none;
      outline: none;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      background: transparent;
      padding: 6px 0;
    }
    .input-with-icon input::placeholder {
      color: #94a3b8;
      font-weight: 500;
    }
    .btn-clear-inline {
      background: #e2e8f0;
      border: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Popover button */
    .popover-btn-wrapper {
      position: relative;
      flex: 1;
    }
    .pill-popover-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      text-align: left;
    }
    .trigger-icon {
      font-weight: 900;
      color: #0284c7;
      font-size: 1.1rem;
      line-height: 1;
    }
    .trigger-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chevron {
      font-size: 0.65rem;
      color: #64748b;
      transition: transform 0.2s ease;
    }

    /* Popover dropdown */
    .filter-popover {
      position: absolute;
      top: calc(100% + 14px);
      left: 50%;
      transform: translateX(-50%);
      width: 320px;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.22);
      border: 1px solid #e2e8f0;
      padding: 18px;
      z-index: 1000;
    }
    .popover-inputs-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .input-col {
      flex: 1;
    }
    .popover-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }
    .popover-input {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.85rem;
      font-weight: 600;
      outline: none;
    }
    .popover-input:focus {
      border-color: #0284c7;
    }
    .arrow-sep {
      color: #94a3b8;
      font-weight: 800;
      margin-top: 14px;
    }
    .range-slider-wrapper {
      margin-bottom: 14px;
    }
    .price-slider {
      width: 100%;
      accent-color: #0284c7;
      cursor: pointer;
    }
    .slider-ticks {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 600;
      margin-top: 2px;
    }
    .popover-options-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
      margin-bottom: 12px;
    }
    .popover-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s;
    }
    .popover-option:hover {
      background: #f0f9ff;
      color: #0284c7;
    }
    .popover-option.selected {
      background: #e0f2fe;
      color: #0284c7;
      font-weight: 800;
    }
    .check-icon {
      font-weight: 900;
      color: #0284c7;
    }
    .popover-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }
    .btn-popover-reset {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-popover-reset:hover { color: #0f172a; }
    .btn-popover-apply {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-popover-apply:hover { background: #0369a1; }

    /* Pill Action Buttons */
    .pill-action-group {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 4px;
    }
    .btn-advanced-filter-trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 10px 16px;
      border-radius: 99px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .btn-advanced-filter-trigger:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-advanced-filter-trigger.has-active {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #7dd3fc;
    }
    .active-dot-badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 900;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-primary-search {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border: none;
      padding: 10px 22px;
      border-radius: 99px;
      font-size: 0.92rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      transition: all 0.2s ease;
    }
    .btn-primary-search:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
    }

    /* 4. ADVANCED FILTER DRAWER */
    .advanced-filter-drawer {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 24px;
      padding: 24px 28px;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12);
    }
    .adv-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #f1f5f9;
      padding-bottom: 14px;
    }
    .adv-icon-badge {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close-drawer {
      background: #f1f5f9;
      border: none;
      font-size: 1.2rem;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close-drawer:hover { background: #e2e8f0; color: #0f172a; }

    .section-title-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section-badge-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .section-main-heading {
      font-size: 0.98rem;
      font-weight: 800;
      color: #0f172a;
    }
    .toggle-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .toggle-all-btn.active {
      background: #e0f2fe;
      border-color: #0284c7;
      color: #0284c7;
    }
    .chk-box-mini {
      width: 14px;
      height: 14px;
      border: 1.5px solid #94a3b8;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 900;
      background: #ffffff;
    }
    .toggle-all-btn.active .chk-box-mini {
      background: #0284c7;
      border-color: #0284c7;
      color: #ffffff;
    }

    /* Amenities Grid */
    .amenities-grid-vip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 950px) {
      .amenities-grid-vip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 700px) {
      .amenities-grid-vip { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .amenities-grid-vip { grid-template-columns: 1fr; }
    }

    .amenity-card-item {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 11px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .amenity-card-item:hover {
      border-color: #93c5fd;
      background: #ffffff;
      transform: translateY(-1px);
    }
    .amenity-card-item.checked {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }
    .custom-checkbox-box {
      width: 20px;
      height: 20px;
      border: 2px solid #94a3b8;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .amenity-card-item.checked .custom-checkbox-box {
      background: #2563eb;
      border-color: #2563eb;
    }
    .chk-mark {
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 900;
      line-height: 1;
    }
    .amenity-label-text {
      font-size: 0.88rem;
      font-weight: 700;
      color: #334155;
    }
    .amenity-card-item.checked .amenity-label-text {
      color: #1d4ed8;
    }

    /* 3-Column Adv Cards Grid */
    .adv-inputs-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 950px) {
      .adv-inputs-grid-3 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .adv-inputs-grid-3 { grid-template-columns: 1fr; }
    }

    .adv-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .adv-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e293b;
    }
    .adv-label .mono-icon {
      width: 16px;
      height: 16px;
      color: #0284c7;
      flex-shrink: 0;
    }

    .adv-pill-options-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .adv-opt-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 11px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .adv-opt-pill:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .adv-opt-pill.active {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #0284c7;
      font-weight: 800;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15);
    }

    .adv-input-with-unit {
      position: relative;
      display: flex;
      align-items: center;
    }
    .adv-input-with-unit .adv-input-text {
      padding-right: 105px;
    }
    .unit-text {
      position: absolute;
      right: 12px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      pointer-events: none;
    }
    .adv-quick-budget-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .quick-lbl {
      font-size: 0.74rem;
      color: #64748b;
      font-weight: 600;
    }
    .btn-micro-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-micro-chip:hover {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #0284c7;
    }

    .adv-input-text, .adv-select {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 9px;
      padding: 8px 12px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
    }
    .adv-input-text:focus, .adv-select:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }

    .adv-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .btn-adv-reset {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-adv-reset:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn-adv-apply {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border: none;
      padding: 9px 24px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
      transition: all 0.2s;
    }
    .btn-adv-apply:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
    }

    /* Sub bar below filter pill */
    .filter-sub-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 0 8px;
    }
    .filter-chips-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-chip {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 5px 14px;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-chip:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .filter-chip.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
    }
    .filter-summary-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .results-count-text {
      font-size: 0.85rem;
      color: #64748b;
    }
    .results-count-text strong {
      color: #0284c7;
    }
    .btn-reset-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .btn-reset-pill:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* 5. POSTS BOARD GRID */
    .posts-board-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .post-card-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.05);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .post-card-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px -8px rgba(2, 132, 199, 0.15);
      border-color: #bae6fd;
    }
    .post-card-thumb {
      position: relative;
      width: 100%;
      height: 190px;
      background: #f8fafc;
      overflow: hidden;
    }
    .post-card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .post-card-item:hover .post-card-thumb img {
      transform: scale(1.05);
    }
    .post-card-thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }
    .placeholder-svg {
      width: 38px;
      height: 38px;
    }
    .placeholder-text {
      font-size: 0.8rem;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: 0.04em;
    }
    .room-status-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    .room-status-badge.badge-has-room {
      background: rgba(22, 163, 74, 0.9);
      color: #ffffff;
    }
    .room-status-badge.badge-no-room {
      background: rgba(2, 132, 199, 0.9);
      color: #ffffff;
    }

    .post-card-content {
      padding: 16px 18px 18px 18px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .post-title-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .gender-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
      margin-top: 2px;
    }
    .gender-pill.male { background: #e0f2fe; color: #0284c7; }
    .gender-pill.female { background: #fce7f3; color: #db2777; }

    .post-card-title {
      font-size: 1.02rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-meta-details {
      font-size: 0.82rem;
      color: #64748b;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 4px 0 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .price-showcase-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-top: 6px;
    }
    .price-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
    }
    .price-val {
      font-size: 1.05rem;
      font-weight: 900;
      color: #0284c7;
    }
    .price-unit {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Habits Tags */
    .habits-tags-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .h-tag {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .h-tag-active { background: #e0f2fe; color: #0284c7; }
    .h-tag-danger { background: #fee2e2; color: #ef4444; }
    .h-tag-warning { background: #fef3c7; color: #d97706; }

    .post-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
      margin-top: auto;
    }
    .author-mini-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0284c7;
      font-weight: 900;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .author-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
      display: block;
    }
    .post-time {
      font-size: 0.7rem;
      color: #94a3b8;
      display: block;
    }

    /* 6. DETECTED RENTED ROOM BANNER */
    .detected-room-banner {
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      border: 2px solid #86efac;
      border-radius: 20px;
      padding: 18px 22px;
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      box-shadow: 0 8px 20px -4px rgba(22, 163, 74, 0.12);
    }
    .detected-room-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #ffffff;
      border: 1.5px solid #86efac;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .detected-tag {
      background: #16a34a;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }
    .detected-room-code {
      font-weight: 800;
      font-size: 0.85rem;
      color: #0284c7;
    }
    .badge-status-green {
      background: #dcfce7;
      color: #15803d;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .detected-room-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .detected-room-addr {
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .detected-room-stats-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .room-stat-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      color: #334155;
    }
    .btn-sync-room {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #16a34a;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 800;
      padding: 10px 18px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .btn-sync-room:hover {
      background: #15803d;
      transform: translateY(-1px);
    }

    /* 7. POST FORM STYLES */
    .max-w-850 { max-width: 850px; }
    .margin-auto { margin-left: auto; margin-right: auto; }
    .post-form-card-vip {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 24px;
      padding: 36px 40px;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06);
    }
    @media (max-width: 650px) {
      .post-form-card-vip { padding: 22px 18px; }
    }
    .form-badge-top {
      display: inline-block;
      background: #e0f2fe;
      color: #0284c7;
      font-size: 0.72rem;
      font-weight: 900;
      padding: 3px 12px;
      border-radius: 99px;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .form-header-title h2 {
      font-size: 1.75rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .form-section-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 8px 14px;
      border-radius: 0 10px 10px 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .section-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-label-bold {
      display: block;
      font-size: 0.88rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .form-control-modern {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control-modern:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }
    .form-control-modern optgroup {
      font-weight: 800;
      color: #0369a1;
      background: #f0f9ff;
      padding: 6px;
    }
    .form-control-modern option {
      font-weight: 500;
      color: #1e293b;
      background: #ffffff;
      padding: 6px;
    }

    /* Address Live Preview Badge */
    .address-preview-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      font-size: 0.88rem;
    }
    .address-preview-left {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #047857;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .preview-map-svg {
      width: 16px;
      height: 16px;
      color: #059669;
    }
    .preview-val {
      font-weight: 700;
      color: #065f46;
      word-break: break-word;
    }

    /* Grids */
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 800px) {
      .form-grid-3 { grid-template-columns: 1fr; }
      .form-grid-2 { grid-template-columns: 1fr; }
    }

    .form-grid-4-demographics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 900px) {
      .form-grid-4-demographics { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 500px) {
      .form-grid-4-demographics { grid-template-columns: 1fr; }
    }

    /* 4-Column Cost and Terms Side-by-Side */
    .cost-terms-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 1000px) {
      .cost-terms-grid-4 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 550px) {
      .cost-terms-grid-4 { grid-template-columns: 1fr; }
    }
    .cost-term-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
    }
    .cost-term-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .cost-term-icon {
      font-weight: 900;
      font-size: 1rem;
    }
    .cost-term-hint {
      font-size: 0.72rem;
      color: #64748b;
    }
    .quick-chip-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .room-status-toggle-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (max-width: 650px) {
      .room-status-toggle-grid { grid-template-columns: 1fr; }
    }
    .room-status-opt-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .room-status-opt-card:hover {
      border-color: #93c5fd;
      background: #ffffff;
    }
    .room-status-opt-card.active {
      background: #eff6ff;
      border-color: #0284c7;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.12);
    }
    .status-opt-radio {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      background: #ffffff;
    }
    .room-status-opt-card.active .status-opt-radio {
      border-color: #0284c7;
    }
    .radio-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #0284c7;
    }
    .status-opt-text strong {
      display: block;
      font-size: 0.92rem;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .status-opt-text span {
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.35;
      display: block;
    }

    .input-with-unit-post {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-unit-post .form-control-modern {
      padding-right: 90px;
    }
    .unit-badge {
      position: absolute;
      right: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      pointer-events: none;
    }
    .input-help-hint {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 4px;
    }

    .file-input-hidden { display: none; }
    .image-upload-dropzone-modern {
      display: block;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.2s ease;
    }
    .image-upload-dropzone-modern:hover {
      border-color: #0284c7;
      background: #f0f9ff;
    }
    .dropzone-center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .upload-mono-svg {
      width: 40px;
      height: 40px;
      color: #0284c7;
    }
    .dropzone-center-content strong {
      font-size: 0.95rem;
      color: #0f172a;
    }
    .dropzone-center-content span {
      font-size: 0.78rem;
      color: #64748b;
    }
    .preview-img-modern {
      max-height: 200px;
      border-radius: 10px;
      object-fit: cover;
      display: block;
      margin: 0 auto 10px auto;
    }
    .change-img-btn {
      display: inline-block;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #0284c7;
    }

    .btn-submit-post-vip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 900;
      padding: 14px 36px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.35);
      transition: all 0.25s ease;
    }
    .btn-submit-post-vip:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(2, 132, 199, 0.45);
    }
    .btn-submit-post-vip:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* 8. AI MATCHMAKER & CARDS */
    .ai-banner-card {
      background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%);
      border-radius: 20px;
      padding: 24px 28px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 15px 30px rgba(124, 58, 237, 0.25);
    }
    .ai-banner-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ai-badge-top {
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #ddd6fe;
      margin-bottom: 4px;
    }
    .ai-banner-content h2 {
      font-size: 1.4rem;
      font-weight: 900;
      margin: 0 0 6px 0;
    }
    .ai-banner-content p {
      margin: 0;
      color: #f5f3ff;
      font-size: 0.88rem;
    }

    /* Live Money Preview Badge */
    .live-money-preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #065f46;
    }
    .preview-coin-icon { font-size: 0.9rem; }
    .preview-money-val { font-weight: 800; color: #047857; }

    /* Multi-Image Upload Styles */
    .multi-image-upload-wrapper {
      width: 100%;
    }
    .post-images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 6px;
    }
    .image-thumb-card {
      position: relative;
      width: 100%;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .image-thumb-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .thumb-cover-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: #0284c7;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 6px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .btn-delete-thumb {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.9);
      color: #ffffff;
      border: none;
      font-size: 11px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-delete-thumb:hover {
      background: #dc2626;
      transform: scale(1.1);
    }
    .image-add-more-card {
      height: 120px;
      border: 2px dashed #0284c7;
      border-radius: 12px;
      background: #f0f9ff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #0284c7;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .image-add-more-card:hover {
      background: #e0f2fe;
      border-color: #0369a1;
    }
    .image-add-more-card .plus-icon {
      width: 24px;
      height: 24px;
    }
    .btn-browse-fake {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
    }

    /* Redesigned Modal Styles */
    .max-w-750 { max-width: 750px; }
    
    .post-detail-modal-custom {
      background: #ffffff !important;
      color: #0f172a !important;
      border-radius: 24px;
      padding: 24px 28px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(226, 232, 240, 0.9);
      max-height: 92vh;
      overflow-y: auto;
      width: 100%;
    }

    /* Modal Gallery Carousel */
    .modal-gallery-wrapper {
      width: 100%;
    }
    .gallery-main-img-box {
      position: relative;
      width: 100%;
      height: 320px;
      border-radius: 16px;
      overflow: hidden;
      background: #0f172a;
    }
    .gallery-main-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.7);
      color: #ffffff;
      border: none;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      transition: all 0.2s ease;
      z-index: 5;
    }
    .carousel-btn:hover {
      background: rgba(2, 132, 199, 0.9);
      transform: translateY(-50%) scale(1.1);
    }
    .carousel-btn.prev-btn { left: 12px; }
    .carousel-btn.next-btn { right: 12px; }
    
    .gallery-counter-badge {
      position: absolute;
      bottom: 12px;
      right: 14px;
      background: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 800;
      backdrop-filter: blur(4px);
    }
    .gallery-thumbnails-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .gallery-thumb-item {
      width: 64px;
      height: 52px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      opacity: 0.65;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .gallery-thumb-item:hover, .gallery-thumb-item.active {
      opacity: 1;
      border-color: #0284c7;
      transform: scale(1.05);
    }
    .gallery-thumb-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Modal Author Profile */
    .modal-author-profile-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .author-avatar-round-lg {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
    }
    .author-fullname-text {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .verified-student-badge {
      background: #dcfce7;
      color: #16a34a;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #bbf7d0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .author-meta-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .meta-sub-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      color: #475569;
    }

    /* Modal Metrics Grid (4 Cards) */
    .modal-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    @media (max-width: 700px) {
      .modal-metrics-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .modal-metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .bg-emerald-subtle { background: #dcfce7; }
    .bg-sky-subtle { background: #e0f2fe; }
    .bg-amber-subtle { background: #fef3c7; }
    .bg-purple-subtle { background: #f3e8ff; }
    .metric-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }
    .metric-val {
      font-size: 0.95rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .unit-sub { font-size: 0.72rem; font-weight: 600; color: #64748b; }

    /* Address Card */
    .modal-address-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .address-icon-cell { font-size: 1.3rem; flex-shrink: 0; }
    .address-details-cell { flex-grow: 1; }
    .addr-label { display: block; font-size: 0.74rem; font-weight: 700; color: #64748b; }
    .addr-text { font-size: 0.92rem; font-weight: 800; color: #1e293b; }
    .btn-open-map {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .btn-open-map:hover { background: #0369a1; }

    /* Bills Breakdown */
    .section-title-clean {
      font-size: 0.92rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px 0;
    }
    .bills-breakdown-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    @media (max-width: 600px) {
      .bills-breakdown-grid { grid-template-columns: 1fr; }
    }
    .bill-mini-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bill-type-icon { font-size: 1.2rem; }
    .bill-type-lbl { display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; }
    .bill-type-val { font-size: 0.88rem; font-weight: 800; color: #0f172a; }

    /* Habits Cards Grid */
    .habits-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 600px) {
      .habits-cards-grid { grid-template-columns: 1fr; }
    }
    .habit-item-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .habit-icon-wrap { font-size: 1.2rem; flex-shrink: 0; }
    .habit-key { display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; }
    .habit-val { font-size: 0.85rem; font-weight: 800; color: #0f172a; }
    .habit-active-sky { background: #f0f9ff; border-color: #bae6fd; }
    .habit-danger { background: #fff1f2; border-color: #fecdd3; }
    .habit-clean { background: #f0fdf4; border-color: #bbf7d0; }
    .habit-warning { background: #fffbeb; border-color: #fde68a; }

    /* Tags Section */
    .modal-tags-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      gap: 8px;
      background: #16a34a;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 900;
      padding: 4px 12px;
      border-radius: 20px;
      letter-spacing: 0.04em;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ffffff;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .free-badge {
      font-size: 0.78rem;
      font-weight: 800;
      color: #0284c7;
      background: #e0f2fe;
      padding: 3px 10px;
      border-radius: 8px;
    }

    .contact-phone-showcase {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1.5px solid #bbf7d0;
      padding: 12px 18px;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      flex-wrap: wrap;
      gap: 10px;
    }
    .phone-display-box .phone-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
    }
    .phone-number-lg {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0284c7;
      letter-spacing: 0.05em;
    }
    .btn-copy-phone {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-copy-phone:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: translateY(-1px);
    }

    .contact-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 550px) {
      .contact-actions-grid { grid-template-columns: 1fr; }
    }
    .btn-call-vip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 800;
      padding: 14px 20px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
      transition: all 0.25s ease;
    }
    .btn-call-vip:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(22, 163, 74, 0.4);
      background: linear-gradient(135deg, #15803d, #166534);
    }
    .btn-zalo-vip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #0068ff, #0052cc);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 800;
      padding: 14px 20px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(0, 104, 255, 0.3);
      transition: all 0.25s ease;
    }
    .btn-zalo-vip:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 104, 255, 0.4);
      background: linear-gradient(135deg, #0052cc, #003d99);
    }

    .safety-tip-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px dashed #cbd5e1;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.78rem;
      color: #475569;
      line-height: 1.45;
    }
    .tip-icon-svg {
      width: 16px;
      height: 16px;
      color: #16a34a;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .modal-footer-custom {
      display: flex;
      justify-content: flex-end;
      border-top: 1.5px solid #f1f5f9;
      padding-top: 14px;
    }
    .btn-close-modal {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 8px 20px;
      border-radius: 10px;
      cursor: pointer;
    }
    .btn-close-modal:hover { background: #e2e8f0; color: #0f172a; }

    /* Loading & Spinner */
    .spinner-sky {
      width: 44px;
      height: 44px;
      border: 4px solid #e0f2fe;
      border-top: 4px solid #0284c7;
      border-radius: 50%;
      margin: 0 auto;
      animation: spin 0.8s linear infinite;
    }
    .spinner-inline {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class TenantMatchComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly contractService = inject(ContractService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  activeTab = signal<'board' | 'post' | 'matches'>('board');

  // Location data
  districts = signal<any[]>([]);
  wards = signal<any[]>([]);
  postWards = signal<any[]>([]);

  urbanDistricts = computed(() => this.districts().filter(d => d.type === 'Quận'));
  suburbanDistricts = computed(() => this.districts().filter(d => d.type !== 'Quận'));

  postAddressModel = {
    district: '',
    ward: '',
    street: ''
  };

  // Popover & advanced drawer states
  showPricePopover = false;
  showAdvancedFilter = false;

  // Price popover states
  selectedPriceOption = 'all';
  minPriceInput: number | null = null;
  maxPriceInput: number | null = null;
  sliderValue = 10000000;

  // Amenity & Surrounding Definition Lists
  amenityList = [
    { key: 'gac_lung', label: 'Gác lửng' },
    { key: 'wifi', label: 'Wifi' },
    { key: 'wc_rieng', label: 'Vệ sinh trong' },
    { key: 'phong_tam', label: 'Phòng tắm' },
    { key: 'nong_lanh', label: 'Bình nóng lạnh' },
    { key: 'ke_bep', label: 'Kệ bếp' },
    { key: 'may_giat', label: 'Máy giặt' },
    { key: 'tivi', label: 'Tivi' },
    { key: 'dieu_hoa', label: 'Điều hòa' },
    { key: 'tu_lanh', label: 'Tủ lạnh' },
    { key: 'giuong_nem', label: 'Giường nệm' },
    { key: 'tu_quan_ao', label: 'Tủ áo quần' },
    { key: 'ban_cong', label: 'Ban công/sân thượng' },
    { key: 'thang_may', label: 'Thang máy' },
    { key: 'bai_xe', label: 'Bãi để xe riêng' },
    { key: 'camera', label: 'Camera an ninh' },
    { key: 'ho_boi', label: 'Hồ bơi' },
    { key: 'san_vuon', label: 'Sân vườn' }
  ];

  surroundingList = [
    { key: 'cho', label: 'Chợ' },
    { key: 'sieu_thi', label: 'Siêu thị' },
    { key: 'benh_vien', label: 'Bệnh viện' },
    { key: 'truong_hoc', label: 'Trường học' },
    { key: 'cong_vien', label: 'Công viên' },
    { key: 'bus', label: 'Bến xe Bus' },
    { key: 'gym_the_thao', label: 'Trung tâm thể dục thể thao' }
  ];

  selectedAmenities: string[] = [];
  selectedSurroundings: string[] = [];
  selectedLeaseTerms: string[] = [];

  // Tenant active rental on ZHome
  myRentalInfo = signal<any | null>(null);

  // Filters for public posts board
  filters = {
    search: '',
    district: '',
    ward: '',
    university: '',
    hasRoom: null as boolean | null,
    gender: 'Any',
    minPrice: null as number | null,
    maxPrice: null as number | null,
    smoke: null as boolean | null,
    sleepLate: null as boolean | null,
    hasPet: null as boolean | null,
    hometown: '',
    // Detailed criteria fields
    amenities: '',
    surroundings: '',
    occupation: 'All',
    ageRange: 'All',
    roommatesWanted: null as number | null,
    leaseTerm: '',
    moveInTime: 'All',
    occupantsPerRoom: null as number | null,
    budgetPerPerson: null as number | null,
    personality: 'All',
    cookFrequency: 'All',
    inviteFriends: 'All',
    otherCriteria: ''
  };

  // Count active detailed filters
  activeAdvancedFilterCount = computed(() => {
    let count = 0;
    if (this.selectedAmenities.length > 0) count += this.selectedAmenities.length;
    if (this.selectedSurroundings.length > 0) count += this.selectedSurroundings.length;
    if (this.selectedLeaseTerms.length > 0) count += this.selectedLeaseTerms.length;
    if (this.filters.hasRoom !== null) count++;
    if (this.filters.smoke !== null) count++;
    if (this.filters.sleepLate !== null) count++;
    if (this.filters.hasPet !== null) count++;
    if (this.filters.hometown && this.filters.hometown.trim()) count++;
    if (this.filters.occupation && this.filters.occupation !== 'All') count++;
    if (this.filters.ageRange && this.filters.ageRange !== 'All') count++;
    if (this.filters.occupantsPerRoom !== null) count++;
    if (this.filters.moveInTime && this.filters.moveInTime !== 'All') count++;
    if (this.filters.budgetPerPerson !== null) count++;
    if (this.filters.personality && this.filters.personality !== 'All') count++;
    if (this.filters.cookFrequency && this.filters.cookFrequency !== 'All') count++;
    if (this.filters.inviteFriends && this.filters.inviteFriends !== 'All') count++;
    if (this.filters.otherCriteria && this.filters.otherCriteria.trim()) count++;
    return count;
  });

  // Lists and loading states
  publicPosts = signal<any[]>([]);
  isBoardLoading = signal(false);

  matchSuggestions = signal<any[]>([]);
  isMatchingLoading = signal(false);

  selectedPost = signal<any | null>(null);
  activeModalImgIdx = signal<number>(0);

  // Multi-image list for post creation
  postImages: string[] = [];

  // Form for posting/editing listing
  postForm = {
    title: '',
    hasRoom: true,
    address: '',
    contactPhone: '',
    contactZalo: '',
    imageUrl: '',
    imageBase64: '',
    gender: 'Male',
    
    // Demographics
    ageRange: '18-22',
    occupation: 'Sinh viên',
    hometown: '',
    
    // Cost breakdown & Terms
    budgetPerPerson: 1200000 as number | null,
    electricityFee: null as number | null,
    waterFee: null as number | null,
    waterFeeType: 'per_person' as 'per_person' | 'per_m3',
    serviceFee: null as number | null,
    occupantsPerRoom: 2,
    leaseTerms: [] as string[],
    moveInTime: 'Ở ngay',

    // Amenities & Surroundings
    amenities: [] as string[],
    surroundings: [] as string[],

    // Roommate lifestyle criteria
    personality: 'Hòa đồng',
    smoke: false,
    sleepLate: false,
    hasPet: false,
    cookFrequency: 'Thường xuyên',
    inviteFriends: 'Hạn chế',
    otherCriteria: '',
    
    description: ''
  };

  postImagePreview: string | null = null;
  isSubmittingPost = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.popover-btn-wrapper')) {
      this.showPricePopover = false;
    }
  }

  ngOnInit(): void {
    this.fetchDistricts();

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'post' || tab === 'matches' || tab === 'board') {
        this.setTab(tab);
      } else {
        this.fetchPublicPosts();
      }
    });

    if (this.authService.isLoggedIn()) {
      this.fetchMyProfile();
      this.fetchMyRental();
    }
  }

  setTab(tab: 'board' | 'post' | 'matches'): void {
    this.activeTab.set(tab);
    if (tab === 'board') {
      this.fetchPublicPosts();
    } else if (tab === 'matches') {
      this.fetchSuggestions();
    }
  }

  fetchPublicPosts(): void {
    this.isBoardLoading.set(true);

    const queryParams: any = {};
    if (this.filters.search) queryParams.search = this.filters.search;
    if (this.filters.district) queryParams.district = this.filters.district;
    if (this.filters.ward) queryParams.ward = this.filters.ward;
    if (this.filters.hasRoom !== null) queryParams.hasRoom = this.filters.hasRoom;
    if (this.filters.gender && this.filters.gender !== 'Any') queryParams.gender = this.filters.gender;
    if (this.filters.minPrice !== null) queryParams.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice !== null) queryParams.maxPrice = this.filters.maxPrice;
    if (this.filters.smoke !== null) queryParams.smoke = this.filters.smoke;
    if (this.filters.sleepLate !== null) queryParams.sleepLate = this.filters.sleepLate;
    if (this.filters.hasPet !== null) queryParams.hasPet = this.filters.hasPet;
    if (this.filters.hometown) queryParams.hometown = this.filters.hometown;

    // Advanced detailed filters
    if (this.filters.amenities) queryParams.amenities = this.filters.amenities;
    if (this.filters.surroundings) queryParams.surroundings = this.filters.surroundings;
    if (this.filters.occupation && this.filters.occupation !== 'All') queryParams.occupation = this.filters.occupation;
    if (this.filters.ageRange && this.filters.ageRange !== 'All') queryParams.ageRange = this.filters.ageRange;
    if (this.filters.leaseTerm) queryParams.leaseTerm = this.filters.leaseTerm;
    if (this.filters.moveInTime && this.filters.moveInTime !== 'All') queryParams.moveInTime = this.filters.moveInTime;
    if (this.filters.occupantsPerRoom !== null) queryParams.occupantsPerRoom = this.filters.occupantsPerRoom;
    if (this.filters.budgetPerPerson !== null) queryParams.budgetPerPerson = this.filters.budgetPerPerson;
    if (this.filters.personality && this.filters.personality !== 'All') queryParams.personality = this.filters.personality;
    if (this.filters.cookFrequency && this.filters.cookFrequency !== 'All') queryParams.cookFrequency = this.filters.cookFrequency;
    if (this.filters.inviteFriends && this.filters.inviteFriends !== 'All') queryParams.inviteFriends = this.filters.inviteFriends;
    if (this.filters.otherCriteria) queryParams.otherCriteria = this.filters.otherCriteria;

    this.matchService.getPublicPosts(queryParams).subscribe({
      next: (posts) => {
        this.publicPosts.set(posts);
        this.isBoardLoading.set(false);
      },
      error: () => {
        this.publicPosts.set([]);
        this.isBoardLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.fetchPublicPosts();
  }

  fetchMyRental(): void {
    this.contractService.getMyRental().subscribe({
      next: (rental) => {
        if (rental && rental.contractId) {
          this.myRentalInfo.set(rental);
          if (!this.postForm.address) {
            this.applyRentedRoomInfo(false);
          }
        }
      },
      error: () => {
        this.myRentalInfo.set(null);
      }
    });
  }

  applyRentedRoomInfo(showToast: boolean = true): void {
    const rental = this.myRentalInfo();
    if (!rental) return;

    this.postForm.hasRoom = true;
    this.postForm.address = rental.propertyAddress || rental.propertyTitle || '';
    this.postAddressModel.street = rental.propertyAddress || '';
    if (rental.roomPrice) {
      const occupants = rental.maxOccupants || 2;
      this.postForm.budgetPerPerson = Math.round(rental.roomPrice / occupants);
      this.postForm.occupantsPerRoom = occupants;
    }
    if (rental.latestBill) {
      if (rental.latestBill.electricityFee) this.postForm.electricityFee = rental.latestBill.electricityFee;
      if (rental.latestBill.waterFee) this.postForm.waterFee = rental.latestBill.waterFee;
      if (rental.latestBill.serviceFee) this.postForm.serviceFee = rental.latestBill.serviceFee;
    }
    if (rental.amenities && Array.isArray(rental.amenities) && rental.amenities.length > 0) {
      this.postForm.amenities = [...rental.amenities];
    }
    if (!this.postForm.title) {
      this.postForm.title = `Tìm bạn ở ghép phòng ${rental.roomNumber ? 'P.' + rental.roomNumber : ''} - ${rental.propertyTitle || 'giá tốt tiện nghi'}`;
    }
    if (showToast) {
      this.toastService.show('Đã tự động đồng bộ thông tin từ phòng trọ bạn đang thuê!', 'success');
    }
  }

  fetchDistricts(): void {
    this.propertyService.getLocations().subscribe({
      next: (data) => {
        this.districts.set(data);
      },
      error: () => {}
    });
  }

  getSelectedDistrictType(districtName: string): string {
    if (!districtName) return 'Quận';
    const d = this.districts().find(item => item.name === districtName);
    return d ? d.type : 'Quận';
  }

  getWardPlaceholder(districtName: string): string {
    if (!districtName) return 'Chọn Quận/Huyện trước';
    const type = this.getSelectedDistrictType(districtName);
    return type === 'Quận' ? '-- Chọn Phường --' : '-- Chọn Xã / Thị trấn --';
  }

  private readonly HANOI_SUBURBAN_COMMUNES: Record<string, { name: string; type: string }[]> = {
    'Thạch Thất': [
      { name: 'Liên Quan', type: 'Thị trấn' },
      { name: 'Tân Xã', type: 'Xã' },
      { name: 'Thạch Hòa', type: 'Xã' },
      { name: 'Bình Yên', type: 'Xã' },
      { name: 'Hạ Bằng', type: 'Xã' },
      { name: 'Đồng Trúc', type: 'Xã' },
      { name: 'Cần Kiệm', type: 'Xã' },
      { name: 'Tiến Xuân', type: 'Xã' },
      { name: 'Yên Bình', type: 'Xã' },
      { name: 'Yên Trung', type: 'Xã' },
      { name: 'Chàng Sơn', type: 'Xã' },
      { name: 'Dị Nậu', type: 'Xã' },
      { name: 'Canh Nậu', type: 'Xã' },
      { name: 'Hữu Bằng', type: 'Xã' },
      { name: 'Kim Quan', type: 'Xã' },
      { name: 'Lại Thượng', type: 'Xã' },
      { name: 'Phú Kim', type: 'Xã' },
      { name: 'Phùng Xá', type: 'Xã' },
      { name: 'Hương Ngải', type: 'Xã' },
      { name: 'Bình Phú', type: 'Xã' },
      { name: 'Đại Đồng', type: 'Xã' },
      { name: 'Cẩm Yên', type: 'Xã' }
    ],
    'Hoài Đức': [
      { name: 'Trạm Trôi', type: 'Thị trấn' },
      { name: 'An Khánh', type: 'Xã' },
      { name: 'An Thượng', type: 'Xã' },
      { name: 'Vân Canh', type: 'Xã' },
      { name: 'Di Trạch', type: 'Xã' },
      { name: 'Kim Chung', type: 'Xã' },
      { name: 'Đức Giang', type: 'Xã' },
      { name: 'Đức Thượng', type: 'Xã' },
      { name: 'Cát Quế', type: 'Xã' },
      { name: 'Đắc Sở', type: 'Xã' },
      { name: 'Đông La', type: 'Xã' },
      { name: 'La Phù', type: 'Xã' },
      { name: 'Lại Yên', type: 'Xã' },
      { name: 'Minh Khai', type: 'Xã' },
      { name: 'Song Phương', type: 'Xã' },
      { name: 'Sơn Đồng', type: 'Xã' },
      { name: 'Tiền Yên', type: 'Xã' },
      { name: 'Vân Côn', type: 'Xã' },
      { name: 'Yên Sở', type: 'Xã' },
      { name: 'Dương Liễu', type: 'Xã' }
    ],
    'Đông Anh': [
      { name: 'Đông Anh', type: 'Thị trấn' },
      { name: 'Kim Chung', type: 'Xã' },
      { name: 'Hải Bối', type: 'Xã' },
      { name: 'Vĩnh Ngọc', type: 'Xã' },
      { name: 'Tiên Dương', type: 'Xã' },
      { name: 'Uy Nỗ', type: 'Xã' },
      { name: 'Cổ Loa', type: 'Xã' },
      { name: 'Bắc Hồng', type: 'Xã' },
      { name: 'Nam Hồng', type: 'Xã' },
      { name: 'Vân Nội', type: 'Xã' },
      { name: 'Võng La', type: 'Xã' },
      { name: 'Đại Mạch', type: 'Xã' },
      { name: 'Đông Hội', type: 'Xã' },
      { name: 'Mai Lâm', type: 'Xã' },
      { name: 'Tàm Xá', type: 'Xã' },
      { name: 'Xuân Canh', type: 'Xã' },
      { name: 'Dục Tú', type: 'Xã' },
      { name: 'Liên Hà', type: 'Xã' },
      { name: 'Thụy Lâm', type: 'Xã' },
      { name: 'Vân Hà', type: 'Xã' },
      { name: 'Việt Hùng', type: 'Xã' },
      { name: 'Xuân Nộn', type: 'Xã' },
      { name: 'Nguyên Khê', type: 'Xã' }
    ],
    'Gia Lâm': [
      { name: 'Trâu Quỳ', type: 'Thị trấn' },
      { name: 'Yên Viên', type: 'Thị trấn' },
      { name: 'Đa Tốn', type: 'Xã' },
      { name: 'Kiêu Kỵ', type: 'Xã' },
      { name: 'Bát Tràng', type: 'Xã' },
      { name: 'Cổ Bi', type: 'Xã' },
      { name: 'Đặng Xá', type: 'Xã' },
      { name: 'Đình Xuyên', type: 'Xã' },
      { name: 'Dương Hà', type: 'Xã' },
      { name: 'Dương Quang', type: 'Xã' },
      { name: 'Dương Xá', type: 'Xã' },
      { name: 'Kim Lan', type: 'Xã' },
      { name: 'Kim Sơn', type: 'Xã' },
      { name: 'Lệ Chi', type: 'Xã' },
      { name: 'Ninh Hiệp', type: 'Xã' },
      { name: 'Phù Đổng', type: 'Xã' },
      { name: 'Phú Thị', type: 'Xã' },
      { name: 'Văn Đức', type: 'Xã' },
      { name: 'Yên Thường', type: 'Xã' },
      { name: 'Đông Dư', type: 'Xã' }
    ],
    'Thanh Trì': [
      { name: 'Văn Điển', type: 'Thị trấn' },
      { name: 'Tân Triều', type: 'Xã' },
      { name: 'Thanh Liệt', type: 'Xã' },
      { name: 'Tả Thanh Oai', type: 'Xã' },
      { name: 'Hữu Hòa', type: 'Xã' },
      { name: 'Tam Hiệp', type: 'Xã' },
      { name: 'Tứ Hiệp', type: 'Xã' },
      { name: 'Ngũ Hiệp', type: 'Xã' },
      { name: 'Ngọc Hồi', type: 'Xã' },
      { name: 'Vĩnh Quỳnh', type: 'Xã' },
      { name: 'Đại Áng', type: 'Xã' },
      { name: 'Duyên Hà', type: 'Xã' },
      { name: 'Đông Mỹ', type: 'Xã' },
      { name: 'Liên Ninh', type: 'Xã' },
      { name: 'Vạn Phúc', type: 'Xã' },
      { name: 'Yên Mỹ', type: 'Xã' }
    ],
    'Sơn Tây': [
      { name: 'Lê Lợi', type: 'Phường' },
      { name: 'Quang Trung', type: 'Phường' },
      { name: 'Phú Thịnh', type: 'Phường' },
      { name: 'Ngô Quyền', type: 'Phường' },
      { name: 'Sơn Lộc', type: 'Phường' },
      { name: 'Xuân Khanh', type: 'Phường' },
      { name: 'Trung Hưng', type: 'Phường' },
      { name: 'Trung Sơn Trầm', type: 'Phường' },
      { name: 'Viên Sơn', type: 'Phường' },
      { name: 'Đường Lâm', type: 'Xã' },
      { name: 'Sơn Đông', type: 'Xã' },
      { name: 'Cổ Đông', type: 'Xã' },
      { name: 'Kim Sơn', type: 'Xã' },
      { name: 'Thanh Mỹ', type: 'Xã' },
      { name: 'Xuân Sơn', type: 'Xã' }
    ],
    'Quốc Oai': [
      { name: 'Quốc Oai', type: 'Thị trấn' },
      { name: 'Thạch Thán', type: 'Xã' },
      { name: 'Sài Sơn', type: 'Xã' },
      { name: 'Đồng Quang', type: 'Xã' },
      { name: 'Cấn Hữu', type: 'Xã' },
      { name: 'Cộng Hòa', type: 'Xã' },
      { name: 'Đại Thành', type: 'Xã' },
      { name: 'Đông Yên', type: 'Xã' },
      { name: 'Hòa Thạch', type: 'Xã' },
      { name: 'Liệp Tuyết', type: 'Xã' },
      { name: 'Nghĩa Hương', type: 'Xã' },
      { name: 'Ngọc Liệp', type: 'Xã' },
      { name: 'Ngọc Mỹ', type: 'Xã' },
      { name: 'Phú Cát', type: 'Xã' },
      { name: 'Phú Mãn', type: 'Xã' },
      { name: 'Phượng Cách', type: 'Xã' },
      { name: 'Tân Hòa', type: 'Xã' },
      { name: 'Tân Phú', type: 'Xã' },
      { name: 'Tuyết Nghĩa', type: 'Xã' },
      { name: 'Yên Sơn', type: 'Xã' },
      { name: 'Đông Xuân', type: 'Xã' }
    ],
    'Chương Mỹ': [
      { name: 'Chúc Sơn', type: 'Thị trấn' },
      { name: 'Xuân Mai', type: 'Thị trấn' },
      { name: 'Phụng Châu', type: 'Xã' },
      { name: 'Tiên Phương', type: 'Xã' },
      { name: 'Đông Phương Yên', type: 'Xã' },
      { name: 'Đông Sơn', type: 'Xã' },
      { name: 'Thủy Xuân Tiên', type: 'Xã' },
      { name: 'Phú Nghĩa', type: 'Xã' },
      { name: 'Tân Tiến', type: 'Xã' },
      { name: 'Nam Phương Tiến', type: 'Xã' },
      { name: 'Tốt Động', type: 'Xã' },
      { name: 'Lam Điền', type: 'Xã' },
      { name: 'Đại Yên', type: 'Xã' },
      { name: 'Hợp Đồng', type: 'Xã' },
      { name: 'Hoàng Văn Thụ', type: 'Xã' },
      { name: 'Quảng Bị', type: 'Xã' },
      { name: 'Mỹ Lương', type: 'Xã' },
      { name: 'Trần Phú', type: 'Xã' },
      { name: 'Thụy Hương', type: 'Xã' },
      { name: 'Thanh Bình', type: 'Xã' },
      { name: 'Thượng Vực', type: 'Xã' },
      { name: 'Văn Võ', type: 'Xã' },
      { name: 'Trung Hòa', type: 'Xã' },
      { name: 'Hồng Phong', type: 'Xã' },
      { name: 'Hữu Văn', type: 'Xã' },
      { name: 'Hoàng Diệu', type: 'Xã' },
      { name: 'Đồng Phú', type: 'Xã' },
      { name: 'Đồng Lạc', type: 'Xã' }
    ],
    'Đan Phượng': [
      { name: 'Phùng', type: 'Thị trấn' },
      { name: 'Đan Phượng', type: 'Xã' },
      { name: 'Đồng Tháp', type: 'Xã' },
      { name: 'Hạ Mỗ', type: 'Xã' },
      { name: 'Hồng Hà', type: 'Xã' },
      { name: 'Liên Hà', type: 'Xã' },
      { name: 'Liên Hồng', type: 'Xã' },
      { name: 'Liên Trung', type: 'Xã' },
      { name: 'Phương Đình', type: 'Xã' },
      { name: 'Song Phượng', type: 'Xã' },
      { name: 'Tân Hội', type: 'Xã' },
      { name: 'Tân Lập', type: 'Xã' },
      { name: 'Thọ An', type: 'Xã' },
      { name: 'Thọ Xuân', type: 'Xã' },
      { name: 'Thượng Mỗ', type: 'Xã' },
      { name: 'Trung Châu', type: 'Xã' }
    ],
    'Sóc Sơn': [
      { name: 'Sóc Sơn', type: 'Thị trấn' },
      { name: 'Phù Linh', type: 'Xã' },
      { name: 'Tiên Dược', type: 'Xã' },
      { name: 'Mai Đình', type: 'Xã' },
      { name: 'Quang Tiến', type: 'Xã' },
      { name: 'Hiền Ninh', type: 'Xã' },
      { name: 'Minh Phú', type: 'Xã' },
      { name: 'Minh Trí', type: 'Xã' },
      { name: 'Nam Sơn', type: 'Xã' },
      { name: 'Bắc Sơn', type: 'Xã' },
      { name: 'Hồng Kỳ', type: 'Xã' },
      { name: 'Trung Giã', type: 'Xã' },
      { name: 'Tân Hưng', type: 'Xã' },
      { name: 'Tân Minh', type: 'Xã' },
      { name: 'Xuân Giang', type: 'Xã' },
      { name: 'Đức Hòa', type: 'Xã' },
      { name: 'Đông Xuân', type: 'Xã' },
      { name: 'Kim Lũ', type: 'Xã' },
      { name: 'Phú Cường', type: 'Xã' },
      { name: 'Phú Minh', type: 'Xã' },
      { name: 'Phù Lỗ', type: 'Xã' },
      { name: 'Tân Dân', type: 'Xã' },
      { name: 'Thanh Xuân', type: 'Xã' },
      { name: 'Việt Long', type: 'Xã' },
      { name: 'Xuân Thu', type: 'Xã' }
    ],
    'Mê Linh': [
      { name: 'Chi Đông', type: 'Thị trấn' },
      { name: 'Quang Minh', type: 'Thị trấn' },
      { name: 'Mê Linh', type: 'Xã' },
      { name: 'Tiền Phong', type: 'Xã' },
      { name: 'Tráng Việt', type: 'Xã' },
      { name: 'Văn Khê', type: 'Xã' },
      { name: 'Đại Thịnh', type: 'Xã' },
      { name: 'Chu Phan', type: 'Xã' },
      { name: 'Hoàng Kim', type: 'Xã' },
      { name: 'Kim Hoa', type: 'Xã' },
      { name: 'Liên Mạc', type: 'Xã' },
      { name: 'Tam Đồng', type: 'Xã' },
      { name: 'Thạch Đà', type: 'Xã' },
      { name: 'Thanh Lâm', type: 'Xã' },
      { name: 'Tự Lập', type: 'Xã' },
      { name: 'Vạn Yên', type: 'Xã' }
    ],
    'Thường Tín': [
      { name: 'Thường Tín', type: 'Thị trấn' },
      { name: 'Hà Hồi', type: 'Xã' },
      { name: 'Quất Động', type: 'Xã' },
      { name: 'Duyên Thái', type: 'Xã' },
      { name: 'Ninh Sở', type: 'Xã' },
      { name: 'Hồng Vân', type: 'Xã' },
      { name: 'Văn Bình', type: 'Xã' },
      { name: 'Liên Phương', type: 'Xã' },
      { name: 'Vân Tảo', type: 'Xã' },
      { name: 'Thắng Lợi', type: 'Xã' },
      { name: 'Tô Hiệu', type: 'Xã' },
      { name: 'Nguyễn Trãi', type: 'Xã' },
      { name: 'Nghiêm Xuyên', type: 'Xã' },
      { name: 'Dũng Tiến', type: 'Xã' },
      { name: 'Nhị Khê', type: 'Xã' },
      { name: 'Khánh Hà', type: 'Xã' },
      { name: 'Hiền Giang', type: 'Xã' },
      { name: 'Hòa Bình', type: 'Xã' },
      { name: 'Tân Minh', type: 'Xã' },
      { name: 'Tiền Phong', type: 'Xã' },
      { name: 'Tự Nhiên', type: 'Xã' },
      { name: 'Vạn Điểm', type: 'Xã' },
      { name: 'Văn Phú', type: 'Xã' },
      { name: 'Văn Tự', type: 'Xã' },
      { name: 'Minh Cường', type: 'Xã' },
      { name: 'Chương Dương', type: 'Xã' },
      { name: 'An Mỹ', type: 'Xã' },
      { name: 'Lê Lợi', type: 'Xã' },
      { name: 'Thống Nhất', type: 'Xã' }
    ],
    'Thanh Oai': [
      { name: 'Kim Bài', type: 'Thị trấn' },
      { name: 'Cự Khê', type: 'Xã' },
      { name: 'Bích Hòa', type: 'Xã' },
      { name: 'Bình Minh', type: 'Xã' },
      { name: 'Cao Dương', type: 'Xã' },
      { name: 'Cao Viên', type: 'Xã' },
      { name: 'Dân Hòa', type: 'Xã' },
      { name: 'Đỗ Động', type: 'Xã' },
      { name: 'Hồng Dương', type: 'Xã' },
      { name: 'Kim An', type: 'Xã' },
      { name: 'Kim Thư', type: 'Xã' },
      { name: 'Liên Châu', type: 'Xã' },
      { name: 'Mỹ Hưng', type: 'Xã' },
      { name: 'Phương Trung', type: 'Xã' },
      { name: 'Tam Hưng', type: 'Xã' },
      { name: 'Tân Ước', type: 'Xã' },
      { name: 'Thanh Cao', type: 'Xã' },
      { name: 'Thanh Mai', type: 'Xã' },
      { name: 'Thanh Thùy', type: 'Xã' },
      { name: 'Thanh Văn', type: 'Xã' },
      { name: 'Xuân Dương', type: 'Xã' }
    ],
    'Ba Vì': [
      { name: 'Tây Đằng', type: 'Thị trấn' },
      { name: 'Ba Trại', type: 'Xã' },
      { name: 'Ba Vì', type: 'Xã' },
      { name: 'Cẩm Lĩnh', type: 'Xã' },
      { name: 'Cam Thượng', type: 'Xã' },
      { name: 'Châu Sơn', type: 'Xã' },
      { name: 'Chu Minh', type: 'Xã' },
      { name: 'Cổ Đô', type: 'Xã' },
      { name: 'Đông Quang', type: 'Xã' },
      { name: 'Đồng Thái', type: 'Xã' },
      { name: 'Khánh Thượng', type: 'Xã' },
      { name: 'Minh Châu', type: 'Xã' },
      { name: 'Minh Quang', type: 'Xã' },
      { name: 'Phong Vân', type: 'Xã' },
      { name: 'Phú Cường', type: 'Xã' },
      { name: 'Phú Đông', type: 'Xã' },
      { name: 'Phú Phương', type: 'Xã' },
      { name: 'Phú Sơn', type: 'Xã' },
      { name: 'Sơn Đà', type: 'Xã' },
      { name: 'Tân Hồng', type: 'Xã' },
      { name: 'Tân Lĩnh', type: 'Xã' },
      { name: 'Thái Hòa', type: 'Xã' },
      { name: 'Thuần Mỹ', type: 'Xã' },
      { name: 'Thụy An', type: 'Xã' },
      { name: 'Tiên Phong', type: 'Xã' },
      { name: 'Tòng Bạt', type: 'Xã' },
      { name: 'Vân Hòa', type: 'Xã' },
      { name: 'Vạn Thắng', type: 'Xã' },
      { name: 'Vật Lại', type: 'Xã' },
      { name: 'Yên Bài', type: 'Xã' },
      { name: 'Phú Châu', type: 'Xã' }
    ],
    'Phú Xuyên': [
      { name: 'Phú Xuyên', type: 'Thị trấn' },
      { name: 'Phú Minh', type: 'Thị trấn' },
      { name: 'Bạch Hạ', type: 'Xã' },
      { name: 'Châu Can', type: 'Xã' },
      { name: 'Chuyên Mỹ', type: 'Xã' },
      { name: 'Đại Thắng', type: 'Xã' },
      { name: 'Đại Xuyên', type: 'Xã' },
      { name: 'Hoàng Long', type: 'Xã' },
      { name: 'Hồng Minh', type: 'Xã' },
      { name: 'Hồng Thái', type: 'Xã' },
      { name: 'Khai Thái', type: 'Xã' },
      { name: 'Minh Tân', type: 'Xã' },
      { name: 'Nam Phong', type: 'Xã' },
      { name: 'Nam Tiến', type: 'Xã' },
      { name: 'Nam Triều', type: 'Xã' },
      { name: 'Phú Túc', type: 'Xã' },
      { name: 'Phú Yên', type: 'Xã' },
      { name: 'Phúc Tiến', type: 'Xã' },
      { name: 'Phượng Dực', type: 'Xã' },
      { name: 'Quang Lãng', type: 'Xã' },
      { name: 'Quang Trung', type: 'Xã' },
      { name: 'Sơn Hà', type: 'Xã' },
      { name: 'Tân Dân', type: 'Xã' },
      { name: 'Thụy Phú', type: 'Xã' },
      { name: 'Tri Thủy', type: 'Xã' },
      { name: 'Tri Trung', type: 'Xã' },
      { name: 'Văn Hoàng', type: 'Xã' },
      { name: 'Vân Từ', type: 'Xã' }
    ],
    'Phúc Thọ': [
      { name: 'Phúc Thọ', type: 'Thị trấn' },
      { name: 'Hát Môn', type: 'Xã' },
      { name: 'Hiệp Thuận', type: 'Xã' },
      { name: 'Liên Hiệp', type: 'Xã' },
      { name: 'Long Xuyên', type: 'Xã' },
      { name: 'Ngọc Tảo', type: 'Xã' },
      { name: 'Phúc Hòa', type: 'Xã' },
      { name: 'Phụng Thượng', type: 'Xã' },
      { name: 'Sen Phương', type: 'Xã' },
      { name: 'Tam Hiệp', type: 'Xã' },
      { name: 'Tam Thuấn', type: 'Xã' },
      { name: 'Thanh Đa', type: 'Xã' },
      { name: 'Thọ Lộc', type: 'Xã' },
      { name: 'Thượng Cốc', type: 'Xã' },
      { name: 'Tích Giang', type: 'Xã' },
      { name: 'Trạch Mỹ Lộc', type: 'Xã' },
      { name: 'Vân Hà', type: 'Xã' },
      { name: 'Vân Nam', type: 'Xã' },
      { name: 'Vân Phúc', type: 'Xã' },
      { name: 'Võng Xuyên', type: 'Xã' },
      { name: 'Xuân Đình', type: 'Xã' }
    ],
    'Mỹ Đức': [
      { name: 'Đại Nghĩa', type: 'Thị trấn' },
      { name: 'An Mỹ', type: 'Xã' },
      { name: 'An Phú', type: 'Xã' },
      { name: 'An Tiến', type: 'Xã' },
      { name: 'Bột Xuyên', type: 'Xã' },
      { name: 'Đại Hưng', type: 'Xã' },
      { name: 'Đốc Tín', type: 'Xã' },
      { name: 'Đồng Tâm', type: 'Xã' },
      { name: 'Hồng Sơn', type: 'Xã' },
      { name: 'Hợp Thanh', type: 'Xã' },
      { name: 'Hợp Tiến', type: 'Xã' },
      { name: 'Hùng Tiến', type: 'Xã' },
      { name: 'Hương Sơn', type: 'Xã' },
      { name: 'Lê Thanh', type: 'Xã' },
      { name: 'Mỹ Thành', type: 'Xã' },
      { name: 'Phù Lưu Tế', type: 'Xã' },
      { name: 'Phúc Lâm', type: 'Xã' },
      { name: 'Phùng Xá', type: 'Xã' },
      { name: 'Thượng Lâm', type: 'Xã' },
      { name: 'Tuy Lai', type: 'Xã' },
      { name: 'Vạn Kim', type: 'Xã' },
      { name: 'Xuy Xá', type: 'Xã' }
    ],
    'Ứng Hòa': [
      { name: 'Vân Đình', type: 'Thị trấn' },
      { name: 'Cao Thành', type: 'Xã' },
      { name: 'Đại Cường', type: 'Xã' },
      { name: 'Đại Hùng', type: 'Xã' },
      { name: 'Đội Bình', type: 'Xã' },
      { name: 'Đông Lỗ', type: 'Xã' },
      { name: 'Đồng Tân', type: 'Xã' },
      { name: 'Đồng Tiến', type: 'Xã' },
      { name: 'Hoa Sơn', type: 'Xã' },
      { name: 'Hòa Lâm', type: 'Xã' },
      { name: 'Hòa Nam', type: 'Xã' },
      { name: 'Hòa Phú', type: 'Xã' },
      { name: 'Hòa Xá', type: 'Xã' },
      { name: 'Hồng Quang', type: 'Xã' },
      { name: 'Kim Đường', type: 'Xã' },
      { name: 'Liên Bạt', type: 'Xã' },
      { name: 'Lưu Hoàng', type: 'Xã' },
      { name: 'Minh Đức', type: 'Xã' },
      { name: 'Phù Lưu', type: 'Xã' },
      { name: 'Phương Tú', type: 'Xã' },
      { name: 'Quảng Phú Cầu', type: 'Xã' },
      { name: 'Tảo Dương Văn', type: 'Xã' },
      { name: 'Trầm Lộng', type: 'Xã' },
      { name: 'Trung Tú', type: 'Xã' },
      { name: 'Trường Thịnh', type: 'Xã' },
      { name: 'Vạn Thái', type: 'Xã' },
      { name: 'Viên An', type: 'Xã' },
      { name: 'Viên Nội', type: 'Xã' }
    ]
  };

  private getFallbackWards(districtName: string): any[] {
    const list = this.HANOI_SUBURBAN_COMMUNES[districtName];
    if (list && list.length > 0) {
      return list.map((item, idx) => ({ id: 90000 + idx, name: item.name, type: item.type }));
    }
    return [];
  }

  onDistrictChange(): void {
    this.filters.ward = '';
    this.wards.set([]);
    this.onFilterChange();
    if (this.filters.district) {
      const fallback = this.getFallbackWards(this.filters.district);
      if (fallback.length > 0) {
        this.wards.set(fallback);
      }
      const districtObj = this.districts().find(d => d.name === this.filters.district);
      if (districtObj) {
        this.propertyService.getChildren(districtObj.id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.wards.set(data);
            }
          },
          error: (err) => console.error(err)
        });
      }
    }
  }

  onPostDistrictChange(): void {
    this.postAddressModel.ward = '';
    this.postWards.set([]);
    this.updatePostAddress();
    if (this.postAddressModel.district) {
      const fallback = this.getFallbackWards(this.postAddressModel.district);
      if (fallback.length > 0) {
        this.postWards.set(fallback);
      }
      const districtObj = this.districts().find(d => d.name === this.postAddressModel.district);
      if (districtObj) {
        this.propertyService.getChildren(districtObj.id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              this.postWards.set(data);
            }
          },
          error: (err) => console.error(err)
        });
      }
    }
  }

  onPostWardChange(): void {
    this.updatePostAddress();
  }

  onPostStreetChange(): void {
    this.updatePostAddress();
  }

  updatePostAddress(): void {
    const districtObj = this.districts().find(d => d.name === this.postAddressModel.district);
    const wardObj = this.postWards().find(w => w.name === this.postAddressModel.ward);

    const districtDisplay = districtObj ? `${districtObj.type} ${districtObj.name}` : this.postAddressModel.district;
    const wardDisplay = wardObj ? `${wardObj.type ? (wardObj.type + ' ') : ''}${wardObj.name}` : this.postAddressModel.ward;

    const parts = [
      this.postAddressModel.street,
      wardDisplay,
      districtDisplay
    ].filter(p => p && p.trim() !== '');
    this.postForm.address = parts.join(', ');
  }

  cleanPhoneNumber(phone?: string): string {
    if (!phone) return '';
    const match = phone.match(/\+?\d[\d\s.-]{7,}/);
    if (match) {
      return match[0].replace(/[^\d+]/g, '');
    }
    return phone.replace(/[^\d+]/g, '');
  }

  togglePricePopover(event: MouseEvent): void {
    event.stopPropagation();
    this.showPricePopover = !this.showPricePopover;
  }

  toggleAdvancedFilter(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showAdvancedFilter = !this.showAdvancedFilter;
  }

  selectPriceOption(option: string): void {
    this.selectedPriceOption = option;
    if (option === 'all') {
      this.filters.minPrice = null;
      this.filters.maxPrice = null;
      this.minPriceInput = null;
      this.maxPriceInput = null;
    } else if (option === 'under1_5m') {
      this.filters.minPrice = null;
      this.filters.maxPrice = 1500000;
      this.minPriceInput = 0;
      this.maxPriceInput = 1500000;
    } else if (option === '1_5to2_5m') {
      this.filters.minPrice = 1500000;
      this.filters.maxPrice = 2500000;
      this.minPriceInput = 1500000;
      this.maxPriceInput = 2500000;
    } else if (option === '2_5to4m') {
      this.filters.minPrice = 2500000;
      this.filters.maxPrice = 4000000;
      this.minPriceInput = 2500000;
      this.maxPriceInput = 4000000;
    } else if (option === '4to6m') {
      this.filters.minPrice = 4000000;
      this.filters.maxPrice = 6000000;
      this.minPriceInput = 4000000;
      this.maxPriceInput = 6000000;
    } else if (option === 'over6m') {
      this.filters.minPrice = 6000000;
      this.filters.maxPrice = null;
      this.minPriceInput = 6000000;
      this.maxPriceInput = 10000000;
    }
    this.onFilterChange();
  }

  onPriceInputCustom(): void {
    this.selectedPriceOption = 'custom';
    this.filters.minPrice = this.minPriceInput;
    this.filters.maxPrice = this.maxPriceInput;
    this.onFilterChange();
  }

  onSliderChange(): void {
    this.selectedPriceOption = 'custom';
    this.maxPriceInput = this.sliderValue;
    this.filters.maxPrice = this.sliderValue;
    this.onFilterChange();
  }

  resetPriceFilter(): void {
    this.selectPriceOption('all');
    this.showPricePopover = false;
  }

  applyPriceFilter(): void {
    this.showPricePopover = false;
    this.fetchPublicPosts();
  }

  getPriceLabel(): string {
    if (this.filters.minPrice === null && this.filters.maxPrice === null) {
      return 'Chọn mức giá';
    }
    if (this.filters.minPrice !== null && this.filters.maxPrice !== null) {
      return `${(this.filters.minPrice / 1000000).toFixed(1)} - ${(this.filters.maxPrice / 1000000).toFixed(1)} tr`;
    }
    if (this.filters.minPrice !== null) {
      return `Từ ${(this.filters.minPrice / 1000000).toFixed(1)} tr`;
    }
    if (this.filters.maxPrice !== null) {
      return `Dưới ${(this.filters.maxPrice / 1000000).toFixed(1)} tr`;
    }
    return 'Chọn mức giá';
  }

  // Quick sub-bar filters
  setQuickRoomFilter(hasRoom: boolean | null): void {
    this.filters.hasRoom = this.filters.hasRoom === hasRoom ? null : hasRoom;
    this.fetchPublicPosts();
  }

  setQuickSmokeFilter(smoke: boolean | null): void {
    this.filters.smoke = this.filters.smoke === smoke ? null : smoke;
    this.fetchPublicPosts();
  }

  setQuickSleepFilter(sleepLate: boolean | null): void {
    this.filters.sleepLate = this.filters.sleepLate === sleepLate ? null : sleepLate;
    this.fetchPublicPosts();
  }

  setQuickPetFilter(hasPet: boolean | null): void {
    this.filters.hasPet = this.filters.hasPet === hasPet ? null : hasPet;
    this.fetchPublicPosts();
  }

  // Amenity & Surrounding Helper Methods
  toggleAmenity(label: string): void {
    if (this.selectedAmenities.includes(label)) {
      this.selectedAmenities = this.selectedAmenities.filter(item => item !== label);
    } else {
      this.selectedAmenities = [...this.selectedAmenities, label];
    }
    this.filters.amenities = this.selectedAmenities.join(',');
    this.onFilterChange();
  }

  toggleAllAmenities(): void {
    if (this.areAllAmenitiesSelected()) {
      this.selectedAmenities = [];
    } else {
      this.selectedAmenities = this.amenityList.map(a => a.label);
    }
    this.filters.amenities = this.selectedAmenities.join(',');
    this.onFilterChange();
  }

  isAmenitySelected(label: string): boolean {
    return this.selectedAmenities.includes(label);
  }

  areAllAmenitiesSelected(): boolean {
    return this.amenityList.length > 0 && this.selectedAmenities.length === this.amenityList.length;
  }

  toggleSurrounding(label: string): void {
    if (this.selectedSurroundings.includes(label)) {
      this.selectedSurroundings = this.selectedSurroundings.filter(item => item !== label);
    } else {
      this.selectedSurroundings = [...this.selectedSurroundings, label];
    }
    this.filters.surroundings = this.selectedSurroundings.join(',');
    this.onFilterChange();
  }

  toggleAllSurroundings(): void {
    if (this.areAllSurroundingsSelected()) {
      this.selectedSurroundings = [];
    } else {
      this.selectedSurroundings = this.surroundingList.map(s => s.label);
    }
    this.filters.surroundings = this.selectedSurroundings.join(',');
    this.onFilterChange();
  }

  isSurroundingSelected(label: string): boolean {
    return this.selectedSurroundings.includes(label);
  }

  areAllSurroundingsSelected(): boolean {
    return this.surroundingList.length > 0 && this.selectedSurroundings.length === this.surroundingList.length;
  }

  toggleLeaseTerm(term: string): void {
    if (this.selectedLeaseTerms.includes(term)) {
      this.selectedLeaseTerms = this.selectedLeaseTerms.filter(t => t !== term);
    } else {
      this.selectedLeaseTerms = [...this.selectedLeaseTerms, term];
    }
    this.filters.leaseTerm = this.selectedLeaseTerms.join(',');
    this.onFilterChange();
  }

  isLeaseTermSelected(term: string): boolean {
    return this.selectedLeaseTerms.includes(term);
  }

  // Post Form Helpers for Amenities & Surroundings
  togglePostAmenity(label: string): void {
    if (this.postForm.amenities.includes(label)) {
      this.postForm.amenities = this.postForm.amenities.filter(a => a !== label);
    } else {
      this.postForm.amenities = [...this.postForm.amenities, label];
    }
  }

  isPostAmenitySelected(label: string): boolean {
    return this.postForm.amenities.includes(label);
  }

  toggleAllPostAmenities(): void {
    if (this.areAllPostAmenitiesSelected()) {
      this.postForm.amenities = [];
    } else {
      this.postForm.amenities = this.amenityList.map(a => a.label);
    }
  }

  areAllPostAmenitiesSelected(): boolean {
    return this.amenityList.length > 0 && this.postForm.amenities.length === this.amenityList.length;
  }

  togglePostSurrounding(label: string): void {
    if (this.postForm.surroundings.includes(label)) {
      this.postForm.surroundings = this.postForm.surroundings.filter(s => s !== label);
    } else {
      this.postForm.surroundings = [...this.postForm.surroundings, label];
    }
  }

  isPostSurroundingSelected(label: string): boolean {
    return this.postForm.surroundings.includes(label);
  }

  toggleAllPostSurroundings(): void {
    if (this.areAllPostSurroundingsSelected()) {
      this.postForm.surroundings = [];
    } else {
      this.postForm.surroundings = this.surroundingList.map(s => s.label);
    }
  }

  areAllPostSurroundingsSelected(): boolean {
    return this.surroundingList.length > 0 && this.postForm.surroundings.length === this.surroundingList.length;
  }

  togglePostLeaseTerm(term: string): void {
    if (this.postForm.leaseTerms.includes(term)) {
      this.postForm.leaseTerms = this.postForm.leaseTerms.filter(t => t !== term);
    } else {
      this.postForm.leaseTerms = [...this.postForm.leaseTerms, term];
    }
  }

  isPostLeaseTermSelected(term: string): boolean {
    return this.postForm.leaseTerms.includes(term);
  }

  resetAdvancedFilters(): void {
    this.selectedAmenities = [];
    this.selectedSurroundings = [];
    this.selectedLeaseTerms = [];
    this.filters.amenities = '';
    this.filters.surroundings = '';
    this.filters.occupation = 'All';
    this.filters.ageRange = 'All';
    this.filters.roommatesWanted = null;
    this.filters.leaseTerm = '';
    this.filters.moveInTime = 'All';
    this.filters.occupantsPerRoom = null;
    this.filters.budgetPerPerson = null;
    this.filters.personality = 'All';
    this.filters.smoke = null;
    this.filters.sleepLate = null;
    this.filters.hasPet = null;
    this.filters.cookFrequency = 'All';
    this.filters.inviteFriends = 'All';
    this.filters.hometown = '';
    this.filters.university = '';
    this.filters.otherCriteria = '';
    this.fetchPublicPosts();
  }

  resetFilters(): void {
    this.selectedAmenities = [];
    this.selectedSurroundings = [];
    this.selectedLeaseTerms = [];
    this.filters = {
      search: '',
      district: '',
      ward: '',
      university: '',
      hasRoom: null,
      gender: 'Any',
      minPrice: null,
      maxPrice: null,
      smoke: null,
      sleepLate: null,
      hasPet: null,
      hometown: '',
      amenities: '',
      surroundings: '',
      occupation: 'All',
      ageRange: 'All',
      roommatesWanted: null,
      leaseTerm: '',
      moveInTime: 'All',
      occupantsPerRoom: null,
      budgetPerPerson: null,
      personality: 'All',
      cookFrequency: 'All',
      inviteFriends: 'All',
      otherCriteria: ''
    };
    this.selectPriceOption('all');
    this.wards.set([]);
    this.showAdvancedFilter = false;
    this.fetchPublicPosts();
  }

  fetchMyProfile(): void {
    this.matchService.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.postForm.title = profile.title || this.postForm.title;
          this.postForm.hasRoom = profile.hasRoom !== undefined ? profile.hasRoom : this.postForm.hasRoom;
          this.postForm.address = profile.address || this.postForm.address;
          if (profile.contactPhone) {
            const match = profile.contactPhone.match(/(.*?)\s*\(Zalo:\s*(.*?)\)/i);
            if (match) {
              this.postForm.contactPhone = match[1].trim();
              this.postForm.contactZalo = match[2].trim();
            } else {
              this.postForm.contactPhone = profile.contactPhone;
            }
          }
          this.postForm.gender = profile.gender || this.postForm.gender;
          this.postForm.hometown = profile.hometown || this.postForm.hometown;
          this.postForm.smoke = profile.smoke || false;
          this.postForm.sleepLate = profile.sleepLate || false;
          this.postForm.hasPet = profile.hasPet || false;
          this.postForm.imageUrl = profile.imageUrl || '';
          this.postForm.description = profile.description || '';
          if (profile.budgetMin) this.postForm.budgetPerPerson = profile.budgetMin;
        }
      },
      error: () => {}
    });
  }

  formatCurrencyLive(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'string' ? Number(val.replace(/[^\d]/g, '')) : Number(val);
    if (isNaN(num) || num <= 0) return '';
    
    if (num >= 1000000) {
      const tr = (num / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      return `${num.toLocaleString('vi-VN')} đ (${tr} triệu)`;
    }
    if (num >= 1000) {
      return `${num.toLocaleString('vi-VN')} đ (${(num / 1000).toLocaleString('vi-VN')}k)`;
    }
    return `${num.toLocaleString('vi-VN')} đ`;
  }

  onPostImagesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const maxUpload = 10 - this.postImages.length;
      const count = Math.min(files.length, maxUpload);
      for (let i = 0; i < count; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.postImages.push(e.target.result);
          if (!this.postForm.imageBase64) {
            this.postForm.imageBase64 = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePostImage(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.postImages.splice(index, 1);
    this.postForm.imageBase64 = this.postImages.length > 0 ? this.postImages[0] : '';
  }

  getPostImages(post: any): string[] {
    if (!post || !post.imageUrl) return [];
    if (Array.isArray(post.imageUrl)) return post.imageUrl;
    return post.imageUrl.split(',').map((u: string) => u.trim()).filter((u: string) => u.length > 0);
  }

  nextModalImg(max: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeModalImgIdx.update(idx => (idx + 1) % max);
  }

  prevModalImg(max: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeModalImgIdx.update(idx => (idx - 1 + max) % max);
  }

  setModalImg(idx: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeModalImgIdx.set(idx);
  }

  parsePostDetails(post: any): {
    cleanDescription: string;
    bills: { electricity?: string; water?: string; service?: string; leaseTerm?: string; moveInTime?: string; occupants?: string; personality?: string; cookFrequency?: string; inviteFriends?: string; otherCriteria?: string; zalo?: string; ageRange?: string; occupation?: string };
    amenitiesList: string[];
    surroundingsList: string[];
  } {
    if (!post) {
      return { cleanDescription: '', bills: {}, amenitiesList: [], surroundingsList: [] };
    }

    const rawDesc = post.description || '';
    const bills: any = {};
    let cleanDescription = '';
    let amenitiesList: string[] = [];
    let surroundingsList: string[] = [];

    const parts = rawDesc.split(' | ');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('Mô tả:')) {
        cleanDescription = trimmed.replace(/^Mô tả:\s*/, '').trim();
      } else if (trimmed.startsWith('Tiền điện:')) {
        bills.electricity = trimmed.replace(/^Tiền điện:\s*/, '').trim();
      } else if (trimmed.startsWith('Tiền nước:')) {
        bills.water = trimmed.replace(/^Tiền nước:\s*/, '').trim();
      } else if (trimmed.startsWith('Dịch vụ:')) {
        bills.service = trimmed.replace(/^Dịch vụ:\s*/, '').trim();
      } else if (trimmed.startsWith('Thời gian thuê:')) {
        bills.leaseTerm = trimmed.replace(/^Thời gian thuê:\s*/, '').trim();
      } else if (trimmed.startsWith('Bắt đầu ở:')) {
        bills.moveInTime = trimmed.replace(/^Bắt đầu ở:\s*/, '').trim();
      } else if (trimmed.startsWith('Số người/phòng:')) {
        bills.occupants = trimmed.replace(/^Số người\/phòng:\s*/, '').trim();
      } else if (trimmed.startsWith('Nghề nghiệp:')) {
        bills.occupation = trimmed.replace(/^Nghề nghiệp:\s*/, '').trim();
      } else if (trimmed.startsWith('Độ tuổi:')) {
        bills.ageRange = trimmed.replace(/^Độ tuổi:\s*/, '').trim();
      } else if (trimmed.startsWith('Tính cách:')) {
        bills.personality = trimmed.replace(/^Tính cách:\s*/, '').trim();
      } else if (trimmed.startsWith('Nấu ăn:')) {
        bills.cookFrequency = trimmed.replace(/^Nấu ăn:\s*/, '').trim();
      } else if (trimmed.startsWith('Dẫn bạn về:')) {
        bills.inviteFriends = trimmed.replace(/^Dẫn bạn về:\s*/, '').trim();
      } else if (trimmed.startsWith('Tiện nghi:')) {
        const listStr = trimmed.replace(/^Tiện nghi:\s*/, '').trim();
        if (listStr) amenitiesList = listStr.split(',').map((s: string) => s.trim());
      } else if (trimmed.startsWith('Môi trường:')) {
        const listStr = trimmed.replace(/^Môi trường:\s*/, '').trim();
        if (listStr) surroundingsList = listStr.split(',').map((s: string) => s.trim());
      } else if (trimmed.startsWith('Sở thích/Tiêu chí khác:')) {
        bills.otherCriteria = trimmed.replace(/^Sở thích\/Tiêu chí khác:\s*/, '').trim();
      } else if (trimmed.startsWith('Zalo:')) {
        bills.zalo = trimmed.replace(/^Zalo:\s*/, '').trim();
      } else if (!cleanDescription && !trimmed.includes(':')) {
        cleanDescription = trimmed;
      }
    }

    return {
      cleanDescription,
      bills,
      amenitiesList,
      surroundingsList
    };
  }

  openGoogleMapsSearch(address: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!address) return;
    const q = encodeURIComponent(`${address}, Hà Nội`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  onPostImageSelected(event: any): void {
    this.onPostImagesSelected(event);
  }

  submitPostForm(): void {
    if (!this.postForm.title || !this.postForm.contactPhone) {
      this.toastService.show('Vui lòng điền đầy đủ Tiêu đề bài đăng và Số điện thoại liên hệ.', 'error');
      return;
    }

    this.isSubmittingPost.set(true);

    // Compile structured criteria string to save in description
    const structuredCriteria = [
      this.postForm.description ? `Mô tả: ${this.postForm.description}` : '',
      `Nghề nghiệp: ${this.postForm.occupation}`,
      `Độ tuổi: ${this.postForm.ageRange}`,
      `Số người/phòng: ${this.postForm.occupantsPerRoom} người`,
      `Ngân sách/người: ${this.postForm.budgetPerPerson ? Number(this.postForm.budgetPerPerson).toLocaleString() + ' đ/người' : 'Thỏa thuận'}`,
      this.postForm.electricityFee ? `Tiền điện: ${Number(this.postForm.electricityFee).toLocaleString()} đ/kWh` : '',
      this.postForm.waterFee ? `Tiền nước: ${Number(this.postForm.waterFee).toLocaleString()} đ (${this.postForm.waterFeeType === 'per_m3' ? 'Theo khối m³' : 'Theo đầu người'})` : '',
      this.postForm.serviceFee ? `Dịch vụ: ${Number(this.postForm.serviceFee).toLocaleString()} đ` : '',
      this.postForm.leaseTerms?.length ? `Thời gian thuê: ${this.postForm.leaseTerms.join(', ')}` : '',
      `Bắt đầu ở: ${this.postForm.moveInTime}`,
      this.postForm.amenities?.length ? `Tiện nghi: ${this.postForm.amenities.join(', ')}` : '',
      this.postForm.surroundings?.length ? `Môi trường: ${this.postForm.surroundings.join(', ')}` : '',
      `Tính cách: ${this.postForm.personality}`,
      `Giấc ngủ: ${this.postForm.sleepLate ? 'Thức khuya' : 'Dậy sớm'}`,
      `Hút thuốc: ${this.postForm.smoke ? 'Có hút thuốc' : 'Không hút thuốc'}`,
      `Thú cưng: ${this.postForm.hasPet ? 'Nuôi thú cưng OK' : 'Không nuôi'}`,
      `Nấu ăn: ${this.postForm.cookFrequency}`,
      `Dẫn bạn về: ${this.postForm.inviteFriends}`,
      this.postForm.otherCriteria ? `Sở thích/Tiêu chí khác: ${this.postForm.otherCriteria}` : '',
      this.postForm.contactZalo ? `Zalo: ${this.postForm.contactZalo}` : ''
    ].filter(Boolean).join(' | ');

    const payload = {
      title: this.postForm.title,
      hasRoom: this.postForm.hasRoom,
      address: this.postForm.address || this.postAddressModel.street,
      contactPhone: this.postForm.contactPhone + (this.postForm.contactZalo ? ` (Zalo: ${this.postForm.contactZalo})` : ''),
      gender: this.postForm.gender,
      roommateGenderPreference: 'Any',
      budgetMin: this.postForm.budgetPerPerson || 0,
      budgetMax: this.postForm.budgetPerPerson || 0,
      smoke: this.postForm.smoke,
      sleepLate: this.postForm.sleepLate,
      hasPet: this.postForm.hasPet,
      hometown: this.postForm.hometown,
      description: structuredCriteria,
      imageUrl: this.postImages.length > 0 ? this.postImages.join(',') : this.postForm.imageUrl,
      imageBase64: this.postImages.length > 0 ? this.postImages[0] : this.postForm.imageBase64,
      imagesBase64: this.postImages
    };

    this.matchService.saveProfile(payload).subscribe({
      next: (res) => {
        this.isSubmittingPost.set(false);
        this.toastService.show(res.message || 'Đã đăng tin tìm bạn ở ghép thành công!', 'success');
        this.setTab('board');
      },
      error: () => {
        this.isSubmittingPost.set(false);
        this.toastService.show('Lỗi đăng bài tìm ở ghép.', 'error');
      }
    });
  }

  fetchSuggestions(): void {
    this.isMatchingLoading.set(true);
    this.matchService.getSuggestedRoommates().subscribe({
      next: (suggestions) => {
        this.matchSuggestions.set(suggestions);
        this.isMatchingLoading.set(false);
      },
      error: (err) => {
        this.isMatchingLoading.set(false);
        const msg = err.error?.message || 'Vui lòng điền thông tin đăng tin bài ở ghép trước.';
        this.toastService.show(msg, 'info');
      }
    });
  }

  openPostModal(post: any): void {
    this.selectedPost.set(post);
    this.activeModalImgIdx.set(0);
  }

  closePostModal(): void {
    this.selectedPost.set(null);
  }

  copyPhoneNumber(phone: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!phone) {
      this.toastService.show('Chưa có số điện thoại liên hệ.', 'error');
      return;
    }
    const cleanNum = this.cleanPhoneNumber(phone);
    navigator.clipboard.writeText(cleanNum).then(() => {
      this.toastService.show(`Đã sao chép SĐT: ${cleanNum}`, 'success');
    }).catch(() => {
      this.toastService.show(`SĐT liên hệ: ${cleanNum}`, 'info');
    });
  }

  getImageUrl(url?: string): string {
    if (!url) return 'assets/default-room.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) return url;
    return `${environment.baseUrl}${url}`;
  }
}
