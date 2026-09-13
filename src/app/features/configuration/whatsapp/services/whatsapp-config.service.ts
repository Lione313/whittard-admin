import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service'; // Ajusta la ruta a tu ApiService
import { ApiResponse } from '@/app/core/models/api.model';
import { WhatsappConfig, WhatsappConfigPayload } from '../models/whatsapp-config.model';

@Injectable({
    providedIn: 'root'
})
export class WhatsappConfigService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/configuration/whatsapp';

    get(): Observable<ApiResponse<WhatsappConfig>> {
        return this.api.get<ApiResponse<WhatsappConfig>>(this.endpoint);
    }

    update(payload: WhatsappConfigPayload): Observable<ApiResponse<WhatsappConfig>> {
        const formData = new FormData();

        if (payload.phone_number !== undefined) formData.append('phone_number', payload.phone_number || '');
        if (payload.welcome_message !== undefined) formData.append('welcome_message', payload.welcome_message || '');
        if (payload.hover_text !== undefined) formData.append('hover_text', payload.hover_text || '');
        if (payload.is_active !== undefined) formData.append('is_active', payload.is_active ? '1' : '0');
        if (payload.image) formData.append('image', payload.image);

        return this.api.post<ApiResponse<WhatsappConfig>>(this.endpoint, formData);
    }
}