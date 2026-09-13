import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ApiResponse, PaginatedResult } from '@/app/core/models/api.model';
import { BankAccount, BankAccountPayload } from '../models/bank-account.model';

@Injectable({
  providedIn: 'root'
})
export class BankAccountService {
  private api = inject(ApiService);
  private endpoint = 'v1/admin/configuration/bank-accounts';

  getAll(filters?: { search?: string; currency?: string; is_active?: boolean; page?: number; per_page?: number }): Observable<ApiResponse<PaginatedResult<BankAccount>>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.api.get<ApiResponse<PaginatedResult<BankAccount>>>(this.endpoint, params);
  }

  getById(id: number): Observable<ApiResponse<BankAccount>> {
    return this.api.get<ApiResponse<BankAccount>>(`${this.endpoint}/${id}`);
  }

  create(payload: BankAccountPayload): Observable<ApiResponse<BankAccount>> {
    return this.api.post<ApiResponse<BankAccount>>(this.endpoint, payload);
  }

  update(id: number, payload: Partial<BankAccountPayload>): Observable<ApiResponse<BankAccount>> {
    return this.api.put<ApiResponse<BankAccount>>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.api.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
  }

  toggleActive(id: number): Observable<ApiResponse<null>> {
    return this.api.put<ApiResponse<null>>(`${this.endpoint}/${id}/toggle-active`, {});
  }
}