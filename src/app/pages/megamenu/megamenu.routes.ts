import { Routes } from '@angular/router';
import { MegamenuBuilder } from './megamenu-builder';
import { LandingList } from './landing-list';
import { LandingForm } from './landing-form';

export default [
    { path: '', redirectTo: 'menu', pathMatch: 'full' },
    { path: 'menu', data: { breadcrumb: 'Mega Menú' }, component: MegamenuBuilder },
    { path: 'landings', data: { breadcrumb: 'Landings' }, component: LandingList },
    { path: 'landings/new', data: { breadcrumb: 'Nueva Landing' }, component: LandingForm },
    { path: 'landings/:id/edit', data: { breadcrumb: 'Editar Landing' }, component: LandingForm },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
