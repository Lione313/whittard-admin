import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductType } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-variant-mode-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card !m-0">
            <div class="border-b border-surface-100 dark:border-surface-800 pb-3 mb-4 flex items-center justify-between">
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Atributos y Variantes</span>
                <span class="text-xs text-muted-color">{{ productType() === 'simple' ? 'Sin atributos' : 'Con atributos' }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    type="button"
                    class="rounded-xl border p-4 flex flex-col items-start gap-2 text-left cursor-pointer transition-all hover:border-primary"
                    [ngClass]="productType() === 'simple' ? 'border-primary bg-primary-500/10' : 'border-surface-200 dark:border-surface-700'"
                    (click)="select('simple')"
                >
                    <div class="flex items-center gap-2 w-full">
                        <span class="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                            <i class="pi pi-box text-lg text-primary"></i>
                        </span>
                        <span class="flex-1 font-medium text-surface-900 dark:text-surface-0">Sin atributos</span>
                        @if (productType() === 'simple') {
                            <i class="pi pi-check-circle text-primary"></i>
                        }
                    </div>
                    <span class="text-xs text-muted-color leading-relaxed">Producto simple con una única variante, sin opciones.</span>
                </button>

                <button
                    type="button"
                    class="rounded-xl border p-4 flex flex-col items-start gap-2 text-left cursor-pointer transition-all hover:border-primary"
                    [ngClass]="productType() === 'variable' ? 'border-primary bg-primary-500/10' : 'border-surface-200 dark:border-surface-700'"
                    (click)="select('variable')"
                >
                    <div class="flex items-center gap-2 w-full">
                        <span class="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                            <i class="pi pi-sitemap text-lg text-primary"></i>
                        </span>
                        <span class="flex-1 font-medium text-surface-900 dark:text-surface-0">Con atributos</span>
                        @if (productType() === 'variable') {
                            <i class="pi pi-check-circle text-primary"></i>
                        }
                    </div>
                    <span class="text-xs text-muted-color leading-relaxed">Genera variantes por opciones como talla, color o material.</span>
                </button>
            </div>
        </div>
    `
})
export class VariantModeSelector {
    productType = input.required<ProductType>();

    typeChange = output<ProductType>();

    select(type: ProductType) {
        this.typeChange.emit(type);
    }
}
