import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CONSENT_KEY = 'pk-rishta-cookie-consent';

@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <div class="cookie-banner animate-fade-in-up" role="dialog" aria-label="Cookie consent">
        <div class="cookie-inner">
          <div class="cookie-text">
            <strong>🍪 We use cookies</strong>
            <p>
              PK Rishta uses cookies to improve your experience and may show ads through Google AdSense.
              By continuing, you agree to our
              <a routerLink="/privacy" (click)="accept()">Privacy Policy</a>.
            </p>
          </div>
          <div class="cookie-actions">
            <button type="button" class="btn btn-primary btn-sm" (click)="accept()">Accept</button>
            <a routerLink="/privacy" class="btn btn-outline btn-sm" (click)="accept()">Learn More</a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 1rem;
      background: rgba(45, 27, 27, 0.97);
      backdrop-filter: blur(12px);
      border-top: 2px solid var(--gold);
      box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
    }
    .cookie-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .cookie-text { flex: 1; min-width: 260px; color: white; }
    .cookie-text strong { display: block; margin-bottom: 0.35rem; font-size: 0.95rem; }
    .cookie-text p { font-size: 0.85rem; opacity: 0.9; line-height: 1.5; margin: 0; }
    .cookie-text a { color: var(--gold-shine); text-decoration: underline; }
    .cookie-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }
    @media (max-width: 576px) {
      .cookie-inner { flex-direction: column; align-items: stretch; }
      .cookie-actions { justify-content: center; }
    }
  `],
})
export class CookieConsentComponent implements OnInit {
  visible = signal(false);

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(CONSENT_KEY)) {
      this.visible.set(true);
    }
  }

  accept(): void {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    this.visible.set(false);
  }
}
