import { Routes } from '@angular/router';
import { CouponList } from './coupon-list';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Cupones' }, component: CouponList }
] as Routes;
