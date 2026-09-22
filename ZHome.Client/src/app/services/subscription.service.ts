import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SePayPaymentResponse {
  orderCode: number;
  checkoutUrl: string;
  qrCodeUrl: string;
  amount: number;
  description: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  status: string;
  packageName: string;
  months: number;
  isMock: boolean;
}

// Alias for backwards compatibility
export type PayOSPaymentResponse = SePayPaymentResponse;

export interface OrderStatusResponse {
  orderCode: number;
  status: string;
  isPaid: boolean;
  packageId: number;
  packageName: string;
  amount: number;
  paidAt?: string;
  subscriptionId?: number;
  subscriptionEndDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly apiUrl = 'http://localhost:5000/api/Subscription';

  constructor(private http: HttpClient) {}

  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/packages`);
  }

  purchasePackage(packageId: number, months: number = 1): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/purchase`, { packageId, months });
  }

  createSePayPayment(packageId: number, months: number = 1): Observable<SePayPaymentResponse> {
    return this.http.post<SePayPaymentResponse>(`${this.apiUrl}/create-sepay-payment`, { packageId, months });
  }

  // Alias for compatibility
  createPayOSPayment(packageId: number, months: number = 1): Observable<SePayPaymentResponse> {
    return this.createSePayPayment(packageId, months);
  }

  checkOrderStatus(orderCode: number | string): Observable<OrderStatusResponse> {
    return this.http.get<OrderStatusResponse>(`${this.apiUrl}/check-order-status/${orderCode}`);
  }

  simulateSePaySuccess(orderCode: number | string, packageId?: number, months: number = 1): Observable<any> {
    const query = packageId ? `?packageId=${packageId}&months=${months}` : '';
    return this.http.post<any>(`${this.apiUrl}/simulate-sepay-success/${orderCode}${query}`, {});
  }

  // Alias for compatibility
  simulatePayOSSuccess(orderCode: number | string, packageId?: number, months: number = 1): Observable<any> {
    return this.simulateSePaySuccess(orderCode, packageId, months);
  }

  verifyMyPayments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify-my-payments`);
  }
}
