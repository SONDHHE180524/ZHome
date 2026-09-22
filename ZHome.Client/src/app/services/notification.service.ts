import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  targetUrl?: string;
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/notification`;

  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly activeToast = signal<NotificationItem | null>(null);

  private pollingIntervalId: any = null;
  private toastTimeoutId: any = null;
  private knownNotificationIds = new Set<number>();
  private isInitialFetch = true;

  constructor() {
    // Start polling automatically if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.startPolling();
    }
  }

  fetchNotifications(): void {
    if (!this.authService.isLoggedIn()) {
      this.notifications.set([]);
      this.unreadCount.set(0);
      return;
    }

    this.http.get<{ unreadCount: number; items: NotificationItem[] }>(this.apiUrl).subscribe({
      next: (res) => {
        const items = res.items || [];
        this.unreadCount.set(res.unreadCount || 0);
        this.notifications.set(items);

        if (this.isInitialFetch) {
          // Record existing IDs without popping up
          items.forEach(item => this.knownNotificationIds.add(item.id));
          this.isInitialFetch = false;
        } else {
          // Check if there are newly arrived unread notifications
          const newUnreadItems = items.filter(item => !this.knownNotificationIds.has(item.id) && !item.isRead);
          if (newUnreadItems.length > 0) {
            // Show toast popup for the newest notification
            const newest = newUnreadItems[0];
            this.showToastPopup(newest);
            this.playNotificationSound();
          }
          items.forEach(item => this.knownNotificationIds.add(item.id));
        }
      },
      error: () => {
        // Silently handle error in polling
      }
    });
  }

  showToastPopup(notification: NotificationItem): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.activeToast.set(notification);
    // Auto dismiss after 5 seconds
    this.toastTimeoutId = setTimeout(() => {
      this.dismissToast();
    }, 5000);
  }

  dismissToast(): void {
    this.activeToast.set(null);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  navigateAndRead(notification: NotificationItem): void {
    this.dismissToast();
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }

    if (notification.targetUrl) {
      this.router.navigateByUrl(notification.targetUrl);
    }
  }

  markAsRead(id: number): void {
    // Optimistic UI update
    this.notifications.update(list =>
      list.map(item => item.id === id ? { ...item, isRead: true } : item)
    );
    this.unreadCount.update(c => Math.max(0, c - 1));

    this.http.put(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  markAllAsRead(): void {
    // Optimistic UI update
    this.notifications.update(list => list.map(item => ({ ...item, isRead: true })));
    this.unreadCount.set(0);

    this.http.put(`${this.apiUrl}/read-all`, {}).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  startPolling(): void {
    this.stopPolling();
    this.isInitialFetch = true;
    this.knownNotificationIds.clear();
    this.fetchNotifications();

    // Poll every 5 seconds
    this.pollingIntervalId = setInterval(() => {
      this.fetchNotifications();
    }, 5000);
  }

  stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  private playNotificationSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }
}
