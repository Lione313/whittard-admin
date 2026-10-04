import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./seo-paginas.page').then((m) => m.PageSeoPage)
    }
] as Routes;
