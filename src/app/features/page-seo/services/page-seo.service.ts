import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { PageSeo, PageSeoPayload } from '../models/page-seo.model';

@Injectable({ providedIn: 'root' })
export class PageSeoService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/configuration/page-seo';

    list(): Observable<ApiResponse<PageSeo[]>> {
        return this.api.get<ApiResponse<PageSeo[]>>(this.endpoint);
    }

    update(id: string, payload: PageSeoPayload): Observable<ApiResponse<PageSeo>> {
        return this.api.put<ApiResponse<PageSeo>>(`${this.endpoint}/${id}`, payload);
    }
}
