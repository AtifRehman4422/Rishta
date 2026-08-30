import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { FooterComponent } from '../../shared/components/footer/footer';
import { CookieConsentComponent } from '../../shared/components/cookie-consent/cookie-consent';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top';
import { ScrollContainerDirective } from '../../shared/directives/scroll-container.directive';
import { VisitService } from '../../core/services/visit.service';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ScrollToTopComponent, ScrollContainerDirective, CookieConsentComponent],
  template: `
    <div class="app-shell">
      <app-navbar />
      <div class="app-scroll" appScrollContainer>
        <main class="main-content">
          <router-outlet />
        </main>
        <app-footer />
      </div>
      <app-scroll-to-top />
      <app-cookie-consent />
      @if (favorites.toast(); as t) {
        <div
          class="fav-toast"
          [class.toast-ok]="t.kind === 'added'"
          [class.toast-bad]="t.kind === 'removed' || t.kind === 'error'"
          [class.toast-info]="t.kind === 'info'"
          role="status"
        >
          {{ t.text }}
        </div>
      }
    </div>
  `,
  styles: [`
    .app-shell {
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .app-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      min-height: 0;
    }
    .main-content {
      min-height: 100%;
    }
    .fav-toast {
      position: fixed;
      left: 50%;
      bottom: 1.5rem;
      transform: translateX(-50%);
      z-index: 1200;
      padding: 0.85rem 1.25rem;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 700;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
      animation: toast-in 0.25s ease;
      max-width: calc(100% - 2rem);
    }
    .toast-ok { background: #15803D; color: #fff; }
    .toast-bad { background: #B91C1C; color: #fff; }
    .toast-info { background: #7A1528; color: #fff; }
    @keyframes toast-in {
      from { opacity: 0; transform: translate(-50%, 10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly visitService = inject(VisitService);
  readonly favorites = inject(FavoritesService);

  ngOnInit(): void {
    this.visitService.track(this.router.url || '/');
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.visitService.track(e.urlAfterRedirects || e.url);
    });
  }
}
