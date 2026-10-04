import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./recipe-carousel.page').then((m) => m.RecipeCarouselPage)
    }
] as Routes;
