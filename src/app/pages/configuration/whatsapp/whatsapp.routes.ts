import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./whatsapp.page').then((m) => m.WhatsappPage)
    }
] as Routes;