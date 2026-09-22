import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly apiUrl = `${environment.apiUrl}/matching`;

  constructor(private http: HttpClient) {}

  getPublicPosts(filters?: any): Observable<any[]> {
    let params: any = {};
    if (filters) {
      if (filters.university) params.university = filters.university;
      if (filters.hasRoom !== null && filters.hasRoom !== undefined) params.hasRoom = filters.hasRoom;
      if (filters.gender) params.gender = filters.gender;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.search) params.search = filters.search;
    }
    return this.http.get<any[]>(`${this.apiUrl}/posts`, { params });
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  saveProfile(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profile`, data);
  }

  getSuggestedRoommates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suggested-roommates`);
  }

  toggleActive(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/toggle-active`, {});
  }
}
