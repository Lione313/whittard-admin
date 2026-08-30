import { Routes } from '@angular/router';
import { InventoryManagement } from './inventory';
import { InventoryMovements } from './movements';

export default [
    { path: '', data: { breadcrumb: 'Inventario' }, component: InventoryManagement },
    { path: 'movements', data: { breadcrumb: 'Movimientos' }, component: InventoryMovements }
] as Routes;
