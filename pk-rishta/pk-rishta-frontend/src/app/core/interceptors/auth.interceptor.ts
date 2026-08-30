import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const AUTH_PUBLIC = /\/auth\/(login|register|verify-register-otp|resend-otp|forgot-password|reset-password)(\?|$)/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pk_token') : null;
  const token = (auth.getToken() || stored || '').trim();

  if (token && token !== 'null' && token !== 'undefined') {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !AUTH_PUBLIC.test(req.url)) {
        const hadSession = auth.isLoggedIn();
        auth.clearSession();
        if (hadSession && !req.url.includes('/auth/me')) {
          auth.logout();
        }
      }
      return throwError(() => err);
    }),
  );
};
