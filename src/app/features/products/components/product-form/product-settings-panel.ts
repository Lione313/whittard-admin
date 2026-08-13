import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ChipModule } from 'primeng/chip';
import { Attribution } from '@/app/features/products/models/attribution.model';
import { Category } from '@/app/features/products/models/category.model';
import { ProductStatus } from '@/app/features/products/models/product.model';
import { ProductFormValue } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-product-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, MultiSelectModule, ChipModule],
    template: `
        <div class="card !m-0 flex flex-col gap-5">
            <div>
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Configuración</span>
            </div>

            <div class="flex flex-col gap-4">
                <div>
                    <label class="block font-medium mb-2">Categoría *</label>
                    <p-select
                        [ngModel]="parentCategoryId()"
                        (ngModelChange)="parentCategoryChange.emit($event)"
                        [options]="parentCategoryOptions()"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Seleccionar categoría"
                        showClear
                        filter
                        class="w-full"
                    />
                    @if (validated() && !form().category_id) {
                        <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>Debes seleccionar una categoría.</small>
                    }
                </div>

                <div>
                    <label class="block font-medium mb-2">Subcategoría *</label>
                    <p-select
                        [ngModel]="form().category_id"
                        (ngModelChange)="subcategoryChange.emit($event)"
                        [options]="subcategoryOptions()"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Seleccionar subcategoría"
                        showClear
                        [disabled]="!parentCategoryId()"
                        class="w-full"
                    />
                    @if (!parentCategoryId()) {
                        <small class="text-muted-color mt-1 block">Primero elige la categoría.</small>
                    }
                </div>

                <div>
                    <label class="block font-medium mb-2">Estado</label>
                    <p-select [ngModel]="status()" (ngModelChange)="statusChange.emit($event)" [options]="statusOptions()" optionLabel="label" optionValue="value" class="w-full" />
                    <small class="text-muted-color mt-1 block">Borrador no se muestra en la tienda; Publicado sí.</small>
                </div>

                <div>
                    <label class="block font-medium mb-2">Sellos</label>
                    <p-multiselect
                        [ngModel]="attributionIds()"
                        (ngModelChange)="attributionIdsChange.emit($event)"
                        [options]="attributions()"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Seleccionar sellos"
                        class="w-full"
                        [showClear]="true"
                        [filter]="true"
                        [maxSelectedLabels]="3"
                        [selectedItemsLabel]="'{0} sellos seleccionados'"
                    />
                    @if (selectedAttributions().length) {
                        <div class="flex flex-wrap gap-2 mt-2">
                            @for (a of selectedAttributions(); track a.id) {
                                <p-chip [label]="a.name" [image]="a.image_url || undefined" />
                            }
                        </div>
                    }
                </div>
            </div>
        </div>
    `
})
export class ProductSettingsPanel {
    form = input.required<ProductFormValue>();
    validated = input.required<boolean>();
    parentCategoryId = input<string | null>(null);
    parentCategoryOptions = input.required<Category[]>();
    subcategoryOptions = input.required<Category[]>();
    status = input.required<ProductStatus>();
    statusOptions = input.required<{ label: string; value: ProductStatus }[]>();
    attributions = input.required<Attribution[]>();
    attributionIds = input.required<string[]>();
    selectedAttributions = input.required<Attribution[]>();

    parentCategoryChange = output<string | null>();
    subcategoryChange = output<string | null>();
    statusChange = output<ProductStatus>();
    attributionIdsChange = output<string[] | null>();
}
