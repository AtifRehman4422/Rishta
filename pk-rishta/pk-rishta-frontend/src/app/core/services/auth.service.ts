import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  readonly currentUser = signal<User | null>(this.loadUser());
  readonly isLoggedIn = signal(!!this.getToken());
  readonly isAdmin = signal(this.currentUser()?.role === 'admin');

  private loadUser(): User | null {
    try {
      const data = localStorage.getItem('pk_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem('pk_token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  }

  /** Creates account + sends OTP (does not log in until OTP is verified). */
  register(data: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data);
  }

  verifyRegisterOtp(email: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/verify-register-otp`, { email, code })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  resendOtp(email: string, purpose: 'email_verify' | 'password_reset'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/resend-otp`, { email, purpose });
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/reset-password`, {
        email,
        code,
        new_password: newPassword,
      })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  getCaptcha(): Observable<ApiResponse<{ captcha_token: string; question: string; expires_in: number }>> {
    return this.http.get<ApiResponse<{ captcha_token: string; question: string; expires_in: number }>>(
      `${this.baseUrl}/auth/captcha`
    );
  }

  login(
    email: string,
    password: string,
    captchaToken: string,
    captchaAnswer: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, {
        email,
        password,
        captcha_token: captchaToken,
        captcha_answer: captchaAnswer,
      })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/auth/me`).pipe(
      tap((res) => {
        if (!res.data) return;
        this.currentUser.set(res.data);
        localStorage.setItem('pk_user', JSON.stringify(res.data));
        this.isLoggedIn.set(true);
        this.isAdmin.set(res.data.role === 'admin');
      })
    );
  }

  /** Confirms the stored token with the server. Local role is never trusted alone. */
  restoreSession(): Observable<User | null> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return of(null);
    }
    return this.getMe().pipe(
      map((res) => res.data ?? null),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  clearSession(): void {
    localStorage.removeItem('pk_token');
    localStorage.removeItem('pk_user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/']);
  }

  private handleAuth(res: AuthResponse): void {
    if (res.success && res.data?.token && res.data.user) {
      localStorage.setItem('pk_token', res.data.token);
      localStorage.setItem('pk_user', JSON.stringify(res.data.user));
      this.currentUser.set(res.data.user);
      this.isLoggedIn.set(true);
      this.isAdmin.set(res.data.user.role === 'admin');
    }
  }
}
