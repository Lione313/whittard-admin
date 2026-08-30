import { Routes } from '@angular/router';
import { ReviewList } from './review-list';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Reseñas' }, component: ReviewList }
] as Routes;
