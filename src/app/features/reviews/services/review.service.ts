import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Review, ReviewFilters, ReviewList, ReviewModerationPayload } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
    private api = inject(ApiService);

    list(filters: ReviewFilters = {}): Observable<ApiResponse<ReviewList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.status) params = params.set('filter[status]', filters.status);
        if (filters.rating) params = params.set('filter[rating]', filters.rating);
        if (filters.product_id) params = params.set('filter[product_id]', filters.product_id);

        return this.api.get('v1/admin/reviews', params);
    }

    moderate(id: string, status: 'approved' | 'rejected'): Observable<ApiResponse<Review>> {
        const payload: ReviewModerationPayload = { status };

        return this.api.put(`v1/admin/reviews/${id}/moderate`, payload);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/reviews/${id}`);
    }
}
