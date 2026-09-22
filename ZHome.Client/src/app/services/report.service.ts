import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/report`;

  constructor(private http: HttpClient) {}

  createReport(data: { title: string, content: string, contractId?: number, rating?: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getMyReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-reports`);
  }

  getAllReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  updateStatus(reportId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${reportId}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
