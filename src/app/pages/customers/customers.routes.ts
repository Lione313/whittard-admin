import { Routes } from '@angular/router';
import { CustomerList } from './customer-list';
import { CustomerDetail } from './customer-detail';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Clientes' }, component: CustomerList },
    { path: ':id', data: { breadcrumb: 'Detalle del cliente' }, component: CustomerDetail }
] as Routes;
