import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('auth/login') || req.url.includes('auth/refresh');

      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap((refreshed) => {
            if (refreshed) {
              return next(req);
            }
            authService.clearSession();
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            authService.clearSession();
            return throwError(() => refreshErr);
          })
        );
      }

      if (error.status === 401 && isAuthEndpoint) {
        authService.clearSession();
      }

      return throwError(() => error);
    })
  );
};