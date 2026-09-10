import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Landing, LandingFilters, LandingStatus } from '../models/landing.model';

@Injectable({ providedIn: 'root' })
export class LandingService {
    private api = inject(ApiService);

    list(filters: LandingFilters = {}): Observable<ApiResponse<Landing[]>> {
        let params = new HttpParams();

        if (filters.status) params = params.set('status', filters.status);
        if (filters.category_id) params = params.set('category_id', filters.category_id);

        return this.api.get('v1/admin/landings', params);
    }

    get(id: string): Observable<ApiResponse<Landing>> {
        return this.api.get(`v1/admin/landings/${id}`);
    }

    create(form: FormData): Observable<ApiResponse<Landing>> {
        return this.api.postForm('v1/admin/landings', form);
    }

    update(id: string, form: FormData): Observable<ApiResponse<Landing>> {
        return this.api.putForm(`v1/admin/landings/${id}`, form);
    }

    updateStatus(id: string, status: LandingStatus): Observable<ApiResponse<Landing>> {
        const form = new FormData();

        form.append('status', status);

        return this.api.putForm(`v1/admin/landings/${id}`, form);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/landings/${id}`);
    }
}
