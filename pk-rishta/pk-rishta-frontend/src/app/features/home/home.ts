import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Profile } from '../../core/models';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ALL_LOCATION_PROVINCES,
  OVERSEAS_COUNTRIES,
  citiesForProvince,
  isOverseasProvince,
  provinceLabel,
} from '../../core/constants/pakistan-locations';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot';
import { FloatingHeartsComponent } from '../../shared/components/floating-hearts/floating-hearts';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, ProfileCardComponent, AdSlotComponent, FloatingHeartsComponent],
  template: `
    <!-- Hero -->
    <section class="hero bg-hero">
      <app-floating-hearts />
      <div class="hero-shine"></div>
      <div class="hero-sparkles">
        <span class="sparkle s1">✦</span>
        <span class="sparkle s2">✧</span>
        <span class="sparkle s3">❋</span>
        <span class="sparkle s4">✦</span>
        <span class="sparkle s5">✧</span>
      </div>

      <div class="container hero-content">
        <div class="hero-text animate-fade-in-up">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            Pakistan's Trusted Matchmaking Platform
          </div>
          <h1>
            Your <span class="highlight">Blessed</span> Journey<br>
            to a Beautiful <span class="highlight-gold">Nikah</span>
          </h1>
          <p class="hero-urdu text-urdu">اللہ کے نام سے — اپنا رشتہ تلاش کریں</p>
          <p class="hero-desc">
            Halal matches, verified families, and thousands of profiles from across Pakistan.
            Your marriage journey starts here.
          </p>

          @if (!auth.isLoggedIn() || auth.isAdmin() || auth.currentUser()?.is_profile_complete) {
            <div class="hero-search card glass-card">
              <p class="search-label">🔍 Find your ideal match</p>
              <div class="search-row">
                <select class="form-select" [(ngModel)]="searchGender">
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  class="form-select"
                  [(ngModel)]="searchProvince"
                  (ngModelChange)="onProvinceChange($event)"
                >
                  <option value="">Any</option>
                  @for (p of provinces; track p) {
                    <option [value]="p">{{ provinceLabel(p) }}</option>
                  }
                </select>
                @if (isOverseasProvince(searchProvince)) {
                  <select class="form-select" [(ngModel)]="searchCity">
                    <option value="">Any</option>
                    @for (c of overseasCountries; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                } @else {
                  <select
                    class="form-select"
                    [(ngModel)]="searchCity"
                    [disabled]="!searchProvince"
                  >
                    <option value="">Any</option>
                    @for (c of cityOptions; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                }
                <a [routerLink]="['/search']" [queryParams]="{ gender: searchGender, city: searchCity, province: searchProvince }" class="btn btn-primary">
                  Search Matches
                </a>
              </div>
            </div>
          } @else {
            <div class="hero-profile-gate card glass-card">
              <div class="hero-gate-shine" aria-hidden="true"></div>
              <div class="hero-gate-head">
                <div class="hero-gate-badge-wrap">
                  <span class="hero-gate-icon">💍</span>
                </div>
                <div>
                  <span class="hero-gate-status">Almost there — 4 easy steps</span>
                  <h2>Start your match journey</h2>
                  <p>Complete your profile — then matching profiles will unlock.</p>
                </div>
              </div>
              <div class="hero-gate-progress" aria-hidden="true">
                <span class="gate-progress-fill"></span>
              </div>
              <div class="hero-gate-steps">
                <div class="gate-step">
                  <span class="gate-step-num">1</span>
                  <span class="gate-step-emoji">👤</span>
                  <strong>Personal</strong>
                  <small>Name, age, height</small>
                </div>
                <div class="gate-step">
                  <span class="gate-step-num">2</span>
                  <span class="gate-step-emoji">🏠</span>
                  <strong>Background</strong>
                  <small>Caste, education</small>
                </div>
                <div class="gate-step">
                  <span class="gate-step-num">3</span>
                  <span class="gate-step-emoji">📍</span>
                  <strong>Contact</strong>
                  <small>Phone & location</small>
                </div>
                <div class="gate-step">
                  <span class="gate-step-num">4</span>
                  <span class="gate-step-emoji">❤️</span>
                  <strong>Partner</strong>
                  <small>Your preferences</small>
                </div>
              </div>
              <a routerLink="/my-profile" class="btn btn-secondary btn-lg hero-gate-cta">
                Continue Profile Setup →
              </a>
              <p class="hero-gate-hint">Just a few minutes — verified families will be able to see you</p>
            </div>
          }

          @if (!auth.isLoggedIn() || auth.isAdmin() || auth.currentUser()?.is_profile_complete) {
            <div class="hero-cta">
              @if (!auth.isLoggedIn()) {
                <a routerLink="/register" class="btn btn-secondary btn-lg">💍 Register Free</a>
                <a routerLink="/search" class="btn btn-outline-light btn-lg">Search Profiles</a>
              } @else if (!auth.isAdmin()) {
                <a routerLink="/search" [queryParams]="{ matching: 'true' }" class="btn btn-secondary btn-lg">Matching Profiles</a>
                <a routerLink="/my-profile" class="btn btn-outline-light btn-lg">My Profile</a>
              }
            </div>
          }

          <div class="trust-row">
            @for (t of trustBadges; track t) {
              <span class="trust-item">{{ t }}</span>
            }
          </div>
        </div>
      </div>

      <div class="hero-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="var(--ivory)"/>
        </svg>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="why-section page-section">
      <div class="container">
        <div class="section-ornament animate-fade-in-up">✦ ❋ ✦</div>
        <h2 class="section-title text-center animate-fade-in-up">Why Families Trust PK Rishta</h2>
        <p class="section-subtitle text-center text-urdu">خاندانوں کا اعتماد — ہمارا فخر</p>
        <div class="why-grid">
          @for (item of whyUs; track item.title; let i = $index) {
            <div class="why-card card animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
              <div class="why-icon-wrap">
                <span class="why-icon">{{ item.icon }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Recent Profiles -->
    <section class="profiles-section page-section">
      <div class="container">
        <div class="section-ornament">💍 ✦ 💍</div>
        <h2 class="section-title text-center">Recent Profiles</h2>
        <p class="section-subtitle text-center">Verified matches from Pakistan and overseas</p>
        @if (!canViewProfiles) {
          <div class="recent-results">
            <div class="recent-access-overlay card">
              <span class="recent-lock-icon">🔒</span>
              @if (!auth.isLoggedIn()) {
                <h3>Login to view profiles</h3>
                <p>Profiles are only visible to registered members with a complete profile.</p>
                <div class="recent-access-actions">
                  <a routerLink="/login" class="btn btn-primary">Login</a>
                  <a routerLink="/register" class="btn btn-outline">Register Free</a>
                </div>
              } @else {
                <h3>Complete your profile first</h3>
                <p>Fill all required fields to unlock profiles and matching.</p>
                <a routerLink="/my-profile" class="btn btn-primary">Complete Your Profile</a>
              }
            </div>
          </div>
        } @else if (loading()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else if (recentProfiles().length) {
          <div class="recent-results">
            <div class="grid-3 recent-profile-grid">
              @for (profile of recentProfiles(); track profile.id; let i = $index) {
                <app-profile-card [profile]="profile" [delay]="(i * 0.1) + 's'" />
              }
            </div>
          </div>
          <div class="text-center profiles-cta">
            <a routerLink="/search" class="btn btn-primary btn-lg">View All Profiles →</a>
          </div>
          <div class="home-ad">
            <app-ad-slot [slot]="adSlots.homeBelowProfiles" format="horizontal" />
          </div>
        } @else {
          <p class="text-center profiles-empty">No profiles available yet — please register first.</p>
        }
      </div>
    </section>

    <!-- How it works -->
    <section class="how-section page-section">
      <div class="container">
        <div class="section-ornament">❋ ✦ ❋</div>
        <h2 class="section-title text-center">How Does Matching Work?</h2>
        <p class="section-subtitle text-center">Just 4 easy steps — from profile to marriage</p>

        <div class="steps-timeline">
          <div class="steps-track" aria-hidden="true"></div>
          <div class="steps-grid">
            @for (step of steps; track step.title; let i = $index) {
              <article class="step-card animate-fade-in-up" [style.animation-delay]="(i * 0.12) + 's'">
                <div class="step-badge">{{ i + 1 }}</div>
                <div class="step-icon-wrap">
                  <span class="step-icon">{{ step.icon }}</span>
                </div>
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-urdu text-urdu">{{ step.urdu }}</p>
                <p class="step-desc">{{ step.desc }}</p>
              </article>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials-section page-section bg-testimonials">
      <div class="container">
        <div class="section-ornament">✦ 💑 ✦</div>
        <h2 class="section-title text-center" style="color: white">Happy Matches</h2>
        <p class="section-subtitle text-center" style="color: rgba(255,255,255,0.8)">Couples who started their journey with PK Rishta</p>
        <div class="testimonial-grid">
          @for (t of testimonials; track t.name; let i = $index) {
            <div class="testimonial-card card animate-fade-in-up" [style.animation-delay]="(i * 0.12) + 's'">
              <div class="quote-mark">"</div>
              <p class="testimonial-text">{{ t.text }}</p>
              <div class="testimonial-author">
                <div class="author-avatar">{{ t.name.charAt(0) }}</div>
                <div>
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.city }} · {{ t.year }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <app-floating-hearts [light]="true" />
      <div class="container text-center cta-inner">
        <span class="cta-ring animate-float">💍</span>
        <h2 class="animate-fade-in-up">Register your profile today</h2>
        <p class="text-urdu cta-urdu">آج ہی اپنا رشتہ رجسٹر کریں — مکمل مفت</p>
        <p>Thousands of Pakistani families have found their match here. Now it's your turn.</p>
        <div class="cta-buttons">
          <a routerLink="/register" class="btn btn-secondary btn-lg">💍 Create a free profile</a>
          <a routerLink="/search" class="btn btn-outline btn-lg cta-outline">View Profiles</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* ── Hero ── */
    .hero {
      position: relative; padding: 4rem 0 5rem; overflow: hidden;
      min-height: calc(100vh - var(--navbar-height));
      display: flex; align-items: center;
    }
    .hero-shine {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.12), transparent 55%);
      pointer-events: none;
    }
    .hero-sparkles { position: absolute; inset: 0; pointer-events: none; }
    .sparkle {
      position: absolute; color: var(--gold-shine); font-size: 1.2rem;
      animation: sparkle 2.5s ease-in-out infinite;
    }
    .s1 { top: 15%; left: 8%; animation-delay: 0s; }
    .s2 { top: 25%; right: 12%; animation-delay: 0.5s; }
    .s3 { top: 60%; left: 5%; animation-delay: 1s; }
    .s4 { top: 70%; right: 20%; animation-delay: 1.5s; }
    .s5 { top: 40%; right: 40%; animation-delay: 0.8s; }
    .hero-content {
      position: relative; z-index: 2;
      max-width: 720px; margin: 0 auto; text-align: center;
    }
    .hero-text { display: flex; flex-direction: column; align-items: center; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(212,175,55,0.4);
      color: var(--gold-shine); padding: 0.45rem 1.1rem;
      border-radius: 50px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem;
      backdrop-filter: blur(8px);
    }
    .badge-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--gold-shine); animation: pulse-ring 1.5s ease infinite;
    }
    .hero h1 {
      font-family: var(--font-display); font-size: 3.2rem; font-weight: 800;
      line-height: 1.12; margin-bottom: 0.75rem; color: white;
      text-shadow: 0 2px 20px rgba(0,0,0,0.2);
    }
    .highlight {
      background: linear-gradient(135deg, #F5E6B8, #FFD700);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .highlight-gold {
      background: linear-gradient(135deg, #FFD700, #F5E6B8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-urdu { font-size: 1.4rem; color: var(--gold-shine); margin-bottom: 0.75rem; }
    .hero-desc { color: rgba(255,255,255,0.9); font-size: 1.05rem; margin-bottom: 2rem; max-width: 520px; line-height: 1.8; }
    .hero-search { padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(201,162,39,0.25); width: 100%; }
    .search-label { font-weight: 600; font-size: 0.9rem; color: var(--primary); margin-bottom: 1rem; }
    .search-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: center; }
    .hero-profile-gate {
      position: relative;
      overflow: hidden;
      padding: 1.65rem 1.5rem 1.35rem;
      margin-bottom: 1.25rem;
      width: 100%;
      border: 1px solid rgba(212, 175, 55, 0.45);
      background:
        linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06)),
        rgba(80, 10, 25, 0.35);
      backdrop-filter: blur(14px);
      text-align: left;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      animation: gate-rise 0.55s ease-out;
    }
    .hero-gate-shine {
      position: absolute;
      top: -40%;
      right: -10%;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.28), transparent 70%);
      pointer-events: none;
    }
    @keyframes gate-rise {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hero-gate-head {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    .hero-gate-badge-wrap {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg, rgba(255, 215, 0, 0.35), rgba(255, 255, 255, 0.12));
      border: 1px solid rgba(212, 175, 55, 0.5);
      box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
    }
    .hero-gate-icon { font-size: 1.55rem; line-height: 1; }
    .hero-gate-status {
      display: inline-block;
      color: var(--gold-shine);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      margin-bottom: 0.3rem;
    }
    .hero-profile-gate h2 {
      margin: 0 0 0.35rem;
      font-size: 1.4rem;
      color: #fff;
      font-family: var(--font-display);
      line-height: 1.3;
    }
    .hero-gate-head p {
      color: rgba(255, 255, 255, 0.88);
      margin: 0;
      font-size: 0.94rem;
      line-height: 1.55;
    }
    .hero-gate-progress {
      height: 4px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.15);
      margin-bottom: 1.15rem;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }
    .gate-progress-fill {
      display: block;
      height: 100%;
      width: 18%;
      border-radius: 99px;
      background: linear-gradient(90deg, var(--gold), #ffe566);
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.55);
      animation: gate-progress-pulse 2.2s ease-in-out infinite;
    }
    @keyframes gate-progress-pulse {
      0%, 100% { width: 16%; opacity: 0.85; }
      50% { width: 22%; opacity: 1; }
    }
    .hero-gate-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
      margin-bottom: 1.25rem;
      position: relative;
      z-index: 1;
    }
    .gate-step {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 0.9rem 0.75rem 0.85rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.14);
      transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
    }
    .gate-step:hover {
      transform: translateY(-3px);
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(212, 175, 55, 0.45);
    }
    .gate-step-num {
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--gold), #e8c547);
      color: var(--primary-dark);
      font-size: 0.72rem;
      font-weight: 800;
      margin-bottom: 0.4rem;
    }
    .gate-step-emoji { font-size: 1.15rem; margin-bottom: 0.35rem; line-height: 1; }
    .gate-step strong {
      font-size: 0.88rem;
      margin-bottom: 0.2rem;
      color: #fff;
    }
    .gate-step small {
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.4;
      font-size: 0.78rem;
    }
    .hero-gate-cta {
      width: 100%;
      justify-content: center;
      position: relative;
      z-index: 1;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    .hero-gate-hint {
      margin: 0.75rem 0 0;
      text-align: center;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.7);
      position: relative;
      z-index: 1;
    }
    .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; justify-content: center; }
    .trust-row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
    .trust-item {
      font-size: 0.8rem; color: white; font-weight: 500;
      padding: 0.3rem 0.75rem; background: rgba(255,255,255,0.12);
      border-radius: 50px; border: 1px solid rgba(212,175,55,0.35);
      backdrop-filter: blur(6px);
    }
    .hero-wave { position: absolute; bottom: 0; left: 0; right: 0; line-height: 0; }
    .hero-wave svg { width: 100%; height: 60px; }

    /* Why us */
    .why-section { background: white; }
    .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .why-card { padding: 2rem 1.5rem; text-align: center; }
    .why-icon-wrap {
      width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 1rem;
      background: linear-gradient(135deg, rgba(155,27,48,0.08), rgba(201,162,39,0.12));
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(201,162,39,0.25);
    }
    .why-icon { font-size: 1.8rem; }
    .why-card h3 { font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--primary); }
    .why-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; }

    /* Recent profiles */
    .profiles-section { position: relative; background: var(--blush); }
    .profiles-cta { margin-top: 2.5rem; }
    .recent-results { position: relative; min-height: 0; }
    .recent-access-overlay {
      position: relative;
      z-index: 5;
      margin: 0 auto;
      width: min(440px, calc(100% - 2rem));
      padding: 1.75rem;
      text-align: center;
      box-shadow: 0 18px 50px rgba(46, 6, 16, 0.2);
    }
    .recent-access-overlay h3 { margin: 0.6rem 0 0.4rem; }
    .recent-access-overlay p { color: var(--text-muted); margin-bottom: 1rem; }
    .recent-lock-icon { font-size: 2rem; }
    .recent-access-actions { display: flex; justify-content: center; gap: 0.65rem; flex-wrap: wrap; }
    .home-ad { max-width: 728px; margin: 2rem auto 0; }
    .profiles-empty { color: var(--text-muted); padding: 2rem 0; }

    /* How it works */
    .how-section {
      background: linear-gradient(180deg, #fff 0%, rgba(255, 248, 243, 0.7) 100%);
      position: relative;
      overflow: hidden;
    }
    .steps-timeline {
      position: relative;
      margin-top: 3rem;
    }
    .steps-track {
      display: none;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      position: relative;
      z-index: 1;
    }
    .step-card {
      background: #fff;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(212, 175, 55, 0.22);
      box-shadow: var(--shadow);
      text-align: center;
      padding: 1.75rem 1.15rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100%;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .step-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-lg);
      border-color: rgba(212, 175, 55, 0.45);
    }
    .step-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--gradient-wedding);
      color: #fff;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px var(--gold);
      flex-shrink: 0;
    }
    .step-icon-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      margin-bottom: 1rem;
      background: linear-gradient(145deg, rgba(155, 27, 48, 0.07), rgba(201, 162, 39, 0.14));
      border: 1px solid rgba(212, 175, 55, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-icon { font-size: 1.85rem; line-height: 1; }
    .step-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.35rem;
      line-height: 1.3;
    }
    .step-urdu {
      font-size: 1rem;
      color: var(--primary-dark);
      margin-bottom: 0.55rem;
      direction: rtl;
      line-height: 1.5;
    }
    .step-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.65;
      margin: 0;
    }

    @media (min-width: 1025px) {
      .steps-track {
        display: block;
        position: absolute;
        top: 2.15rem;
        left: 12%;
        right: 12%;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--gold) 15%, var(--primary) 50%, var(--gold) 85%, transparent);
        border-radius: 4px;
        z-index: 0;
      }
    }

    @media (max-width: 1024px) {
      .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    }

    @media (max-width: 640px) {
      .steps-timeline { margin-top: 2rem; }
      .steps-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding-left: 0.5rem;
      }
      .step-card {
        flex-direction: row;
        flex-wrap: wrap;
        text-align: left;
        align-items: flex-start;
        gap: 0 1rem;
        padding: 1.25rem 1.25rem 1.25rem 1.5rem;
        border-left: 4px solid var(--gold);
        position: relative;
      }
      .step-badge {
        position: absolute;
        left: -18px;
        top: 1.25rem;
        width: 32px;
        height: 32px;
        font-size: 0.82rem;
        margin: 0;
      }
      .step-icon-wrap {
        width: 52px;
        height: 52px;
        margin-bottom: 0;
      }
      .step-icon { font-size: 1.5rem; }
      .step-title { width: calc(100% - 64px); margin-bottom: 0.15rem; }
      .step-urdu { width: 100%; text-align: right; margin-bottom: 0.35rem; }
      .step-desc { width: 100%; }
    }

    /* Testimonials */
    .testimonials-section { position: relative; overflow: hidden; }
    .testimonials-section .section-ornament { color: var(--gold-shine); }
    .testimonial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; position: relative; z-index: 1; }
    .testimonial-card { padding: 2rem; position: relative; background: rgba(255,255,255,0.97); }
    .quote-mark {
      font-family: var(--font-display); font-size: 4rem; line-height: 1;
      color: var(--primary); opacity: 0.15; position: absolute; top: 0.5rem; left: 1rem;
    }
    .testimonial-text { font-size: 0.95rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 1.25rem; font-style: italic; }
    .testimonial-author { display: flex; align-items: center; gap: 0.75rem; }
    .author-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: var(--gradient-wedding); color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .testimonial-author strong { display: block; font-size: 0.9rem; }
    .testimonial-author span { font-size: 0.8rem; color: var(--text-muted); }

    /* CTA */
    .cta-section {
      padding: 5rem 0; position: relative; overflow: hidden;
      background: linear-gradient(135deg, #FFF0F3, #FFF8F3);
      border-top: 3px solid var(--gold);
    }
    .cta-inner { position: relative; z-index: 2; }
    .cta-ring { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .cta-section h2 {
      font-family: var(--font-display); font-size: 2.4rem; margin-bottom: 0.5rem;
      color: var(--primary-dark);
    }
    .cta-urdu { font-size: 1.3rem; color: var(--primary); margin-bottom: 0.5rem; }
    .cta-section p { color: var(--text-muted); margin-bottom: 2rem; font-size: 1.05rem; }
    .cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .cta-outline { border-color: var(--primary); color: var(--primary); background: white; }

    @media (max-width: 1024px) {
      .why-grid, .testimonial-grid { grid-template-columns: repeat(2, 1fr); }
      .search-row { grid-template-columns: 1fr 1fr; }
      .hero-gate-steps { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .hero h1 { font-size: 2.1rem; }
      .why-grid, .testimonial-grid { grid-template-columns: 1fr; }
      .search-row { grid-template-columns: 1fr; }
      .hero-gate-steps { grid-template-columns: 1fr; }
      .hero-profile-gate h2 { font-size: 1.2rem; }
    }
  `],
})
export class HomeComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  readonly auth = inject(AuthService);

  readonly adSlots = ADSENSE_SLOTS;
  recentProfiles = signal<Profile[]>([]);
  loading = signal(true);

  get canViewProfiles(): boolean {
    return this.auth.isAdmin()
      || (this.auth.isLoggedIn() && !!this.auth.currentUser()?.is_profile_complete);
  }

  searchGender = '';
  searchCity = '';
  searchProvince = '';
  provinces = [...ALL_LOCATION_PROVINCES];
  overseasCountries = [...OVERSEAS_COUNTRIES];
  readonly provinceLabel = provinceLabel;
  readonly isOverseasProvince = isOverseasProvince;

  get cityOptions(): string[] {
    return citiesForProvince(this.searchProvince);
  }

  onProvinceChange(province: string): void {
    this.searchProvince = province;
    const allowed = isOverseasProvince(province)
      ? this.overseasCountries
      : citiesForProvince(province);
    if (this.searchCity && !allowed.includes(this.searchCity)) {
      this.searchCity = '';
    }
  }

  trustBadges = ['✓ 100% Halal', '🔒 Privacy Protected', '✅ Verified Profiles', '🆓 Free Registration'];

  whyUs = [
    { icon: '🕌', title: 'Islamic Values', desc: 'Every match follows a halal process — faith and family values come first' },
    { icon: '🔒', title: 'Privacy First', desc: 'Your photos and details are visible only to registered members' },
    { icon: '✅', title: 'Verified Families', desc: 'Our admin team verifies every profile — no fake accounts' },
    { icon: '🏙️', title: 'All Pakistan', desc: 'From Karachi to Gilgit — matches from every city and province' },
    { icon: '👨‍👩‍👧', title: 'Family Friendly', desc: 'Parents can view profiles too — the whole family is included' },
    { icon: '💍', title: 'Serious Intentions', desc: 'For marriage only — no casual dating' },
  ];

  steps = [
    { icon: '📝', title: 'Create Profile', urdu: 'پروفائل بنائیں', desc: 'Register for free and fill in your details' },
    { icon: '🔍', title: 'Find a Match', urdu: 'رشتہ تلاش کریں', desc: 'Filter by city, education, and profession' },
    { icon: '💌', title: 'Send Request', urdu: 'درخواست بھیجیں', desc: 'Send a contact request on a profile you like' },
    { icon: '💍', title: 'Until Nikah', urdu: 'نکاح تک', desc: 'Connect with the family and begin your journey' },
  ];

  testimonials = [
    { name: 'Sara & Ali', city: 'Lahore', year: '2025', text: 'We found our match on PK Rishta. The platform is very professional and treats families with respect. Thank you!' },
    { name: 'Hina Malik', city: 'Karachi', year: '2025', text: 'My daughter found her perfect match here. Verified profiles and strong privacy — I recommend it from the heart.' },
    { name: 'Usman Sheikh', city: 'Islamabad', year: '2024', text: 'I found my match in 2 months. The filters are very helpful and the process was easy.' },
  ];

  ngOnInit(): void {
    this.loadRecentIfAllowed();
  }

  private loadRecentIfAllowed(): void {
    if (!this.canViewProfiles) {
      this.recentProfiles.set([]);
      this.loading.set(false);
      return;
    }
    this.profileService.search({ page: 1, limit: 6 }).subscribe({
      next: (res) => { this.recentProfiles.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
