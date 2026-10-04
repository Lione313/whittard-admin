import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Order, OrderFilters, OrderList, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
    private api = inject(ApiService);

    list(filters: OrderFilters = {}): Observable<ApiResponse<OrderList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.search) params = params.set('search', filters.search);

        return this.api.get('v1/admin/orders', params);
    }

    get(id: string): Observable<ApiResponse<Order>> {
        return this.api.get(`v1/admin/orders/${id}`);
    }

    updateStatus(id: string, status: OrderStatus): Observable<ApiResponse<Order>> {
        return this.api.patch(`v1/admin/orders/${id}/status`, { status });
    }
}
