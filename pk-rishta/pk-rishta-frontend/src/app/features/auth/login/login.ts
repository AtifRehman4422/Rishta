import { Component, inject, signal } from '@angular/core';
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
    <app-auth-shell title="Welcome Back" urduTitle="خوش آمدید" subtitle="Sign in to continue your rishta journey">
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
          <button class="btn btn-primary auth-submit" type="submit" [disabled]="loading()">
            {{ loading() ? 'Verifying…' : 'Verify & Login' }}
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

        <button
          class="btn btn-primary auth-submit animate-fade-in-up delay-3"
          type="submit"
          [disabled]="loading()"
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

      <div class="demo-credentials animate-fade-in-up delay-5">
        <p><strong>Demo Admin:</strong> atif-admin442@pkrishta.com / ARadmin@442</p>
        <p><strong>Demo User (Ahmed):</strong> ahmed.khan@example.com / User@123</p>
        <p><strong>Demo User (Zainab):</strong> zainab.hussain@example.com / User@123</p>
        <div class="demo-actions">
          <button type="button" class="demo-fill-btn" (click)="fillDemo('admin')">Use Admin</button>
          <button type="button" class="demo-fill-btn" (click)="fillDemo('ahmed')">Use Ahmed</button>
          <button type="button" class="demo-fill-btn" (click)="fillDemo('zainab')">Use Zainab</button>
        </div>
      </div>
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
      opacity: 0;
      animation-fill-mode: forwards;
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

    .demo-credentials {
      margin-top: 1.5rem;
      padding: 1rem 1.1rem;
      background: rgba(255, 255, 255, 0.75);
      border: 1px dashed var(--border);
      border-radius: 14px;
      font-size: 0.82rem;
      color: var(--text-muted);
      opacity: 0;
      animation-fill-mode: forwards;
    }
    .demo-credentials p { margin-bottom: 0.35rem; line-height: 1.5; }
    .demo-credentials strong { color: var(--primary); }
    .demo-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    .demo-fill-btn {
      padding: 0.4rem 0.85rem;
      border-radius: 50px;
      border: 1px solid var(--border);
      background: white;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      font-family: var(--font);
      transition: border-color 0.2s, background 0.2s;
    }
    .demo-fill-btn:hover {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.05);
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
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  otpCode = '';
  loading = signal(false);
  error = signal('');
  info = signal('');
  showPassword = signal(false);
  otpStep = signal(false);
  resendSeconds = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  readonly formErrors = new FormErrorState();

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

  fillDemo(type: 'admin' | 'ahmed' | 'zainab'): void {
    this.formErrors.reset();
    if (type === 'admin') {
      this.email = 'atif-admin442@pkrishta.com';
      this.password = 'ARadmin@442';
    } else if (type === 'ahmed') {
      this.email = 'ahmed.khan@example.com';
      this.password = 'User@123';
    } else {
      this.email = 'zainab.hussain@example.com';
      this.password = 'User@123';
    }
  }

  onSubmit(): void {
    this.formErrors.markSubmitted();
    const errors = validateLoginForm(this.email, this.password);
    this.formErrors.setAll(errors);
    if (Object.keys(errors).length) return;

    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    this.auth.login(this.email, this.password).subscribe({
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
