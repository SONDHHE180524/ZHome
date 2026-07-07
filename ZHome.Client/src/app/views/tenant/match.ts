import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchService } from '../../services/match.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tenant-match',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="match-container animate-fade-in">
      <div class="header-row">
        <div>
          <h1>ZHome Matchmaker</h1>
          <p>Thuật toán ghép phòng tự động cho sinh viên theo thói quen sinh hoạt và tầm giá phòng</p>
        </div>
      </div>

      <!-- Navigation tabs -->
      <div class="glass-panel nav-tabs-panel">
        <div class="tabs-row">
          <button 
            (click)="setTab('survey')" 
            [class.active]="activeTab() === 'survey'" 
            class="tab-btn">📝 Khảo sát lối sống cá nhân</button>
          <button 
            (click)="setTab('matches')" 
            [class.active]="activeTab() === 'matches'" 
            class="tab-btn">✨ Danh sách gợi ý ghép trọ</button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="tab-content mt-4">
        
        <!-- Tab 1: Survey Form -->
        @if (activeTab() === 'survey') {
          <div class="glass-panel survey-card animate-fade-in">
            <h2>Thiết Lập Lối Sống & Yêu Cầu Ở Ghép</h2>
            <p class="text-muted">Hoàn thành 5 câu hỏi dưới đây để thuật toán ZHome tìm người phù hợp nhất với bạn.</p>
            
            <form (ngSubmit)="submitSurvey()" class="mt-4">
              
              <!-- 1. Gender & Pref -->
              <div class="row-flex">
                <div class="form-group flex-1">
                  <label for="gender">Giới tính của bạn</label>
                  <select id="gender" name="gender" [(ngModel)]="survey.gender" required class="form-control">
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label for="prefGender">Ưu tiên giới tính bạn cùng phòng</label>
                  <select id="prefGender" name="prefGender" [(ngModel)]="survey.roommateGenderPreference" required class="form-control">
                    <option value="Any">Bất kỳ ai (Any)</option>
                    <option value="Male">Chỉ ghép với Nam</option>
                    <option value="Female">Chỉ ghép với Nữ</option>
                  </select>
                </div>
              </div>

              <!-- 2. Budget Ranges -->
              <div class="form-group">
                <label>Ngân sách thuê phòng (VND/tháng)</label>
                <div class="price-inputs">
                  <div class="flex-1">
                    <span class="input-sub-label">Tối thiểu:</span>
                    <input type="number" name="budgetMin" [(ngModel)]="survey.budgetMin" required class="form-control" />
                  </div>
                  <div class="flex-1">
                    <span class="input-sub-label">Tối đa:</span>
                    <input type="number" name="budgetMax" [(ngModel)]="survey.budgetMax" required class="form-control" />
                  </div>
                </div>
              </div>

              <!-- 3. Habits Questionnaire -->
              <h3 class="form-section-title mt-4">Khảo sát 3 thói quen sinh hoạt</h3>
              <div class="habits-question-grid">
                
                <div class="habit-question-card" [class.checked]="survey.sleepLate" (click)="survey.sleepLate = !survey.sleepLate">
                  <span class="habit-icon">🌙</span>
                  <div class="habit-details">
                    <strong>Thức đêm muộn?</strong>
                    <p>Bạn thường đi ngủ sau 12h đêm</p>
                  </div>
                  <input type="checkbox" name="sleepLate" [(ngModel)]="survey.sleepLate" (click)="$event.stopPropagation()" class="hidden-check" />
                </div>

                <div class="habit-question-card" [class.checked]="survey.smoke" (click)="survey.smoke = !survey.smoke">
                  <span class="habit-icon">🚬</span>
                  <div class="habit-details">
                    <strong>Hút thuốc lá?</strong>
                    <p>Bạn có thói quen hút thuốc lá/vape</p>
                  </div>
                  <input type="checkbox" name="smoke" [(ngModel)]="survey.smoke" (click)="$event.stopPropagation()" class="hidden-check" />
                </div>

                <div class="habit-question-card" [class.checked]="survey.hasPet" (click)="survey.hasPet = !survey.hasPet">
                  <span class="habit-icon">🐱</span>
                  <div class="habit-details">
                    <strong>Nuôi thú cưng?</strong>
                    <p>Bạn nuôi chó, mèo hoặc động vật khác</p>
                  </div>
                  <input type="checkbox" name="hasPet" [(ngModel)]="survey.hasPet" (click)="$event.stopPropagation()" class="hidden-check" />
                </div>

              </div>

              <!-- 4. Hometown -->
              <div class="form-group mt-4">
                <label for="hometown">Quê quán (Hometown)</label>
                <input type="text" id="hometown" name="hometown" [(ngModel)]="survey.hometown" class="form-control" placeholder="Ví dụ: Thanh Hóa, Nam Định..." />
              </div>

              <!-- 5. Description -->
              <div class="form-group">
                <label for="description">Giới thiệu bản thân & mong muốn</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="survey.description" 
                  class="form-control" 
                  rows="4" 
                  placeholder="Hãy viết vài dòng giới thiệu bản thân: đang học trường nào, sở thích, tính cách, mong muốn tìm bạn cùng phòng như thế nào..."></textarea>
              </div>

              <button type="submit" [disabled]="isSaving()" class="btn btn-primary mt-3">
                {{ isSaving() ? 'Đang lưu hồ sơ...' : 'Cập nhật hồ sơ & Tìm bạn ở ghép' }}
              </button>
            </form>
          </div>
        }

        <!-- Tab 2: Suggestion Match List -->
        @if (activeTab() === 'matches') {
          <div class="matches-list animate-fade-in">
            @if (isMatchingLoading()) {
              <div class="loading-state">ZHome AI đang sàng lọc hồ sơ ở ghép tương thích...</div>
            } @else if (matchSuggestions().length === 0) {
              <div class="empty-state">
                <p>Không tìm thấy bạn ghép trọ nào tương thích hoặc bạn chưa cập nhật hồ sơ khảo sát.</p>
                <button (click)="setTab('survey')" class="btn btn-primary mt-3">Điền khảo sát ngay</button>
              </div>
            } @else {
              <div class="matches-grid">
                @for (candidate of matchSuggestions(); track candidate.studentId) {
                  <div class="interactive-card candidate-card" (click)="openDetail(candidate)">
                    
                    <div class="candidate-header">
                      <!-- Compatibility Badge -->
                      <div class="compat-ring" [class.high-compat]="candidate.matchPercentage >= 80" [style.--percent]="candidate.matchPercentage">
                        <span class="compat-val">{{ candidate.matchPercentage }}%</span>
                        <span class="compat-lbl">Match</span>
                      </div>
                      <div class="candidate-name-box">
                        <h3>{{ candidate.fullName }}</h3>
                        <p class="text-muted">🏠 Quê: {{ candidate.hometown || 'Chưa rõ' }}</p>
                      </div>
                    </div>

                    <div class="modal-divider my-2"></div>

                    <div class="candidate-habits-summary">
                      <span class="habit-badge" [class.badge-active]="candidate.sleepLate">
                        {{ candidate.sleepLate ? '🌙 Ngủ muộn' : '☀️ Ngủ sớm' }}
                      </span>
                      <span class="habit-badge" [class.badge-danger-active]="candidate.smoke">
                        {{ candidate.smoke ? '🚬 Có hút thuốc' : '🚭 Không hút thuốc' }}
                      </span>
                      <span class="habit-badge" [class.badge-warning-active]="candidate.hasPet">
                        {{ candidate.hasPet ? '🐾 Có thú cưng' : '🚫 Không thú cưng' }}
                      </span>
                    </div>

                    <div class="candidate-budget-range mt-3">
                      <span>Mức ngân sách:</span>
                      <strong class="text-white">{{ candidate.budgetMin | number:'1.0-0' }}đ - {{ candidate.budgetMax | number:'1.0-0' }}đ</strong>
                    </div>

                    <p class="candidate-desc mt-3">
                      {{ candidate.description ? (candidate.description | slice:0:100) + '...' : 'Không có mô tả chi tiết.' }}
                    </p>

                    <button class="btn btn-secondary btn-block mt-4">🔍 Xem hồ sơ & Liên hệ</button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Roommate Detail Modal -->
      @if (selectedCandidate(); as cand) {
        <div class="modal-backdrop" (click)="closeDetail()">
          <div class="glass-panel modal-card max-w-600" (click)="$event.stopPropagation()">
            <button (click)="closeDetail()" class="modal-close-btn">&times;</button>
            
            <div class="modal-match-header">
              <div class="large-compat-ring" [class.high-compat]="cand.matchPercentage >= 80">
                <span class="ring-val">{{ cand.matchPercentage }}%</span>
                <span class="ring-lbl">Tương thích</span>
              </div>
              <div>
                <h2>Hồ Sơ Ghép Trọ: {{ cand.fullName }}</h2>
                <p class="text-muted">Quê quán: {{ cand.hometown || 'Chưa rõ' }} • Giới tính: {{ cand.gender === 'Male' ? 'Nam' : 'Nữ' }}</p>
              </div>
            </div>

            <div class="modal-divider"></div>

            <div class="modal-grid">
              <div class="modal-main-info">
                <h3>Thói quen sinh hoạt</h3>
                <div class="habits-details-list">
                  <div class="habit-detail-item">
                    <span class="status-indicator" [class.active]="cand.sleepLate"></span>
                    <span>Thói quen ngủ: <strong>{{ cand.sleepLate ? 'Thường thức khuya sau 12h đêm' : 'Thường ngủ sớm trước 12h đêm' }}</strong></span>
                  </div>
                  <div class="habit-detail-item">
                    <span class="status-indicator" [class.danger]="cand.smoke"></span>
                    <span>Hút thuốc lá: <strong>{{ cand.smoke ? 'Có hút thuốc lá / vape' : 'Không hút thuốc' }}</strong></span>
                  </div>
                  <div class="habit-detail-item">
                    <span class="status-indicator" [class.warning]="cand.hasPet"></span>
                    <span>Nuôi thú cưng: <strong>{{ cand.hasPet ? 'Có nuôi thú cưng (chó, mèo...)' : 'Không nuôi thú cưng' }}</strong></span>
                  </div>
                </div>

                <h3 class="mt-4">Nguyện vọng tìm phòng</h3>
                <p><strong>Ngân sách chi trả:</strong> {{ cand.budgetMin | number:'1.0-0' }}đ - {{ cand.budgetMax | number:'1.0-0' }}đ / tháng</p>
                <p><strong>Ưu tiên giới tính bạn ghép:</strong> {{ cand.roommateGenderPreference === 'Any' ? 'Bất kỳ ai (Nam/Nữ)' : (cand.roommateGenderPreference === 'Male' ? 'Chỉ ghép với Nam' : 'Chỉ ghép với Nữ') }}</p>
                
                @if (cand.description) {
                  <h3 class="mt-4">Lời giới thiệu</h3>
                  <p class="modal-desc msg-text">{{ cand.description }}</p>
                }
              </div>

              <div class="modal-sidebar-info">
                <div class="landlord-card">
                  <h4>Thông tin liên hệ</h4>
                  <p class="landlord-name">📞 {{ cand.phone }}</p>
                  @if (cand.email) {
                    <p class="landlord-phone">✉️ {{ cand.email }}</p>
                  }
                  <a href="tel:{{ cand.phone }}" class="btn btn-primary btn-block mt-3">Gọi điện / Zalo</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .header-row {
      margin-bottom: 25px;
    }
    .nav-tabs-panel {
      padding: 12px 24px;
    }
    .tabs-row {
      display: flex;
      gap: 16px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 10px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .tab-btn:hover {
      background: rgba(0,0,0,0.03);
      color: var(--text-main);
    }
    .tab-btn.active {
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-primary-light);
    }
    .survey-card {
      padding: 30px;
    }
    .form-section-title {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
    }
    .input-sub-label {
      font-size: 0.8rem;
      color: var(--text-dark);
      display: block;
      margin-bottom: 4px;
    }
    .habits-question-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }
    .habit-question-card {
      background: rgba(255,255,255,0.01);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: var(--transition);
    }
    .habit-question-card:hover {
      background: rgba(255,255,255,0.03);
      border-color: rgba(99,102,241,0.2);
    }
    .habit-question-card.checked {
      background: rgba(99, 102, 241, 0.06);
      border-color: var(--color-primary);
      box-shadow: 0 0 8px rgba(99,102,241,0.2);
    }
    .habit-icon {
      font-size: 2rem;
    }
    .habit-details strong {
      font-size: 0.9rem;
      color: var(--text-main);
      display: block;
    }
    .habit-details p {
      font-size: 0.75rem;
      color: var(--text-dark);
      margin-top: 2px;
    }
    .hidden-check {
      display: none;
    }
    
    /* Matches Suggestion list */
    .matches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .candidate-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 380px;
    }
    .candidate-header {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .compat-ring {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 3px solid var(--color-warning);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .compat-ring.high-compat {
      border-color: var(--color-success);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    }
    .compat-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .compat-lbl {
      font-size: 0.5rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 2px;
    }
    .candidate-name-box h3 {
      font-size: 1.15rem;
    }
    .candidate-habits-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .habit-badge {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-color);
      color: var(--text-dark);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .habit-badge.badge-active {
      color: var(--color-primary-light);
      background: rgba(99,102,241,0.08);
      border-color: rgba(99,102,241,0.2);
    }
    .habit-badge.badge-danger-active {
      color: var(--color-danger-light);
      background: rgba(244,63,94,0.08);
      border-color: rgba(244,63,94,0.2);
    }
    .habit-badge.badge-warning-active {
      color: #fbd38d;
      background: rgba(245,158,11,0.08);
      border-color: rgba(245,158,11,0.2);
    }
    .candidate-budget-range {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .candidate-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      flex-grow: 1;
      line-height: 1.5;
    }

    /* Modal Details roommate */
    .modal-match-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    .large-compat-ring {
      width: 74px;
      height: 74px;
      border-radius: 50%;
      border: 4px solid var(--color-warning);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .large-compat-ring.high-compat {
      border-color: var(--color-success);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }
    .ring-val {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .ring-lbl {
      font-size: 0.55rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 2px;
    }
    .habits-details-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }
    .habit-detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-dark);
      display: inline-block;
    }
    .status-indicator.active { background: var(--color-primary); }
    .status-indicator.danger { background: var(--color-danger); }
    .status-indicator.warning { background: var(--color-warning); }

    /* Standard modal elements reuse */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      padding: 30px;
      position: relative;
    }
    .max-w-600 { max-width: 600px; }
    .modal-close-btn {
      position: absolute;
      top: 16px; right: 16px;
      background: rgba(0,0,0,0.05);
      border: none; color: var(--text-main);
      width: 32px; height: 32px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-close-btn:hover { background: var(--color-danger); }
    .modal-grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 30px;
    }
    .landlord-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 20px;
      text-align: center;
    }
    .landlord-card h4 {
      margin-bottom: 12px;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .landlord-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .landlord-phone {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .msg-text {
      background: rgba(255,255,255,0.01);
      border: 1px solid var(--border-color);
      padding: 12px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      margin-top: 8px;
    }
    .mt-4 { margin-top: 24px; }
    .mt-3 { margin-top: 16px; }
    .my-2 { margin: 8px 0; }
  `]
})
export class TenantMatchComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly toastService = inject(ToastService);

  activeTab = signal<string>('survey');

  // Survey forms
  survey = {
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

  isSaving = signal(false);

  // Suggestions states
  matchSuggestions = signal<any[]>([]);
  isMatchingLoading = signal(false);
  selectedCandidate = signal<any | null>(null);

  ngOnInit(): void {
    this.fetchProfile();
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'matches') {
      this.fetchSuggestions();
    }
  }

  fetchProfile(): void {
    this.matchService.getProfile().subscribe({
      next: (profile) => {
        this.survey = { ...this.survey, ...profile };
      },
      error: () => {
        // Ignored. It means profile doesn't exist yet, which is fine
      }
    });
  }

  submitSurvey(): void {
    this.isSaving.set(true);
    this.matchService.saveProfile(this.survey).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.show('Đã cập nhật hồ sơ lối sống thành công!', 'success');
        this.setTab('matches'); // switch to suggestions list
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.show('Lỗi lưu hồ sơ khảo sát.', 'error');
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
      error: () => {
        this.isMatchingLoading.set(false);
        this.toastService.show('Chưa hoàn thành khảo sát tìm ở ghép.', 'info');
      }
    });
  }

  openDetail(cand: any): void {
    this.selectedCandidate.set(cand);
  }

  closeDetail(): void {
    this.selectedCandidate.set(null);
  }
}
