import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

interface NavRoute {
    label: string;
    icon: string;
    routerLink: string[];
}

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [
        RouterModule, 
        FormsModule, 
        AppFloatingConfigurator, 
        ButtonModule, 
        InputTextModule, 
        IconFieldModule, 
        InputIconModule, 
        TagModule
    ],
    template: `
        <app-floating-configurator />
        <div class="flex items-center justify-center min-h-screen overflow-hidden p-4">
            <div class="flex flex-col items-center justify-center">
                
                <!-- Logo Whittard -->
                <div class="mb-8 shrink-0">
                    <img 
                        src="demo/images/whittar-logo-dark.png" 
                        alt="Whittard Admin Logo" 
                        class="h-16 w-auto block dark:hidden" 
                    />
                    <img 
                        src="demo/images/whittar-logo.png" 
                        alt="Whittard Admin Logo" 
                        class="h-16 w-auto hidden dark:block" 
                    />
                </div>

                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-16 flex flex-col items-center" style="border-radius: 53px">
                        
                        <!-- Header Status -->
                        <div class="flex items-center gap-2 mb-4">
                            <p-tag severity="danger" value="HTTP 404" [rounded]="true" />
                            <p-tag severity="secondary" value="Whittard Admin" [rounded]="true" />
                        </div>

                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-4xl mb-2 text-center">
                            Página no encontrada
                        </h1>
                        <p class="text-surface-600 dark:text-surface-200 mb-6 text-center max-w-md">
                            La ruta solicitada no existe. Escribe el nombre del módulo para ir directamente.
                        </p>

                        <!-- Buscador dinámico de rutas -->
                        <div class="w-full max-w-md mb-6 relative">
                            <p-iconfield iconPosition="left" class="w-full">
                                <p-inputicon class="pi pi-search" />
                                <input 
                                    type="text" 
                                    pInputText 
                                    [(ngModel)]="searchQuery" 
                                    (input)="filterRoutes()"
                                    placeholder="Buscar módulo (ej. Productos, Clientes, Recetas)..." 
                                    class="w-full rounded-xl!" 
                                />
                            </p-iconfield>

                            <!-- Coincidencias en tiempo real -->
                            @if (filteredRoutes.length > 0 && searchQuery.trim()) {
                                <div class="absolute left-0 right-0 top-full mt-2 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg z-50 overflow-hidden">
                                    @for (route of filteredRoutes; track route.label) {
                                        <a 
                                            [routerLink]="route.routerLink" 
                                            class="flex items-center gap-3 p-3 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-0 transition-colors cursor-pointer"
                                        >
                                            <i [class]="route.icon + ' text-primary'"></i>
                                            <span class="text-sm font-medium">{{ route.label }}</span>
                                        </a>
                                    }
                                </div>
                            }
                        </div>

                        <!-- Enlaces útiles principales -->
                        <div class="w-full flex flex-col gap-3 mb-8">
                            <a routerLink="/" class="w-full flex items-center p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                                <span class="flex justify-center items-center border-2 border-primary text-primary rounded-lg shrink-0" style="height: 3rem; width: 3rem">
                                    <i class="pi pi-fw pi-home text-xl"></i>
                                </span>
                                <span class="ml-4 flex flex-col">
                                    <span class="text-surface-900 dark:text-surface-0 font-medium block">Ir al Dashboard</span>
                                    <span class="text-xs text-surface-500 dark:text-surface-400">Regresa a la vista principal del sistema</span>
                                </span>
                            </a>

                            <a routerLink="/orders" class="w-full flex items-center p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                                <span class="flex justify-center items-center border-2 border-primary text-primary rounded-lg shrink-0" style="height: 3rem; width: 3rem">
                                    <i class="pi pi-fw pi-shopping-cart text-xl"></i>
                                </span>
                                <span class="ml-4 flex flex-col">
                                    <span class="text-surface-900 dark:text-surface-0 font-medium block">Gestión de Órdenes</span>
                                    <span class="text-xs text-surface-500 dark:text-surface-400">Revisa los últimos pedidos de la tienda</span>
                                </span>
                            </a>

                            <a routerLink="/products/list" class="w-full flex items-center p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                                <span class="flex justify-center items-center border-2 border-primary text-primary rounded-lg shrink-0" style="height: 3rem; width: 3rem">
                                    <i class="pi pi-fw pi-list text-xl"></i>
                                </span>
                                <span class="ml-4 flex flex-col">
                                    <span class="text-surface-900 dark:text-surface-0 font-medium block">Catálogo de Productos</span>
                                    <span class="text-xs text-surface-500 dark:text-surface-400">Administra inventarios, categorías y atributos</span>
                                </span>
                            </a>
                        </div>

                        <!-- Acciones principales -->
                        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <p-button label="Volver al Inicio" icon="pi pi-arrow-left" routerLink="/" styleClass="w-full sm:w-auto" />
                            <p-button label="Configuración" icon="pi pi-cog" severity="secondary" [outlined]="true" routerLink="/settings/bank-accounts" styleClass="w-full sm:w-auto" />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `
})
export class Notfound {
    searchQuery: string = '';
    filteredRoutes: NavRoute[] = [];

    // Mapeo exacto de las rutas reales de tu AppMenu
    private availableRoutes: NavRoute[] = [
        { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
        { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: ['/customers'] },
        { label: 'Recetas', icon: 'pi pi-fw pi-book', routerLink: ['/recipes'] },
        { label: 'Órdenes', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/orders'] },
        { label: 'Contenido General', icon: 'pi pi-fw pi-file-edit', routerLink: ['/content'] },
        { label: 'Productos', icon: 'pi pi-fw pi-list', routerLink: ['/products/list'] },
        { label: 'Categorías', icon: 'pi pi-fw pi-sitemap', routerLink: ['/products/categories'] },
        { label: 'Atributos', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/products/attributes'] },
        { label: 'Sellos', icon: 'pi pi-fw pi-star', routerLink: ['/products/attributions'] },
        { label: 'Cuentas Bancarias', icon: 'pi pi-fw pi-wallet', routerLink: ['/settings/bank-accounts'] },
        { label: 'WhatsApp', icon: 'pi pi-fw pi-whatsapp', routerLink: ['/settings/whatsapp'] },
        { label: 'Tiendas Físicas', icon: 'pi pi-fw pi-map-marker', routerLink: ['/settings/physical-stores'] },
        { label: 'Zona Delivery', icon: 'pi pi-fw pi-truck', routerLink: ['/settings/shipping-zones'] },
        { label: 'SEO Páginas', icon: 'pi pi-fw pi-search', routerLink: ['/settings/seo-metadata'] },
        { label: 'Scripts', icon: 'pi pi-fw pi-code', routerLink: ['/settings/custom-scripts'] }
    ];

    filterRoutes() {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            this.filteredRoutes = [];
            return;
        }

        this.filteredRoutes = this.availableRoutes.filter(r => 
            r.label.toLowerCase().includes(query)
        );
    }
}