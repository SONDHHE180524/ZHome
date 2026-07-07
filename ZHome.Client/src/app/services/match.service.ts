import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly apiUrl = 'http://localhost:5000/api/matching';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  saveProfile(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profile`, data);
  }

  getSuggestedRoommates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suggested-roommates`);
  }
}
