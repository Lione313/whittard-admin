import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

import { authGuard } from './app/core/auth/auth.guard';
import { guestGuard } from './app/core/auth/guest.guard';

export const appRoutes: Routes = [
    {
        path: 'auth',
        canActivate: [guestGuard],
        loadChildren: () => import('./app/pages/auth/auth.routes').then((m) => m.default)
    },

    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },

    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes').then((m) => m.default) },
            { path: 'products', loadChildren: () => import('./app/pages/products/products.routes').then((m) => m.default) },
            { path: 'customers', loadChildren: () => import('./app/pages/customers/customers.routes').then((m) => m.default) },
            { path: 'coupons', loadChildren: () => import('./app/pages/coupons/coupons.routes').then((m) => m.default) },
            { path: 'inventory', loadChildren: () => import('./app/pages/inventory/inventory.routes').then((m) => m.default) },
            { path: 'reviews', loadChildren: () => import('./app/pages/reviews/reviews.routes').then((m) => m.default) },
            { path: 'taxes', loadChildren: () => import('./app/pages/taxes/taxes.routes').then((m) => m.default) },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes').then((m) => m.default) }
        ]
    },

    { path: '**', redirectTo: '/notfound' }
];
