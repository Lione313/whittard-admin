import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { BankAccountService } from '../services/bank-account.service';
import { PaginatedResult } from '@/app/core/models/api.model';
import { BankAccount } from '../models/bank-account.model';

export const bankAccountsListResolver: ResolveFn<PaginatedResult<BankAccount>> = () => {
    return inject(BankAccountService).getAll({ page: 1, per_page: 15 }).pipe(
        map(res => res.data)
    );
};