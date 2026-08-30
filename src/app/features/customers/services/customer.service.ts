import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse } from '@/app/core/models/api.model';
import { Customer, CustomerDetail, CustomerFilters, CustomerList } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private api = inject(ApiService);

    list(filters: CustomerFilters = {}): Observable<ApiResponse<CustomerList>> {
        let params = new HttpParams();

        if (filters.page) params = params.set('page', filters.page);
        if (filters.per_page) params = params.set('per_page', filters.per_page);
        if (filters.search) params = params.set('search', filters.search);

        return this.api.get('v1/admin/customers', params);
    }

    get(id: string): Observable<ApiResponse<CustomerDetail>> {
        return this.api.get(`v1/admin/customers/${id}`);
    }
}
