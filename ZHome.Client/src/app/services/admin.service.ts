import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  getVerifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verifications`);
  }

  approveVerification(userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verifications/${userId}/approve`, {});
  }

  rejectVerification(userId: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verifications/${userId}/reject`, { reason });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-stats`);
  }

  getProperties(landlordId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/properties`;
    if (landlordId && landlordId > 0) {
      url += `?landlordId=${landlordId}`;
    }
    return this.http.get<any[]>(url);
  }

  getTransactions(propertyId?: number, landlordId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/transactions`;
    const params: string[] = [];
    if (propertyId && propertyId > 0) params.push(`propertyId=${propertyId}`);
    if (landlordId && landlordId > 0) params.push(`landlordId=${landlordId}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<any[]>(url);
  }
}
