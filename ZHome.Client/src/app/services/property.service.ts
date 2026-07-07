import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly apiUrl = 'http://localhost:5000/api/property';

  constructor(private http: HttpClient) {}

  getProperties(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProperty(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updatePropertyImage(id: number, imageBase64: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/image`, { imageBase64 });
  }

  createProperty(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  addRoom(propertyId: number, roomData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${propertyId}/room`, roomData);
  }

  incrementViewCount(propertyId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${propertyId}/view`, {});
  }

  getListings(filters: {
    search?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    verifiedHost?: boolean;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.district) params = params.set('district', filters.district);
    if (filters.minPrice !== undefined && filters.minPrice !== null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.verifiedHost) params = params.set('verifiedHost', 'true');

    return this.http.get<any[]>(`${this.apiUrl}/listings`, { params });
  }

  getDistricts(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:5000/api/location/districts');
  }

  toggleFavorite(roomId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/favorites/${roomId}`, {});
  }

  getPropertyReports(propertyId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:5000/api/report/property/${propertyId}`);
  }
}
