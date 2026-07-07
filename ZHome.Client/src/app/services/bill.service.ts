import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private readonly apiUrl = 'http://localhost:5000/api/bill';

  constructor(private http: HttpClient) {}

  getUtilityGrid(propertyId: number, month: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/utility-grid/${propertyId}?month=${month}&year=${year}`);
  }

  createSupplementaryBill(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/supplementary`, data);
  }

  submitUtilityGrid(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/utility-grid/submit`, data);
  }

  getLandlordBills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/landlord`);
  }

  getTenantBills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tenant`);
  }

  payBill(billId: number, amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${billId}/pay`, { amount });
  }

  sendEmailNotification(billId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${billId}/send-email`, {});
  }

  getBillById(billId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${billId}`);
  }
}
