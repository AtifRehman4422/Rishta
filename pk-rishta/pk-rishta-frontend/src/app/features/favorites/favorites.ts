import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritesService } from '../../core/services/favorites.service';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ProfileCardComponent],
  template: `
    <div class="bg-page-header">
      <div class="container">
        <h1 class="animate-fade-in-up">Favorites</h1>
        <p class="text-urdu animate-fade-in-up delay-1">پسندیدہ پروفائلز</p>
      </div>
    </div>

    <div class="container page-section">
      @if (favorites.loading() && !favorites.profiles().length) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (!favorites.profiles().length) {
        <div class="empty-state card animate-fade-in-up">
          <span class="empty-heart" aria-hidden="true">♥</span>
          <h3>No saved profiles yet</h3>
          <p>Tap the ♥ on any profile to keep it here and easily find your favorite matches again.</p>
          <a routerLink="/search" class="btn btn-primary">Browse Profiles</a>
        </div>
      } @else {
        <p class="result-meta animate-fade-in-up">
          {{ favorites.profiles().length }} profile{{ favorites.profiles().length === 1 ? '' : 's' }} in your favorites
        </p>
        <div class="grid-3">
          @for (profile of favorites.profiles(); track profile.id; let i = $index) {
            <app-profile-card [profile]="profile" [delay]="(i * 0.05) + 's'" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .result-meta {
      font-size: 0.92rem;
      color: var(--text-muted);
      margin: 0 0 1.25rem;
      font-weight: 600;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      max-width: 480px;
      margin: 0 auto;
    }
    .empty-heart {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7A1528, #9B1B30);
      color: #FFC1CB;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .empty-state p {
      color: var(--text-muted);
      margin: 0 0 1.5rem;
      line-height: 1.6;
    }
    @media (max-width: 900px) {
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .grid-3 { grid-template-columns: 1fr; }
    }
  `],
})
export class FavoritesComponent {
  readonly favorites = inject(FavoritesService);
}
