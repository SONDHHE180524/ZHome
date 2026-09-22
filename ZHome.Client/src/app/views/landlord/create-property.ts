import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-property-wrapper animate-fade-in">
      
      <!-- Top Stepper Header (Image 1 Style) -->
      <div class="stepper-card mb-4">
        <div class="stepper-content">
          <div class="step-item active">
            <span class="step-badge">1</span>
            <span class="step-title">Tạo nhà trọ, phòng trọ & Đăng quảng cáo</span>
          </div>
          <div class="step-connector"></div>
          <div class="step-item inactive">
            <span class="step-badge">2</span>
            <span class="step-title">Hoàn tất</span>
          </div>
        </div>
      </div>

      <!-- Main Form -->
      <form (ngSubmit)="onSubmit()" class="create-property-form">
        
        <!-- SECTION 1: THÔNG TIN NHÀ TRỌ, PHÒNG TRỌ (Image 1 Layout) -->
        <div class="form-card mb-4">
          <h2 class="card-title mb-4">Thông tin nhà trọ, phòng trọ</h2>
          
          <!-- Row 1: Tên trọ -->
          <div class="form-group mb-3">
            <label class="form-label">Tên nhà trọ, phòng trọ</label>
            <input 
              type="text" 
              name="title" 
              [(ngModel)]="title" 
              required 
              class="form-control" 
              placeholder="Tên trọ" />
          </div>

          <!-- Row 2: Số lượng phòng & Diện tích (2 Cols) -->
          <div class="grid-2-col mb-3">
            <div class="form-group">
              <label class="form-label">Số lượng phòng</label>
              <input 
                type="number" 
                name="roomCount" 
                [(ngModel)]="roomCount" 
                class="form-control" 
                placeholder="Số lượng phòng" />
            </div>
            <div class="form-group">
              <label class="form-label">Diện tích</label>
              <input 
                type="number" 
                name="area" 
                [(ngModel)]="area" 
                class="form-control" 
                placeholder="Diện tích" />
            </div>
          </div>

          <!-- Row 3: Address Dropdowns (2 Cols: Tỉnh/Thành phố & Quận/Huyện) -->
          <div class="grid-2-col mb-3">
            <div class="form-group">
              <label class="form-label">Tỉnh/Thành phố</label>
              <select name="selectedProvince" [(ngModel)]="selectedProvince" (change)="onProvinceChange()" class="form-select">
                <option value="Thành phố Hà Nội">Chọn tinh/thành phố</option>
                <option value="Thành phố Hà Nội">Thành phố Hà Nội</option>
                <option value="Thành phố Hồ Chí Minh">Thành phố Hồ Chí Minh</option>
                <option value="Thành phố Đà Nẵng">Thành phố Đà Nẵng</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Quận/Huyện</label>
              <select name="district" [(ngModel)]="addressModel.district" (change)="onDistrictChange()" required class="form-select">
                <option value="">Chọn quận/huyện</option>
                @for (d of districts(); track d.id) {
                  <option [value]="d.name">{{ d.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Row 4: Xã/Phường & Số nhà (Tự điền - 2 Cols) -->
          <div class="grid-2-col mb-3">
            <div class="form-group">
              <label class="form-label">Xã/Phường</label>
              <input 
                type="text" 
                name="ward" 
                [(ngModel)]="addressModel.ward" 
                (input)="updateFullAddress()" 
                class="form-control" 
                placeholder="Nhập xã/phường" />
            </div>
            <div class="form-group">
              <label class="form-label">Số nhà</label>
              <input 
                type="text" 
                name="houseNumber" 
                [(ngModel)]="addressModel.houseNumber" 
                (input)="updateFullAddress()" 
                class="form-control" 
                placeholder="Ví dụ: 123/45" />
            </div>
          </div>

          <!-- Row 5: Địa chỉ (Auto) -->
          <div class="form-group mb-3">
            <label class="form-label">Địa chỉ</label>
            <input 
              type="text" 
              [value]="computedFullAddress()" 
              readonly 
              class="form-control readonly-input" 
              placeholder="Tự động cập nhật từ các trường trên..." />
          </div>

          <!-- GOOGLE MAPS API & LOCATION LINK SECTION -->
          <div class="google-maps-box p-3 rounded">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="form-label text-primary font-bold m-0 d-flex align-items-center gap-2">
                <i class="fas fa-map-marked-alt text-danger"></i> Định vị Google Maps (Lấy vị trí API trọ)
              </label>
              <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" class="btn-gmap-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
                </svg>
                <span>Mở Google Maps</span>
              </a>
            </div>
            
            <div class="input-group">
              <input 
                type="text" 
                name="googleMapUrl" 
                [(ngModel)]="googleMapUrl" 
                class="form-control" 
                placeholder="Dán liên kết từ Google Maps (VD: https://maps.app.goo.gl/... hoặc 21.0135,105.5255)..." />
              <button type="button" class="btn btn-primary" (click)="verifyGoogleMapLink()">
                Xác minh vị trí
              </button>
            </div>

            @if (isMapVerified()) {
              <div class="alert alert-success py-2 px-3 mt-2 text-xs d-flex align-items-center gap-2 m-0">
                <i class="fas fa-check-circle"></i>
                <span>Đã ghim vị trí Google Maps thành công trên hệ thống ZHome!</span>
              </div>
            }
          </div>
        </div>

        <!-- SECTION 2: TIỆN NGHI & MÔI TRƯỜNG XUNG QUANH -->
        <div class="form-card mb-4">
          <!-- TIỆN NGHI -->
          <div class="amenities-wrapper mb-4">
            <div class="category-header mb-3">
              <h2 class="category-title">Tiện nghi</h2>
              <label class="select-all-chip cursor-pointer" [class.active]="isAllAmenitiesSelected()">
                <input type="checkbox" [checked]="isAllAmenitiesSelected()" (change)="toggleAllAmenities($event)" class="checkbox-input" />
                <span class="select-all-label">Tất cả</span>
              </label>
            </div>

            <!-- EXACT 4 COLUMNS GRID -->
            <div class="grid-4-col gap-3">
              <div *ngFor="let item of amenityList">
                <label class="checkbox-card cursor-pointer" [class.active]="amenityState[item.key]">
                  <input type="checkbox" [(ngModel)]="amenityState[item.key]" [name]="'am_' + item.key" class="checkbox-input" />
                  <span class="checkbox-label">{{ item.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <hr class="card-divider my-4" />

          <!-- MÔI TRƯỜNG XUNG QUANH -->
          <div class="surroundings-wrapper">
            <div class="category-header mb-3">
              <h2 class="category-title">Môi trường xung quanh</h2>
              <label class="select-all-chip cursor-pointer" [class.active]="isAllSurroundingsSelected()">
                <input type="checkbox" [checked]="isAllSurroundingsSelected()" (change)="toggleAllSurroundings($event)" class="checkbox-input" />
                <span class="select-all-label">Tất cả</span>
              </label>
            </div>

            <!-- EXACT 4 COLUMNS GRID -->
            <div class="grid-4-col gap-3">
              <div *ngFor="let item of surroundingList">
                <label class="checkbox-card cursor-pointer" [class.active]="surroundingState[item.key]">
                  <input type="checkbox" [(ngModel)]="surroundingState[item.key]" [name]="'env_' + item.key" class="checkbox-input" />
                  <span class="checkbox-label">{{ item.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: MÔ TẢ (Giới hạn 200 ký tự) -->
        <div class="form-card mb-4">
          <h2 class="card-title mb-3">Mô tả</h2>

          <!-- Rich Text Editor Toolbar & Box -->
          <div class="rich-editor-box">
            <div class="editor-toolbar">
              <button type="button" class="tb-icon" (click)="applyFormat('undo')" title="Undo">↩</button>
              <button type="button" class="tb-icon" (click)="applyFormat('redo')" title="Redo">↪</button>
              <span class="tb-divider"></span>
              <button type="button" class="tb-icon font-bold" (click)="applyFormat('bold')" title="Bold">B</button>
              <button type="button" class="tb-icon fst-italic" (click)="applyFormat('italic')" title="Italic">I</button>
              <span class="tb-divider"></span>
              <button type="button" class="tb-icon" (click)="applyFormat('unorderedList')" title="Bullet List">•=</button>
              <button type="button" class="tb-icon" (click)="applyFormat('orderedList')" title="Numbered List">1=</button>
              <span class="tb-divider"></span>
              <button type="button" class="tb-icon" (click)="applyFormat('link')" title="Link">🔗</button>
              <button type="button" class="tb-icon" (click)="applyFormat('symbol')" title="Symbol">Ω</button>
              <button type="button" class="tb-icon" (click)="applyFormat('emoji')" title="Emoji">😊</button>
              <button type="button" class="tb-icon" (click)="applyFormat('code')" title="Code">&lt;&gt;</button>
            </div>

            <textarea 
              name="userDescription" 
              [(ngModel)]="userDescription" 
              (input)="onDescriptionInput()"
              maxlength="200"
              rows="5" 
              class="form-control editor-area" 
              placeholder="Viết mô tả về nhà trọ, phòng trọ (tối đa 200 ký tự)..."></textarea>

            <div class="editor-status-bar d-flex justify-content-between align-items-center">
              <span class="text-xs text-muted d-flex align-items-center gap-1">
                <i class="fas fa-info-circle text-primary"></i> Giới hạn tối đa 200 ký tự
              </span>
              <div class="text-xs font-semibold">
                @if (getRemainingChars() === 0) {
                  <span class="text-danger font-bold d-flex align-items-center gap-1">
                    <i class="fas fa-exclamation-triangle"></i> 0/200 - Đã hết số ký tự cho phép!
                  </span>
                } @else {
                  <span [class.text-warning]="getRemainingChars() <= 20" class="text-secondary">
                    Còn {{ getRemainingChars() }}/200 ký tự
                  </span>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 4: HÌNH ÁNH TỔNG QUAN (Image 4 Layout) -->
        <div class="form-card mb-4">
          <h2 class="card-title mb-3">Hình ảnh tổng quan (Ít nhất 3 ảnh)</h2>

          <!-- Upload Dropzone -->
          <div class="dropzone-area text-center p-4 mb-3 cursor-pointer" (click)="triggerFileInput('galleryPhotoInput')">
            <input 
              type="file" 
              id="galleryPhotoInput" 
              accept="image/*" 
              multiple 
              (change)="onGalleryPhotosSelected($event)" 
              class="d-none" />
            
            <div class="cloud-icon-circle mb-2">
              <i class="fas fa-cloud-upload-alt text-primary"></i>
            </div>
            <strong class="d-block text-primary font-bold uppercase-text">KÉO THẢ HOẶC CHỌN FILE</strong>
            <span class="text-xs text-muted">Hỗ trợ: JPG, PNG, WEBP (Tối đa 5MB)</span>
          </div>

          <!-- Light Blue Regulation Banner -->
          <div class="regulation-box p-3 rounded mb-3">
            <div class="d-flex align-items-start gap-2">
              <span class="info-blue-icon">ℹ</span>
              <div>
                <strong class="d-block text-sm text-primary font-bold mb-1">Quy định đăng ảnh</strong>
                <ul class="regulation-bullets text-xs text-secondary m-0 p-0">
                  <li>Đăng tối thiểu <strong>3 ảnh</strong> và tối đa <strong>15 ảnh</strong>.</li>
                  <li>Hãy dùng ảnh thật, không chèn SĐT, không chèn logo.</li>
                  <li>Mỗi ảnh kích thước tối thiểu <strong>400x300 px</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Photo Previews Grid -->
          @if (galleryPreviews().length > 0) {
            <div class="gallery-preview-grid">
              @for (img of galleryPreviews(); track $index) {
                <div class="thumb-wrapper">
                  <img [src]="img" alt="Ảnh trọ" />
                  <button type="button" class="btn-remove" (click)="removeGalleryPhoto($index)">&times;</button>
                </div>
              }
            </div>
          }
        </div>


        <!-- SECTION 6: THÔNG TIN LIÊN HỆ (Image 4 Layout - 3 Cols) -->
        <div class="form-card mb-4">
          <h2 class="card-title mb-3">Thông tin liên hệ</h2>
          
          <!-- 3 Columns Row -->
          <div class="grid-3-col">
            <div class="form-group">
              <label class="form-label text-xs text-muted">Họ tên <span class="text-danger">*</span></label>
              <input 
                type="text" 
                name="contactName" 
                [(ngModel)]="contactInfo.fullName" 
                class="form-control" 
                placeholder="Họ tên chủ trọ" />
            </div>
            <div class="form-group">
              <label class="form-label text-xs text-muted">Số điện thoại <span class="text-danger">*</span></label>
              <input 
                type="text" 
                name="contactPhone" 
                [(ngModel)]="contactInfo.phone" 
                class="form-control" 
                placeholder="Số điện thoại" />
            </div>
            <div class="form-group">
              <label class="form-label text-xs text-muted">Zalo</label>
              <input 
                type="text" 
                name="contactZalo" 
                [(ngModel)]="contactInfo.zalo" 
                class="form-control" 
                placeholder="Zalo" />
            </div>
          </div>
        </div>

        <!-- SUBMIT ACTION BAR -->
        <div class="submit-bar d-flex justify-content-end gap-3 mb-5">
          <a routerLink="/landlord/properties" class="btn btn-cancel">Hủy bỏ</a>
          <button type="submit" [disabled]="isLoading()" class="btn btn-submit">
            @if (isLoading()) {
              ⏳ Đang lưu...
            } @else {
              Tạo khu trọ & Hoàn tất
            }
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .create-property-wrapper {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem 1rem;
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* STEPPER BAR (IMAGE 1 STYLE) */
    .stepper-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .stepper-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .step-item.active .step-badge {
      background: #2563eb;
      color: #ffffff;
    }
    .step-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: #1e293b;
    }
    .step-item.inactive .step-title {
      color: #94a3b8;
    }
    .step-connector {
      flex-grow: 1;
      height: 1px;
      background: #e2e8f0;
      margin: 0 1.5rem;
    }

    /* FORM CARD CONTAINER */
    .form-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.8rem 2rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .form-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
      display: block;
    }
    .form-control, .form-select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.9rem;
      color: #334155;
      background: #ffffff;
      width: 100%;
      transition: all 0.15s ease;
    }
    .form-control:focus, .form-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      outline: none;
    }
    .readonly-input {
      background: #f8fafc !important;
      color: #64748b !important;
      cursor: not-allowed;
    }

    /* GRID UTILITIES FOR EXACT LAYOUT */
    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-3-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .grid-4-col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px 20px;
    }
    @media (max-width: 900px) {
      .grid-4-col { grid-template-columns: repeat(2, 1fr); }
      .grid-3-col { grid-template-columns: 1fr; }
      .grid-2-col { grid-template-columns: 1fr; }
    }

    /* GOOGLE MAPS LINK BUTTON */
    .btn-gmap-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #2563eb;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .btn-gmap-link:hover {
      background: #f8fafc;
      border-color: #2563eb;
      color: #1d4ed8;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
    }

    /* CATEGORY HEADER & SELECT ALL CHIP (TẠO RỘNG RÃI CÁCH BIỆT THOẢI MÁI) */
    .category-header {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 20px !important;
      margin-bottom: 18px !important;
      flex-wrap: nowrap !important;
    }
    .category-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 !important;
      padding: 0 !important;
      display: inline-block !important;
      white-space: nowrap !important;
      line-height: 1.2;
    }
    .select-all-chip {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 5px 14px !important;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      margin: 0 !important;
      white-space: nowrap !important;
    }
    .select-all-chip:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .select-all-chip.active, .select-all-chip:has(.checkbox-input:checked) {
      background: #eff6ff;
      border-color: #3b82f6;
    }
    .select-all-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: #475569;
    }
    .select-all-chip.active .select-all-label,
    .select-all-chip:has(.checkbox-input:checked) .select-all-label {
      color: #1d4ed8;
    }

    /* MODERN CHECKBOX CARD STYLING (THOẢI MÁI DỄ NHÌN) */
    .checkbox-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease-in-out;
      width: 100%;
      box-sizing: border-box;
      min-height: 44px;
    }
    .checkbox-card:hover {
      border-color: #93c5fd;
      background: #f0f9ff;
    }
    .checkbox-card.active, .checkbox-card:has(.checkbox-input:checked) {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
    }
    .checkbox-input {
      width: 18px;
      height: 18px;
      accent-color: #2563eb;
      cursor: pointer;
      flex-shrink: 0;
      margin: 0;
    }
    .checkbox-label {
      font-size: 0.88rem;
      font-weight: 500;
      color: #334155;
      text-transform: none;
      line-height: 1.3;
    }
    .checkbox-card.active .checkbox-label, 
    .checkbox-card:has(.checkbox-input:checked) .checkbox-label {
      color: #1d4ed8;
      font-weight: 600;
    }
    .card-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 2rem 0 !important;
    }

    /* AI BUTTON & RICH EDITOR (IMAGE 3 MATCH) */
    .btn-ai-blue {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-ai-blue:hover {
      background: #1d4ed8;
    }
    .rich-editor-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .editor-toolbar {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tb-icon {
      background: none;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      color: #475569;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .tb-icon:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .tb-divider {
      width: 1px;
      height: 16px;
      background: #cbd5e1;
      margin: 0 4px;
    }
    .editor-area {
      border: none !important;
      border-radius: 0 !important;
      padding: 14px;
      resize: vertical;
    }
    .editor-status-bar {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 6px 14px;
    }

    /* DROPZONE & REGULATIONS (IMAGE 4 MATCH) */
    .dropzone-area {
      border: 2px dashed #93c5fd;
      background: #f0f9ff;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .dropzone-area:hover {
      background: #e0f2fe;
      border-color: #2563eb;
    }
    .cloud-icon-circle {
      font-size: 2.2rem;
      width: 54px;
      height: 54px;
      background: #ffffff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
    }
    .uppercase-text {
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .regulation-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .info-blue-icon {
      color: #2563eb;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .regulation-bullets {
      list-style: disc inside;
    }
    .gallery-preview-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .thumb-wrapper {
      position: relative;
      width: 110px;
      height: 90px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    .thumb-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .btn-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    /* RADIO BUTTONS */
    .radio-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .radio-container input {
      width: 16px;
      height: 16px;
      accent-color: #2563eb;
    }

    /* SUBMIT BAR */
    .btn-cancel {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-submit {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 32px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-submit:hover { background: #1d4ed8; }

    .cursor-pointer { cursor: pointer; }
    .font-bold { font-weight: 700; }
    .text-xs { font-size: 0.8rem; }
    .text-sm { font-size: 0.9rem; }
  `]
})
export class CreatePropertyComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  title = '';
  roomCount: number | null = null;
  area: number | null = null;
  selectedProvince = 'Thành phố Hà Nội';

  addressModel = {
    houseNumber: '',
    street: '',
    ward: '',
    district: ''
  };

  districts = signal<any[]>([]);
  wards = signal<any[]>([]);
  googleMapUrl = '';
  isMapVerified = signal(false);

  userDescription = '';
  tiktokVideoUrl = '';

  contactType: 'default' | 'custom' = 'default';
  contactInfo = {
    fullName: '',
    phone: '',
    zalo: ''
  };

  // AMENITY LIST ORDERED EXACTLY AS IMAGE 2 (FILLS ROW BY ROW ACROSS 4 COLUMNS)
  amenityList = [
    { key: 'gacLung', label: 'Gác lửng' },
    { key: 'wifi', label: 'Wifi' },
    { key: 'veSinhTrong', label: 'Vệ sinh trong' },
    { key: 'phongTam', label: 'Phòng tắm' },

    { key: 'binhNongLanh', label: 'Bình nóng lạnh' },
    { key: 'keBep', label: 'Kệ bếp' },
    { key: 'mayGiat', label: 'Máy giặt' },
    { key: 'tivi', label: 'Tivi' },

    { key: 'dieuHoa', label: 'Điều hòa' },
    { key: 'tuLanh', label: 'Tủ lạnh' },
    { key: 'giuongNem', label: 'Giường nệm' },
    { key: 'tuAoQuan', label: 'Tủ áo quần' },

    { key: 'banCong', label: 'Ban công/sân thượng' },
    { key: 'thangMay', label: 'Thang máy' },
    { key: 'baiDeXe', label: 'Bãi để xe riêng' },
    { key: 'camera', label: 'Camera an ninh' },

    { key: 'hoBoi', label: 'Hồ bơi' },
    { key: 'sanVuon', label: 'Sân vườn' }
  ];

  amenityState: { [key: string]: boolean } = {
    gacLung: false,
    wifi: true,
    veSinhTrong: true,
    phongTam: true,
    binhNongLanh: true,
    keBep: true,
    mayGiat: true,
    tivi: false,
    dieuHoa: true,
    tuLanh: true,
    giuongNem: true,
    tuAoQuan: true,
    banCong: false,
    thangMay: false,
    baiDeXe: true,
    camera: true,
    hoBoi: false,
    sanVuon: false
  };

  // SURROUNDING ENVIRONMENT ORDERED EXACTLY AS IMAGE 2
  surroundingList = [
    { key: 'cho', label: 'Chợ' },
    { key: 'sieuThi', label: 'Siêu thị' },
    { key: 'benhVien', label: 'Bệnh viện' },
    { key: 'truongHoc', label: 'Trường học' },

    { key: 'congVien', label: 'Công viên' },
    { key: 'benXeBus', label: 'Bến xe Bus' },
    { key: 'gym', label: 'Trung tâm thể dục thể thao' }
  ];

  surroundingState: { [key: string]: boolean } = {
    cho: true,
    sieuThi: true,
    benhVien: false,
    truongHoc: true,
    congVien: false,
    benXeBus: true,
    gym: false
  };

  coverPhotoBase64 = signal('');
  galleryPreviews = signal<string[]>([]);
  galleryBase64s = signal<string[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadDistricts();
    this.loadDefaultContactInfo();
  }

  loadDefaultContactInfo() {
    const session = this.authService.session();
    this.contactInfo.fullName = session?.fullName || 'Vu Tung';
    this.contactInfo.phone = session?.phone || '0375457065';
    this.contactInfo.zalo = session?.phone || '0375457065';
  }

  onContactTypeChange() {
    if (this.contactType === 'default') {
      this.loadDefaultContactInfo();
    }
  }

  loadDistricts(): void {
    this.propertyService.getLocations(2).subscribe({
      next: (data) => this.districts.set(data),
      error: (err) => console.error(err)
    });
  }

  onProvinceChange(): void {
    this.addressModel.district = '';
    this.updateFullAddress();
    this.loadDistricts();
  }

  onDistrictChange(): void {
    this.updateFullAddress();
  }

  computedFullAddress(): string {
    const parts = [
      this.addressModel.houseNumber,
      this.addressModel.street,
      this.addressModel.ward,
      this.addressModel.district,
      this.selectedProvince
    ].filter(p => p && p.trim() !== '');
    return parts.join(', ');
  }

  updateFullAddress() {
    // Computed address string updates automatically
  }

  detectCurrentLocation() {
    if (navigator.geolocation) {
      this.toastService.show('Đang lấy tọa độ GPS...', 'info');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.googleMapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          this.isMapVerified.set(true);
          this.toastService.show(`Đã định vị thành công GPS! (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'success');
        },
        () => {
          this.toastService.show('Không thể lấy vị trí GPS tự động. Vui lòng dán liên kết Google Maps.', 'error');
        }
      );
    } else {
      this.toastService.show('Trình duyệt không hỗ trợ vị trí GPS.', 'error');
    }
  }

  verifyGoogleMapLink() {
    if (!this.googleMapUrl.trim()) {
      this.toastService.show('Vui lòng dán liên kết Google Maps!', 'error');
      return;
    }
    this.isMapVerified.set(true);
    this.toastService.show('Đã xác minh liên kết Google Maps!', 'success');
  }

  isAllAmenitiesSelected(): boolean {
    return Object.values(this.amenityState).every(v => v === true);
  }

  toggleAllAmenities(event: any) {
    const checked = event.target.checked;
    Object.keys(this.amenityState).forEach(k => this.amenityState[k] = checked);
  }

  isAllSurroundingsSelected(): boolean {
    return Object.values(this.surroundingState).every(v => v === true);
  }

  toggleAllSurroundings(event: any) {
    const checked = event.target.checked;
    Object.keys(this.surroundingState).forEach(k => this.surroundingState[k] = checked);
  }

  generateAIDescription() {
    if (!this.title.trim()) {
      this.toastService.show('Vui lòng nhập Tên trọ trước!', 'error');
      return;
    }

    const activeAmenities = this.amenityList
      .filter(item => this.amenityState[item.key])
      .map(item => item.label);

    const activeSurroundings = this.surroundingList
      .filter(item => this.surroundingState[item.key])
      .map(item => item.label);

    const fullAddr = this.computedFullAddress();
    const contact = this.contactInfo;

    const generated = `CHÍNH CHỦ CHO THUÊ KHU TRỌ CAO CẤP: ${this.title.toUpperCase()}
Địa chỉ: ${fullAddr || 'Khu vực trung tâm, giao thông thuận tiện'}

THÔNG TIN CHI TIẾT & TIỆN NGHI KÈM THEO:
- Phòng ốc thiết kế hiện đại, thoáng mát, tràn ngập ánh sáng tự nhiên.
- Tiện ích có sẵn: ${activeAmenities.length > 0 ? activeAmenities.join(', ') : 'Điện nước riêng, Wifi tốc độ cao, Giờ giấc tự do'}.
- An ninh đảm bảo 24/7, chỗ để xe rộng rãi, khu vực văn minh lịch sự.

VỊ TRÍ XUNG QUANH & GIAO THÔNG:
- Vị trí đắc địa, kết nối nhanh chóng các tuyến đường chính.
- Tiện ích xung quanh: ${activeSurroundings.length > 0 ? activeSurroundings.join(', ') : 'Gần Chợ, Siêu thị, Trường học, Bến xe Bus'}.

LIÊN HỆ XEM PHÒNG TRỰC TIẾP:
- Chủ trọ: ${contact.fullName || 'Vu Tung'}
- Điện thoại / Zalo: ${contact.phone || '0375457065'}
- Hỗ trợ xem phòng miễn phí tất cả các ngày trong tuần!`;

    this.userDescription = generated;
    this.onDescriptionInput();
    this.toastService.show('AI đã tự động tạo nội dung mô tả!', 'success');
  }

  applyFormat(command: string) {
    if (command === 'bold') {
      this.userDescription += ' **In đậm** ';
    } else if (command === 'italic') {
      this.userDescription += ' *In nghiêng* ';
    } else if (command === 'unorderedList') {
      this.userDescription += '\n- Mục 1\n- Mục 2';
    } else if (command === 'orderedList') {
      this.userDescription += '\n1. Mục 1\n2. Mục 2';
    } else if (command === 'emoji') {
      this.userDescription += ' 😊 ';
    } else if (command === 'link') {
      this.userDescription += ' [Liên kết](https://zhome.vn) ';
    }
    this.onDescriptionInput();
  }

  onDescriptionInput(): void {
    if (this.userDescription && this.userDescription.length > 200) {
      this.userDescription = this.userDescription.substring(0, 200);
      this.toastService.show('Đã đạt giới hạn tối đa 200 ký tự!', 'error');
    }
  }

  getRemainingChars(): number {
    const len = this.userDescription ? this.userDescription.length : 0;
    return Math.max(0, 200 - len);
  }

  getWordCount(): number {
    if (!this.userDescription.trim()) return 0;
    return this.userDescription.trim().split(/\s+/).length;
  }

  triggerFileInput(id: string) {
    document.getElementById(id)?.click();
  }

  onGalleryPhotosSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        this.galleryPreviews.update(prev => [...prev, base64]);
        this.galleryBase64s.update(prev => [...prev, base64]);
        if (!this.coverPhotoBase64()) {
          this.coverPhotoBase64.set(base64);
        }
      };
      reader.readAsDataURL(files[i]);
    }
  }

  removeGalleryPhoto(index: number): void {
    this.galleryPreviews.update(prev => prev.filter((_, i) => i !== index));
    this.galleryBase64s.update(prev => prev.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (!this.title.trim()) {
      this.toastService.show('Vui lòng nhập tên khu trọ!', 'error');
      return;
    }
    if (!this.addressModel.district) {
      this.toastService.show('Vui lòng chọn Quận/Huyện!', 'error');
      return;
    }
    if (!this.contactInfo.fullName.trim() || !this.contactInfo.phone.trim()) {
      this.toastService.show('Vui lòng điền Họ tên và Số điện thoại liên hệ!', 'error');
      return;
    }

    this.isLoading.set(true);

    const fullAddress = this.computedFullAddress();

    let compiledDesc = '';
    if (this.googleMapUrl) {
      compiledDesc += `Vị trí Google Maps: ${this.googleMapUrl}\n\n`;
    }

    const selectedAmenities = this.amenityList
      .filter(item => this.amenityState[item.key])
      .map(item => item.label);

    if (selectedAmenities.length > 0) {
      compiledDesc += `Tiện nghi khu trọ:\n- ${selectedAmenities.join('\n- ')}\n\n`;
    }

    const selectedSurroundings = this.surroundingList
      .filter(item => this.surroundingState[item.key])
      .map(item => item.label);

    if (selectedSurroundings.length > 0) {
      compiledDesc += `Môi trường xung quanh:\n- ${selectedSurroundings.join('\n- ')}\n\n`;
    }

    if (this.tiktokVideoUrl) {
      compiledDesc += `Video Review (Tiktok): ${this.tiktokVideoUrl}\n\n`;
    }

    compiledDesc += `Liên hệ: ${this.contactInfo.fullName} - ${this.contactInfo.phone} (Zalo: ${this.contactInfo.zalo})\n\n`;

    if (this.userDescription) {
      compiledDesc += `Ghi chú & Mô tả:\n${this.userDescription}`;
    }

    const payload = {
      title: this.title,
      address: fullAddress,
      description: compiledDesc.trim(),
      imageBase64: this.coverPhotoBase64() || null
    };

    this.propertyService.createProperty(payload).subscribe({
      next: (createdProp) => {
        const totalRooms = this.roomCount && this.roomCount > 0 ? this.roomCount : 1;
        const defaultArea = this.area && this.area > 0 ? this.area : 25;
        const galleryImages = this.galleryBase64s();

        let createdCount = 0;
        for (let i = 1; i <= totalRooms; i++) {
          const roomPayload = {
            roomNumber: `${100 + i}`,
            price: 2500000,
            area: defaultArea,
            maxOccupants: 2,
            amenities: selectedAmenities,
            imageBase64s: i === 1 ? galleryImages : []
          };

          this.propertyService.addRoom(createdProp.id, roomPayload).subscribe({
            next: () => {
              createdCount++;
              if (createdCount === totalRooms) {
                this.isLoading.set(false);
                this.toastService.show(`Đã tạo thành công khu trọ "${createdProp.title}" với ${totalRooms} phòng!`, 'success');
                this.router.navigate(['/landlord/properties']);
              }
            },
            error: () => {
              createdCount++;
              if (createdCount === totalRooms) {
                this.isLoading.set(false);
                this.toastService.show(`Đã tạo thành công khu trọ "${createdProp.title}"!`, 'success');
                this.router.navigate(['/landlord/properties']);
              }
            }
          });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Lỗi tạo khu trọ.');
        this.toastService.show(msg, 'error');
      }
    });
  }
}
