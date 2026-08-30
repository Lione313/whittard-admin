import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';

export interface UploadedMedia {
    url: string;
    path: string;
    name: string;
    size: number;
    mime: string;
    type: 'image' | 'video' | 'document' | 'other';
}

@Injectable({ providedIn: 'root' })
export class MediaService {
    private api = inject(ApiService);

    upload(files: File[]): Observable<ApiResponse<{ items: UploadedMedia[] }>> {
        const form = new FormData();

        for (const file of files) form.append('files[]', file);

        return this.api.post('v1/admin/media', form);
    }

    remove(path: string): Observable<ApiResponse<{ deleted: boolean }>> {
        return this.api.delete('v1/admin/media', { path });
    }
}
