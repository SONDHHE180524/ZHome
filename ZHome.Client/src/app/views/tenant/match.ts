import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../services/match.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

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
            
            <!-- Floating Search Pill Filter Bar (Matching Landing Page Search Style) -->
            <div class="match-search-section mb-4">
              <div class="search-pill-container glass-panel">
                <div class="search-pill">
                  
                  <!-- Keyword Search -->
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
                        placeholder="Bạn muốn tìm bạn ở ghép khu vực nào?" />
                      @if (filters.search) {
                        <button type="button" class="btn-clear-inline" (click)="filters.search = ''; onFilterChange()">&times;</button>
                      }
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- University / Area Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      <select [(ngModel)]="filters.university" (change)="onFilterChange()">
                        <option value="">Tất cả Trường & Khu vực</option>
                        <option value="Bách Khoa">ĐH Bách Khoa Hà Nội</option>
                        <option value="Quốc Gia">ĐH Quốc Gia Hà Nội</option>
                        <option value="Kinh Tế Quốc Dân">ĐH Kinh Tế Quốc Dân</option>
                        <option value="FPT">Đại học FPT Hòa Lạc</option>
                        <option value="Xây Dựng">Đại học Xây Dựng</option>
                        <option value="Thương Mại">Đại học Thương Mại</option>
                        <option value="Giao Thông">ĐH Giao Thông Vận Tải</option>
                        <option value="Học Viện Tài Chính">Học Viện Tài Chính</option>
                        <option value="Bưu Chính Viễn Thông">Học Viện CNBCVT</option>
                      </select>
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- Room Status Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      <select [(ngModel)]="filters.hasRoom" (change)="onFilterChange()">
                        <option [ngValue]="null">Tất cả tình trạng phòng</option>
                        <option [ngValue]="true">Đã có sẵn phòng trọ</option>
                        <option [ngValue]="false">Chưa có phòng (tìm người ghép)</option>
                      </select>
                    </div>
                  </div>

                  <div class="pill-divider"></div>

                  <!-- Gender Select -->
                  <div class="pill-group select-group">
                    <div class="select-with-icon">
                      <svg class="select-prefix-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <select [(ngModel)]="filters.gender" (change)="onFilterChange()">
                        <option value="Any">Tất cả giới tính</option>
                        <option value="Male">Chỉ bạn Nam</option>
                        <option value="Female">Chỉ bạn Nữ</option>
                      </select>
                    </div>
                  </div>

                  <!-- Action Search Button -->
                  <button class="pill-search-btn-primary" (click)="onFilterChange()">
                    <svg class="btn-search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>Tìm kiếm</span>
                  </button>

                </div>
              </div>

              <!-- Quick Tag Filters & Status Header Bar -->
              <div class="filter-sub-bar mt-3">
                <div class="filter-chips-list">
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasRoom === null && filters.gender === 'Any' && !filters.university" 
                    (click)="resetFilters()">
                    Tất cả
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasRoom === true" 
                    (click)="setQuickRoomFilter(true)">
                    Đã có sẵn phòng
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.hasRoom === false" 
                    (click)="setQuickRoomFilter(false)">
                    Tìm phòng ghép
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.gender === 'Male'" 
                    (click)="setQuickGenderFilter('Male')">
                    Bạn Nam
                  </button>
                  <button 
                    class="filter-chip" 
                    [class.active]="filters.gender === 'Female'" 
                    (click)="setQuickGenderFilter('Female')">
                    Bạn Nữ
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
                          <strong class="price-val">{{ post.budgetMin | number:'1.0-0' }}đ - {{ post.budgetMax | number:'1.0-0' }}đ</strong>
                          <span class="price-unit">/tháng</span>
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
            <div class="form-header-title">
              <div class="form-badge-top">ĐĂNG TIN MIỄN PHÍ</div>
              <h2>Đăng Bài Tìm Bạn Ở Ghép Cho Sinh Viên</h2>
              <p class="text-muted text-sm">Điền thông tin chi tiết bài đăng để sinh viên khác tìm thấy bạn dễ dàng nhất</p>
            </div>

            <form (ngSubmit)="submitPostForm()" class="mt-4">
              
              <!-- Section 1 -->
              <div class="form-section-divider">
                <span class="section-num">1</span>
                <span>Thông tin bài đăng & Phòng trọ</span>
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
                  placeholder="Ví dụ: Tìm 1 bạn Nam sinh viên ở ghép phòng 25m2 gần ĐH Bách Khoa, đầy đủ ĐH, tủ lạnh..." />
              </div>

              <!-- University & HasRoom -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label for="postUniv" class="form-label-bold">Trường Đại học / Khu vực <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    id="postUniv" 
                    name="university" 
                    [(ngModel)]="postForm.university" 
                    required 
                    class="form-control-modern" 
                    placeholder="Ví dụ: ĐH Bách Khoa, FPT Hòa Lạc, Quốc Gia Cầu Giấy..." />
                </div>

                <div class="form-group">
                  <label for="postHasRoom" class="form-label-bold">Tình trạng phòng trọ hiện tại</label>
                  <select id="postHasRoom" name="hasRoom" [(ngModel)]="postForm.hasRoom" class="form-control-modern">
                    <option [ngValue]="true">Đã có sẵn phòng trọ (Tìm người vào ở cùng)</option>
                    <option [ngValue]="false">Chưa có phòng (Muốn tìm người ghép đi tìm phòng)</option>
                  </select>
                </div>
              </div>

              <!-- Section 2 -->
              <div class="form-section-divider mt-4">
                <span class="section-num">2</span>
                <span>Ngân sách chi trả & Vị trí phòng</span>
              </div>

              <!-- Budget Range & Address -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label class="form-label-bold">Ngân sách chi trả (VND/tháng/người)</label>
                  <div class="d-flex gap-2">
                    <input type="number" name="budgetMin" [(ngModel)]="postForm.budgetMin" class="form-control-modern" placeholder="Từ (VND)" />
                    <input type="number" name="budgetMax" [(ngModel)]="postForm.budgetMax" class="form-control-modern" placeholder="Đến (VND)" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="postAddress" class="form-label-bold">Địa chỉ phòng trọ (Nếu có)</label>
                  <input type="text" id="postAddress" name="address" [(ngModel)]="postForm.address" class="form-control-modern" placeholder="Ví dụ: Ngõ 8 Tân Xã, Thạch Thất" />
                </div>
              </div>

              <!-- Gender & Preferences -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label for="postGender" class="form-label-bold">Giới tính của bạn</label>
                  <select id="postGender" name="gender" [(ngModel)]="postForm.gender" class="form-control-modern">
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="postPrefGender" class="form-label-bold">Ưu tiên giới tính bạn ở ghép</label>
                  <select id="postPrefGender" name="roommateGenderPreference" [(ngModel)]="postForm.roommateGenderPreference" class="form-control-modern">
                    <option value="Any">Bất kỳ ai (Nam / Nữ đều được)</option>
                    <option value="Male">Chỉ ghép với Nam</option>
                    <option value="Female">Chỉ ghép với Nữ</option>
                  </select>
                </div>
              </div>

              <!-- Section 3 -->
              <div class="form-section-divider mt-4">
                <span class="section-num">3</span>
                <span>Khảo sát thói quen sinh hoạt</span>
              </div>

              <!-- Habits Survey -->
              <div class="habits-checkbox-grid mb-3">
                <label class="habit-check-card" [class.checked]="postForm.sleepLate">
                  <input type="checkbox" name="sleepLate" [(ngModel)]="postForm.sleepLate" />
                  <svg class="check-mono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span class="check-label-text">Thức đêm (sau 12h đêm)</span>
                </label>
                <label class="habit-check-card" [class.checked]="postForm.smoke">
                  <input type="checkbox" name="smoke" [(ngModel)]="postForm.smoke" />
                  <svg class="check-mono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="8" x2="18" y2="8.01"/>
                    <path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/>
                  </svg>
                  <span class="check-label-text">Có hút thuốc lá / vape</span>
                </label>
                <label class="habit-check-card" [class.checked]="postForm.hasPet">
                  <input type="checkbox" name="hasPet" [(ngModel)]="postForm.hasPet" />
                  <svg class="check-mono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="15" r="4"/>
                    <circle cx="6.5" cy="9.5" r="2"/>
                    <circle cx="17.5" cy="9.5" r="2"/>
                  </svg>
                  <span class="check-label-text">Có nuôi thú cưng</span>
                </label>
              </div>

              <!-- Section 4 -->
              <div class="form-section-divider mt-4">
                <span class="section-num">4</span>
                <span>Thông tin liên hệ & Hình ảnh</span>
              </div>

              <!-- Contact Info & Hometown -->
              <div class="form-grid-2 mb-3">
                <div class="form-group">
                  <label for="postPhone" class="form-label-bold">Số điện thoại / Zalo liên hệ <span class="text-danger">*</span></label>
                  <input type="text" id="postPhone" name="contactPhone" [(ngModel)]="postForm.contactPhone" required class="form-control-modern" placeholder="Ví dụ: 0912345678" />
                </div>
                <div class="form-group">
                  <label for="postHometown" class="form-label-bold">Quê quán</label>
                  <input type="text" id="postHometown" name="hometown" [(ngModel)]="postForm.hometown" class="form-control-modern" placeholder="Ví dụ: Thanh Hóa, Nam Định, Hải Phòng..." />
                </div>
              </div>

              <!-- Image Upload -->
              <div class="form-group mb-3">
                <label class="form-label-bold">Ảnh thực tế phòng trọ (Nếu có)</label>
                <input type="file" accept="image/*" (change)="onPostImageSelected($event)" class="file-input-hidden" id="postImageFile" />
                <label for="postImageFile" class="image-upload-dropzone-modern mt-1">
                  @if (postImagePreview) {
                    <img [src]="postImagePreview" alt="Xem trước ảnh" class="preview-img-modern" />
                    <span class="change-img-btn">Bấm để đổi ảnh khác</span>
                  } @else if (postForm.imageUrl) {
                    <img [src]="getImageUrl(postForm.imageUrl)" alt="Ảnh phòng hiện tại" class="preview-img-modern" />
                    <span class="change-img-btn">Bấm để đổi ảnh khác</span>
                  } @else {
                    <div class="dropzone-center-content">
                      <svg class="upload-mono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <strong>Tải ảnh phòng trọ của bạn</strong>
                      <span class="upload-hint">Định dạng JPG, PNG (Dung lượng < 5MB)</span>
                    </div>
                  }
                </label>
              </div>

              <!-- Description -->
              <div class="form-group mb-4">
                <label for="postDesc" class="form-label-bold">Lời giới thiệu & Yêu cầu chi tiết</label>
                <textarea 
                  id="postDesc" 
                  name="description" 
                  [(ngModel)]="postForm.description" 
                  rows="4" 
                  class="form-control-modern" 
                  placeholder="Giới thiệu thêm về bản thân: Đang học ngành gì, tính cách, giờ giấc đi làm/đi học, mong muốn môi trường ở cùng hòa đồng..."></textarea>
              </div>

              <div class="form-actions-row d-flex justify-content-end gap-3 mt-4">
                <button type="button" (click)="setTab('board')" class="btn-cancel-form">Hủy bỏ</button>
                <button type="submit" [disabled]="isSubmittingPost()" class="btn-submit-post-vip">
                  <span>{{ isSubmittingPost() ? 'Đang đăng tin...' : 'Đăng Tin Tìm Bạn Ở Ghép Ngay' }}</span>
                </button>
              </div>

            </form>
          </div>
        }

        <!-- 3. TAB: AI MATCHMAKER -->
        @if (activeTab() === 'matches') {
          <div class="matches-list-container animate-fade-in">
            <div class="ai-banner-showcase mb-4">
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
                      <span class="text-xs text-muted">Ngân sách dự kiến:</span>
                      <strong class="text-sky font-bold">{{ candidate.budgetMin | number:'1.0-0' }}đ - {{ candidate.budgetMax | number:'1.0-0' }}đ/tháng</strong>
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

      <!-- POST DETAIL POPUP MODAL (MINIMAL BLACK & WHITE ICONS) -->
      @if (selectedPost(); as p) {
        <div class="modal-backdrop" (click)="closePostModal()">
          <div class="modal-card max-w-700 post-detail-modal-custom animate-scale-up" (click)="$event.stopPropagation()">
            
            <!-- Modal Header with Badges -->
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
              <button (click)="closePostModal()" class="modal-close-btn" title="Đóng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="post-modal-body mt-3">
              <!-- Post Image (If available) -->
              @if (p.imageUrl) {
                <div class="post-modal-img-wrapper mb-3">
                  <img [src]="getImageUrl(p.imageUrl)" alt="Ảnh phòng trọ" />
                  <div class="img-overlay-info">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>Ảnh thực tế phòng</span>
                  </div>
                </div>
              }

              <!-- Post Title & Meta -->
              <h2 class="post-detail-main-title">{{ p.title || 'Bài Đăng Tìm Bạn Ở Ghép Phòng Trọ' }}</h2>
              
              <div class="post-author-snippet mb-3">
                <div class="author-avatar-round">{{ p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U' }}</div>
                <div class="author-meta-text">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <strong class="author-name-lg">{{ p.fullName }}</strong>
                    <span class="verified-badge" title="Tài khoản đã xác minh">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Đã xác minh SV</span>
                    </span>
                  </div>
                  <span class="author-subtext">Trường: {{ p.university || 'Khu vực sinh viên' }} • Quê quán: {{ p.hometown || 'Chưa cập nhật' }}</span>
                </div>
              </div>

              <!-- Primary Highlights Grid (Price & Location) -->
              <div class="primary-highlights-box mb-3">
                <div class="highlight-item budget-highlight">
                  <span class="hl-label">Ngân sách dự kiến:</span>
                  <strong class="hl-value text-emerald">{{ p.budgetMin | number:'1.0-0' }}đ - {{ p.budgetMax | number:'1.0-0' }}đ <span class="hl-unit">/tháng/người</span></strong>
                </div>
                <div class="highlight-item location-highlight">
                  <span class="hl-label">Địa chỉ / Khu vực:</span>
                  <strong class="hl-value text-slate">{{ p.address || p.university || 'Khu vực sinh viên' }}</strong>
                </div>
              </div>

              <!-- Habits & Living Preferences Cards (Clean Minimal Line SVGs) -->
              <div class="habits-section-card mb-3">
                <h4 class="section-title-sm">Thói quen sinh hoạt & Lối sống</h4>
                <div class="habits-detail-grid">
                  
                  <div class="habit-badge-card" [class.active-sky]="p.sleepLate" [class.active-calm]="!p.sleepLate">
                    <div class="habit-icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path *ngIf="p.sleepLate" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        <circle *ngIf="!p.sleepLate" cx="12" cy="12" r="5"/>
                      </svg>
                    </div>
                    <div>
                      <span class="habit-title">Giờ giấc ngủ</span>
                      <strong>{{ p.sleepLate ? 'Thường thức muộn (Sau 12h)' : 'Ngủ sớm điều độ' }}</strong>
                    </div>
                  </div>

                  <div class="habit-badge-card" [class.danger-subtle]="p.smoke" [class.success-subtle]="!p.smoke">
                    <div class="habit-icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="8" x2="18" y2="8.01"/>
                        <path d="M12 8c0 2.5-2 2.5-2 5s2 2.5 2 5"/>
                      </svg>
                    </div>
                    <div>
                      <span class="habit-title">Hút thuốc lá / Vape</span>
                      <strong>{{ p.smoke ? 'Có hút thuốc' : 'Không hút thuốc' }}</strong>
                    </div>
                  </div>

                  <div class="habit-badge-card" [class.warning-subtle]="p.hasPet" [class.info-subtle]="!p.hasPet">
                    <div class="habit-icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="15" r="4"/>
                        <circle cx="6.5" cy="9.5" r="2"/>
                        <circle cx="17.5" cy="9.5" r="2"/>
                      </svg>
                    </div>
                    <div>
                      <span class="habit-title">Nuôi thú cưng</span>
                      <strong>{{ p.hasPet ? 'Có nuôi thú cưng' : 'Không nuôi thú cưng' }}</strong>
                    </div>
                  </div>

                  <div class="habit-badge-card highlight-subtle">
                    <div class="habit-icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <span class="habit-title">Ưu tiên ghép cùng</span>
                      <strong>{{ p.roommateGenderPreference === 'Any' ? 'Nam hoặc Nữ đều được' : (p.roommateGenderPreference === 'Male' ? 'Chỉ ghép với Nam' : 'Chỉ ghép với Nữ') }}</strong>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Extra Description -->
              @if (p.description) {
                <div class="description-section-card mb-3">
                  <h4 class="section-title-sm">Lời nhắn & Giới thiệu chi tiết</h4>
                  <p class="desc-content-text">{{ p.description }}</p>
                </div>
              }

              <!-- VIP CONTACT ACTION BOX -->
              <div class="vip-contact-card">
                <div class="contact-header-row">
                  <div class="contact-badge-pulse">
                    <span class="pulse-dot"></span>
                    <span>LIÊN HỆ TRỰC TIẾP CHÍNH CHỦ</span>
                  </div>
                  <span class="free-badge">Miễn phí 100%</span>
                </div>

                <div class="contact-phone-showcase">
                  <div class="phone-display-box">
                    <span class="phone-label">Số điện thoại / Zalo người đăng:</span>
                    <strong class="phone-number-lg">{{ p.phone || p.contactPhone || 'Chưa cập nhật SĐT' }}</strong>
                  </div>
                  @if (p.phone || p.contactPhone) {
                    <button type="button" class="btn-copy-phone" (click)="copyPhoneNumber(p.phone || p.contactPhone, $event)" title="Sao chép số điện thoại">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      <span>Sao chép SĐT</span>
                    </button>
                  }
                </div>

                <!-- Action Buttons -->
                <div class="contact-actions-grid mt-3">
                  @if (p.phone || p.contactPhone) {
                    <a href="tel:{{ p.phone || p.contactPhone }}" class="btn-call-vip">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>Gọi Điện Thoại Ngay</span>
                    </a>

                    <a href="https://zalo.me/{{ p.phone || p.contactPhone }}" target="_blank" class="btn-zalo-vip">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.08L5 22l4.13-1.65c.92.27 1.89.42 2.87.42 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1 13.5h-2v-2h2v2zm0-4h-2V7h2v4.5z"/>
                      </svg>
                      <span>Nhắn Tin Qua Zalo</span>
                    </a>
                  } @else {
                    <p class="text-muted text-center m-0">Người đăng chưa để lại số điện thoại.</p>
                  }
                </div>

                <!-- Safety Note -->
                <div class="safety-tip-box mt-3">
                  <svg class="tip-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span><strong>Mẹo an toàn:</strong> Khuyên bạn nên trao đổi kỹ lối sống và hẹn xem phòng thực tế trực tiếp cùng chủ trọ trước khi quyết định ở ghép.</span>
                </div>
              </div>

            </div>

            <div class="modal-footer-custom mt-3">
              <button (click)="closePostModal()" class="btn-close-modal">Đóng cửa sổ</button>
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

    /* 3. FLOATING SEARCH PILL (LANDING PAGE STYLE) */
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
      padding: 6px 10px;
      min-width: 0;
    }
    .search-input-group {
      flex: 1.6;
    }
    .pill-divider {
      width: 1px;
      height: 32px;
      background: #e2e8f0;
      flex-shrink: 0;
    }
    .input-with-icon, .select-with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .search-prefix-svg, .select-prefix-svg {
      width: 17px;
      height: 17px;
      color: #0284c7;
      flex-shrink: 0;
    }
    .pill-group input[type="text"], .pill-group select {
      width: 100%;
      border: none;
      background: transparent;
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      cursor: pointer;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .pill-group input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }
    .btn-clear-inline {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .btn-clear-inline:hover {
      color: #0f172a;
    }

    .pill-search-btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border: none;
      padding: 12px 26px;
      border-radius: 99px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-search-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.5);
      background: linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%);
    }
    .btn-search-svg {
      width: 16px;
      height: 16px;
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
      transition: all 0.2s ease;
    }
    .filter-chip:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .filter-chip.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
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
      font-weight: 800;
    }
    .btn-reset-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #64748b;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-reset-pill:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* 4. POSTS GRID & CARDS */
    .posts-board-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 22px;
    }
    .post-card-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .post-card-item:hover {
      transform: translateY(-6px);
      border-color: #7dd3fc;
      box-shadow: 0 16px 32px -6px rgba(2, 132, 199, 0.16);
    }
    .post-card-thumb {
      position: relative;
      width: 100%;
      height: 190px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .post-card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .post-card-item:hover .post-card-thumb img {
      transform: scale(1.06);
    }
    .post-card-thumb-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .placeholder-svg {
      width: 44px;
      height: 44px;
    }
    .placeholder-text { font-size: 0.82rem; font-weight: 800; color: #475569; }

    .room-status-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 20px;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      display: inline-flex;
      align-items: center;
    }
    .badge-has-room { background: rgba(220, 252, 231, 0.95); color: #15803d; border: 1px solid #86efac; }
    .badge-no-room { background: rgba(224, 242, 254, 0.95); color: #0369a1; border: 1px solid #7dd3fc; }

    .post-card-content {
      padding: 18px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: space-between;
    }
    .gender-pill {
      align-self: flex-start;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
    }
    .gender-pill.male { background: #e0f2fe; color: #0369a1; }
    .gender-pill.female { background: #fce7f3; color: #be185d; }

    .post-card-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0c4a6e;
      line-height: 1.4;
      margin: 0;
    }
    .post-meta-details .meta-row {
      margin: 4px 0;
      font-size: 0.85rem;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .price-showcase-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 8px 12px;
      border-radius: 10px;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .price-showcase-box .price-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }
    .price-showcase-box .price-val {
      font-size: 1.05rem;
      font-weight: 900;
      color: #16a34a;
    }
    .price-showcase-box .price-unit {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
    }

    .habits-tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .h-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      display: inline-flex;
      align-items: center;
    }
    .h-tag-active { background: #e0f2fe; color: #0369a1; }
    .h-tag-danger { background: #ffe4e6; color: #be123c; }
    .h-tag-warning { background: #fef3c7; color: #b45309; }

    .post-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    .author-mini-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);
    }
    .author-text-meta .author-name {
      font-weight: 800;
      font-size: 0.85rem;
      color: #0f172a;
      display: block;
    }
    .author-text-meta .post-time {
      font-size: 0.72rem;
      color: #94a3b8;
      display: block;
    }

    /* 5. POST FORM CARD */
    .post-form-card-vip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 36px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }
    .max-w-850 { max-width: 850px; }
    .form-header-title {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .form-badge-top {
      display: inline-block;
      background: #e0f2fe;
      color: #0284c7;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .form-header-title h2 {
      font-size: 1.6rem;
      font-weight: 900;
      color: #0c4a6e;
      margin: 0 0 6px 0;
    }
    .form-section-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 24px 0 16px 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }
    .section-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0284c7;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.78rem;
    }
    .form-label-bold {
      display: block;
      font-size: 0.85rem;
      font-weight: 800;
      color: #334155;
      margin-bottom: 6px;
    }
    .form-control-modern {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.92rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control-modern:focus {
      border-color: #0284c7;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 650px) {
      .form-grid-2 { grid-template-columns: 1fr; }
    }

    .habits-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .habit-check-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      padding: 14px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 700;
      color: #475569;
      transition: all 0.2s ease;
    }
    .habit-check-card input {
      accent-color: #0284c7;
      width: 18px;
      height: 18px;
    }
    .check-mono-svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #64748b;
    }
    .habit-check-card.checked {
      background: #e0f2fe;
      border-color: #0284c7;
      color: #0369a1;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
    }
    .habit-check-card.checked .check-mono-svg {
      color: #0284c7;
    }

    .image-upload-dropzone-modern {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed #7dd3fc;
      background: #f0f9ff;
      border-radius: 14px;
      padding: 24px;
      cursor: pointer;
      color: #0284c7;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .image-upload-dropzone-modern:hover {
      background: #e0f2fe;
      border-color: #0284c7;
    }
    .dropzone-center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .upload-mono-svg { width: 32px; height: 32px; margin-bottom: 4px; }
    .upload-hint { font-size: 0.75rem; color: #64748b; font-weight: 500; }
    .preview-img-modern {
      max-height: 180px;
      border-radius: 10px;
      object-fit: cover;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
    }
    .change-img-btn {
      font-size: 0.78rem;
      margin-top: 8px;
      color: #0284c7;
    }

    .btn-submit-post-vip {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #ffffff;
      font-weight: 800;
      font-size: 1rem;
      padding: 13px 28px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.3);
      transition: all 0.25s ease;
    }
    .btn-submit-post-vip:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 26px rgba(2, 132, 199, 0.4);
      background: linear-gradient(135deg, #0369a1, #0284c7);
    }
    .btn-cancel-form {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      padding: 12px 22px;
      border-radius: 12px;
      cursor: pointer;
    }

    /* 6. AI MATCHMAKER BANNER & CARDS */
    .ai-banner-showcase {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      border-radius: 20px;
      padding: 30px 36px;
      color: #ffffff;
      box-shadow: 0 16px 36px -10px rgba(67, 56, 202, 0.3);
    }
    .ai-badge-top {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 900;
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }
    .ai-banner-content h2 {
      font-size: 1.8rem;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
    }
    .ai-banner-content p {
      color: #c7d2fe;
      margin: 0;
      font-size: 0.92rem;
      max-width: 750px;
      line-height: 1.6;
    }

    .matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .candidate-card-sky {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .candidate-card-sky:hover {
      border-color: #38bdf8;
      transform: translateY(-4px);
      box-shadow: 0 14px 28px rgba(2, 132, 199, 0.15);
    }
    .candidate-header-bar {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .compat-ring-sky {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 3.5px solid #0284c7;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f0f9ff;
      flex-shrink: 0;
    }
    .compat-ring-sky.high-compat {
      border-color: #10b981;
      background: #ecfdf5;
    }
    .compat-ring-sky.high-compat .compat-val { color: #059669; }
    .compat-val { font-size: 1.05rem; font-weight: 900; color: #0284c7; line-height: 1; }
    .compat-lbl { font-size: 0.55rem; color: #64748b; text-transform: uppercase; font-weight: 800; }
    .candidate-person-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .candidate-person-sub {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0;
    }

    /* Buttons */
    .btn-action-sky {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.88rem;
      padding: 9px 18px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action-sky:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
      background: linear-gradient(135deg, #0369a1, #0284c7);
    }
    .btn-outline-sky {
      background: #ffffff;
      color: #0284c7;
      border: 1.5px solid #7dd3fc;
      font-weight: 800;
      padding: 9px 18px;
      border-radius: 10px;
      cursor: pointer;
    }

    /* Modal Backdrop & Advanced Popup Container */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px);
      z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .max-w-700 { max-width: 700px; }
    
    .post-detail-modal-custom {
      background: #ffffff !important;
      color: #0f172a !important;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(226, 232, 240, 0.9);
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
    }
    .animate-scale-up {
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scaleUp {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .post-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #f1f5f9;
    }
    .room-status-badge-lg {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
    }
    .room-status-badge-lg.badge-has-room {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .room-status-badge-lg.badge-no-room {
      background: #e0f2fe;
      color: #0284c7;
      border: 1px solid #7dd3fc;
    }
    .gender-pill-lg {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
    }
    .gender-pill-lg.male { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .gender-pill-lg.female { background: #fce7f3; color: #be185d; border: 1px solid #fbcfe8; }

    .modal-close-btn {
      background: #f1f5f9;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .modal-close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .post-modal-img-wrapper {
      position: relative;
      width: 100%;
      max-height: 260px;
      border-radius: 14px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .post-modal-img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .img-overlay-info {
      position: absolute;
      bottom: 10px;
      right: 12px;
      background: rgba(15, 23, 42, 0.7);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      backdrop-filter: blur(4px);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .post-detail-main-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0c4a6e;
      line-height: 1.35;
      margin: 10px 0 12px 0;
    }

    /* Author Snippet */
    .post-author-snippet {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .author-avatar-round {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
    }
    .author-name-lg {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .verified-badge {
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
    .author-subtext {
      font-size: 0.82rem;
      color: #64748b;
      display: block;
      margin-top: 2px;
    }

    /* Highlights Box */
    .primary-highlights-box {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 14px 16px;
      border-radius: 14px;
    }
    @media (max-width: 600px) {
      .primary-highlights-box { grid-template-columns: 1fr; }
    }
    .highlight-item .hl-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .highlight-item .hl-value {
      font-size: 1.15rem;
      font-weight: 900;
    }
    .text-emerald { color: #059669 !important; }
    .text-slate { color: #1e293b !important; font-size: 0.95rem !important; }
    .hl-unit {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    /* Habits Cards */
    .habits-section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .section-title-sm {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px 0;
    }
    .habits-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 550px) {
      .habits-detail-grid { grid-template-columns: 1fr; }
    }
    .habit-badge-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .habit-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      flex-shrink: 0;
    }
    .habit-badge-card .habit-title {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }
    .habit-badge-card strong {
      font-size: 0.85rem;
      color: #0f172a;
    }
    .active-sky { background: #f0f9ff; border-color: #bae6fd; }
    .active-calm { background: #f8fafc; border-color: #e2e8f0; }
    .danger-subtle { background: #fff1f2; border-color: #fecdd3; }
    .success-subtle { background: #f0fdf4; border-color: #bbf7d0; }
    .warning-subtle { background: #fffbeb; border-color: #fde68a; }
    .info-subtle { background: #f8fafc; border-color: #e2e8f0; }
    .highlight-subtle { background: #faf5ff; border-color: #e9d5ff; }

    /* Description */
    .description-section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .desc-content-text {
      margin: 0;
      font-size: 0.88rem;
      color: #334155;
      line-height: 1.6;
    }

    /* VIP CONTACT CARD */
    .vip-contact-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
      border: 2px solid #86efac;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.12);
    }
    .contact-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .contact-badge-pulse {
      display: inline-flex;
      align-items: center;
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
      flex-shrink: 0;
      color: #0284c7;
      margin-top: 1px;
    }

    .modal-footer-custom {
      display: flex;
      justify-content: flex-end;
    }
    .btn-close-modal {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      padding: 9px 22px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }
    .btn-close-modal:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .empty-feed-icon {
      margin-bottom: 8px;
    }
    .spinner-sky {
      width: 44px; height: 44px; border: 4px solid #e2e8f0; border-top-color: #0284c7;
      border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class TenantMatchComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  activeTab = signal<'board' | 'post' | 'matches'>('board');

  // Filters for public posts board
  filters = {
    search: '',
    university: '',
    hasRoom: null as boolean | null,
    gender: 'Any',
    maxPrice: null as number | null
  };

  // Lists and loading states
  publicPosts = signal<any[]>([]);
  isBoardLoading = signal(false);

  matchSuggestions = signal<any[]>([]);
  isMatchingLoading = signal(false);

  selectedPost = signal<any | null>(null);

  // Form for posting/editing listing
  postForm = {
    title: '',
    university: '',
    hasRoom: false,
    address: '',
    contactPhone: '',
    imageUrl: '',
    imageBase64: '',
    gender: 'Male',
    budgetMin: 1500000,
    budgetMax: 3000000,
    smoke: false,
    sleepLate: false,
    hasPet: false,
    hometown: '',
    description: '',
    roommateGenderPreference: 'Any'
  };

  postImagePreview: string | null = null;
  isSubmittingPost = signal(false);

  ngOnInit(): void {
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
    }
  }

  setTab(tab: 'board' | 'post' | 'matches'): void {
    if ((tab === 'post' || tab === 'matches') && !this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập tài khoản Khách thuê để đăng tin hoặc sử dụng AI Matchmaker.', 'info');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/tenant/match' } });
      return;
    }
    this.activeTab.set(tab);
    if (tab === 'board') {
      this.fetchPublicPosts();
    } else if (tab === 'matches') {
      this.fetchSuggestions();
    }
  }

  fetchPublicPosts(): void {
    this.isBoardLoading.set(true);
    this.matchService.getPublicPosts(this.filters).subscribe({
      next: (posts) => {
        this.publicPosts.set(posts);
        this.isBoardLoading.set(false);
      },
      error: () => {
        this.isBoardLoading.set(false);
        this.toastService.show('Lỗi tải danh sách bài đăng ở ghép.', 'error');
      }
    });
  }

  onFilterChange(): void {
    this.fetchPublicPosts();
  }

  setQuickRoomFilter(hasRoom: boolean | null): void {
    this.filters.hasRoom = this.filters.hasRoom === hasRoom ? null : hasRoom;
    this.fetchPublicPosts();
  }

  setQuickGenderFilter(gender: string): void {
    this.filters.gender = this.filters.gender === gender ? 'Any' : gender;
    this.fetchPublicPosts();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      university: '',
      hasRoom: null,
      gender: 'Any',
      maxPrice: null
    };
    this.fetchPublicPosts();
  }

  fetchMyProfile(): void {
    this.matchService.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.postForm = { ...this.postForm, ...profile };
        }
      },
      error: () => {
        // Ignored
      }
    });
  }

  onPostImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.postImagePreview = e.target.result;
        this.postForm.imageBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitPostForm(): void {
    if (!this.postForm.title || !this.postForm.university || !this.postForm.contactPhone) {
      this.toastService.show('Vui lòng điền đầy đủ Tiêu đề, Trường học và SĐT liên hệ.', 'error');
      return;
    }

    this.isSubmittingPost.set(true);

    this.matchService.saveProfile(this.postForm).subscribe({
      next: (res) => {
        this.isSubmittingPost.set(false);
        this.toastService.show(res.message || 'Đã đăng tin tìm bạn ở ghép thành công!', 'success');
        this.setTab('board'); // Switch to public feed
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
    navigator.clipboard.writeText(phone).then(() => {
      this.toastService.show(`Đã sao chép SĐT: ${phone}`, 'success');
    }).catch(() => {
      this.toastService.show(`SĐT liên hệ: ${phone}`, 'info');
    });
  }

  getImageUrl(url?: string): string {
    if (!url) return 'assets/default-room.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url}`;
  }
}
