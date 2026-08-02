import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error desconocido';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        if (error.status === 422) {
          errorMessage = error.error.message || 'Error de validación en los datos enviados.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno en el servidor de Laravel.';
        } else {
          errorMessage = error.error?.message || `Código de error: ${error.status}`;
        }
      }

      console.error('[ErrorInterceptor]:', errorMessage, error);
      return throwError(() => new Error(errorMessage));
    })
  );
};