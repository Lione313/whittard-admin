import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { Page, PageSection } from '../models/content.model';

@Injectable({
    providedIn: 'root'
})
export class ContentService {
    private api = inject(ApiService);

    private readonly basePath = 'v1/admin/content';

    getPages(): Observable<Page[]> {
        return this.api
            .get<{ success: boolean; data: Page[] }>(`${this.basePath}/pages`)
            .pipe(map((res) => res.data));
    }

    getSection(slug: string, identifier: string, id: number): Observable<PageSection> {
        return this.api
            .get<{ success: boolean; data: PageSection }>(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}`)
            .pipe(map((res) => res.data));
    }

    // Solo JSON (sin archivos)
    updateSection(slug: string, identifier: string, id: number, content: Record<string, unknown>): Observable<any> {
        return this.api.put(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}`, { content });
    }

    // Con archivos → FormData
    updateSectionForm(slug: string, identifier: string, id: number, formData: FormData): Observable<any> {
        return this.api.putForm(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}`, formData);
    }

    saveDraft(slug: string, identifier: string, id: number, content: Record<string, unknown>): Observable<any> {
        return this.api.post(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}/draft`, { content });
    }

    saveDraftForm(slug: string, identifier: string, id: number, formData: FormData): Observable<any> {
        return this.api.postForm(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}/draft`, formData);
    }

    publish(slug: string, identifier: string, id: number): Observable<any> {
        return this.api.post(`${this.basePath}/pages/${slug}/sections/${identifier}/${id}/publish`, {});
    }
}