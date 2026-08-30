import { Routes } from '@angular/router';
import { Login } from './login';

export default [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
] as Routes;
