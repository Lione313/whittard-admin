import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
    next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ocurrió un error desconocido';
            let errors: Record<string, string[]> | undefined;

            if (error.error instanceof ErrorEvent) {
                errorMessage = `Error: ${error.error.message}`;
            } else {
                if (error.status === 422) {
                    errorMessage = error.error?.message || 'Error de validación en los datos enviados.';
                    errors = error.error?.errors;
                } else if (error.status === 401) {
                    errorMessage = error.error?.message || 'Sesión expirada o no autorizada.';
                } else if (error.status === 500) {
                    errorMessage = 'Error interno en el servidor de Laravel.';
                } else {
                    errorMessage = error.error?.message || `Código de error: ${error.status}`;
                }
            }

            console.error('[ErrorInterceptor]:', errorMessage, error);

            return throwError(() => new ApiError(errorMessage, error.status ?? 0, errors));
        })
    );
