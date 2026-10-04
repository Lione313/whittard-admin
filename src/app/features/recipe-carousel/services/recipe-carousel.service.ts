import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { RecipeCarousel, RecipeCarouselPayload } from '../models/recipe-carousel.model';

@Injectable({ providedIn: 'root' })
export class RecipeCarouselService {
    private api = inject(ApiService);
    private endpoint = 'v1/admin/recipe-carousel';

    get(): Observable<ApiResponse<RecipeCarousel>> {
        return this.api.get<ApiResponse<RecipeCarousel>>(this.endpoint);
    }

    update(payload: RecipeCarouselPayload): Observable<ApiResponse<RecipeCarousel>> {
        return this.api.post<ApiResponse<RecipeCarousel>>(this.endpoint, payload);
    }
}
