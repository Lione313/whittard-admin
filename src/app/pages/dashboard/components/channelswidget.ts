import { Component, input, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
    selector: 'app-channels-widget',
    standalone: true,
    imports: [ChartModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">Origen de Clientes</h3>
            <p class="text-xs text-surface-500 mb-6">Canales con mayor tasa de conversión</p>
            <p-chart type="doughnut" [data]="data" [options]="options" height="260px" />
        </div>
    `
})
export class ChannelsWidget implements OnInit {
    dateRange = input<Date[] | null>();

    data: any;
    options: any;

    ngOnInit() {
        this.data = {
            labels: ['Búsqueda Orgánica', 'Redes Sociales', 'WhatsApp Directo', 'Campañas / Ads'],
            datasets: [
                {
                    data: [40, 25, 20, 15],
                    backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b']
                }
            ]
        };

        this.options = {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
            }
        };
    }
}