import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

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

  // Roles & User Management
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`);
  }

  getUsers(keyword?: string, roleId?: number, verificationStatus?: string): Observable<any[]> {
    let url = `${this.apiUrl}/users`;
    const params: string[] = [];
    if (keyword && keyword.trim()) params.push(`keyword=${encodeURIComponent(keyword.trim())}`);
    if (roleId && roleId > 0) params.push(`roleId=${roleId}`);
    if (verificationStatus && verificationStatus !== 'All') params.push(`verificationStatus=${encodeURIComponent(verificationStatus)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<any[]>(url);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, data);
  }

  assignRole(id: number, roleId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}/role`, { roleId });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }
}
