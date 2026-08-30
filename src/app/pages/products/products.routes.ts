import { Routes } from '@angular/router';
import { ProductList } from './product-list';
import { ProductForm } from './product-form';
import { CategoryList } from './category-list';
import { AttributionList } from './attribution-list';
import { AttributeList } from './attribute-list';
import { FlavorList } from './flavor-list';
import { discardChangesGuard } from '@/app/features/products/services/discard-changes.guard';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Productos' }, component: ProductList },
    { path: 'new', data: { breadcrumb: 'Nuevo Producto' }, component: ProductForm, canDeactivate: [discardChangesGuard] },
    { path: 'categories', data: { breadcrumb: 'Categorías' }, component: CategoryList },
    { path: 'attributions', data: { breadcrumb: 'Sellos' }, component: AttributionList },
    { path: 'attributes', data: { breadcrumb: 'Atributos' }, component: AttributeList },
    { path: 'flavors', data: { breadcrumb: 'Sabores' }, component: FlavorList },
    { path: ':id/edit', data: { breadcrumb: 'Editar Producto' }, component: ProductForm },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
