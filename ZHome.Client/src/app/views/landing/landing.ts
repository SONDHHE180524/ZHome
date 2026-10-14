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
  public readonly propertyService = inject(PropertyService);
  public readonly toastService = inject(ToastService);
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // View Mode: 'home' for Home page with Banners & Hot Rooms & Trust, 'rooms' for Full Listings & Rounded Filters
  viewMode = signal<'home' | 'rooms'>('home');

  // Carousel State
  activeBannerIndex = signal<number>(0);
  private bannerTimer: any = null;

  // Hover Slideshow Timers for Room Cards (3s rotation)
  private hoverTimers = new Map<number, any>();
  private routerSubscription?: Subscription;

  // Contact Form Model
  contactForm = {
    fullName: '',
    phone: '',
    need: 'ThueTro',
    message: ''
  };

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
  selectedPriceOption = 'all'; // 'all', 'under1m', '1to10m', '10to30m', '30to50m', 'custom'
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

    // 4. Fetch locations & listings
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

    this.hoverTimers.set(prop.propertyId, timer);
  }

  stopPropertyHoverSlideshow(prop: any): void {
    if (!prop) return;
    const timer = this.hoverTimers.get(prop.propertyId);
    if (timer) {
      clearInterval(timer);
      this.hoverTimers.delete(prop.propertyId);
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

    // Reset form
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
    if (this.minArea || this.maxArea) return 'Diện tích đã chọn';
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
        this.listings.set(data);
        this.groupProperties(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('Lỗi tải danh sách phòng trống từ server.', 'error');
      }
    });
  }

  groupProperties(list: any[]): void {
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
    const currentList = [...this.groupedProperties()];
    
    currentList.sort((a, b) => {
       const subA = a.subscriptionId || 1;
       const subB = b.subscriptionId || 1;
       if (subB !== subA) return subB - subA; // 3 -> 2 -> 1
       
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       
       if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
       return (b.averageRating || 0) - (a.averageRating || 0);
    });

    this.groupedProperties.set(currentList);

    const premiumProps = currentList.filter(p => p.subscriptionId === 2 || p.subscriptionId === 3 || p.isHot);
    // If few premium props, fallback to top 6 popular properties for hot section
    const hotList = premiumProps.length >= 3 ? premiumProps : currentList.slice(0, 6);
    const freeProps = currentList.filter(p => !hotList.includes(p));

    this.hotProperties.set(hotList);
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

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDistrict = '';
    this.selectedWard = '';
    this.verifiedHost = false;
    this.selectedAmenity = '';
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
