import { Component, inject, effect, signal, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';
import { NotificationService, NotificationItem } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  public readonly toastService = inject(ToastService);
  public readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  fontSize = signal<'normal' | 'large'>('normal');

  private inactivityTimeoutId: any;
  private readonly INACTIVITY_TIME = 60 * 60 * 1000; // 60 minutes

  constructor() {
    // 1. Initial size check from localStorage
    const savedSize = localStorage.getItem('zhome-font-size') as 'normal' | 'large';
    if (savedSize && (savedSize === 'normal' || savedSize === 'large')) {
      this.fontSize.set(savedSize);
    } else {
      // Default to large for Landlord role to support middle-aged users
      const role = this.authService.userRole();
      if (role === 'Landlord') {
        this.fontSize.set('large');
      } else {
        this.fontSize.set('normal');
      }
    }

    // 2. React to login role change & start/stop notification polling
    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (isLoggedIn) {
        this.notificationService.startPolling();
      } else {
        this.notificationService.stopPolling();
      }

      const role = this.authService.userRole();
      const hasSaved = localStorage.getItem('zhome-font-size');
      if (!hasSaved) {
        if (role === 'Landlord') {
          this.fontSize.set('large');
        } else {
          this.fontSize.set('normal');
        }
      }
    });

    // 3. React to role & font size to apply root class classes
    effect(() => {
      const size = this.fontSize();
      const role = this.authService.userRole();

      // Apply font-size scale class to HTML tag (documentElement) so rem scales correctly
      const htmlEl = document.documentElement;
      htmlEl.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
      htmlEl.classList.add(`font-size-${size}`);

      // Apply role class to body
      if (role === 'Landlord') {
        document.body.classList.add('role-landlord');
      } else {
        document.body.classList.remove('role-landlord');
      }
    });
  }

  ngOnInit(): void {
    this.setupInactivityListener();
  }

  ngOnDestroy(): void {
    this.clearInactivityListener();
    this.notificationService.stopPolling();
  }

  private setupInactivityListener(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.resetTimeout);
      window.addEventListener('keydown', this.resetTimeout);
      window.addEventListener('click', this.resetTimeout);
      window.addEventListener('scroll', this.resetTimeout);
    });
    this.startTimeout();
  }

  private clearInactivityListener(): void {
    window.removeEventListener('mousemove', this.resetTimeout);
    window.removeEventListener('keydown', this.resetTimeout);
    window.removeEventListener('click', this.resetTimeout);
    window.removeEventListener('scroll', this.resetTimeout);
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }
  }

  private resetTimeout = (): void => {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }
    this.startTimeout();
  };

  private startTimeout(): void {
    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          if (this.authService.isLoggedIn()) {
            this.authService.logout();
            this.toastService.show('Đã tự động đăng xuất do không có tương tác trong thời gian dài.', 'info');
            this.router.navigate(['/login']);
          }
        });
      }, this.INACTIVITY_TIME);
    });
  }

  setFontSize(size: 'normal' | 'large'): void {
    this.fontSize.set(size);
    localStorage.setItem('zhome-font-size', size);
  }

  isNotificationsOpen = signal(false);
  isProfileMenuOpen = signal(false);

  toggleNotifications(): void {
    const nextState = !this.isNotificationsOpen();
    this.isNotificationsOpen.set(nextState);
    if (nextState) {
      this.isProfileMenuOpen.set(false);
      this.notificationService.fetchNotifications();
    }
  }

  toggleProfileMenu(): void {
    const nextState = !this.isProfileMenuOpen();
    this.isProfileMenuOpen.set(nextState);
    if (nextState) {
      this.isNotificationsOpen.set(false);
    }
  }

  closeAllMenus(): void {
    this.isNotificationsOpen.set(false);
    this.isProfileMenuOpen.set(false);
  }

  getUserInitials(name: string): string {
    if (!name) return 'ZH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarUrl(avatarUrl?: string): string {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    return 'http://localhost:5000' + avatarUrl;
  }

  getDefaultAvatarSvg(): string {
    const role = this.authService.userRole();
    const bg = role === 'Administrator' ? '%231d4ed8' : (role === 'Landlord' ? '%2315803d' : '%237e22ce');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="${bg}"/><path d="M50 24A18 18 0 1 0 50 60A18 18 0 1 0 50 24Z" fill="%23ffffff"/><path d="M20 86C20 70 33 58 50 58C67 58 80 70 80 86" stroke="%23ffffff" stroke-width="8" stroke-linecap="round"/></svg>`;
  }

  onAvatarImageError(event: any): void {
    event.target.src = this.getDefaultAvatarSvg();
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead();
  }

  readNotification(n: NotificationItem): void {
    this.closeAllMenus();
    this.notificationService.navigateAndRead(n);
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Vừa xong';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} ngày trước`;
    } catch {
      return '';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'LandlordVerification': return '';
      case 'BillPayment': return '';
      case 'PaymentConfirmed': return '';
      case 'PaymentRejected': return '⚠️';
      case 'IncidentReport': return '️';
      default: return '';
    }
  }

  logout(): void {
    this.closeAllMenus();
    this.notificationService.stopPolling();
    this.authService.logout();
    this.toastService.show('Đã đăng xuất tài khoản.', 'info');
    this.router.navigate(['/login']);
  }
}

