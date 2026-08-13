import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell
      title="Forgot Password"
      urduTitle="پاس ورڈ بھول گئے؟"
      subtitle="OTP aapki email par bheja jayega"
    >
      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (info()) {
        <div class="alert alert-success">{{ info() }}</div>
      }

      @if (step() === 'email') {
        <form class="auth-form" (ngSubmit)="sendOtp()" novalidate>
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input
              class="form-input auth-input"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your@email.com"
              autocomplete="email"
              required
            />
          </div>
          <button class="btn btn-primary auth-submit" type="submit" [disabled]="loading()">
            {{ loading() ? 'Sending…' : 'Send OTP' }}
          </button>
        </form>
      } @else {
        <form class="auth-form" (ngSubmit)="resetPassword()" novalidate>
          <p class="hint">OTP sent to <strong>{{ email }}</strong></p>
          <div class="form-group">
            <label class="form-label">OTP Code *</label>
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
          <div class="form-group">
            <label class="form-label">New Password *</label>
            <input
              class="form-input auth-input"
              type="password"
              [(ngModel)]="newPassword"
              name="password"
              placeholder="Min 8 characters"
              autocomplete="new-password"
            />
          </div>
          <button class="btn btn-primary auth-submit" type="submit" [disabled]="loading()">
            {{ loading() ? 'Updating…' : 'Reset Password' }}
          </button>
          <div class="otp-actions">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              [disabled]="resendSeconds() > 0 || loading()"
              (click)="resend()"
            >
              @if (resendSeconds() > 0) {
                Resend in {{ resendLabel() }}
              } @else {
                Resend OTP
              }
            </button>
          </div>
        </form>
      }

      <p class="auth-footer">
        Remembered it? <a routerLink="/login" class="auth-link">Back to Login</a>
      </p>
    </app-auth-shell>
  `,
  styles: [`
    .auth-input {
      border-radius: 14px;
      padding: 0.85rem 1rem;
      border: 2px solid var(--border);
    }
    .auth-submit {
      width: 100%;
      margin-top: 0.5rem;
      border-radius: 50px;
      padding: 0.95rem 1.5rem;
    }
    .otp-input {
      letter-spacing: 0.45em;
      font-size: 1.35rem;
      font-weight: 700;
      text-align: center;
    }
    .hint { color: var(--text-muted); margin-bottom: 1rem; line-height: 1.45; }
    .otp-actions { display: flex; justify-content: center; margin-top: 1rem; }
    .auth-footer { text-align: center; margin-top: 1.5rem; color: var(--text-muted); }
    .auth-link { font-weight: 600; color: var(--primary); }
    .alert-success {
      background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857;
      padding: 0.85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
    }
  `],
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  otpCode = '';
  newPassword = '';
  step = signal<'email' | 'otp'>('email');
  loading = signal(false);
  error = signal('');
  info = signal('');
  resendSeconds = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  resendLabel(): string {
    const s = this.resendSeconds();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  private startCountdown(seconds: number): void {
    if (this.timer) clearInterval(this.timer);
    this.resendSeconds.set(Math.max(0, Math.floor(seconds)));
    this.timer = setInterval(() => {
      const next = this.resendSeconds() - 1;
      if (next <= 0) {
        this.resendSeconds.set(0);
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
      } else {
        this.resendSeconds.set(next);
      }
    }, 1000);
  }

  sendOtp(): void {
    if (!this.email.includes('@')) {
      this.error.set('Enter a valid email');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.step.set('otp');
        this.info.set(res.message || 'OTP sent');
        this.startCountdown(res.data?.resend_after_seconds ?? 240);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Could not send OTP');
      },
    });
  }

  resend(): void {
    if (this.resendSeconds() > 0) return;
    this.loading.set(true);
    this.auth.resendOtp(this.email.trim(), 'password_reset').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.info.set(res.message || 'OTP resent');
        this.startCountdown(res.data?.resend_after_seconds ?? 240);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Could not resend OTP');
        const wait = err.error?.data?.resend_after_seconds;
        if (wait) this.startCountdown(wait);
      },
    });
  }

  resetPassword(): void {
    if (!this.otpCode || this.newPassword.length < 8) {
      this.error.set('Enter OTP and a valid new password (min 8 chars)');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.resetPassword(this.email.trim(), this.otpCode.trim(), this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Password reset failed');
      },
    });
  }
}
