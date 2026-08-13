import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, AppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  readonly unreadCount = signal(0);
  readonly items = signal<AppNotification[]>([]);

  getNotifications(limit = 20): Observable<ApiResponse<AppNotification[]>> {
    return this.http.get<ApiResponse<AppNotification[]>>(`${this.apiUrl}?limit=${limit}`).pipe(
      tap((res) => this.items.set(res.data || []))
    );
  }

  refreshUnreadCount(): Observable<ApiResponse<{ unread: number }>> {
    return this.http.get<ApiResponse<{ unread: number }>>(`${this.apiUrl}/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.data?.unread || 0))
    );
  }

  markRead(id: string): Observable<ApiResponse<AppNotification>> {
    return this.http.patch<ApiResponse<AppNotification>>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.items.update((list) =>
          list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
      })
    );
  }

  markAllRead(): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.items.update((list) => list.map((n) => ({ ...n, is_read: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
