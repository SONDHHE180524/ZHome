import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly apiUrl = `${environment.apiUrl}/property`;

  constructor(private http: HttpClient) {}

  getProperties(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProperty(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/${id}`);
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

  getLandlordRoomDetail(roomId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/room/${roomId}`);
  }

  updateRoom(roomId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/room/${roomId}`, data);
  }

  deleteRoom(roomId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/room/${roomId}`);
  }

  incrementViewCount(propertyId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${propertyId}/view`, {});
  }

  getListings(filters: {
    search?: string;
    district?: string;
    ward?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    verifiedHost?: boolean;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.district) params = params.set('district', filters.district);
    if (filters.ward) params = params.set('ward', filters.ward);
    if (filters.minPrice !== undefined && filters.minPrice !== null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minArea !== undefined && filters.minArea !== null) params = params.set('minArea', filters.minArea.toString());
    if (filters.maxArea !== undefined && filters.maxArea !== null) params = params.set('maxArea', filters.maxArea.toString());
    if (filters.verifiedHost) params = params.set('verifiedHost', 'true');

    return this.http.get<any[]>(`${this.apiUrl}/listings`, { params });
  }

  getLocations(level: number = 2): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/location?level=${level}`);
  }

  getChildren(parentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/location/${parentId}/children`);
  }

  toggleFavorite(roomId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/favorites/${roomId}`, {});
  }

  getPropertyReports(propertyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/report/property/${propertyId}`);
  }
}
