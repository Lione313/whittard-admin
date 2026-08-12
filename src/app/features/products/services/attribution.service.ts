import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Attribution } from '../models/attribution.model';

@Injectable({ providedIn: 'root' })
export class AttributionService {
    private api = inject(ApiService);

    list(): Observable<ApiResponse<Attribution[]>> {
        return this.api.get('v1/admin/attributions');
    }

    get(id: string): Observable<ApiResponse<Attribution>> {
        return this.api.get(`v1/admin/attributions/${id}`);
    }

    create(formData: FormData): Observable<ApiResponse<Attribution>> {
        return this.api.post('v1/admin/attributions', formData);
    }

    update(id: string, formData: FormData): Observable<ApiResponse<Attribution>> {
        return this.api.put(`v1/admin/attributions/${id}`, formData);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/attributions/${id}`);
    }
}
