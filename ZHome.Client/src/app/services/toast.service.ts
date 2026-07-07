import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  show(message: any, type: 'success' | 'error' | 'info' = 'info'): void {
    let msgText = 'Đã xảy ra lỗi.';
    if (typeof message === 'string') {
      msgText = message;
    } else if (message && typeof message === 'object') {
      if (message.errors) {
        msgText = Object.values(message.errors).flat().join(', ');
      } else if (message.message) {
        msgText = message.message;
      } else if (message.error) {
        if (typeof message.error === 'string') {
          msgText = message.error;
        } else if (message.error.errors) {
          msgText = Object.values(message.error.errors).flat().join(', ');
        } else if (message.error.message) {
          msgText = message.error.message;
        } else {
          msgText = JSON.stringify(message.error);
        }
      } else {
        msgText = JSON.stringify(message);
      }
    }
    const id = this.nextId++;
    const toast = { message: msgText, type, id };
    this.toasts.update(val => [...val, toast]);
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number): void {
    this.toasts.update(val => val.filter(t => t.id !== id));
  }
}
