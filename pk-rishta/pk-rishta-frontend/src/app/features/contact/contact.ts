import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FormErrorState } from '../../core/utils/form-error-state';
import { firstError, validateContactForm } from '../../core/utils/validation';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links';
import { ContactService } from '../../core/services/contact.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, RouterLink, FieldErrorComponent, SocialLinksComponent],
  template: `
    <section class="contact-hero bg-page-header">
      <div class="hero-glow"></div>
      <div class="hero-particles">
        @for (p of particles; track p) {
          <span class="particle" [style.--i]="p"></span>
        }
      </div>
      <div class="container hero-inner">
        <div class="hero-badge animate-fade-in-up">
          <span class="pulse-dot"></span> We're Here to Help
        </div>
        <h1 class="animate-fade-in-up delay-1">Contact <span class="gold">Hum Rishta</span></h1>
        <p class="text-urdu animate-fade-in-up delay-2">ہم سے رابطہ کریں</p>
        <p class="hero-sub animate-fade-in-up delay-3">
          Questions about profiles, registration, or admin verification? Reach out — we reply within 24 hours.
        </p>
      </div>
    </section>

    <div class="container contact-body">
      <div class="info-grid">
        @for (card of contactCards; track card.title; let i = $index) {
          <a
            class="info-card card animate-fade-in-up"
            [class]="'delay-' + (i + 1)"
            [href]="card.href"
            [attr.target]="card.external ? '_blank' : null"
            [attr.rel]="card.external ? 'noopener' : null"
          >
            <div class="info-icon-wrap" [style.--accent]="card.color">
              <span class="info-icon">{{ card.icon }}</span>
              <span class="icon-ring"></span>
            </div>
            <h3>{{ card.title }}</h3>
            <p class="info-value">{{ card.value }}</p>
            <p class="info-hint">{{ card.hint }}</p>
            <span class="info-arrow">→</span>
          </a>
        }
      </div>

      <div class="social-section card animate-fade-in-up delay-2">
        <app-social-links title="Follow Hum Rishta on social" />
      </div>

      <div class="form-section">
        <div class="form-card card animate-fade-in-up delay-2">
          <div class="form-head">
            <span class="form-icon">✉️</span>
            <div>
              <h2>Send Us a Message</h2>
              <p>Fill the form and our team will get back to you soon.</p>
            </div>
          </div>

          @if (submitted()) {
            <div class="success-box animate-fade-in-up">
              <span class="success-icon">✓</span>
              <h3>Message Sent!</h3>
              <p>شکریہ! We received your message and will respond within <strong>24 hours</strong>.</p>
              <button class="btn btn-outline" type="button" (click)="resetForm()">Send Another</button>
            </div>
          } @else {
            <form class="contact-form" (ngSubmit)="submit()" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Your Name</label>
                  <input
                    class="form-input"
                    [class.input-invalid]="formErrors.show('name')"
                    [(ngModel)]="form.name"
                    name="name"
                    placeholder="Full name"
                    (blur)="formErrors.touch('name')"
                    (ngModelChange)="formErrors.clear('name')"
                  />
                  <app-field-error [message]="formErrors.message('name')" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input
                    class="form-input"
                    [class.input-invalid]="formErrors.show('email')"
                    type="email"
                    [(ngModel)]="form.email"
                    name="email"
                    placeholder="you@email.com"
                    (blur)="formErrors.touch('email')"
                    (ngModelChange)="formErrors.clear('email')"
                  />
                  <app-field-error [message]="formErrors.message('email')" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Subject</label>
                <select
                  class="form-select"
                  [class.input-invalid]="formErrors.show('subject')"
                  [(ngModel)]="form.subject"
                  name="subject"
                  (ngModelChange)="formErrors.clear('subject')"
                >
                  <option value="general">General Inquiry</option>
                  <option value="registration">Registration Help</option>
                  <option value="contact-request">Contact Request Issue</option>
                  <option value="complaint">Complaint / Report</option>
                  <option value="partnership">Business / Partnership</option>
                </select>
                <app-field-error [message]="formErrors.message('subject')" />
              </div>
              <div class="form-group">
                <label class="form-label">Message</label>
                <textarea
                  class="form-textarea"
                  [class.input-invalid]="formErrors.show('message')"
                  [(ngModel)]="form.message"
                  name="message"
                  rows="5"
                  placeholder="How can we help you? (min 10 characters)"
                  (blur)="formErrors.touch('message')"
                  (ngModelChange)="formErrors.clear('message')"
                ></textarea>
                <app-field-error [message]="formErrors.message('message')" />
              </div>
              @if (formAlert()) {
                <div class="alert alert-error">{{ formAlert() }}</div>
              }
              <button class="btn btn-primary btn-lg submit-btn" type="submit" [disabled]="sending()">
                @if (sending()) {
                  <span class="btn-spinner"></span> Sending...
                } @else {
                  Send Message →
                }
              </button>
            </form>
          }
        </div>

        <div class="side-panel animate-fade-in-up delay-3">
          <div class="hours-card card">
            <h3>🕐 Office Hours</h3>
            <ul>
              <li><span>Mon – Fri</span><strong>9:00 AM – 6:00 PM</strong></li>
              <li><span>Saturday</span><strong>10:00 AM – 4:00 PM</strong></li>
              <li><span>Sunday</span><strong>Closed</strong></li>
            </ul>
            <p class="hours-note">Pakistan Standard Time (PKT)</p>
          </div>
          <div class="cta-card card">
            <h3>Looking for a Match?</h3>
            <p>Browse verified profiles across Pakistan.</p>
            <a routerLink="/search" class="btn btn-secondary">Search Profiles</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-hero {
      position: relative;
      padding: 4rem 0 3.5rem;
      overflow: hidden;
      text-align: center;
    }
    .hero-glow {
      position: absolute;
      top: 50%; left: 50%;
      width: 500px; height: 500px;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
      animation: glow-pulse 4s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes glow-pulse {
      0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    }
    .hero-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .particle {
      position: absolute;
      width: 4px; height: 4px;
      background: rgba(245, 230, 184, 0.6);
      border-radius: 50%;
      left: calc(var(--i) * 8%);
      top: calc(var(--i) * 7% + 10%);
      animation: float-particle 6s ease-in-out infinite;
      animation-delay: calc(var(--i) * 0.4s);
    }
    @keyframes float-particle {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
      50% { transform: translateY(-20px) scale(1.3); opacity: 1; }
    }
    .hero-inner { position: relative; z-index: 1; }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 50px;
      font-size: 0.82rem;
      color: #F5E6B8;
      margin-bottom: 1rem;
    }
    .pulse-dot {
      width: 8px; height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse-dot 2s ease infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
      50% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
    }
    .contact-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .contact-hero h1 .gold { color: var(--gold-shine); }
    .hero-sub {
      max-width: 560px;
      margin: 1rem auto 0;
      color: rgba(255,255,255,0.85);
      font-size: 1rem;
      line-height: 1.7;
    }

    .contact-body { padding: 3rem 0 4rem; margin-top: -1.5rem; position: relative; z-index: 2; }

    .social-section {
      padding: 1.5rem 1.25rem;
      margin-bottom: 2.5rem;
      border: 1px solid rgba(212, 175, 55, 0.25);
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,248,240,0.9));
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .info-card {
      position: relative;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .info-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--accent, #D4AF37), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .info-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(155, 27, 48, 0.12);
    }
    .info-card:hover::before { opacity: 1; }
    .info-icon-wrap {
      position: relative;
      width: 52px; height: 52px;
      margin-bottom: 1rem;
    }
    .info-icon {
      position: relative; z-index: 1;
      display: flex; align-items: center; justify-content: center;
      width: 52px; height: 52px;
      font-size: 1.5rem;
      background: linear-gradient(135deg, #fff 0%, #FFF8F3 100%);
      border-radius: 14px;
      border: 1px solid rgba(212, 175, 55, 0.3);
    }
    .icon-ring {
      position: absolute;
      inset: -4px;
      border: 2px solid var(--accent, #D4AF37);
      border-radius: 18px;
      opacity: 0;
      animation: ring-pulse 3s ease infinite;
    }
    .info-card:hover .icon-ring { opacity: 0.5; }
    @keyframes ring-pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.08); opacity: 0.6; }
    }
    .info-card h3 { font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 0.35rem; }
    .info-value { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
    .info-hint { font-size: 0.78rem; color: var(--text-muted); }
    .info-arrow {
      position: absolute;
      bottom: 1rem; right: 1rem;
      color: var(--primary);
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.3s ease;
    }
    .info-card:hover .info-arrow { opacity: 1; transform: translateX(0); }

    .form-section {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .form-card { padding: 2rem; }
    .form-head {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 2px solid var(--border);
    }
    .form-icon { font-size: 2rem; }
    .form-head h2 { font-size: 1.35rem; color: var(--primary); margin-bottom: 0.25rem; }
    .form-head p { font-size: 0.88rem; color: var(--text-muted); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .submit-btn { width: 100%; margin-top: 0.5rem; }

    .success-box {
      text-align: center;
      padding: 2.5rem 1.5rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-radius: 12px;
      border: 1px solid #86efac;
    }
    .success-icon {
      display: inline-flex;
      align-items: center; justify-content: center;
      width: 56px; height: 56px;
      background: #22c55e;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      border-radius: 50%;
      margin-bottom: 1rem;
      animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes success-pop {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    .success-box h3 { color: #15803d; margin-bottom: 0.5rem; }
    .success-box p { color: var(--text-muted); margin-bottom: 1.25rem; }

    .side-panel { display: flex; flex-direction: column; gap: 1.25rem; }
    .hours-card, .cta-card { padding: 1.5rem; }
    .hours-card h3, .cta-card h3 { font-size: 1rem; color: var(--primary); margin-bottom: 1rem; }
    .hours-card ul { list-style: none; display: flex; flex-direction: column; gap: 0.65rem; }
    .hours-card li {
      display: flex; justify-content: space-between;
      font-size: 0.88rem; padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--border);
    }
    .hours-card li span { color: var(--text-muted); }
    .hours-note { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.75rem; }
    .cta-card p { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem; }
    .cta-card .btn { width: 100%; }

    .btn-spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-right: 0.5rem;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 992px) {
      .info-grid { grid-template-columns: repeat(2, 1fr); }
      .form-section { grid-template-columns: 1fr; }
    }
    @media (max-width: 576px) {
      .info-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .contact-hero h1 { font-size: 1.85rem; }
    }
  `],
})
export class ContactComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly seo = inject(SeoService);

  readonly particles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  ngOnInit(): void {
    this.seo.apply({
      title: 'Contact Hum Rishta — Rishta & Matrimonial Support',
      description:
        'Contact Hum Rishta for help with registration, profiles, or rishta requests. Pakistan\'s trusted matrimonial website support team.',
      path: '/contact',
    });
  }

  contactCards = [
    {
      icon: '📧',
      title: 'Email Us',
      value: 'humrishta@gmail.com',
      hint: 'We reply within 24 hours',
      href: 'mailto:humrishta@gmail.com',
      color: '#9B1B30',
      external: false,
    },
    {
      icon: '💬',
      title: 'WhatsApp Chat',
      value: '+92 343 5020077',
      hint: 'Mon–Sat, 9 AM – 6 PM',
      href: 'https://wa.me/923435020077',
      color: '#25D366',
      external: true,
    },
    {
      icon: '📢',
      title: 'WhatsApp Channel',
      value: 'Follow HumRishta',
      hint: 'Updates · rishtay · announcements',
      href: 'https://whatsapp.com/channel/0029VbELMHi4SpkEkfsXeZ3g',
      color: '#00A884',
      external: true,
    },
  ];

  form = { name: '', email: '', subject: 'general', message: '' };
  submitted = signal(false);
  sending = signal(false);
  formAlert = signal('');
  readonly formErrors = new FormErrorState();

  submit(): void {
    this.formErrors.markSubmitted();
    const errors = validateContactForm(this.form);
    this.formErrors.setAll(errors);
    if (Object.keys(errors).length) {
      this.formAlert.set(firstError(errors) ?? 'Please fix the errors below');
      return;
    }
    this.formAlert.set('');
    this.sending.set(true);
    this.contactService.submitMessage(this.form).subscribe({
      next: () => {
        this.sending.set(false);
        this.submitted.set(true);
        this.formErrors.reset();
      },
      error: (err) => {
        this.sending.set(false);
        this.formAlert.set(err.error?.message || 'Failed to send message. Please try again.');
      },
    });
  }

  resetForm(): void {
    this.form = { name: '', email: '', subject: 'general', message: '' };
    this.formErrors.reset();
    this.formAlert.set('');
    this.submitted.set(false);
  }
}
