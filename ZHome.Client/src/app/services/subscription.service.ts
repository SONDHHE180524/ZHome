import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly apiUrl = 'http://localhost:5000/api/Subscription';

  constructor(private http: HttpClient) {}

  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/packages`);
  }

  purchasePackage(packageId: number, months: number = 1): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/purchase`, { packageId, months });
  }
}
