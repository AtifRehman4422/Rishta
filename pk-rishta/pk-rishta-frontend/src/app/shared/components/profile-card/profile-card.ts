import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../../core/models';
import { formatProfileLocation } from '../../../core/constants/pakistan-locations';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-profile-card',
  imports: [RouterLink, ProfileAvatarComponent],
  template: `
    <div class="profile-card card animate-fade-in-up" [style.animation-delay]="delay">
      <div class="card-photo" [class.has-fav]="favorites.canFavorite(profile.id)">
        <app-profile-avatar
          class="card-avatar"
          [photo]="profile.profile_photo"
          [gender]="profile.gender"
          [firstName]="profile.first_name"
          [lastName]="profile.last_name"
          size="md"
        />
        @if (favorites.canFavorite(profile.id)) {
          <button
            type="button"
            class="fav-btn"
            [class.is-on]="favorites.isFavorite(profile.id)"
            [attr.aria-label]="favorites.isFavorite(profile.id) ? 'Remove from favorites' : 'Save to favorites'"
            (click)="onHeart($event)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" [attr.fill]="favorites.isFavorite(profile.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        }
        @if (profile.is_verified) {
          <span class="verified-badge" title="Verified">✓</span>
        }
        @if (auth.isAdmin() && profile.admin_rating) {
          <span class="rating-stars" title="Attractiveness">{{ ratingStars(profile.admin_rating) }}</span>
        }
        @if (profile.match_score != null) {
          <span class="match-badge">{{ profile.match_score }}% match</span>
        }
      </div>
      <div class="card-body">
        <h3 class="card-name">{{ profile.first_name }} {{ profile.last_name }}</h3>
        <p class="card-meta">
          {{ profile.age }} yrs · {{ formatProfileLocation(profile) }}
        </p>
        <p class="card-gender">{{ profile.gender === 'male' ? 'Male' : 'Female' }}</p>

        <div class="card-details">
          @if (profile.education) {
            <div class="detail-row">
              <span class="detail-icon" aria-hidden="true">🎓</span>
              <span class="detail-text">{{ profile.education }}</span>
            </div>
          }
          @if (profile.profession) {
            <div class="detail-row">
              <span class="detail-icon" aria-hidden="true">💼</span>
              <span class="detail-text">{{ profile.profession }}</span>
            </div>
          }
        </div>

        <a [routerLink]="['/profile', profile.id]" class="btn btn-primary btn-sm view-btn">View Profile</a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
    }

    .profile-card {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      text-align: center;
    }

    .card-photo {
      position: relative;
      padding: 2rem 1.5rem 1rem;
      background: linear-gradient(180deg, rgba(155,27,48,0.05), rgba(201,162,39,0.04));
      border-bottom: 1px solid rgba(201,162,39,0.15);
    }

    .card-avatar {
      margin: 0 auto;
      display: block;
      width: fit-content;
    }

    .verified-badge {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .has-fav .verified-badge { right: 3.55rem; }
    .fav-btn {
      position: absolute;
      top: 0.85rem;
      right: 0.75rem;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.38);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
      padding: 0;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .fav-btn svg { width: 18px; height: 18px; }
    .fav-btn.is-on { color: #FF5D7A; background: rgba(0, 0, 0, 0.45); }
    .fav-btn:hover { transform: scale(1.08); background: rgba(0, 0, 0, 0.55); }
    .rating-stars {
      position: absolute;
      top: 1.35rem;
      left: 1.25rem;
      color: #FFD700;
      font-size: 1.05rem;
      letter-spacing: 0.04em;
      line-height: 1;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
    }
    .match-badge {
      position: absolute;
      left: 50%;
      bottom: 0.6rem;
      transform: translateX(-50%);
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      background: linear-gradient(135deg, #7A1528, #9B1B30);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      box-shadow: 0 3px 10px rgba(46, 6, 16, 0.2);
      white-space: nowrap;
    }

    .card-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 1rem 1.5rem 1.5rem;
      min-height: 0;
    }

    .card-name {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      line-height: 1.3;
    }

    .card-meta {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0 0 0.35rem;
    }

    .card-gender {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.75rem;
    }

    .card-details {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      width: 100%;
      text-align: left;
      margin-bottom: 1rem;
      flex: 1;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 1.25rem minmax(0, 1fr);
      column-gap: 0.45rem;
      align-items: start;
    }

    .detail-icon {
      font-size: 0.85rem;
      line-height: 1.35;
      text-align: center;
    }

    .detail-text {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.35;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      word-break: break-word;
    }

    .view-btn {
      width: 100%;
      margin-top: auto;
    }

    .profile-card:hover {
      transform: translateY(-4px);
    }
  `],
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: Profile;
  @Input() delay = '0s';
  readonly formatProfileLocation = formatProfileLocation;
  readonly favorites = inject(FavoritesService);
  readonly auth = inject(AuthService);

  onHeart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.profile.id, this.profile);
  }

  ratingStars(n?: number | null): string {
    const count = Number(n);
    if (!count || count < 1) return '';
    return '★'.repeat(Math.min(5, count));
  }
}
