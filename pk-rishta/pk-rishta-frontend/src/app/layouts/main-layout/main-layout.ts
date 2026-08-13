import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { FooterComponent } from '../../shared/components/footer/footer';
import { CookieConsentComponent } from '../../shared/components/cookie-consent/cookie-consent';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top';
import { ScrollContainerDirective } from '../../shared/directives/scroll-container.directive';
import { VisitService } from '../../core/services/visit.service';

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
  `],
})
export class MainLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly visitService = inject(VisitService);

  ngOnInit(): void {
    this.visitService.track(this.router.url || '/');
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.visitService.track(e.urlAfterRedirects || e.url);
    });
  }
}
