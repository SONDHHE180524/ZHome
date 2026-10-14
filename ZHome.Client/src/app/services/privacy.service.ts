import { Injectable, signal } from '@angular/core';

export type PrivacyTab = 'tenant' | 'landlord' | 'rights';

@Injectable({
  providedIn: 'root'
})
export class PrivacyService {
  private readonly STORAGE_KEY = 'zhome_privacy_consent_v1';

  // State signals
  isBannerVisible = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);
  activeTab = signal<PrivacyTab>('tenant');
  hasAccepted = signal<boolean>(false);

  constructor() {
    this.checkConsent();
  }

  checkConsent(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.hasAccepted.set(true);
        this.isBannerVisible.set(false);
      } else {
        this.hasAccepted.set(false);
        // Show notice banner after a short gentle delay (700ms) on first visit
        setTimeout(() => {
          if (!this.hasAccepted() && !this.isModalOpen()) {
            this.isBannerVisible.set(true);
          }
        }, 700);
      }
    } catch {
      // LocalStorage access fallback
      this.hasAccepted.set(false);
    }
  }

  openModal(tab: PrivacyTab = 'tenant'): void {
    this.activeTab.set(tab);
    this.isModalOpen.set(true);
    this.isBannerVisible.set(false);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    // If not accepted yet, restore the subtle banner
    if (!this.hasAccepted()) {
      this.isBannerVisible.set(true);
    }
  }

  acceptConsent(): void {
    try {
      const consentRecord = {
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consentRecord));
    } catch {}
    this.hasAccepted.set(true);
    this.isBannerVisible.set(false);
    this.isModalOpen.set(false);
  }

  dismissBanner(): void {
    this.isBannerVisible.set(false);
  }

  switchTab(tab: PrivacyTab): void {
    this.activeTab.set(tab);
  }
}
