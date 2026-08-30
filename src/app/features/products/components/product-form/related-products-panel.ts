import { Component, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-related-products',
    standalone: true,
    imports: [FormsModule, MultiSelectModule],
    template: `
        <div class="card !m-0 flex flex-col gap-5">
            <div>
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Productos relacionados</span>
                <small class="block text-muted-color mt-1">Se guardan junto con el producto.</small>
            </div>

            <div class="flex flex-col gap-4">
                <div>
                    <label class="block font-medium mb-2">Combinables (cross-sell, combos)</label>
                    <p-multiselect
                        [ngModel]="combinableIds()"
                        (ngModelChange)="combinableChange.emit($event)"
                        [options]="options()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Buscar y seleccionar productos"
                        filter
                        emptyMessage="Sin resultados"
                        (onFilter)="searchChange.emit($event.filter ?? '')"
                        class="w-full"
                        [showClear]="true"
                        [maxSelectedLabels]="3"
                        [selectedItemsLabel]="'{0} productos seleccionados'"
                    />
                    <small class="text-muted-color mt-1 block">Productos que se sugieren junto a este (aditamentos, combos).</small>
                </div>

                <div>
                    <label class="block font-medium mb-2">Similares (alternativos)</label>
                    <p-multiselect
                        [ngModel]="similarIds()"
                        (ngModelChange)="similarChange.emit($event)"
                        [options]="options()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Buscar y seleccionar productos"
                        filter
                        emptyMessage="Sin resultados"
                        (onFilter)="searchChange.emit($event.filter ?? '')"
                        class="w-full"
                        [showClear]="true"
                        [maxSelectedLabels]="3"
                        [selectedItemsLabel]="'{0} productos seleccionados'"
                    />
                    <small class="text-muted-color mt-1 block">Productos alternativos o sustitutos.</small>
                </div>
            </div>
        </div>
    `
})
export class RelatedProductsPanel {
    combinableIds = input.required<string[]>();
    similarIds = input.required<string[]>();
    options = input.required<{ label: string; value: string }[]>();

    searchChange = output<string>();
    combinableChange = output<string[] | null>();
    similarChange = output<string[] | null>();
}
