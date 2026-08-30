import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-orders-status-widget',
    standalone: true,
    imports: [TagModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-4">Últimos Pedidos</h3>
            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
                    <div>
                        <p class="text-sm font-bold text-surface-900 dark:text-surface-0">#ORD-8921</p>
                        <span class="text-xs text-surface-500">Hace 5 min • S/ 124.00</span>
                    </div>
                    <p-tag severity="warn" value="En Preparación" />
                </div>
                <div class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
                    <div>
                        <p class="text-sm font-bold text-surface-900 dark:text-surface-0">#ORD-8920</p>
                        <span class="text-xs text-surface-500">Hace 22 min • S/ 85.50</span>
                    </div>
                    <p-tag severity="info" value="En Camino" />
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-surface-900 dark:text-surface-0">#ORD-8919</p>
                        <span class="text-xs text-surface-500">Hace 45 min • S/ 210.00</span>
                    </div>
                    <p-tag severity="success" value="Entregado" />
                </div>
            </div>
        </div>
    `
})
export class OrdersStatusWidget {
    dateRange = input<Date[] | null>();
}