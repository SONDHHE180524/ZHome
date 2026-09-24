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
      if (filters.search) params.search = filters.search;
      if (filters.district) params.district = filters.district;
      if (filters.ward) params.ward = filters.ward;
      if (filters.university) params.university = filters.university;
      if (filters.hasRoom !== null && filters.hasRoom !== undefined) params.hasRoom = filters.hasRoom;
      if (filters.gender && filters.gender !== 'Any') params.gender = filters.gender;
      if (filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice > 0) params.maxPrice = filters.maxPrice;
      if (filters.budgetPerPerson !== null && filters.budgetPerPerson !== undefined && filters.budgetPerPerson > 0) params.budgetPerPerson = filters.budgetPerPerson;
      if (filters.smoke !== null && filters.smoke !== undefined) params.smoke = filters.smoke;
      if (filters.sleepLate !== null && filters.sleepLate !== undefined) params.sleepLate = filters.sleepLate;
      if (filters.hasPet !== null && filters.hasPet !== undefined) params.hasPet = filters.hasPet;
      if (filters.hometown) params.hometown = filters.hometown;
      if (filters.occupation && filters.occupation !== 'All') params.occupation = filters.occupation;
      if (filters.ageRange && filters.ageRange !== 'All') params.ageRange = filters.ageRange;
      if (filters.roommatesWanted) params.roommatesWanted = filters.roommatesWanted;
      if (filters.leaseTerm && filters.leaseTerm !== 'All') params.leaseTerm = filters.leaseTerm;
      if (filters.moveInTime && filters.moveInTime !== 'All') params.moveInTime = filters.moveInTime;
      if (filters.occupantsPerRoom) params.occupantsPerRoom = filters.occupantsPerRoom;
      if (filters.personality && filters.personality !== 'All') params.personality = filters.personality;
      if (filters.cookFrequency && filters.cookFrequency !== 'All') params.cookFrequency = filters.cookFrequency;
      if (filters.inviteFriends && filters.inviteFriends !== 'All') params.inviteFriends = filters.inviteFriends;
      if (filters.otherCriteria) params.otherCriteria = filters.otherCriteria;
      if (filters.amenities && filters.amenities.length > 0) params.amenities = filters.amenities.join(',');
      if (filters.surroundings && filters.surroundings.length > 0) params.surroundings = filters.surroundings.join(',');
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
