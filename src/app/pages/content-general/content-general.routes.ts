import { Routes } from '@angular/router';

export default [
    { 
        path: '', 
        data: { breadcrumb: 'Contenido General' }, 
        loadComponent: () => import('./content-general').then((m) => m.ContentGeneral) 
    },
    { 
        path: 'edit/:slug/:identifier/:id', 
        data: { breadcrumb: 'Editar Sección' }, 
        loadComponent: () => import('./section-edit').then((m) => m.SectionEdit) 
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;