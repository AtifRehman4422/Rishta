import { Component, OnInit, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <section class="page-hero bg-page-header">
      <div class="container hero-inner animate-fade-in-up">
        <h1>About <span class="gold">Hum Rishta</span></h1>
        <p class="text-urdu">ہمارے بارے میں</p>
        <p class="hero-sub">Pakistan's trusted halal matrimonial platform — connecting families with faith, respect, and tradition since 2024.</p>
      </div>
    </section>

    <div class="container page-body">
      <section class="content-card card animate-fade-in-up delay-1">
        <h2>Our Mission</h2>
        <p>
          Hum Rishta was created to make the search for a life partner simple, safe, and aligned with Islamic values.
          We believe every person deserves a blessed nikah with a compatible partner, and families deserve a platform
          they can trust with their personal information.
        </p>
        <p>
          Our mission is to connect Pakistani families — at home and overseas — through verified profiles,
          admin-moderated contact sharing, and a respectful community built on honesty and adab.
        </p>
      </section>

      <div class="values-grid">
        @for (v of values; track v.title; let i = $index) {
          <div class="value-card card animate-fade-in-up" [class]="'delay-' + (i + 1)">
            <span class="value-icon">{{ v.icon }}</span>
            <h3>{{ v.title }}</h3>
            <p>{{ v.desc }}</p>
          </div>
        }
      </div>

      <section class="content-card card animate-fade-in-up delay-3">
        <h2>How Hum Rishta Works</h2>
        <ol class="steps-list">
          <li><strong>Register free</strong> — Create your account and complete your matrimonial profile with education, profession, and family details.</li>
          <li><strong>Search profiles</strong> — Filter by city, province, religion, age, and more across Pakistan and overseas.</li>
          <li><strong>Request contact</strong> — When you find a compatible profile, submit a contact request for admin review.</li>
          <li><strong>Admin verification</strong> — Our team verifies both parties before sharing contact numbers for a limited period.</li>
          <li><strong>Family meetings</strong> — Connect with families respectfully and take the next steps toward nikah with Allah's guidance.</li>
        </ol>
      </section>

      <section class="content-card card animate-fade-in-up delay-4">
        <h2>Why Families Trust Us</h2>
        <ul class="trust-list">
          <li>Admin-verified contact sharing — numbers are never public</li>
          <li>Daily request limits to prevent spam</li>
          <li>Complaint system with admin mediation</li>
          <li>Profiles for Pakistani cities and overseas Pakistanis</li>
          <li>Respectful, halal-focused community guidelines</li>
        </ul>
      </section>

      <div class="cta-box card animate-fade-in-up delay-5">
        <h3>Start Your Blessed Journey</h3>
        <p>Join Hum Rishta today — registration is completely free.</p>
        <div class="cta-btns">
          <a routerLink="/register" class="btn btn-primary">Register Free</a>
          <a routerLink="/contact" class="btn btn-outline">Contact Us</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-hero { padding: 3.5rem 0; text-align: center; }
    .page-hero h1 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.75rem); color: white; }
    .gold { color: var(--gold-shine); }
    .hero-sub { color: rgba(255,255,255,0.88); max-width: 600px; margin: 1rem auto 0; line-height: 1.7; }
    .page-body { padding: 2.5rem 0 4rem; }
    .content-card { padding: 2rem; margin-bottom: 1.5rem; }
    .content-card h2 { font-family: var(--font-display); color: var(--primary-dark); margin-bottom: 1rem; font-size: 1.35rem; }
    .content-card p { line-height: 1.8; color: var(--text); margin-bottom: 1rem; }
    .content-card p:last-child { margin-bottom: 0; }
    .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
    .value-card { padding: 1.5rem; text-align: center; transition: var(--transition); }
    .value-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .value-icon { font-size: 2.25rem; display: block; margin-bottom: 0.75rem; }
    .value-card h3 { font-size: 1rem; color: var(--primary-dark); margin-bottom: 0.5rem; }
    .value-card p { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; }
    .steps-list, .trust-list { padding-left: 1.25rem; line-height: 1.85; color: var(--text); }
    .steps-list li, .trust-list li { margin-bottom: 0.75rem; }
    .cta-box { text-align: center; padding: 2.5rem; background: linear-gradient(135deg, #fff8f3, white); }
    .cta-box h3 { font-family: var(--font-display); color: var(--primary-dark); margin-bottom: 0.5rem; }
    .cta-box p { color: var(--text-muted); margin-bottom: 1.25rem; }
    .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    @media (max-width: 768px) { .values-grid { grid-template-columns: 1fr; } }
  `],
})
export class AboutComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly values = [
    { icon: '🕌', title: 'Halal & Respectful', desc: 'Every feature is designed for Islamic matrimonial search with family involvement.' },
    { icon: '🛡️', title: 'Safe & Verified', desc: 'Admin-reviewed contact requests protect your privacy and prevent misuse.' },
    { icon: '💍', title: 'Family Focused', desc: 'We connect families, not just individuals — honoring Pakistani traditions.' },
  ];

  ngOnInit(): void {
    this.title.setTitle('About Us | Hum Rishta — Pakistan Matrimonial Platform');
    this.meta.updateTag({
      name: 'description',
      content: 'Learn about Hum Rishta — Pakistan\'s trusted halal matrimonial platform for verified matches, family connections, and safe contact sharing.',
    });
  }
}
