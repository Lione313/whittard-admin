import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private api = inject(ApiService);

    list(): Observable<ApiResponse<Category[]>> {
        return this.api.get('v1/admin/categories');
    }

    get(id: string): Observable<ApiResponse<Category>> {
        return this.api.get(`v1/admin/categories/${id}`);
    }

    create(payload: unknown): Observable<ApiResponse<Category>> {
        return this.api.post('v1/admin/categories', payload);
    }

    update(id: string, payload: unknown): Observable<ApiResponse<Category>> {
        return this.api.put(`v1/admin/categories/${id}`, payload);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/categories/${id}`);
    }
}
