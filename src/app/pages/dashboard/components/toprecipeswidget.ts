import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-top-recipes-widget',
    standalone: true,
    imports: [TagModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0">Recetas Top en Tendencia</h3>
                <i class="pi pi-book text-primary text-xl"></i>
            </div>
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div>
                        <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">Té Helado de Frutos Rojos</p>
                        <span class="text-xs text-surface-500">1.4k vistas esta semana</span>
                    </div>
                    <p-tag severity="success" value="🔥 +32%" />
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div>
                        <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">Matcha Latte Cream</p>
                        <span class="text-xs text-surface-500">980 vistas esta semana</span>
                    </div>
                    <p-tag severity="info" value="+18%" />
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div>
                        <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">Infusión Relajante de Lavanda</p>
                        <span class="text-xs text-surface-500">620 vistas esta semana</span>
                    </div>
                    <p-tag severity="secondary" value="+5%" />
                </div>
            </div>
        </div>
    `
})
export class TopRecipesWidget {
    dateRange = input<Date[] | null>();
}