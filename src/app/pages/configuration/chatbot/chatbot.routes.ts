import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./chatbot.page').then((m) => m.ChatbotConfigPage)
    }
] as Routes;
