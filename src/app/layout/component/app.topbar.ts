import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleClassModule } from 'primeng/styleclass';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { AppCalendarWidget } from './app.calendar-widget';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/auth/auth.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, StyleClassModule, PopoverModule, DatePickerModule, TagModule, AppConfigurator, AppCalendarWidget],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img [src]="layoutService.isDarkTheme() ? '/demo/images/whittar-logo.png' : '/demo/images/whittar-logo-dark.png'" alt="Logo" class="h-8 w-auto" />
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        <!-- AGENDA COMERCIAL Y OPERATIVA -->
                        <app-calendar-widget />

                        <!-- Perfil -->
                        <div class="relative">
                            <button type="button" class="layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                                <i class="pi pi-user"></i>
                                <span>{{ authService.user()?.name ?? 'Perfil' }}</span>
                            </button>

                            <div class="hidden absolute right-0 top-full mt-2 w-48 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg z-50 overflow-hidden">
                                <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                    <p class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate">
                                        {{ authService.user()?.name }}
                                    </p>
                                    <p class="text-xs text-surface-500 truncate">
                                        {{ authService.user()?.email }}
                                    </p>
                                </div>

                                <div class="py-1">
                                    <a
                                        routerLink="/settings"
                                        class="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300
                                               hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                                    >
                                        <i class="pi pi-cog text-surface-500"></i>
                                        <span>Configuración</span>
                                    </a>

                                    <button
                                        type="button"
                                        (click)="logout()"
                                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400
                                               hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer transition-colors"
                                    >
                                        <i class="pi pi-sign-out"></i>
                                        <span>Cerrar sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    authService = inject(AuthService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    logout() {
        this.authService.logout();
    }
}