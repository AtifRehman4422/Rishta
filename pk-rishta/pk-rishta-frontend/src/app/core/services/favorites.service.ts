import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { ApiResponse, Profile } from '../models';
import { AuthService } from './auth.service';

export type FavoriteToast = {
  kind: 'added' | 'removed' | 'error' | 'info';
  text: string;
};

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/favorites`;

  readonly ids = signal<Set<string>>(new Set());
  readonly profiles = signal<Profile[]>([]);
  readonly loading = signal(false);
  readonly toast = signal<FavoriteToast | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      const complete = !!this.auth.currentUser()?.is_profile_complete;
      untracked(() => {
        if (loggedIn && !this.auth.isAdmin() && complete) this.load();
        else this.clear();
      });
    });
  }

  isFavorite(profileId: string): boolean {
    return this.ids().has(profileId);
  }

  canFavorite(profileId: string): boolean {
    if (!this.auth.isLoggedIn() || this.auth.isAdmin()) return false;
    if (!this.auth.currentUser()?.is_profile_complete) return false;
    return this.auth.currentUser()?.profile_id !== profileId;
  }

  load(): void {
    if (!this.auth.isLoggedIn() || this.auth.isAdmin() || !this.auth.currentUser()?.is_profile_complete) return;
    this.loading.set(true);
    const params = new HttpParams().set('limit', '50');
    this.http.get<ApiResponse<Profile[]>>(this.baseUrl, { params }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.profiles.set(list);
        this.ids.set(new Set(list.map((p) => p.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clear(): void {
    this.ids.set(new Set());
    this.profiles.set([]);
    this.loading.set(false);
  }

  toggle(profileId: string, profile?: Profile): void {
    if (!this.canFavorite(profileId)) return;

    if (!this.auth.isLoggedIn()) {
      this.showToast({ kind: 'info', text: 'Login to save profiles to favorites' });
      this.router.navigate(['/login']);
      return;
    }

    if (!this.auth.currentUser()?.is_profile_complete) {
      this.showToast({ kind: 'info', text: 'Complete your profile to save favorites' });
      this.router.navigate(['/my-profile']);
      return;
    }

    const wasFavorite = this.ids().has(profileId);
    this.ids.update((set) => {
      const next = new Set(set);
      if (wasFavorite) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
    if (wasFavorite) {
      this.profiles.update((list) => list.filter((p) => p.id !== profileId));
    } else if (profile && !this.profiles().some((p) => p.id === profileId)) {
      this.profiles.update((list) => [profile, ...list]);
    }

    const req = wasFavorite
      ? this.http.delete<ApiResponse<{ is_favorite: boolean }>>(`${this.baseUrl}/${profileId}`)
      : this.http.post<ApiResponse<{ is_favorite: boolean }>>(`${this.baseUrl}/${profileId}`, {});

    req.subscribe({
      next: () => {
        this.showToast({
          kind: wasFavorite ? 'removed' : 'added',
          text: wasFavorite ? 'Removed from favorites' : 'Added to favorites',
        });
      },
      error: (err) => {
        this.ids.update((set) => {
          const next = new Set(set);
          if (wasFavorite) next.add(profileId);
          else next.delete(profileId);
          return next;
        });
        if (wasFavorite && profile) {
          this.profiles.update((list) =>
            list.some((p) => p.id === profileId) ? list : [profile, ...list]
          );
        } else if (!wasFavorite) {
          this.profiles.update((list) => list.filter((p) => p.id !== profileId));
        }
        this.showToast({
          kind: 'error',
          text: err.error?.message || 'Could not update favorites. Try again.',
        });
      },
    });
  }

  private showToast(toast: FavoriteToast): void {
    this.toast.set(toast);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2800);
  }
}
