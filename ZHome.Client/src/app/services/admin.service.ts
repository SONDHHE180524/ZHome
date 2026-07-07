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
}
