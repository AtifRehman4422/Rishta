import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FormErrorState } from '../../../core/utils/form-error-state';
import { validateLoginForm } from '../../../core/utils/validation';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthShellComponent, FieldErrorComponent],
  template: `
    <app-auth-shell title="Welcome Back" urduTitle="خوش آمدید" subtitle="Sign in to continue your journey">
      @if (error()) {
        <div class="alert alert-error alert-shake">{{ error() }}</div>
      }
      @if (info()) {
        <div class="alert alert-success">{{ info() }}</div>
      }

      @if (otpStep()) {
        <form class="auth-form" (ngSubmit)="onVerifyOtp()" novalidate>
          <p class="otp-hint">Verify <strong>{{ email }}</strong> with the OTP sent to your inbox.</p>
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
          <button class="btn btn-primary auth-submit animate-fade-in-up" type="submit" [disabled]="loading()">
            {{ loading() ? 'Verifying…' : 'Verify OTP' }}
          </button>
          <div class="otp-actions">
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="resendSeconds() > 0 || loading()" (click)="onResendOtp()">
              {{ resendSeconds() > 0 ? 'Resend in ' + resendLabel() : 'Resend OTP' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="otpStep.set(false)">Back</button>
          </div>
        </form>
      } @else {
      <form class="auth-form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group animate-fade-in-up delay-1">
          <label class="form-label">
            <span class="label-icon">✉️</span> Email Address
          </label>
          <div class="input-wrap">
            <input
              class="form-input auth-input"
              [class.input-invalid]="formErrors.show('email')"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your@email.com"
              autocomplete="email"
              (blur)="formErrors.touch('email')"
              (ngModelChange)="formErrors.clear('email')"
            />
          </div>
          <app-field-error [message]="formErrors.message('email')" />
        </div>

        <div class="form-group animate-fade-in-up delay-2">
          <div class="pw-row">
            <label class="form-label">
              <span class="label-icon">🔐</span> Password
            </label>
            <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          <div class="input-wrap has-toggle">
            <input
              class="form-input auth-input"
              [class.input-invalid]="formErrors.show('password')"
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              (blur)="formErrors.touch('password')"
              (ngModelChange)="formErrors.clear('password')"
            />
            <button
              type="button"
              class="toggle-pw"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            >
              {{ showPassword() ? '🙈' : '👁️' }}
            </button>
          </div>
          <app-field-error [message]="formErrors.message('password')" />
        </div>

        <div class="captcha-card animate-fade-in-up delay-3" [class.captcha-invalid]="formErrors.show('captcha')">
          <div class="captcha-head">
            <div>
              <span class="captcha-badge">🛡️ Security check</span>
              <p class="captcha-hint">Solve to prove you're human</p>
            </div>
            <button
              type="button"
              class="captcha-refresh"
              (click)="loadCaptcha()"
              [disabled]="captchaLoading()"
              aria-label="Refresh captcha"
            >
              {{ captchaLoading() ? '…' : '↻' }}
            </button>
          </div>
          <div class="captcha-body">
            <div class="captcha-question" aria-hidden="true">
              @if (captchaQuestion()) {
                <span class="cq-num">{{ captchaLeft() }}</span>
                <span class="cq-op">{{ captchaOp() }}</span>
                <span class="cq-num">{{ captchaRight() }}</span>
                <span class="cq-eq">=</span>
              } @else {
                <span class="cq-loading">Loading…</span>
              }
            </div>
            <input
              class="form-input auth-input captcha-input"
              [class.input-invalid]="formErrors.show('captcha')"
              type="text"
              inputmode="numeric"
              [(ngModel)]="captchaAnswer"
              name="captcha"
              placeholder="?"
              autocomplete="off"
              maxlength="3"
              (blur)="formErrors.touch('captcha')"
              (ngModelChange)="formErrors.clear('captcha')"
            />
          </div>
          <app-field-error [message]="formErrors.message('captcha')" />
        </div>

        <button
          class="btn btn-primary auth-submit animate-fade-in-up delay-4"
          type="submit"
          [disabled]="loading() || captchaLoading() || !captchaToken()"
          [class.is-loading]="loading()"
        >
          @if (loading()) {
            <span class="btn-spinner"></span>
            Signing in...
          } @else {
            Login to Your Account →
          }
        </button>
      </form>
      }

      <p class="auth-footer animate-fade-in-up delay-4">
        Don't have an account?
        <a routerLink="/register" class="auth-link">Register Free</a>
      </p>
    </app-auth-shell>
  `,
  styles: [`
    .auth-form { margin-bottom: 0.5rem; }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .label-icon { font-size: 0.95rem; }

    .input-wrap {
      position: relative;
    }
    .input-wrap.has-toggle .auth-input { padding-right: 3rem; }

    .auth-input {
      border-radius: 14px;
      padding: 0.85rem 1rem;
      border: 2px solid var(--border);
      background: rgba(255, 255, 255, 0.9);
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }
    .auth-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(155, 27, 48, 0.1);
      transform: translateY(-1px);
    }

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
      transition: opacity 0.2s;
    }
    .toggle-pw:hover { opacity: 1; }

    .auth-submit {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.95rem 1.5rem;
      font-size: 1rem;
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
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      opacity: 0;
      animation-fill-mode: forwards;
    }

    .auth-link {
      font-weight: 600;
      color: var(--primary);
      margin-left: 0.25rem;
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

    .pw-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .forgot-link {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--primary);
      white-space: nowrap;
    }
    .otp-hint { color: var(--text-muted); margin-bottom: 1rem; line-height: 1.45; }
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

    .captcha-card {
      margin: 0.35rem 0 0.85rem;
      padding: 0.95rem 1rem;
      border-radius: 16px;
      background:
        radial-gradient(ellipse 80% 70% at 100% 0%, rgba(212, 175, 55, 0.16), transparent 55%),
        linear-gradient(145deg, #fffdf8, #fff5f0);
      border: 1.5px solid rgba(155, 27, 48, 0.14);
      box-shadow: 0 8px 22px rgba(58, 8, 18, 0.06);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .captcha-card.captcha-invalid {
      border-color: rgba(185, 28, 28, 0.45);
      box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.08);
    }
    .captcha-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .captcha-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      color: #5A0E1A;
      letter-spacing: 0.02em;
    }
    .captcha-hint {
      margin: 0.2rem 0 0;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .captcha-refresh {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      border: 1px solid rgba(155, 27, 48, 0.18);
      background: #fff;
      color: #9B1B30;
      font-size: 1.15rem;
      cursor: pointer;
      transition: transform 0.25s ease, background 0.2s ease;
    }
    .captcha-refresh:hover:not(:disabled) {
      transform: rotate(-45deg);
      background: #fff8f3;
    }
    .captcha-refresh:disabled { opacity: 0.55; cursor: wait; }
    .captcha-body {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .captcha-question {
      flex: 1;
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.55rem 0.75rem;
      border-radius: 12px;
      background: linear-gradient(135deg, #5A0E1A, #9B1B30 55%, #7A1528);
      color: #F5E6B8;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(155, 27, 48, 0.25);
      font-family: var(--font-display, Georgia, serif);
    }
    .cq-num {
      font-size: 1.45rem;
      font-weight: 800;
      min-width: 1.4rem;
      text-align: center;
    }
    .cq-op, .cq-eq {
      font-size: 1.25rem;
      font-weight: 700;
      opacity: 0.92;
    }
    .cq-loading { font-size: 0.9rem; opacity: 0.85; }
    .captcha-input {
      width: 72px;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 800;
      padding: 0.7rem 0.4rem;
    }
  `],
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  otpCode = '';
  captchaAnswer = '';
  loading = signal(false);
  captchaLoading = signal(false);
  error = signal('');
  info = signal('');
  showPassword = signal(false);
  otpStep = signal(false);
  captchaToken = signal('');
  captchaQuestion = signal('');
  resendSeconds = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  readonly formErrors = new FormErrorState();

  ngOnInit(): void {
    this.loadCaptcha();
  }

  captchaLeft(): string {
    return this.captchaQuestion().split(/\s+/)[0] || '';
  }

  captchaOp(): string {
    return this.captchaQuestion().split(/\s+/)[1] || '+';
  }

  captchaRight(): string {
    return this.captchaQuestion().split(/\s+/)[2] || '';
  }

  loadCaptcha(): void {
    this.captchaLoading.set(true);
    this.captchaAnswer = '';
    this.formErrors.clear('captcha');
    this.auth.getCaptcha().subscribe({
      next: (res) => {
        this.captchaToken.set(res.data?.captcha_token || '');
        this.captchaQuestion.set(res.data?.question || '');
        this.captchaLoading.set(false);
      },
      error: () => {
        this.captchaLoading.set(false);
        this.error.set('Could not load security check. Please refresh.');
      },
    });
  }

  resendLabel(): string {
    const s = this.resendSeconds();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
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

  onSubmit(): void {
    this.formErrors.markSubmitted();
    const errors = validateLoginForm(this.email, this.password, this.captchaAnswer);
    this.formErrors.setAll(errors);
    if (Object.keys(errors).length) return;
    if (!this.captchaToken()) {
      this.error.set('Security check not ready. Please refresh.');
      this.loadCaptcha();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    this.auth.login(this.email, this.password, this.captchaToken(), this.captchaAnswer.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.auth.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const body = err.error;
        if (body?.code === 'EMAIL_NOT_VERIFIED' || body?.data?.requires_otp) {
          this.otpStep.set(true);
          this.info.set(body?.message || 'OTP sent to your email');
          this.startResendCountdown(body?.data?.resend_after_seconds ?? 240);
          return;
        }
        this.error.set(body?.message || 'Login failed');
        this.loadCaptcha();
      },
    });
  }

  onVerifyOtp(): void {
    if (!this.otpCode.trim()) {
      this.error.set('Enter the OTP from your email');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyRegisterOtp(this.email.trim(), this.otpCode.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
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
    this.auth.resendOtp(this.email.trim(), 'email_verify').subscribe({
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
