import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./physical-stores.page').then((m) => m.PhysicalStoresPage),
    },
    {
        path: 'create',
        loadComponent: () =>
            import('@/app/features/configuration/physical-stores/components/physical-store-form').then(
                (m) => m.PhysicalStoreForm
            ),
    },
    {
        path: ':id/edit',
        loadComponent: () =>
            import('@/app/features/configuration/physical-stores/components/physical-store-form').then(
                (m) => m.PhysicalStoreForm
            ),
    },
] as Routes;