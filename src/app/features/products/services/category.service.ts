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

    create(form: FormData): Observable<ApiResponse<Category>> {
        return this.api.postForm('v1/admin/categories', form);
    }

    update(id: string, form: FormData): Observable<ApiResponse<Category>> {
        return this.api.putForm(`v1/admin/categories/${id}`, form);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/categories/${id}`);
    }
}
