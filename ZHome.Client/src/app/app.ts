import { Component, inject, effect, signal, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  public readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  fontSize = signal<'normal' | 'large'>('normal');

  private inactivityTimeoutId: any;
  private readonly INACTIVITY_TIME = 60 * 60 * 1000; // 2 minutes

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

    // 2. React to login role change (if no manual preference is saved yet)
    effect(() => {
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

  logout(): void {
    this.authService.logout();
    this.toastService.show('Đã đăng xuất tài khoản.', 'info');
    this.router.navigate(['/login']);
  }
}
