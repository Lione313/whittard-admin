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
        path: 'chatbot',
        data: { breadcrumb: 'Chatbot' },
        loadChildren: () => import('./chatbot/chatbot.routes').then((m) => m.default)
    },
    {
        path: 'recojo-en-tienda',
        data: { breadcrumb: 'Recojo en Tienda' },
        loadChildren: () => import('./pickup-stores/pickup-stores.routes').then((m) => m.default)
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
    {
        path: 'seo-paginas',
        data: { breadcrumb: 'SEO de Páginas' },
        loadChildren: () => import('./seo-paginas/seo-paginas.routes').then((m) => m.default)
    },
    { path: '', redirectTo: 'cuentas-bancarias', pathMatch: 'full' }
] as Routes;
