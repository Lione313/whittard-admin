import { Routes } from '@angular/router';
import { bankAccountsListResolver } from '@/app/features/configuration/bank-accounts/resolvers/bank-accounts-list.resolver';

export default [
    {
        path: '',
        loadComponent: () =>
            import('../bank-accounts.page').then((m) => m.BankAccountsPage),
        resolve: { result: bankAccountsListResolver },
    },
    { path: '**', redirectTo: '/notfound' },
] as Routes;