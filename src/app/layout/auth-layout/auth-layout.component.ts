import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div class="w-full max-w-md p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}