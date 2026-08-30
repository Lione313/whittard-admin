import { Component, input, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
    selector: 'app-sales-analytics-widget',
    standalone: true,
    imports: [ChartModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0">Rendimiento de Ventas</h3>
                    <p class="text-xs text-surface-500">Comparativa mensual entre ventas web vs. pedidos por WhatsApp</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="flex items-center gap-1 text-xs font-medium text-surface-600 dark:text-surface-300">
                        <span class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Web
                    </span>
                    <span class="flex items-center gap-1 text-xs font-medium text-surface-600 dark:text-surface-300 ml-3">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> WhatsApp
                    </span>
                </div>
            </div>
            <p-chart type="line" [data]="data" [options]="options" height="300px" />
        </div>
    `
})
export class SalesAnalyticsWidget implements OnInit {
    dateRange = input<Date[] | null>();

    data: any;
    options: any;

    ngOnInit() {
        this.data = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
            datasets: [
                {
                    label: 'Ventas Web',
                    data: [12000, 19000, 15000, 22000, 28000, 25000, 31000, 35000],
                    fill: true,
                    borderColor: '#6366f1',
                    tension: 0.4,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                },
                {
                    label: 'Ventas WhatsApp',
                    data: [8000, 11000, 9000, 14000, 18000, 16000, 20000, 22000],
                    fill: true,
                    borderColor: '#10b981',
                    tension: 0.4,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)'
                }
            ]
        };

        this.options = {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: 'rgba(160, 174, 192, 0.1)' } }
            }
        };
    }
}