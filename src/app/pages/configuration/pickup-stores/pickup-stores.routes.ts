import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./pickup-stores.page').then((m) => m.PickupStoresPage)
    },
    {
        path: 'create',
        loadComponent: () => import('@/app/features/configuration/pickup-stores/components/pickup-store-form').then((m) => m.PickupStoreForm)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('@/app/features/configuration/pickup-stores/components/pickup-store-form').then((m) => m.PickupStoreForm)
    }
] as Routes;
