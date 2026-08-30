import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';

import { StatsWidget } from './components/statswidget';
import { SalesAnalyticsWidget } from './components/salesanalyticswidget';
import { ChannelsWidget } from './components/channelswidget';
import { TopRecipesWidget } from './components/toprecipeswidget';
import { OrdersStatusWidget } from './components/ordersstatuswidget';

interface DatePreset {
    label: string;
    value: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePickerModule,
        SelectButtonModule,
        ButtonModule,
        StatsWidget,
        SalesAnalyticsWidget,
        ChannelsWidget,
        TopRecipesWidget,
        OrdersStatusWidget
    ],
    template: `
        <div class="grid grid-cols-12 gap-6 p-4">
            
            <!-- Barra Superior: Filtro Global de Fechas -->
            <div class="col-span-12 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight">Panel de Control</h1>
                    <p class="text-xs text-surface-500">Filtrar estadísticas por rango de fechas</p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <!-- Presets Rápidos -->
                    <p-selectButton 
                        [options]="presetOptions" 
                        [(ngModel)]="selectedPreset" 
                        optionLabel="label" 
                        optionValue="value"
                        (onChange)="applyPreset($event.value)" />

                    <!-- PrimeNG DatePicker -->
                    <p-datePicker 
                        [ngModel]="dateRange()" 
                        (ngModelChange)="onDateRangeChange($event)"
                        selectionMode="range" 
                        [readonlyInput]="true"
                        [showIcon]="true"
                        placeholder="Rango de fechas"
                        dateFormat="dd/mm/yy"
                        styleClass="w-64" />

                    <p-button 
                        icon="pi pi-refresh" 
                        [rounded]="true" 
                        [outlined]="true" 
                        severity="secondary" 
                        (onClick)="refreshDashboard()" />
                </div>
            </div>

            <!-- 1. Tarjetas de Métricas Clave -->
            <app-stats-widget [dateRange]="dateRange()" class="col-span-12 grid grid-cols-12 gap-6" />

            <!-- 2. Gráfico Principal de Ventas -->
            <div class="col-span-12 xl:col-span-8">
                <app-sales-analytics-widget [dateRange]="dateRange()" />
            </div>

            <!-- 3. Distribución por Canales -->
            <div class="col-span-12 xl:col-span-4">
                <app-channels-widget [dateRange]="dateRange()" />
            </div>

            <!-- 4. Recetas más vistas -->
            <div class="col-span-12 xl:col-span-6">
                <app-top-recipes-widget [dateRange]="dateRange()" />
            </div>

            <!-- 5. Órdenes filtradas por fecha -->
            <div class="col-span-12 xl:col-span-6">
                <app-orders-status-widget [dateRange]="dateRange()" />
            </div>
        </div>
    `
})
export class Dashboard {
    dateRange = signal<Date[] | null>([
        new Date(new Date().setDate(new Date().getDate() - 7)),
        new Date()
    ]);

    selectedPreset = '7d';

    presetOptions: DatePreset[] = [
        { label: 'Hoy', value: 'today' },
        { label: '7 Días', value: '7d' },
        { label: '30 Días', value: '30d' },
        { label: 'Este Mes', value: 'month' }
    ];

    applyPreset(preset: string) {
        const now = new Date();
        let start = new Date();

        switch (preset) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
            case '7d':
                start.setDate(now.getDate() - 7);
                break;
            case '30d':
                start.setDate(now.getDate() - 30);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        this.dateRange.set([start, new Date()]);
    }

    onDateRangeChange(value: Date[] | null) {
        this.dateRange.set(value);
        if (value && value.length === 2 && value[1]) {
            this.selectedPreset = '';
        }
    }

    refreshDashboard() {
        this.dateRange.set([...(this.dateRange() || [])]);
    }
}