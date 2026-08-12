import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Product, ProductFilters, ProductImportResult, ProductListResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private api = inject(ApiService);

    list(filters: ProductFilters = {}): Observable<ApiResponse<ProductListResponse>> {
        let params = new HttpParams();
        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.sort) params = params.set('sort', filters.sort);
        if (filters.status) params = params.set('filter[status]', filters.status);
        if (filters.category_id) params = params.set('filter[category_id]', filters.category_id);
        if (filters.search) params = params.set('filter[search]', filters.search);

        return this.api.get('v1/admin/products', params);
    }

    get(id: string): Observable<ApiResponse<Product>> {
        return this.api.get(`v1/admin/products/${id}`);
    }

    getBySlug(slug: string): Observable<ApiResponse<Product>> {
        return this.api.get(`v1/admin/products/by-slug/${slug}`);
    }

    create(formData: FormData): Observable<ApiResponse<Product>> {
        return this.api.post('v1/admin/products', formData);
    }

    update(id: string, formData: FormData): Observable<ApiResponse<Product>> {
        return this.api.put(`v1/admin/products/${id}`, formData);
    }

    remove(id: string): Observable<ApiResponse<null>> {
        return this.api.delete(`v1/admin/products/${id}`);
    }

    exportProducts(): Observable<Blob> {
        return this.api.getBlob('v1/admin/products/export');
    }

    importProducts(file: File): Observable<ApiResponse<ProductImportResult>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post('v1/admin/products/import', formData);
    }

    validateImport(file: File): Observable<ApiResponse<ProductImportResult>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post('v1/admin/products/import/validate', formData);
    }
}
