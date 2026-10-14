import { Component, inject, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PropertyService } from '../../services/property.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  public readonly Math = Math;
  public readonly propertyService = inject(PropertyService);
  public readonly toastService = inject(ToastService);
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // View Mode: 'home' for Home page, 'rooms' for Full Listings & Rounded Filters
  viewMode = signal<'home' | 'rooms'>('home');

  // Carousel State
  activeBannerIndex = signal<number>(0);
  private bannerTimer: any = null;

  // Hover Slideshow Timers for Room Cards (3s rotation)
  private hoverTimers = new Map<number, any>();
  private routerSubscription?: Subscription;

  // Compare Rooms State (Max 3 rooms)
  selectedCompareRooms = signal<any[]>([]);
  showCompareModal = signal<boolean>(false);

  // Hot Section Location Filter
  hotLocationFilter = signal<string>('all');

  // Pagination for Phòng trọ (15 rooms per page)
  pageSize = 15;
  currentPage = signal<number>(1);

  // Contact Form Model
  contactForm = {
    fullName: '',
    phone: '',
    need: 'ThueTro',
    message: ''
  };

  // Raw listings & rooms
  listings = signal<any[]>([]);
  allRooms = signal<any[]>([]);
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
  
  // Filtered Hot Properties based on location pills
  filteredHotProperties = computed(() => {
    const list = this.hotProperties();
    const loc = this.hotLocationFilter();
    if (loc === 'all') return list;
    return list.filter(p => p.address && p.address.toLowerCase().includes(loc.toLowerCase()));
  });

  // Filter Models for Phòng trọ
  searchQuery = '';
  selectedDistrict = '';
  selectedWard = '';
  verifiedHost = false;
  selectedAmenity = '';

  // Popover controls
  showPricePopover = false;
  showAreaPopover = false;

  // Price filter states
  selectedPriceOption = 'all';
  minPrice?: number;
  maxPrice?: number;
  minPriceInput: number | null = 0;
  maxPriceInput: number | null = 10000;
  sliderValue = 50;

  // Area filter states
  selectedAreaOption = 'all';
  minArea?: number;
  maxArea?: number;
  minAreaInput: number | null = 0;
  maxAreaInput: number | null = 100;

  // Filtered Rooms for full Phòng Trọ view
  filteredRooms = computed(() => {
    let list = this.allRooms();
    if (list.length === 0) {
      list = this.getFeaturedSampleProperties();
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r => 
        (r.propertyTitle && r.propertyTitle.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
      );
    }

    if (this.selectedDistrict) {
      list = list.filter(r => r.address && r.address.toLowerCase().includes(this.selectedDistrict.toLowerCase()));
    }

    if (this.selectedWard) {
      list = list.filter(r => r.address && r.address.toLowerCase().includes(this.selectedWard.toLowerCase()));
    }

    if (this.minPrice !== undefined && this.minPrice !== null) {
      list = list.filter(r => r.price >= this.minPrice!);
    }

    if (this.maxPrice !== undefined && this.maxPrice !== null) {
      list = list.filter(r => r.price <= this.maxPrice!);
    }

    if (this.minArea !== undefined && this.minArea !== null) {
      list = list.filter(r => r.area >= this.minArea!);
    }

    if (this.maxArea !== undefined && this.maxArea !== null) {
      list = list.filter(r => r.area <= this.maxArea!);
    }

    if (this.verifiedHost) {
      list = list.filter(r => r.isVerifiedTick);
    }

    if (this.selectedAmenity) {
      const a = this.selectedAmenity.toLowerCase();
      list = list.filter(r => r.amenities && r.amenities.some((x: string) => x.toLowerCase().includes(a)));
    }

    return list;
  });

  // Total pages
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRooms().length / this.pageSize)));

  // Paginated Rooms list (15 per page)
  paginatedRooms = computed(() => {
    const list = this.filteredRooms();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.popover-btn-wrapper')) {
      this.showPricePopover = false;
      this.showAreaPopover = false;
    }
  }

  ngOnInit(): void {
    // 1. Determine initial view mode from current route
    this.updateViewModeFromUrl(this.router.url);

    // 2. React to navigation events between '/' and '/phong-tro'
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateViewModeFromUrl(event.urlAfterRedirects || event.url);
      });

    // 3. Start auto banner carousel
    this.startBannerAutoSlide();

    // 4. Initialize with 8 hot properties right away
    const samples = this.getFeaturedSampleProperties();
    this.hotProperties.set(samples);
    this.allRooms.set(samples);
    this.groupedProperties.set(samples);

    // 5. Fetch locations & real listings from backend
    this.fetchDistricts();
    this.fetchListings();
  }

  ngOnDestroy(): void {
    this.stopBannerAutoSlide();
    this.routerSubscription?.unsubscribe();

    // Clean up hover slideshow timers
    for (const timer of this.hoverTimers.values()) {
      clearInterval(timer);
    }
    this.hoverTimers.clear();
  }

  private updateViewModeFromUrl(url: string): void {
    if (url.includes('/phong-tro') && !url.includes('/phong-tro-detail')) {
      this.viewMode.set('rooms');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.viewMode.set('home');
    }
  }

  // ==========================================
  // VIEW MODE SWITCHING
  // ==========================================
  switchToRooms(): void {
    this.viewMode.set('rooms');
    this.router.navigate(['/phong-tro']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  switchToHome(): void {
    this.viewMode.set('home');
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // HOT SECTION LOCATION FILTER
  // ==========================================
  setHotLocationFilter(loc: string): void {
    this.hotLocationFilter.set(loc);
  }

  // ==========================================
  // ROOM COMPARISON (MAX 3 ROOMS)
  // ==========================================
  toggleCompare(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const current = this.selectedCompareRooms();
    const id = item.roomId || item.propertyId;
    const exists = current.some(r => (r.roomId || r.propertyId) === id);

    if (exists) {
      this.selectedCompareRooms.set(current.filter(r => (r.roomId || r.propertyId) !== id));
      this.toastService.show('Đã bỏ phòng khỏi danh sách so sánh.', 'info');
    } else {
      if (current.length >= 3) {
        this.toastService.show('Bạn chỉ có thể so sánh tối đa 3 phòng cùng lúc.', 'error');
        return;
      }
      this.selectedCompareRooms.set([...current, item]);
      this.toastService.show(`Đã thêm "${item.propertyTitle}" vào so sánh (${current.length + 1}/3).`, 'success');
    }
  }

  isRoomInCompare(item: any): boolean {
    const id = item.roomId || item.propertyId;
    return this.selectedCompareRooms().some(r => (r.roomId || r.propertyId) === id);
  }

  removeFromCompare(id: number): void {
    this.selectedCompareRooms.set(this.selectedCompareRooms().filter(r => (r.roomId || r.propertyId) !== id));
    if (this.selectedCompareRooms().length === 0) {
      this.showCompareModal.set(false);
    }
  }

  clearCompare(): void {
    this.selectedCompareRooms.set([]);
    this.showCompareModal.set(false);
  }

  openCompareModal(): void {
    if (this.selectedCompareRooms().length < 2) {
      this.toastService.show('Vui lòng chọn ít nhất 2 phòng để so sánh đối chiếu.', 'info');
      return;
    }
    this.showCompareModal.set(true);
  }

  closeCompareModal(): void {
    this.showCompareModal.set(false);
  }

  // ==========================================
  // PAGINATION CONTROLS (15 ROOMS PER PAGE)
  // ==========================================
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      const el = document.querySelector('.rooms-header-bar') || document.querySelector('.smart-filter-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const curr = this.currentPage();
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(1, curr - delta); i <= Math.min(total, curr + delta); i++) {
      range.push(i);
    }
    return range;
  }

  // ==========================================
  // BANNER CAROUSEL LOGIC (3 SLIDES)
  // ==========================================
  startBannerAutoSlide(): void {
    this.stopBannerAutoSlide();
    this.bannerTimer = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  pauseBannerAutoSlide(): void {
    this.stopBannerAutoSlide();
  }

  resumeBannerAutoSlide(): void {
    this.startBannerAutoSlide();
  }

  stopBannerAutoSlide(): void {
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
      this.bannerTimer = null;
    }
  }

  nextBanner(): void {
    this.activeBannerIndex.update(idx => (idx + 1) % 3);
  }

  prevBanner(): void {
    this.activeBannerIndex.update(idx => (idx - 1 + 3) % 3);
  }

  goToBanner(index: number): void {
    this.activeBannerIndex.set(index);
    this.startBannerAutoSlide();
  }

  // ==========================================
  // 3-SECOND HOVER SLIDESHOW FOR ROOM CARDS
  // ==========================================
  startPropertyHoverSlideshow(prop: any): void {
    if (!prop || !prop.imageUrls || prop.imageUrls.length <= 1) return;
    this.stopPropertyHoverSlideshow(prop);

    const timer = setInterval(() => {
      prop.activeImageIndex = ((prop.activeImageIndex || 0) + 1) % prop.imageUrls.length;
    }, 3000);

    const id = prop.roomId || prop.propertyId;
    this.hoverTimers.set(id, timer);
  }

  stopPropertyHoverSlideshow(prop: any): void {
    if (!prop) return;
    const id = prop.roomId || prop.propertyId;
    const timer = this.hoverTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.hoverTimers.delete(id);
    }
  }

  // ==========================================
  // CONTACT FORM SUBMISSION
  // ==========================================
  submitContact(): void {
    if (!this.contactForm.fullName.trim() || !this.contactForm.phone.trim()) {
      this.toastService.show('Vui lòng nhập Họ tên và Số điện thoại liên hệ.', 'error');
      return;
    }

    this.toastService.show(
      `Cảm ơn ${this.contactForm.fullName}! Đội ngũ ZHome đã tiếp nhận yêu cầu và sẽ liên hệ hỗ trợ bạn sớm nhất qua SĐT ${this.contactForm.phone}.`,
      'success'
    );

    this.contactForm = {
      fullName: '',
      phone: '',
      need: 'ThueTro',
      message: ''
    };
  }

  // ==========================================
  // ROUTE NAVIGATION HELPERS
  // ==========================================
  goToPostRoom(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.authService.userRole() === 'Landlord' || this.authService.userRole() === 'Administrator') {
      this.router.navigate(['/landlord/create-property']);
    } else {
      this.toastService.show('Chỉ tài khoản Chủ trọ mới có quyền đăng phòng. Bạn có thể nâng cấp tài khoản.', 'error');
      this.router.navigate(['/packages']);
    }
  }

  goToPackages(): void {
    this.router.navigate(['/packages']);
  }

  goToRegisterLandlord(): void {
    this.router.navigate(['/register']);
  }

  goToMatch(tab: 'board' | 'post' | 'matches' = 'board'): void {
    this.router.navigate(['/tenant/match'], { queryParams: { tab } });
  }

  // ==========================================
  // POPOVERS & FILTER METHODS
  // ==========================================
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
    }
  }

  onPriceInputCustom(): void {
    this.selectedPriceOption = 'custom';
    this.minPrice = this.minPriceInput != null ? this.minPriceInput * 1000 : undefined;
    this.maxPrice = this.maxPriceInput != null ? this.maxPriceInput * 1000 : undefined;
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
    this.currentPage.set(1);
    this.fetchListings();
  }

  resetPriceFilter(): void {
    this.selectPriceOption('all');
    this.showPricePopover = false;
    this.currentPage.set(1);
    this.fetchListings();
  }

  getPriceLabel(): string {
    if (this.selectedPriceOption === 'under1m') return 'Dưới 1 triệu';
    if (this.selectedPriceOption === '1to10m') return '1 - 10 triệu';
    if (this.selectedPriceOption === '10to30m') return '10 - 30 triệu';
    if (this.selectedPriceOption === '30to50m') return '30 - 50 triệu';
    if (this.minPrice || this.maxPrice) return 'Mức giá đã chọn';
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
    this.currentPage.set(1);
    this.fetchListings();
  }

  resetAreaFilter(): void {
    this.selectAreaOption('all');
    this.showAreaPopover = false;
    this.currentPage.set(1);
    this.fetchListings();
  }

  getAreaLabel(): string {
    if (this.selectedAreaOption === 'under20') return 'Dưới 20 m²';
    if (this.selectedAreaOption === '20to30') return '20 - 30 m²';
    if (this.selectedAreaOption === '30to50') return '30 - 50 m²';
    if (this.selectedAreaOption === 'over50') return 'Trên 50 m²';
    if (this.minArea || this.maxArea) return 'Diện tích đã chọn';
    return 'Diện tích';
  }

  toggleAmenityFilter(amenity: string): void {
    if (this.selectedAmenity === amenity) {
      this.selectedAmenity = '';
    } else {
      this.selectedAmenity = amenity;
    }
    this.currentPage.set(1);
  }

  // ==========================================
  // DATA FETCHING & GROUPING
  // ==========================================
  fetchDistricts(): void {
    this.propertyService.getLocations().subscribe({
      next: (data) => {
        this.districts.set(data);
      },
      error: () => {
        this.toastService.show('Lỗi tải danh sách quận huyện.', 'error');
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
        if (data && data.length > 0) {
          this.listings.set(data);
          
          // Map to rooms list for pagination
          const rooms = data.map(item => ({
            ...item,
            activeImageIndex: 0,
            isHot: item.subscriptionId === 2 || item.subscriptionId === 3 || (item.viewCount && item.viewCount > 10),
            price: item.price,
            minRoomPrice: item.price,
            imageUrls: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls : [this.defaultPropertyImage]
          }));
          this.allRooms.set(rooms);

          // Group by property
          this.groupProperties(data);
        } else {
          if (!this.searchQuery && !this.selectedDistrict && !this.selectedWard) {
            this.groupProperties([]);
          } else {
            this.allRooms.set([]);
            this.groupedProperties.set([]);
            this.hotProperties.set([]);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        if (this.groupedProperties().length === 0) {
          const samples = this.getFeaturedSampleProperties();
          this.allRooms.set(samples);
          this.groupedProperties.set(samples);
          this.applySorting();
        }
      }
    });
  }

  groupProperties(list: any[]): void {
    if (!list || list.length === 0) {
      const sample = this.getFeaturedSampleProperties();
      this.groupedProperties.set(sample);
      this.applySorting();
      return;
    }

    const map = new Map<number, any>();
    for (const item of list) {
      const rawPropImages: string[] = [];
      if (item.propertyImageUrl && typeof item.propertyImageUrl === 'string') {
        rawPropImages.push(...item.propertyImageUrl.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
      if (item.imageUrls && Array.isArray(item.imageUrls)) {
        for (const u of item.imageUrls) {
          if (u && typeof u === 'string') {
            rawPropImages.push(...u.split(',').map((s: string) => s.trim()).filter(Boolean));
          }
        }
      }

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
          activeImageIndex: 0,
          isHot: item.subscriptionId === 2 || item.subscriptionId === 3 || (item.viewCount && item.viewCount > 10),
          imageUrls: rawPropImages.length > 0 ? Array.from(new Set(rawPropImages)) : [this.defaultPropertyImage],
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
      if (item.imageUrls && Array.isArray(item.imageUrls)) {
        for (const u of item.imageUrls) {
          if (u && typeof u === 'string') {
            const split = u.split(',').map((s: string) => s.trim()).filter(Boolean);
            for (const img of split) {
              if (!prop.imageUrls.includes(img)) {
                prop.imageUrls.push(img);
              }
            }
          }
        }
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
    let currentList = [...this.groupedProperties()];
    if (currentList.length === 0) {
      currentList = this.getFeaturedSampleProperties();
      this.groupedProperties.set(currentList);
    }
    
    currentList.sort((a, b) => {
       const subA = a.subscriptionId || 1;
       const subB = b.subscriptionId || 1;
       if (subB !== subA) return subB - subA;
       
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       
       if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
       return (b.averageRating || 0) - (a.averageRating || 0);
    });

    this.groupedProperties.set(currentList);

    // Pick 8 properties for the 4-column x 2-row HOT grid (exact match to user screenshot)
    const hotCount = Math.min(8, currentList.length);
    const hotList = currentList.slice(0, hotCount).map(p => {
      p.isHot = true;
      return p;
    });

    const freeProps = currentList.slice(hotCount);

    this.hotProperties.set(hotList);
    this.normalProperties.set(freeProps);
  }

  // Exact 8 properties from user screenshot
  getFeaturedSampleProperties(): any[] {
    return [
      {
        propertyId: 2001,
        propertyTitle: 'Trung Đức Home',
        address: 'Thạch Hoà, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 1,
        landlordName: 'Trung Đức',
        landlordPhone: '0981234567',
        description: 'Phòng trọ tiện nghi, sạch sẽ thoáng mát gần chợ Hoà Lạc, đi lại thuận tiện.',
        totalRooms: 10,
        viewCount: 8,
        vacantRoomsCount: 3,
        status: 'Available',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/property_0358356866_639274973312204706.jpg'],
        minRoomPrice: 2000000,
        price: 2000000,
        area: 25,
        averageRating: 5.0,
        amenities: ['Điều hòa', 'Nóng lạnh', 'Khép kín']
      },
      {
        propertyId: 2002,
        propertyTitle: 'Biệt Thự Ngay Cổng ĐHQG',
        address: 'Thạch Hoà, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 2,
        landlordName: 'Nguyễn Văn Minh',
        landlordPhone: '0912345678',
        description: 'Biệt thự sang trọng view thoáng, đầy đủ tiện ích cao cấp dành cho sinh viên và giảng viên.',
        totalRooms: 14,
        viewCount: 197,
        vacantRoomsCount: 2,
        status: 'Available',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/0919919919_639275077481748600.jpg'],
        minRoomPrice: 3500000,
        price: 3500000,
        area: 35,
        averageRating: 5.0,
        amenities: ['Điều hòa', 'Nóng lạnh', 'Ban công', 'Thang máy']
      },
      {
        propertyId: 2003,
        propertyTitle: 'C Home 6',
        address: 'Hạ Bằng, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 3,
        landlordName: 'Hạ Bằng ZHome',
        landlordPhone: '0977889911',
        description: 'Dãy trọ sinh viên giá rẻ, khép kín, an ninh đảm bảo tại Hạ Bằng.',
        totalRooms: 8,
        viewCount: 175,
        vacantRoomsCount: 4,
        status: 'Available',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/0919919919_639275826163087052.jpg'],
        minRoomPrice: 1600000,
        price: 1600000,
        area: 20,
        averageRating: 4.8,
        amenities: ['Nóng lạnh', 'Khép kín', 'Wifi']
      },
      {
        propertyId: 2004,
        propertyTitle: "C Home's 5",
        address: 'Thạch Hoà, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 4,
        landlordName: 'C Home',
        landlordPhone: '0966554433',
        description: 'Vị trí gần cây xăng 39, thuận lợi giao thông, phòng rộng có gác xép.',
        totalRooms: 12,
        viewCount: 151,
        vacantRoomsCount: 1,
        status: 'Available',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/property_0886459398_639275003924210085.jpg'],
        minRoomPrice: 2000000,
        price: 2000000,
        area: 22,
        averageRating: 4.9,
        amenities: ['Điều hòa', 'Nóng lạnh']
      },
      {
        propertyId: 2005,
        propertyTitle: 'LuxHome - URHome',
        address: 'Bình Yên, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 5,
        landlordName: 'LuxHome',
        landlordPhone: '0904346979',
        description: 'Tòa nhà căn hộ mini Vận Lôi, thiết kế sang trọng, hiện đại.',
        totalRooms: 16,
        viewCount: 100,
        vacantRoomsCount: 0,
        status: 'Occupied',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/property_0898765433_639250812545623697.jpg'],
        minRoomPrice: 2200000,
        price: 2200000,
        area: 26,
        averageRating: 5.0,
        amenities: ['Điều hòa', 'Nóng lạnh', 'Khép kín', 'Tủ lạnh']
      },
      {
        propertyId: 2006,
        propertyTitle: 'Trọ Bắc Phú Cát',
        address: 'Phú Cát, Quốc Oai',
        isVerifiedTick: true,
        landlordId: 6,
        landlordName: 'Nguyễn Thành Tùng',
        landlordPhone: '0888196666',
        description: 'Nhà trọ Bắc Phú Cát đường rộng thoáng, ô tô vào tận cửa, an ninh tuyệt đối.',
        totalRooms: 15,
        viewCount: 318,
        vacantRoomsCount: 3,
        status: 'Available',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/property_0919919919_639274991567935199.png'],
        minRoomPrice: 2900000,
        price: 2900000,
        area: 28,
        averageRating: 4.9,
        amenities: ['Điều hòa', 'Nóng lạnh', 'Ban công']
      },
      {
        propertyId: 2007,
        propertyTitle: 'YoungHouse 2 - Phòng Studio 2...',
        address: 'Tân Xã, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 7,
        landlordName: 'YoungHouse',
        landlordPhone: '0919919919',
        description: 'Studio dành cho bạn trẻ năng động tại Phú Hữu, không gian mở sáng tạo.',
        totalRooms: 18,
        viewCount: 913,
        vacantRoomsCount: 0,
        status: 'Occupied',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/0919919919_639275077484150808.jpg'],
        minRoomPrice: 2800000,
        price: 2800000,
        area: 30,
        averageRating: 5.0,
        amenities: ['Điều hòa', 'Nóng lạnh', 'Thang máy', 'Ban công']
      },
      {
        propertyId: 2008,
        propertyTitle: 'C Home 7',
        address: 'Thạch Hoà, Thạch Thất',
        isVerifiedTick: true,
        landlordId: 8,
        landlordName: 'C Home',
        landlordPhone: '0988776655',
        description: 'Phòng gác lửng cao ráo, rộng rãi, khu dân cư an ninh tại Thôn 3.',
        totalRooms: 9,
        viewCount: 95,
        vacantRoomsCount: 0,
        status: 'Occupied',
        isHot: true,
        activeImageIndex: 0,
        imageUrls: ['/media/properties/0919919919_639275077486040420.jpg'],
        minRoomPrice: 2500000,
        price: 2500000,
        area: 24,
        averageRating: 4.8,
        amenities: ['Gác lửng', 'Nóng lạnh', 'Khép kín']
      }
    ];
  }

  toggleFavorite(prop: any, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để lưu tin yêu thích.', 'error');
      return;
    }
    
    const roomId = prop.roomId || prop.rooms?.[0]?.roomId;
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
    this.currentPage.set(1);
    this.fetchListings();
  }

  onDistrictChange(): void {
    this.selectedWard = '';
    this.wards.set([]);
    this.currentPage.set(1);
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

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.verifiedHost = false;
    this.selectedAmenity = '';
    this.selectPriceOption('all');
    this.selectAreaOption('all');
    this.wards.set([]);
    this.currentPage.set(1);
    this.fetchListings();
  }

  openPropertyDetail(property: any): void {
    const id = property?.propertyId || property?.id;
    if (id) {
      this.router.navigate(['/phong-tro-detail', id]);
    }
  }

  formatDisplayAddress(address?: string): string {
    if (!address) return 'Thạch Thất';
    let clean = address
      .replace(/,\s*(TP\.?|Thành phố)?\s*Hà Nội/gi, '')
      .replace(/,\s*Việt Nam/gi, '')
      .replace(/(TP\.?|Thành phố)\s*Hà Nội/gi, '')
      .replace(/Hà Nội/gi, '')
      .trim();
    clean = clean.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
    const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 2) {
      return clean || 'Thạch Thất';
    }
    return parts.slice(-2).join(', ');
  }

  defaultPropertyImage = '/media/properties/0919919919_639275077481748600.jpg';

  onImageLoaded(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.add('loaded');
    }
  }

  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.classList.add('loaded');
    }
    const fallback = this.getImageUrl(this.defaultPropertyImage);
    if (target && target.src !== fallback) {
      target.src = fallback;
    }
  }

  getImageUrl(url?: string): string {
    if (!url) return this.defaultPropertyImage;
    if (url.includes(',')) {
      url = url.split(',')[0].trim();
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
