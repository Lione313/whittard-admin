import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Recipe, RecipeFilters, RecipeList, RecipePayload } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
    private api = inject(ApiService);

    list(filters: RecipeFilters = {}): Observable<ApiResponse<RecipeList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.search) params = params.set('search', filters.search);

        return this.api.get('v1/admin/recipes', params);
    }

    get(id: string): Observable<ApiResponse<Recipe>> {
        return this.api.get(`v1/admin/recipes/${id}`);
    }

    create(payload: RecipePayload): Observable<ApiResponse<Recipe>> {
        return this.api.post('v1/admin/recipes', payload);
    }

    update(id: string, payload: RecipePayload): Observable<ApiResponse<Recipe>> {
        return this.api.put(`v1/admin/recipes/${id}`, payload);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/recipes/${id}`);
    }
}
