import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FormErrorState } from '../../../core/utils/form-error-state';
import { validateRegisterForm } from '../../../core/utils/validation';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error';
import { GuidePopupComponent } from '../../../shared/components/guide-popup/guide-popup';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, AuthShellComponent, FieldErrorComponent, GuidePopupComponent],
  template: `
    <app-guide-popup
      [open]="showPhoneGuide()"
      variant="register-phone"
      dismissLabel="Got it — سمجھ گیا"
      (closed)="showPhoneGuide.set(false)"
    />
    <app-auth-shell
      [wide]="true"
      title="Create Your Profile"
      urduTitle="اپنا پروفائل بنائیں"
      subtitle="Join Pakistan's trusted matrimonial platform — it's free!"
    >
      @if (error()) {
        <div class="alert alert-error alert-shake">{{ error() }}</div>
      }
      @if (info()) {
        <div class="alert alert-success">{{ info() }}</div>
      }

      @if (otpStep()) {
        <form class="auth-form" (ngSubmit)="onVerifyOtp()" novalidate>
          <p class="otp-hint">
            An OTP has been sent to <strong>{{ pendingEmail }}</strong>.
            Resend becomes available after 4 minutes.
          </p>
          <div class="form-group">
            <label class="form-label">Enter 6-digit OTP *</label>
            <input
              class="form-input auth-input otp-input"
              [(ngModel)]="otpCode"
              name="otp"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="••••••"
            />
          </div>
          <button
            class="btn btn-primary auth-submit animate-fade-in-up"
            type="submit"
            [disabled]="loading()"
            [class.is-loading]="loading()"
          >
            @if (loading()) {
              <span class="btn-spinner"></span>
              Verifying...
            } @else {
              Verify OTP
            }
          </button>
          <div class="otp-actions">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              [disabled]="resendSeconds() > 0 || loading()"
              (click)="onResendOtp()"
            >
              @if (resendSeconds() > 0) {
                Resend in {{ resendLabel() }}
              } @else {
                Resend OTP
              }
            </button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="backToForm()">
              Edit details
            </button>
          </div>
        </form>
      } @else {
      <div class="steps-bar animate-fade-in-up delay-1">
        @for (step of steps; track step.label; let i = $index) {
          <div class="step" [class.active]="currentStep() >= i + 1" [class.done]="currentStep() > i + 1">
            <span class="step-num">{{ currentStep() > i + 1 ? '✓' : i + 1 }}</span>
            <span class="step-label">{{ step.label }}</span>
          </div>
          @if (i < steps.length - 1) {
            <div class="step-line" [class.filled]="currentStep() > i + 1"></div>
          }
        }
      </div>

      <form class="auth-form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-section animate-fade-in-up delay-2">
          <h3 class="section-label"><span>👤</span> Personal Info</h3>
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input
              class="form-input auth-input"
              [class.input-invalid]="formErrors.show('full_name')"
              [(ngModel)]="form.full_name"
              name="full_name"
              placeholder="Enter full name"
              (blur)="formErrors.touch('full_name')"
              (ngModelChange)="onFieldChange('full_name')"
            />
            <app-field-error [message]="formErrors.message('full_name')" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Gender *</label>
              <select
                class="form-select auth-input"
                [class.input-invalid]="formErrors.show('gender')"
                [(ngModel)]="form.gender"
                name="gender"
                (ngModelChange)="onFieldChange('gender')"
              >
                <option value="">Select</option>
                <option value="male">🤵 Male</option>
                <option value="female">👰 Female</option>
              </select>
              <app-field-error [message]="formErrors.message('gender')" />
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth *</label>
              <input
                class="form-input auth-input"
                [class.input-invalid]="formErrors.show('date_of_birth')"
                type="date"
                [(ngModel)]="form.date_of_birth"
                name="dob"
                [max]="maxDob"
                (blur)="formErrors.touch('date_of_birth')"
                (ngModelChange)="onFieldChange('date_of_birth')"
              />
              <app-field-error [message]="formErrors.message('date_of_birth')" />
            </div>
          </div>
        </div>

        <div class="form-section animate-fade-in-up delay-3">
          <h3 class="section-label"><span>📧</span> Account Details</h3>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input
              class="form-input auth-input"
              [class.input-invalid]="formErrors.show('email')"
              type="email"
              [(ngModel)]="form.email"
              name="email"
              placeholder="your@email.com"
              (blur)="formErrors.touch('email')"
              (ngModelChange)="onFieldChange('email')"
            />
            <app-field-error [message]="formErrors.message('email')" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone *</label>
              <input
                class="form-input auth-input"
                [class.input-invalid]="formErrors.show('phone')"
                type="tel"
                [(ngModel)]="form.phone"
                name="phone"
                placeholder="+92 300 1234567 or +1 416 555 0100"
                (blur)="formErrors.touch('phone')"
                (ngModelChange)="onFieldChange('phone')"
              />
              <app-field-error [message]="formErrors.message('phone')" />
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <div class="input-wrap has-toggle">
                <input
                  class="form-input auth-input"
                  [class.input-invalid]="formErrors.show('password')"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="form.password"
                  name="password"
                  placeholder="Min 6 chars, letters & numbers"
                  (blur)="formErrors.touch('password')"
                  (ngModelChange)="onFieldChange('password')"
                />
                <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              <app-field-error [message]="formErrors.message('password')" />
            </div>
          </div>
        </div>

        <div class="trust-note animate-fade-in-up delay-4">
          <span>🔒</span> Your data is secure. We never share contact without admin approval.
        </div>

        <button
          class="btn btn-primary auth-submit animate-fade-in-up delay-5"
          type="submit"
          [disabled]="loading()"
          [class.is-loading]="loading()"
        >
          @if (loading()) {
            <span class="btn-spinner"></span> Creating your profile...
          } @else {
            💍 Register Free — Start Your Journey
          }
        </button>
      </form>

      <p class="auth-footer animate-fade-in-up delay-5">
        Already have an account? <a routerLink="/login" class="auth-link">Login</a>
      </p>
      }

    </app-auth-shell>
  `,
  styles: [`
    .steps-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 1.75rem;
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      min-width: 72px;
    }

    .step-num {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: 700;
      background: var(--border);
      color: var(--text-muted);
      transition: all 0.35s ease;
    }

    .step.active .step-num {
      background: var(--gradient-wedding);
      color: white;
      box-shadow: 0 4px 14px rgba(155, 27, 48, 0.35);
      transform: scale(1.08);
    }

    .step.done .step-num {
      background: var(--secondary);
      color: var(--primary-dark);
    }

    .step-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      transition: color 0.3s;
    }
    .step.active .step-label { color: var(--primary); }

    .step-line {
      flex: 1;
      height: 2px;
      min-width: 24px;
      max-width: 48px;
      background: var(--border);
      margin-bottom: 1.25rem;
      border-radius: 2px;
      transition: background 0.4s ease;
    }
    .step-line.filled { background: var(--secondary); }

    .form-section {
      margin-bottom: 1.25rem;
      padding-bottom: 0.25rem;
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      margin-bottom: 0.85rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    .auth-input {
      border-radius: 14px;
      padding: 0.8rem 1rem;
      border: 2px solid var(--border);
      background: rgba(255, 255, 255, 0.9);
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }
    .auth-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(155, 27, 48, 0.1);
      transform: translateY(-1px);
    }

    .input-wrap { position: relative; }
    .input-wrap.has-toggle .auth-input { padding-right: 3rem; }

    .toggle-pw {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      opacity: 0.7;
    }
    .toggle-pw:hover { opacity: 1; }

    .trust-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(155, 27, 48, 0.05);
      border: 1px solid rgba(155, 27, 48, 0.12);
      border-radius: 12px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .auth-submit {
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.95rem 1.5rem;
      font-size: 0.95rem;
      border-radius: 50px;
    }
    .auth-submit.is-loading { opacity: 0.85; cursor: wait; }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.25rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .auth-link {
      font-weight: 600;
      color: var(--primary);
      position: relative;
    }
    .auth-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--gradient-wedding);
      transition: width 0.3s ease;
    }
    .auth-link:hover::after { width: 100%; }

    .alert-shake {
      animation: shake 0.45s ease, fadeIn 0.3s ease;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    @media (max-width: 640px) {
      .steps-bar { gap: 0; }
      .step { min-width: 56px; }
      .step-label { font-size: 0.6rem; }
    }

    .otp-hint {
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .otp-input {
      letter-spacing: 0.45em;
      font-size: 1.35rem;
      font-weight: 700;
      text-align: center;
    }
    .otp-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .alert-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }
  `],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = {
    email: '', password: '', phone: '', full_name: '',
    gender: '', date_of_birth: '',
  };
  readonly maxDob = this.calcMaxDob();
  loading = signal(false);
  error = signal('');
  info = signal('');
  showPhoneGuide = signal(true);
  showPassword = signal(false);
  otpStep = signal(false);
  otpCode = '';
  pendingEmail = '';
  resendSeconds = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  readonly formErrors = new FormErrorState();

  readonly steps = [
    { label: 'Personal' },
    { label: 'Account' },
  ];

  currentStep = signal(1);

  resendLabel(): string {
    const s = this.resendSeconds();
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  private calcMaxDob(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  onFieldChange(field: string): void {
    this.formErrors.clear(field);
    this.updateStep();
  }

  updateStep(): void {
    let step = 1;
    if (this.form.full_name && this.form.gender && this.form.date_of_birth) {
      step = 2;
    }
    if (this.form.email && this.form.phone && this.form.password?.length >= 8) {
      step = 2;
    }
    this.currentStep.set(step);
  }

  private startResendCountdown(seconds: number): void {
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendSeconds.set(Math.max(0, Math.floor(seconds)));
    this.resendTimer = setInterval(() => {
      const next = this.resendSeconds() - 1;
      if (next <= 0) {
        this.resendSeconds.set(0);
        if (this.resendTimer) clearInterval(this.resendTimer);
        this.resendTimer = null;
      } else {
        this.resendSeconds.set(next);
      }
    }, 1000);
  }

  backToForm(): void {
    this.otpStep.set(false);
    this.otpCode = '';
    this.error.set('');
    this.info.set('');
  }

  onSubmit(): void {
    this.formErrors.markSubmitted();
    const errors = validateRegisterForm(this.form);
    this.formErrors.setAll(errors);
    if (Object.keys(errors).length) return;

    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    this.auth.register({
      ...this.form,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.pendingEmail = res.data?.email || this.form.email;
        this.otpStep.set(true);
        this.info.set(res.message || 'OTP sent to your email');
        this.startResendCountdown(res.data?.resend_after_seconds ?? 240);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }

  onVerifyOtp(): void {
    if (!this.otpCode || this.otpCode.trim().length < 4) {
      this.error.set('Please enter the OTP from your email');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyRegisterOtp(this.pendingEmail, this.otpCode.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/my-profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'OTP verification failed');
      },
    });
  }

  onResendOtp(): void {
    if (this.resendSeconds() > 0) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.resendOtp(this.pendingEmail, 'email_verify').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.info.set(res.message || 'OTP resent');
        this.startResendCountdown(res.data?.resend_after_seconds ?? 240);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Could not resend OTP');
        const wait = err.error?.data?.resend_after_seconds;
        if (wait) this.startResendCountdown(wait);
      },
    });
  }
}
