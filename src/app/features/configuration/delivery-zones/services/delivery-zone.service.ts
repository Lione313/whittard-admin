import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { UbigeoItem, DeliveryZonePayload, DeliveryGlobalConfig } from '../models/delivery-zone.model';

@Injectable({
    providedIn: 'root'
})
export class DeliveryZoneService {
    private api = inject(ApiService);
    private readonly basePath = 'v1/admin/configuration/delivery-zones';

    private extractData(res: any): UbigeoItem[] {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        return [];
    }

    getDepartments(): Observable<UbigeoItem[]> {
        const params = new HttpParams().set('level', 'department');
        return this.api.get<any>(this.basePath, params).pipe(
            map(res => this.extractData(res))
        );
    }

    getProvinces(departmentCode: string): Observable<UbigeoItem[]> {
        const params = new HttpParams()
            .set('level', 'province')
            .set('parent_code', departmentCode);

        return this.api.get<any>(this.basePath, params).pipe(
            map(res => this.extractData(res))
        );
    }

    getDistricts(provinceCode: string, departmentCode?: string): Observable<UbigeoItem[]> {
        let params = new HttpParams()
            .set('level', 'district')
            .set('parent_code', provinceCode);

        if (departmentCode) {
            params = params.set('department_code', departmentCode);
        }

        return this.api.get<any>(this.basePath, params).pipe(
            map(res => this.extractData(res))
        );
    }

    savePrice(payload: DeliveryZonePayload): Observable<ApiResponse<UbigeoItem>> {
        return this.api.post<ApiResponse<UbigeoItem>>(this.basePath, payload);
    }

    toggleActive(id: number): Observable<ApiResponse<void>> {
        return this.api.post<ApiResponse<void>>(`${this.basePath}/${id}/toggle-active`, {});
    }

    // Endpoints para los Montos Mínimos de la Cabecera
    getGlobalConfig(): Observable<DeliveryGlobalConfig> {
        return this.api.get<any>(`${this.basePath}/global-config`).pipe(
            map(res => res?.data || res)
        );
    }

    saveGlobalConfig(config: DeliveryGlobalConfig): Observable<ApiResponse<void>> {
        return this.api.post<ApiResponse<void>>(`${this.basePath}/global-config`, config);
    }
    deleteZone(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
}
}
