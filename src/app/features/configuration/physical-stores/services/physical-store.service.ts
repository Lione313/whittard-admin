import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { PhysicalStore, PhysicalStoreSection } from '../models/physical-store.model';

@Injectable({
    providedIn: 'root'
})
export class PhysicalStoreService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/configuration/physical-stores';
    private storesEndpoint = 'v1/admin/configuration/physical-stores/stores';

    // ─── Sección (título/subtítulo) ───────────────────────────────────────────
    getSection(): Observable<ApiResponse<PhysicalStoreSection>> {
        return this.api.get<ApiResponse<PhysicalStoreSection>>(`${this.endpoint}/section`);
    }

    updateSection(formData: FormData): Observable<ApiResponse<PhysicalStoreSection>> {
        return this.api.postForm<ApiResponse<PhysicalStoreSection>>(`${this.endpoint}/section`, formData);
    }
    // ─── Tiendas individuales ─────────────────────────────────────────────────
    getStores(): Observable<ApiResponse<PhysicalStore[]>> {
        return this.api.get<ApiResponse<PhysicalStore[]>>(this.storesEndpoint);
    }

    getStoreById(id: number): Observable<ApiResponse<PhysicalStore>> {
        return this.api.get<ApiResponse<PhysicalStore>>(`${this.storesEndpoint}/${id}`);
    }

    createStore(formData: FormData): Observable<ApiResponse<PhysicalStore>> {
        return this.api.postForm<ApiResponse<PhysicalStore>>(this.storesEndpoint, formData);
    }

updateStore(id: number, formData: FormData): Observable<ApiResponse<PhysicalStore>> {
    return this.api.postForm<ApiResponse<PhysicalStore>>(`${this.storesEndpoint}/${id}`, formData);
}

    deleteStore(id: number): Observable<ApiResponse<null>> {
        return this.api.delete<ApiResponse<null>>(`${this.storesEndpoint}/${id}`);
    }
}
