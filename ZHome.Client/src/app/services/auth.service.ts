import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSession {
  token: string;
  userId: number;
  fullName: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  verificationStatus?: string;
  subscriptionId?: number;
  subscriptionEndDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  // Create a signal for the current user session
  readonly session = signal<UserSession | null>(this.loadSessionFromStorage());

  // Computed signals for quick check
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly userRole = computed(() => this.session()?.role ?? '');
  readonly userName = computed(() => this.session()?.fullName ?? '');
  readonly subscriptionId = computed(() => {
    const s = this.session();
    if (!s) return 1;
    if (s.subscriptionEndDate) {
      const endDate = new Date(s.subscriptionEndDate);
      if (endDate < new Date()) {
        return 1; // Expired
      }
    }
    return s.subscriptionId ?? 1;
  }); // 1 = Free
  readonly isPremium = computed(() => this.subscriptionId() > 1); // >= 99k
  readonly isPremiumPro = computed(() => this.subscriptionId() > 2); // >= 299k

  constructor(private http: HttpClient) {
    if (this.isLoggedIn()) {
      this.refreshUserProfile();
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(credentials: any): Observable<UserSession> {
    return this.http.post<UserSession>(`${this.apiUrl}/login`, credentials).pipe(
      tap(userSession => {
        this.saveSession(userSession);
        this.refreshUserProfile();
      })
    );
  }

  refreshUserProfile(): void {
    this.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.updateSessionProfile(
            profile.fullName,
            profile.email,
            profile.avatarUrl,
            profile.subscriptionId,
            profile.subscriptionEndDate
          );
        }
      },
      error: () => {}
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    this.session.set(null);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data);
  }

  changePassword(data: { oldPassword: string, newPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, data);
  }

  updateSessionProfile(fullName: string, email?: string, avatarUrl?: string, subscriptionId?: number, subscriptionEndDate?: string): void {
    const current = this.session();
    if (current) {
      const updated = {
        ...current,
        fullName,
        email,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : current.avatarUrl,
        subscriptionId: subscriptionId !== undefined ? subscriptionId : current.subscriptionId,
        subscriptionEndDate: subscriptionEndDate !== undefined ? subscriptionEndDate : current.subscriptionEndDate
      };
      localStorage.setItem('user_session', JSON.stringify(updated));
      this.session.set(updated);
    }
  }

  private saveSession(userSession: UserSession): void {
    localStorage.setItem('token', userSession.token);
    localStorage.setItem('user_session', JSON.stringify(userSession));
    this.session.set(userSession);
  }

  private loadSessionFromStorage(): UserSession | null {
    const rawSession = localStorage.getItem('user_session');
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession) as UserSession;
    } catch {
      return null;
    }
  }
}
