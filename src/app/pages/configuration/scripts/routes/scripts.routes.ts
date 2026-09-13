import { Routes } from '@angular/router';
import { scriptsListResolver } from '@/app/features/configuration/scripts/resolvers/scripts-list.resolver';
import { scriptResolver } from '@/app/features/configuration/scripts/resolvers/script.resolver';

export default [
    {
        path: '',
        loadComponent: () =>
            import('../scripts.page').then((m) => m.ScriptsPage),
        resolve: { result: scriptsListResolver },
    },
    {
        path: 'create',
        loadComponent: () =>
            import('../script-create.page').then((m) => m.ScriptCreatePage),
    },
    {
        path: ':id/edit',
        loadComponent: () =>
            import('../script-edit.page').then((m) => m.ScriptEditPage),
        resolve: { script: scriptResolver },
    },
    { path: '**', redirectTo: '/notfound' },
] as Routes;