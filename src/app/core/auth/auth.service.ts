import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../services/api.service';
import { User } from '../models/user.model';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';

interface LaravelAuthWrapper {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private api = inject(ApiService);
    private router = inject(Router);

    private readonly USER_KEY = 'whittard_user';

    private _user = signal<User | null>(this.getStoredUser());

    public user = this._user.asReadonly();
    public isLoggedIn = computed(() => !!this._user());

    login(credentials: { email: string; password: string }): Observable<LaravelAuthWrapper> {
        return this.api.post<LaravelAuthWrapper>('v1/admin/auth/login', credentials).pipe(
            tap((response) => {
                if (response?.data?.user) {
                    this.setSession(response.data.user);
                }
            })
        );
    }

    /**
     * Intenta refrescar la sesión usando la cookie 'refresh_token' enviada por el navegador.
     * Si es exitoso, recupera los datos del usuario.
     */
    refreshToken(): Observable<boolean> {
        return this.api.post<LaravelAuthWrapper>('v1/admin/auth/refresh', {}).pipe(
            map((response) => {
                if (response?.data?.user) {
                    this.setSession(response.data.user);
                    return true;
                }
                return false;
            }),
            catchError(() => {
                this.clearSession();
                return of(false);
            })
        );
    }

    logout(): void {
        this.api.post('v1/admin/auth/logout', {}).subscribe({
            complete: () => this.clearSession(),
            error: () => this.clearSession()
        });
    }

    private setSession(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._user.set(user);
    }

    public clearSession(): void {
        localStorage.removeItem(this.USER_KEY);
        this._user.set(null);
        this.router.navigate(['/auth/login']);
    }

    private getStoredUser(): User | null {
        const stored = localStorage.getItem(this.USER_KEY);

        if (!stored || stored === 'undefined' || stored === 'null') return null;

        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
}