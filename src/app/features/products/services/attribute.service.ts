import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Attribute } from '../models/attribute.model';

@Injectable({ providedIn: 'root' })
export class AttributeService {
    private api = inject(ApiService);

    list(): Observable<ApiResponse<Attribute[]>> {
        return this.api.get('v1/admin/attributes');
    }

    get(id: string): Observable<ApiResponse<Attribute>> {
        return this.api.get(`v1/admin/attributes/${id}`);
    }

    create(formData: FormData): Observable<ApiResponse<Attribute>> {
        return this.api.post('v1/admin/attributes', formData);
    }

    update(id: string, formData: FormData): Observable<ApiResponse<Attribute>> {
        return this.api.put(`v1/admin/attributes/${id}`, formData);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/attributes/${id}`);
    }
}
