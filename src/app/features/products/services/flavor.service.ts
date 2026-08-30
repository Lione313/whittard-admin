import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Flavor, FlavorPayload } from '../models/flavor.model';

@Injectable({ providedIn: 'root' })
export class FlavorService {
    private api = inject(ApiService);

    list(): Observable<ApiResponse<Flavor[]>> {
        return this.api.get('v1/admin/flavors');
    }

    get(id: string): Observable<ApiResponse<Flavor>> {
        return this.api.get(`v1/admin/flavors/${id}`);
    }

    create(payload: FlavorPayload): Observable<ApiResponse<Flavor>> {
        return this.api.post('v1/admin/flavors', payload);
    }

    update(id: string, payload: FlavorPayload): Observable<ApiResponse<Flavor>> {
        return this.api.put(`v1/admin/flavors/${id}`, payload);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/flavors/${id}`);
    }
}
