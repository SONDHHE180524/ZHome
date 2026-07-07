import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiUrl = 'http://localhost:5000/api/report';

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
