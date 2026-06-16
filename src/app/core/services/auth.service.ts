import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile
} from '../../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API = 'http://localhost:8081/api';
  private readonly TOKEN_KEY = 'cafetron_token';
  private readonly USER_KEY = 'cafetron_user';

  constructor(private http: HttpClient) {}

  // ── API calls ────────────────────────────────────────────────────

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/auth/register`, request
    ).pipe(
      tap(response => this.saveSession(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/auth/login`, request
    ).pipe(
      tap(response => this.saveSession(response))
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/users/me`);
  }

  // ── Session management ───────────────────────────────────────────

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getRole(): string | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (!user) return null;
    return JSON.parse(user).role;
  }

  getUserName(): string | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (!user) return null;
    return JSON.parse(user).name;
  }
}
