import { Routes } from '@angular/router';
import { OrderList } from './order-list';
import { OrderDetail } from './order-detail';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Órdenes' }, component: OrderList },
    { path: ':id', data: { breadcrumb: 'Detalle de la orden' }, component: OrderDetail }
] as Routes;
