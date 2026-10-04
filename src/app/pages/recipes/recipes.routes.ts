import { Routes } from '@angular/router';
import { RecipeList } from './recipe-list';
import { RecipeForm } from './recipe-form';

export default [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'Recetas' }, component: RecipeList },
    { path: 'new', data: { breadcrumb: 'Nueva receta' }, component: RecipeForm },
    { path: ':id/edit', data: { breadcrumb: 'Editar receta' }, component: RecipeForm }
] as Routes;
