import { Routes } from '@angular/router';

export default [
    {
        path: 'cuentas-bancarias',
        data: { breadcrumb: 'Cuentas Bancarias' },
        loadChildren: () => import('./bank-accounts/routes/bank-accounts.routes').then((m) => m.default)
    },
    {
        path: 'whatsapp',
        data: { breadcrumb: 'WhatsApp' },
        loadChildren: () => import('./whatsapp/whatsapp.routes').then((m) => m.default)
    },
    {
        path: 'tiendas-fisicas',
        data: { breadcrumb: 'Tiendas Físicas' },
        loadChildren: () => import('./physical-stores/physical-stores.routes').then((m) => m.default)
    },
    {
        path: 'zonas-delivery',
        data: { breadcrumb: 'Zonas de Delivery' },
        loadChildren: () => import('./delivery-zones/routes/delivery-zones.routes').then((m) => m.default)
    },
    {
        path: 'scripts',
        loadChildren: () => import('@/app/pages/configuration/scripts/routes/scripts.routes')
    },
    { path: '', redirectTo: 'cuentas-bancarias', pathMatch: 'full' }
] as Routes;
