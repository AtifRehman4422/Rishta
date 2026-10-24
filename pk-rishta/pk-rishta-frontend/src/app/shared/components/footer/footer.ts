import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialLinksComponent } from '../social-links/social-links';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, SocialLinksComponent],
  template: `
    <footer class="footer bg-footer">
      <div class="footer-overlay"></div>
      <div class="container footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="logo-row">
              <img src="/images/logo.png" alt="Hum Rishta" class="footer-logo" />
            </div>
            <p class="footer-desc">Pakistan's trusted rishta and matrimonial website. Connecting hearts with faith, respect, and tradition.</p>
            <p class="text-urdu footer-urdu">ایمان، احترام اور روایت کے ساتھ دلوں کو ملانا</p>
            <div class="footer-social">
              <app-social-links [compact]="true" />
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a routerLink="/">Rishta Home</a>
            <a routerLink="/search">Search Rishta Profiles</a>
            <a routerLink="/blog">Rishta & Marriage Blog</a>
            <a routerLink="/about">About Hum Rishta</a>
            <a routerLink="/contact">Contact Us</a>
            <a routerLink="/register">Free Matrimonial Registration</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a routerLink="/privacy">Privacy Policy</a>
            <a routerLink="/terms">Terms of Service</a>
            <a routerLink="/about">About Hum Rishta</a>
          </div>
          <div>
            <h4>Contact</h4>
            <span>humrishta@gmail.com</span>
            <a href="https://wa.me/923435020077" target="_blank" rel="noopener">+92 343 5020077</a>
            <span>Lahore, Pakistan</span>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ year }} Hum Rishta. All rights reserved.</p>
          <div class="footer-legal">
            <a routerLink="/privacy">Privacy</a>
            <span>·</span>
            <a routerLink="/terms">Terms</a>
            <span>·</span>
            <a routerLink="/contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      position: relative; color: white; padding: 4rem 0 0; margin-top: 0;
      border-top: 3px solid var(--gold);
    }
    .footer-overlay {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 30% 0%, rgba(212, 175, 55, 0.08), transparent 60%);
      pointer-events: none;
    }
    .footer-inner { position: relative; z-index: 1; }
    .footer-grid {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 2rem;
      padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,0.15);
    }
    .logo-row { margin-bottom: 1rem; }
    .footer-logo {
      height: 96px;
      width: auto;
      object-fit: contain;
      background: transparent;
    }
    .footer-desc { opacity: 0.9; font-size: 0.9rem; line-height: 1.7; margin-bottom: 0.75rem; }
    .footer-urdu { opacity: 0.75; font-size: 0.85rem; color: var(--gold-shine); margin-bottom: 1.25rem; }
    .footer-social { margin-top: 0.25rem; }
    h4 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--gold-shine); }
    .footer-grid div:not(.footer-brand) {
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .footer-grid a, .footer-grid span {
      color: rgba(255,255,255,0.8); font-size: 0.9rem; text-decoration: none;
    }
    .footer-grid a:hover { color: var(--gold-shine); }
    .footer-bottom {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem 0; opacity: 0.8; font-size: 0.85rem;
      flex-wrap: wrap; gap: 0.75rem;
    }
    .footer-legal { display: flex; gap: 0.5rem; align-items: center; }
    .footer-legal a { color: rgba(255,255,255,0.8); text-decoration: none; }
    .footer-legal a:hover { color: var(--gold-shine); }
    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .footer-bottom { flex-direction: column; text-align: center; }
    }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
