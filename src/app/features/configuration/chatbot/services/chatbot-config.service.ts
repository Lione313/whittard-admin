import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { ChatbotConfig, ChatbotConfigPayload } from '../models/chatbot-config.model';

@Injectable({ providedIn: 'root' })
export class ChatbotConfigService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/configuration/chatbot';

    get(): Observable<ApiResponse<ChatbotConfig>> {
        return this.api.get<ApiResponse<ChatbotConfig>>(this.endpoint);
    }

    update(payload: ChatbotConfigPayload): Observable<ApiResponse<ChatbotConfig>> {
        return this.api.post<ApiResponse<ChatbotConfig>>(this.endpoint, payload);
    }
}
