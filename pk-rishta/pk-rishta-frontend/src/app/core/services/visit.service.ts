import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

const VISITOR_KEY = 'hum_rishta_visitor_id';
const LAST_PING_KEY = 'hum_rishta_visit_ping_at';

@Injectable({ providedIn: 'root' })
export class VisitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/visits`;

  /** Record unique daily visit + page view (throttled to once per 30s). */
  track(path = '/'): void {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_PING_KEY) || 0);
    if (now - last < 30_000) return;
    localStorage.setItem(LAST_PING_KEY, String(now));

    this.ping(path).subscribe();
  }

  private ping(path: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(this.baseUrl, {
      visitor_key: this.getOrCreateVisitorKey(),
      path: path.slice(0, 200),
    }).pipe(catchError(() => of({ success: false, data: null } as ApiResponse<unknown>)));
  }

  private getOrCreateVisitorKey(): string {
    let key = localStorage.getItem(VISITOR_KEY);
    if (!key || key.length < 16) {
      key = (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/-/g, '');
      localStorage.setItem(VISITOR_KEY, key);
    }
    return key;
  }
}
