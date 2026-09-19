import { Component, input } from '@angular/core';
import { FloatingHeartsComponent } from '../floating-hearts/floating-hearts';

@Component({
  selector: 'app-auth-shell',
  imports: [FloatingHeartsComponent],
  template: `
    <div class="auth-shell">
      <aside class="auth-brand" aria-hidden="true">
        <div class="brand-bg"></div>
        <app-floating-hearts />
        <div class="brand-shine"></div>
        <div class="brand-particles">
          @for (p of particles; track p) {
            <span class="particle" [style.--i]="p"></span>
          }
        </div>
        <div class="brand-sparkles">
          <span class="sparkle s1">✦</span>
          <span class="sparkle s2">💍</span>
          <span class="sparkle s3">✧</span>
          <span class="sparkle s4">❋</span>
          <span class="sparkle s5">✦</span>
        </div>

        <div class="brand-inner">
          <div class="brand-content animate-slide-in-left">
            <div class="brand-hero">
              <div class="brand-logo-ring">
                <img src="/images/logo.png" alt="Hum Rishta" class="brand-logo" />
              </div>
              <h2 class="brand-title">Hum <span class="gold">Rishta</span></h2>
            </div>
            <p class="brand-urdu text-urdu">پاکستان کا قابلِ اعتماد رشتہ پلیٹ فارم</p>

            <ul class="brand-features">
              @for (f of features; track f.text) {
                <li class="feature-item animate-fade-in-up" [style.animation-delay]="f.delay">
                  <span class="feature-icon">{{ f.icon }}</span>
                  <span>{{ f.text }}</span>
                </li>
              }
            </ul>

            <div class="brand-stats animate-fade-in-up delay-4">
              <div class="stat"><strong>6K+</strong><span>Profiles</span></div>
              <div class="stat-divider"></div>
              <div class="stat"><strong>100%</strong><span>Halal</span></div>
              <div class="stat-divider"></div>
              <div class="stat"><strong>Free</strong><span>Register</span></div>
            </div>
          </div>
        </div>

        <div class="brand-wave">
          <svg viewBox="0 0 120 800" preserveAspectRatio="none">
            <path d="M0,0 L120,0 L120,800 C80,760 40,820 0,780 Z" fill="var(--ivory)"/>
          </svg>
        </div>
      </aside>

      <div class="auth-form-panel" [class.is-wide]="wide()">
        <app-floating-hearts [light]="true" />
        <div
          class="auth-card glass-card animate-fade-in-up"
          [class.auth-card-wide]="wide()"
        >
          <div class="auth-card-glow"></div>
          <header class="auth-header">
            <div class="auth-logo-wrap animate-float">
              <div class="auth-logo-circle">
                <img src="/images/logo.png" alt="Hum Rishta" class="auth-logo-mobile" />
              </div>
              <span class="auth-mobile-title">Hum <span class="gold">Rishta</span></span>
            </div>
            <div class="auth-ornament">✦ ✧ ✦</div>
            <h1>{{ title() }}</h1>
            <p class="text-urdu auth-urdu">{{ urduTitle() }}</p>
            @if (subtitle()) {
              <p class="auth-sub">{{ subtitle() }}</p>
            }
          </header>
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .auth-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      height: 100%;
      overflow: hidden;
    }

    /* ── Brand panel (fixed, no scroll) ── */
    .auth-brand {
      position: relative;
      height: 100%;
      overflow: hidden;
      color: white;
    }

    .brand-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(145deg, rgba(80, 8, 18, 0.95) 0%, rgba(155, 27, 48, 0.88) 50%, rgba(107, 15, 26, 0.92) 100%),
        url('/images/hero-bg.png') center / cover no-repeat;
    }

    .brand-shine {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.18), transparent 60%);
      pointer-events: none;
    }

    .brand-particles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .particle {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(245, 230, 184, 0.5);
      left: calc(var(--i) * 9.5%);
      top: calc((var(--i) * 13%) % 90% + 5%);
      animation: authFloat calc(4s + var(--i) * 0.4s) ease-in-out infinite;
      animation-delay: calc(var(--i) * -0.6s);
    }

    .brand-sparkles {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .sparkle {
      position: absolute;
      font-size: 1.1rem;
      opacity: 0.5;
      animation: sparkle 3s ease-in-out infinite;
    }
    .s1 { top: 12%; left: 15%; animation-delay: 0s; }
    .s2 { top: 28%; right: 18%; animation-delay: 0.8s; font-size: 1.4rem; }
    .s3 { bottom: 35%; left: 22%; animation-delay: 1.4s; }
    .s4 { top: 55%; right: 12%; animation-delay: 2s; }
    .s5 { bottom: 18%; right: 28%; animation-delay: 0.5s; }

    .brand-inner {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 2.5rem;
      overflow: hidden;
    }

    .brand-content {
      max-width: 420px;
      width: 100%;
      text-align: center;
    }

    .brand-hero {
      margin-bottom: 1rem;
    }

    .brand-logo-ring {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 190px;
      height: 190px;
      margin: 0 auto 1.25rem;
      padding: 4px;
      overflow: hidden;
      border-radius: 50%;
      background: transparent;
      border: 2px solid rgba(212, 175, 55, 0.45);
      box-shadow:
        0 0 0 10px rgba(212, 175, 55, 0.08),
        0 12px 40px rgba(0, 0, 0, 0.25);
      animation: logoPulse 4s ease-in-out infinite;
    }

    .brand-logo {
      width: 100%;
      height: 100%;
      max-width: none;
      object-fit: contain;
      object-position: center;
      transform: scale(1.32);
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
    }

    .brand-title {
      font-family: var(--font-display);
      font-size: clamp(2.6rem, 4vw, 3.4rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .brand-title .gold { color: var(--gold-shine); }

    .brand-urdu {
      color: var(--gold-shine);
      font-size: 1.2rem;
      margin-bottom: 1.5rem;
      opacity: 0.95;
    }

    .brand-features {
      list-style: none;
      text-align: left;
      margin-bottom: 1.5rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.9rem;
      margin-bottom: 0.45rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      backdrop-filter: blur(8px);
      font-size: 0.85rem;
      opacity: 0;
      animation-fill-mode: forwards;
      transition: transform 0.25s ease, background 0.25s ease;
    }
    .feature-item:hover {
      transform: translateX(6px);
      background: rgba(255, 255, 255, 0.12);
    }

    .feature-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(212, 175, 55, 0.2);
      border-radius: 10px;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .brand-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 0.85rem 1.25rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      border: 1px solid rgba(212, 175, 55, 0.25);
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .stat { text-align: center; }
    .stat strong {
      display: block;
      font-family: var(--font-display);
      font-size: 1.25rem;
      color: var(--gold-shine);
    }
    .stat span { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.2); }

    .brand-wave {
      position: absolute;
      top: 0;
      right: -1px;
      bottom: 0;
      width: 48px;
      z-index: 3;
      pointer-events: none;
    }
    .brand-wave svg { width: 100%; height: 100%; }

    /* ── Form panel (scrolls independently) ── */
    .auth-form-panel {
      position: relative;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background:
        linear-gradient(160deg, rgba(255, 248, 243, 0.97) 0%, rgba(255, 240, 243, 0.95) 50%, rgba(253, 245, 232, 0.97) 100%),
        url('/images/hearts-bg.png') center / cover no-repeat;
      -webkit-overflow-scrolling: touch;
    }

    .auth-form-panel.is-wide {
      align-items: flex-start;
      padding-top: 1.75rem;
      padding-bottom: 2rem;
    }

    .auth-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 420px;
      padding: 2rem 1.75rem 1.75rem;
      border-radius: 24px;
      opacity: 0;
      animation-fill-mode: forwards;
      flex-shrink: 0;
    }

    .auth-card-wide { max-width: 520px; }

    .auth-card-glow {
      position: absolute;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 120px;
      background: radial-gradient(ellipse, rgba(155, 27, 48, 0.12), transparent 70%);
      pointer-events: none;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-logo-wrap {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .auth-logo-circle {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      border: 2px solid rgba(212, 175, 55, 0.45);
      box-shadow:
        0 0 0 6px rgba(212, 175, 55, 0.08),
        0 8px 20px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      padding: 2px;
    }

    .auth-logo-mobile {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transform: scale(1.32);
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
    }

    .auth-mobile-title {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text);
    }
    .auth-mobile-title .gold { color: var(--secondary-dark); }

    .auth-ornament {
      color: var(--secondary);
      font-size: 0.85rem;
      letter-spacing: 0.35em;
      margin-bottom: 0.75rem;
      opacity: 0.8;
    }

    .auth-header h1 {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 0.2rem;
    }

    .auth-urdu {
      color: var(--primary);
      font-size: 1.05rem;
      margin-bottom: 0.25rem;
    }

    .auth-sub {
      color: var(--text-muted);
      font-size: 0.88rem;
      margin-top: 0.35rem;
      line-height: 1.5;
    }

    @keyframes authFloat {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
      50% { transform: translateY(-18px) scale(1.2); opacity: 0.9; }
    }

    @keyframes logoPulse {
      0%, 100% { box-shadow: 0 0 0 8px rgba(212, 175, 55, 0.08), 0 12px 40px rgba(0, 0, 0, 0.25); }
      50% { box-shadow: 0 0 0 14px rgba(212, 175, 55, 0.12), 0 16px 48px rgba(0, 0, 0, 0.3); }
    }

    @media (max-width: 900px) {
      .auth-shell { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
      .auth-logo-wrap { display: flex; }
      .auth-form-panel,
      .auth-form-panel.is-wide {
        align-items: flex-start;
        padding-top: 1.5rem;
        padding-bottom: 2rem;
      }
    }
  `],
})
export class AuthShellComponent {
  readonly title = input.required<string>();
  readonly urduTitle = input.required<string>();
  readonly subtitle = input<string>('');
  readonly wide = input(false);

  readonly particles = Array.from({ length: 12 }, (_, i) => i + 1);

  readonly features = [
    { icon: '🔒', text: 'Admin-verified contact sharing', delay: '0.15s' },
    { icon: '💑', text: 'Halal match search across Pakistan', delay: '0.25s' },
    { icon: '✓', text: 'Free registration & profile creation', delay: '0.35s' },
  ];
}
