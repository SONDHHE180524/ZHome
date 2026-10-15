import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

export interface RealtimeNotification {
  id?: number;
  title: string;
  message: string;
  type?: string;
  targetUrl?: string;
  referenceId?: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private readonly toastService = inject(ToastService);
  private hubConnection: HubConnection | null = null;

  // Signal & Observable to let components react to real-time events
  readonly isConnected = signal(false);
  readonly newNotification$ = new Subject<RealtimeNotification>();

  startConnection(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      return;
    }

    const hubUrl = `${environment.baseUrl}/hubs/notifications`;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.None)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        this.registerHandlers();
      })
      .catch((err) => {
        this.isConnected.set(false);
        // Tự động thử kết nối lại khi mạng ổn định
      });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
    });

    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
    });
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.off('ReceiveNotification');
    this.hubConnection.on('ReceiveNotification', (notification: RealtimeNotification) => {
      // 1. Phát sự kiện cho các component lắng nghe
      this.newNotification$.next(notification);

      // 2. Bật Popup Toast thông báo tức thì trên màn hình
      const title = notification.title || 'Thông báo mới';
      const msg = notification.message || '';
      this.toastService.show(`🔔 ${title}: ${msg}`, 'info');
    });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
    }
  }
}
