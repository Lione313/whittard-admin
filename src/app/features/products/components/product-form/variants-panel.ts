import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Attribute } from '@/app/features/products/models/attribute.model';
import { ProductType, VariantDraft } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-product-variants-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToggleSwitchModule],
    template: `
        <div class="flex flex-col gap-4">
            <div class="card !m-0 !p-0 overflow-x-auto">
                <p-table [value]="variants()" [dataKey]="'uid'" [rowHover]="true" [tableStyle]="{ 'min-width': '72rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 12rem">SKU *</th>
                            <th style="min-width: 12rem">Atributos</th>
                            <th style="min-width: 8rem">Precio *</th>
                            <th style="min-width: 5rem">Stock</th>
                            <th style="min-width: 6rem">Activa</th>
                            <th style="width: 11rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-variant let-rowIndex="rowIndex">
                        <tr>
                            <td>
                                <span class="font-medium">{{ variant.sku || '—' }}</span>
                                @if (variant.is_primary) {
                                    <span
                                        class="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-1 w-fit"
                                        title="Variante principal"
                                    >
                                        <i class="pi pi-star"></i>Principal
                                    </span>
                                }
                            </td>
                            <td>
                                @if (variantAttributeChips(variant).length) {
                                    <div class="flex flex-wrap gap-1">
                                        @for (chip of variantAttributeChips(variant); track chip.type) {
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200">
                                                <span class="text-muted-color">{{ chip.label }}:</span>
                                                {{ chip.value }}
                                            </span>
                                        }
                                    </div>
                                } @else {
                                    <span class="text-muted-color">—</span>
                                }
                            </td>
                            <td>
                                @if (variant.sale_price !== null && variant.sale_price !== undefined) {
                                    <span class="font-semibold text-primary">{{ variant.sale_price | number: '1.0-2' }}</span>
                                    <span class="block text-muted-color line-through">{{ variant.price | number: '1.0-2' }}</span>
                                    <small class="block text-muted-color">{{ salePeriodLabel(variant) }}</small>
                                } @else {
                                    {{ variant.price !== null ? (variant.price | number: '1.0-2') : '—' }}
                                }
                            </td>
                            <td>{{ variant.stock ?? 0 }}</td>
                            <td class="text-center">
                                <p-toggleswitch [ngModel]="variant.is_active" (ngModelChange)="toggleVariantActive.emit({ variant, active: $event })" />
                            </td>
                            <td>
                                <div class="flex items-center justify-center gap-1">
                                    <p-button
                                        [icon]="variant.is_primary ? 'pi pi-star-fill' : 'pi pi-star'"
                                        [rounded]="true"
                                        [text]="true"
                                        [severity]="variant.is_primary ? 'warn' : 'secondary'"
                                        title="Marcar como principal"
                                        (onClick)="setVariantPrimary.emit({ variant, checked: !variant.is_primary })"
                                    />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar variante" (onClick)="editVariant.emit(variant)" />
                                    <p-button icon="pi pi-arrow-up" [rounded]="true" [text]="true" severity="secondary" [disabled]="rowIndex === 0" title="Subir" (onClick)="moveVariant.emit({ index: rowIndex, dir: -1 })" />
                                    <p-button icon="pi pi-arrow-down" [rounded]="true" [text]="true" severity="secondary" [disabled]="rowIndex === variants().length - 1" title="Bajar" (onClick)="moveVariant.emit({ index: rowIndex, dir: 1 })" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar variante" (onClick)="removeVariant.emit(rowIndex)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="totalCols" class="text-center p-10">
                                <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                    <i class="pi pi-box text-3xl"></i>
                                    <span>Aún no hay variantes. Haz clic en "Agregar variante" para crear la primera.</span>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
                @if (productType() !== 'simple') {
                    <div class="flex items-center justify-center py-3 border-t border-surface-100 dark:border-surface-800">
                        <p-button label="Agregar variante" icon="pi pi-plus" [outlined]="true" severity="secondary" (onClick)="addVariant.emit()" />
                    </div>
                }
            </div>
        </div>
    `
})
export class VariantsPanel {
    productType = input<ProductType | null>(null);
    variants = input.required<VariantDraft[]>();
    selectedAttributes = input.required<Attribute[]>();

    addVariant = output<void>();
    editVariant = output<VariantDraft>();
    setVariantPrimary = output<{ variant: VariantDraft; checked: boolean }>();
    toggleVariantActive = output<{ variant: VariantDraft; active: boolean }>();
    moveVariant = output<{ index: number; dir: number }>();
    removeVariant = output<number>();

    readonly totalCols = 6;

    variantAttributeChips(variant: VariantDraft): { type: string; label: string; value: string }[] {
        const attrs = this.selectedAttributes();
        return Object.entries(variant.attributes).map(([type, value]) => {
            const attr = attrs.find((a) => a.type === type);
            return { type, label: attr?.label ?? type, value };
        });
    }

    salePeriodLabel(variant: VariantDraft): string {
        const end = variant.sale_ends_at_date;
        if (!end) return 'Oferta';
        return `Oferta hasta ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getFullYear()}`;
    }
}
