import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { PickupStore, PickupStorePayload } from '../models/pickup-store.model';

@Injectable({
    providedIn: 'root'
})
export class PickupStoreService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/configuration/pickup-stores';

    getAll(): Observable<ApiResponse<PickupStore[]>> {
        return this.api.get<ApiResponse<PickupStore[]>>(this.endpoint);
    }

    getById(id: number): Observable<ApiResponse<PickupStore>> {
        return this.api.get<ApiResponse<PickupStore>>(`${this.endpoint}/${id}`);
    }

    create(payload: PickupStorePayload): Observable<ApiResponse<PickupStore>> {
        return this.api.post<ApiResponse<PickupStore>>(this.endpoint, payload);
    }

    update(id: number, payload: PickupStorePayload): Observable<ApiResponse<PickupStore>> {
        return this.api.put<ApiResponse<PickupStore>>(`${this.endpoint}/${id}`, payload);
    }

    delete(id: number): Observable<ApiResponse<null>> {
        return this.api.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
    }
}
