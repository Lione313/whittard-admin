import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../services/api.service';
import { User } from '../models/user.model';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface LaravelAuthWrapper {
    success: boolean;
    message: string;
    data: {
        access_token: string;  // ← era "token", la API devuelve "access_token"
        refresh_token: string;
        token_type: string;
        user: User;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private api    = inject(ApiService);
    private router = inject(Router);

    private readonly TOKEN_KEY = 'whittard_access_token';
    private readonly USER_KEY  = 'whittard_user';

    private _user        = signal<User | null>(this.getStoredUser());
    private _accessToken = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

    public user        = this._user.asReadonly();
    public accessToken = this._accessToken.asReadonly();
    public isLoggedIn  = computed(() => !!this._accessToken());

    login(credentials: { email: string; password: string }): Observable<LaravelAuthWrapper> {
        return this.api.post<LaravelAuthWrapper>('v1/admin/auth/login', credentials).pipe(
            tap((response) => {
                if (response?.data) {
                    this.setSession(response.data.access_token, response.data.user);
                }
            })
        );
    }

    logout(): void {
        this.api.post('v1/admin/auth/logout', {}).subscribe({
            complete: () => this.clearSession(),
            error:    () => this.clearSession(),
        });
    }

    private setSession(token: string, user: User): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._accessToken.set(token);
        this._user.set(user);
    }

    public clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this._accessToken.set(null);
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