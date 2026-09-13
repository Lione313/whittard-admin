import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse, PaginatedResult } from '@/app/core/models/api.model';
import { Script, ScriptForm } from '../models/script.model';

@Injectable({ providedIn: 'root' })
export class ScriptService {
    private api = inject(ApiService);
    private base = 'v1/admin/configuration/scripts';

getAll(params?: { page?: number; per_page?: number }): Observable<ApiResponse<PaginatedResult<Script>>> {
    let httpParams = new HttpParams();
    if (params?.page)     httpParams = httpParams.set('page', params.page);
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page);
    return this.api.get<ApiResponse<PaginatedResult<Script>>>(this.base, httpParams);
}

    getById(id: number): Observable<ApiResponse<Script>> {
        return this.api.get<ApiResponse<Script>>(`${this.base}/${id}`);
    }

    create(data: ScriptForm): Observable<ApiResponse<Script>> {
        return this.api.post<ApiResponse<Script>>(this.base, data);
    }

    update(id: number, data: ScriptForm): Observable<ApiResponse<Script>> {
        return this.api.put<ApiResponse<Script>>(`${this.base}/${id}`, data);
    }

    toggleActive(id: number): Observable<ApiResponse<Script>> {
        return this.api.patch<ApiResponse<Script>>(`${this.base}/${id}/toggle-active`, {});
    }

    delete(id: number): Observable<ApiResponse<null>> {
        return this.api.delete<ApiResponse<null>>(`${this.base}/${id}`);
    }
}