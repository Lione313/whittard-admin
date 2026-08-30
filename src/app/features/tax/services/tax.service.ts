import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { TaxClass, TaxClassPayload } from '../models/tax.model';

@Injectable({ providedIn: 'root' })
export class TaxService {
    private api = inject(ApiService);

    listClasses(): Observable<ApiResponse<TaxClass[]>> {
        return this.api.get('v1/admin/tax-classes');
    }

    createClass(payload: TaxClassPayload): Observable<ApiResponse<TaxClass>> {
        return this.api.post('v1/admin/tax-classes', payload);
    }

    updateClass(id: string, payload: TaxClassPayload): Observable<ApiResponse<TaxClass>> {
        return this.api.put(`v1/admin/tax-classes/${id}`, payload);
    }

    removeClass(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/tax-classes/${id}`);
    }
}
