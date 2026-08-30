import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import {
    AdjustBatchPayload,
    GlobalStockMovementList,
    InventoryFilters,
    InventoryItem,
    InventoryList,
    InventorySummary,
    LowStockThreshold,
    StockAdjustPayload,
    StockMovementFilters,
    StockMovementList,
    StockMovementsFilters,
    VariantStock
} from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private api = inject(ApiService);

    stockMovements(variantId: string, filters: StockMovementsFilters = {}): Observable<ApiResponse<StockMovementList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);

        return this.api.get(`v1/admin/variants/${variantId}/stock-movements`, params);
    }

    adjustStock(variantId: string, payload: StockAdjustPayload): Observable<ApiResponse<VariantStock>> {
        return this.api.post(`v1/admin/variants/${variantId}/stock-adjust`, payload);
    }

    getLowStockThreshold(): Observable<ApiResponse<LowStockThreshold>> {
        return this.api.get('v1/admin/inventory/low-stock-threshold');
    }

    setLowStockThreshold(lowStockThreshold: number | null): Observable<ApiResponse<LowStockThreshold>> {
        return this.api.put('v1/admin/inventory/low-stock-threshold', { low_stock_threshold: lowStockThreshold });
    }

    list(filters: InventoryFilters = {}): Observable<ApiResponse<InventoryList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.filter) params = params.set('filter', filters.filter);
        if (filters.sort) params = params.set('sort', filters.sort);
        if (filters.direction) params = params.set('direction', filters.direction);

        return this.api.get('v1/admin/inventory', params);
    }

    summary(): Observable<ApiResponse<InventorySummary>> {
        return this.api.get('v1/admin/inventory/summary');
    }

    movements(filters: StockMovementFilters = {}): Observable<ApiResponse<GlobalStockMovementList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.variant_id) params = params.set('variant_id', filters.variant_id);
        if (filters.type) params = params.set('type', filters.type);
        if (filters.sku) params = params.set('sku', filters.sku);

        return this.api.get('v1/admin/inventory/movements', params);
    }

    adjustBatch(payload: AdjustBatchPayload): Observable<ApiResponse<InventoryItem[]>> {
        return this.api.post('v1/admin/inventory/adjust-batch', payload);
    }
}
