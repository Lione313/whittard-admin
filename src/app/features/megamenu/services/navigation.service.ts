import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { CatalogData, MegamenuData, PublishedLandingsData, SaveMegamenuPayload } from '../models/navigation.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private api = inject(ApiService);

    getMenu(): Observable<ApiResponse<MegamenuData>> {
        return this.api.get('v1/admin/navigation/megamenu');
    }

    saveMenu(payload: SaveMegamenuPayload): Observable<ApiResponse<MegamenuData>> {
        return this.api.post('v1/admin/navigation/save', payload);
    }

    getCatalog(): Observable<ApiResponse<CatalogData>> {
        return this.api.get('v1/admin/navigation/catalog');
    }

    getPublishedLandings(): Observable<ApiResponse<PublishedLandingsData>> {
        return this.api.get('v1/admin/navigation/landings');
    }
}
