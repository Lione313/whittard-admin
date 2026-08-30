import { Component, input, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatItem {
    label: string;
    value: string;
    percentage: string;
    isPositive: boolean;
    subtext: string;
}

@Component({
    selector: 'app-stats-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngFor="let stat of stats()" class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold uppercase tracking-wider text-surface-400">{{ stat.label }}</span>
                    <span 
                        class="text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
                        [ngClass]="stat.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'"
                    >
                        <i [class]="stat.isPositive ? 'pi pi-arrow-up-right text-[10px]' : 'pi pi-arrow-down-right text-[10px]'"></i> 
                        {{ stat.percentage }}
                    </span>
                </div>
                <div class="text-3xl font-black text-surface-900 dark:text-surface-0 mb-1">{{ stat.value }}</div>
                <span class="text-xs text-surface-500">{{ stat.subtext }}</span>
            </div>
        </div>
    `
})
export class StatsWidget {
    // 1. Recibe el filtro de fechas desde dashboard.ts
    dateRange = input<Date[] | null>();

    // 2. Estado de métricas en un Signal
    stats = signal<StatItem[]>([
        { label: 'Ventas Totales', value: 'S/ 48,290', percentage: '+14.2%', isPositive: true, subtext: 'vs periodo anterior' },
        { label: 'Pedidos Procesados', value: '1,248', percentage: '+8.5%', isPositive: true, subtext: 'Ticket promedio: S/ 38.70' },
        { label: 'Tasa de Conversión', value: '3.42%', percentage: '-1.1%', isPositive: false, subtext: '36,410 visitas a la tienda' },
        { label: 'Nuevos Clientes', value: '684', percentage: '+22.4%', isPositive: true, subtext: '42% vienen de WhatsApp' }
    ]);

    constructor() {
        // 3. Reactividad: Se dispara solo cuando cambia el rango de fechas en el DatePicker
        effect(() => {
            const range = this.dateRange();
            if (range && range.length === 2 && range[0] && range[1]) {
                this.loadStatsForRange(range[0], range[1]);
            }
        });
    }

    private loadStatsForRange(startDate: Date, endDate: Date) {
        // Aquí conectas tu servicio HTTP pasando las fechas filtradas
        // p. ej. this.dashboardService.getStats(startDate, endDate).subscribe(...)
    }
}