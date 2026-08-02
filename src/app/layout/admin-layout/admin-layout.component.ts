import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <!-- Sidebar temporal o definitivo -->
      <aside class="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-6">Whittard Admin</h2>
        <nav class="space-y-2">
          <a routerLink="/dashboard" class="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Dashboard</a>
          <a routerLink="/customers" class="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Clientes</a>
          <a routerLink="/products" class="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Productos</a>
          <a routerLink="/orders" class="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Órdenes</a>
        </nav>
      </aside>

      <!-- Contenido Principal -->
      <div class="flex-1 flex flex-col">
        <header class="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
          <span class="text-slate-600 dark:text-slate-300 font-medium">Panel de Control</span>
          <!-- Aquí irá el perfil de usuario / botón de salir -->
        </header>

        <main class="p-6 flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {}