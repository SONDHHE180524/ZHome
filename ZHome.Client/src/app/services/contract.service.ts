import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly apiUrl = 'http://localhost:5000/api/contract';

  constructor(private http: HttpClient) {}

  checkIn(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check-in`, data);
  }

  checkOut(contractId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${contractId}/check-out`, {});
  }

  getContracts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTenantByPhone(phone: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tenant-by-phone/${phone}`);
  }

  getMyRentals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-rentals`);
  }

  getMyRental(contractId?: number): Observable<any> {
    const url = contractId ? `${this.apiUrl}/my-rental?contractId=${contractId}` : `${this.apiUrl}/my-rental`;
    return this.http.get<any>(url);
  }
}
