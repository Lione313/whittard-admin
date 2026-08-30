import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Coupon, CouponFilters, CouponPayload, CouponUsage, CustomerSummary } from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
    private api = inject(ApiService);

    list(filters: CouponFilters = {}): Observable<ApiResponse<Coupon[]>> {
        let params = new HttpParams();

        if (filters.code) params = params.set('filter[code]', filters.code);
        if (filters.type) params = params.set('filter[type]', filters.type);
        if (filters.applies_to) params = params.set('filter[applies_to]', filters.applies_to);
        if (filters.is_active !== undefined && filters.is_active !== null) params = params.set('filter[is_active]', filters.is_active ? '1' : '0');

        return this.api.get('v1/admin/coupons', params);
    }

    get(id: string): Observable<ApiResponse<Coupon>> {
        return this.api.get(`v1/admin/coupons/${id}`);
    }

    create(payload: CouponPayload): Observable<ApiResponse<Coupon>> {
        return this.api.post('v1/admin/coupons', payload);
    }

    update(id: string, payload: CouponPayload): Observable<ApiResponse<Coupon>> {
        return this.api.put(`v1/admin/coupons/${id}`, payload);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/coupons/${id}`);
    }

    usages(id: string): Observable<ApiResponse<CouponUsage[]>> {
        return this.api.get(`v1/admin/coupons/${id}/usages`);
    }

    listCustomers(search: string = '', perPage: number = 10): Observable<ApiResponse<CustomerSummary[]>> {
        let params = new HttpParams().set('per_page', perPage);

        if (search.trim()) params = params.set('search', search.trim());

        return this.api.get('v1/admin/customers', params);
    }
}
