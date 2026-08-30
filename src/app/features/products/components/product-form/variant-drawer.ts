import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { hideBrokenImage } from '@/app/shared/utils/media';
import { useBodyScrollLock } from '@/app/shared/utils/scroll-lock';
import { Attribute, AttributeOptionValue } from '@/app/features/products/models/attribute.model';
import { VariantDraft } from '@/app/features/products/models/product-form.model';
import { VariantStock } from '@/app/features/inventory/models/inventory.model';
import { StockAdjustDialog, StockAdjustContext } from '@/app/shared/components/stock-adjust-dialog/stock-adjust-dialog';
import { StockMovementsDialog } from '@/app/shared/components/stock-movements-dialog/stock-movements-dialog';

@Component({
    selector: 'app-product-variant-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, InputNumberModule, DatePickerModule, CheckboxModule, ToggleSwitchModule, MessageModule, ToastModule, DrawerModule, StockAdjustDialog, StockMovementsDialog],
    providers: [MessageService],
    template: `
        <p-drawer [visible]="visible()" (visibleChange)="visibleChange.emit($event)" [header]="isNewVariant() ? 'Nueva variante' : 'Editar variante'" position="right" [style]="{ width: '480px' }">
            <ng-template #content>
                @if (variant(); as v) {
                    <div class="flex flex-col gap-5">
                        @if (formError()) {
                            <p-message severity="error" [text]="formError() ?? undefined" />
                        }

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Identificación</span>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">SKU *</label>
                                <input pInputText [(ngModel)]="v.sku" class="w-full" placeholder="Ej: WTC-MAT-LAT-100" />
                                <small class="text-muted-color mt-1 block">Código único para identificar esta variante.</small>
                            </div>
                        </section>

                        @if (selectedAttributes().length) {
                            <section>
                                <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                    <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Atributos</span>
                                </div>
                                <div class="flex flex-col gap-3">
                                    @for (ao of selectedAttributes(); track ao) {
                                        <div>
                                            <label class="block font-medium mb-2">{{ ao.label }}</label>
                                            <p-select
                                                [ngModel]="resolvedAttributeValue(ao, v.attributes[ao.type])"
                                                (ngModelChange)="setVariantAttribute.emit({ variant: v, type: ao.type, value: $event })"
                                                [options]="attributeOptions(ao, v.attributes[ao.type])"
                                                optionLabel="value"
                                                optionValue="value"
                                                placeholder="Seleccionar {{ ao.label.toLowerCase() }}"
                                                showClear
                                                emptyMessage="Sin resultados"
                                                class="w-full"
                                            />
                                        </div>
                                    }
                                </div>
                            </section>
                        }

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Precio y stock</span>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div>
                                    <label class="block font-medium mb-2">Precio *</label>
                                    <p-inputnumber [(ngModel)]="v.price" mode="decimal" [minFractionDigits]="2" class="w-full" />
                                </div>
                                @if (v.id) {
                                    <div>
                                        <label class="block font-medium mb-2">Stock</label>
                                        <div class="flex items-center gap-2">
                                            <p-inputnumber [(ngModel)]="v.stock" [min]="0" class="w-full flex-1" [readonly]="true" />
                                            <p-button label="Ajustar stock" icon="pi pi-pencil" severity="secondary" size="small" [outlined]="true" (onClick)="openAdjust(v)" />
                                        </div>
                                    </div>
                                } @else {
                                    <div>
                                        <label class="block font-medium mb-2">Stock inicial</label>
                                        <p-inputnumber [(ngModel)]="v.stock" [min]="0" class="w-full" />
                                        <small class="text-muted-color mt-1 block">Unidades con las que se crea la variante. Luego se ajustan desde Inventario.</small>
                                    </div>
                                }
                            </div>
                        </section>

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Oferta</span>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div class="flex items-center gap-3">
                                    <p-checkbox [binary]="true" [ngModel]="v.has_sale" (ngModelChange)="onHasSaleToggle($event)" inputId="variant-has-sale" />
                                    <label for="variant-has-sale" class="font-medium cursor-pointer">Aplicar precio de oferta</label>
                                </div>

                                @if (v.has_sale) {
                                    <div class="flex flex-col gap-3">
                                        <div>
                                            <label class="block font-medium mb-2">Precio de oferta *</label>
                                            <p-inputnumber [(ngModel)]="v.sale_price" mode="decimal" [minFractionDigits]="2" class="w-full" />
                                        </div>
                                        <div class="grid grid-cols-12 gap-3">
                                            <div class="col-span-6">
                                                <label class="block font-medium mb-2">Inicio *</label>
                                                <p-datepicker [(ngModel)]="v.sale_starts_at_date" (ngModelChange)="onSaleDateChange()" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
                                            </div>
                                            <div class="col-span-6">
                                                <label class="block font-medium mb-2">Fin *</label>
                                                <p-datepicker [(ngModel)]="v.sale_ends_at_date" (ngModelChange)="onSaleDateChange()" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </section>

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Estado</span>
                            </div>
                            <div class="card !p-3 bg-surface-50 dark:bg-surface-900 flex flex-col gap-3">
                                <div class="flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="v.is_primary" inputId="variant-primary-switch" />
                                    <label for="variant-primary-switch" class="font-medium cursor-pointer">
                                        Variante principal
                                        <i class="pi pi-star text-amber-500 ml-1"></i>
                                    </label>
                                </div>
                                <small class="text-muted-color">La variante que el Frontend preselecciona al abrir el producto. Solo una por producto.</small>

                                <div class="flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="v.is_active" inputId="variant-active-switch" />
                                    <label for="variant-active-switch" class="font-medium cursor-pointer">Activa en tienda</label>
                                </div>
                                <small class="text-muted-color">Si está desactivada, la variante no se muestra ni se puede comprar en la tienda.</small>
                            </div>
                        </section>

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Multimedia</span>
                            </div>
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm text-muted-color">{{ v.media.length }} {{ v.media.length === 1 ? 'archivo' : 'archivos' }}</span>
                                <p-button label="Agregar" icon="pi pi-plus" severity="secondary" text (onClick)="addMedia.emit(v)" />
                            </div>
                            <div class="grid grid-cols-3 gap-3">
                                @for (media of v.media; track media; let m = $index) {
                                    <div class="relative aspect-square rounded-xl border border-surface-200 dark:border-surface-600 overflow-hidden bg-surface-50 dark:bg-surface-800 group">
                                        @if (media.previewUrl || media.url) {
                                            @if (media.type === 'video') {
                                                <video [src]="media.previewUrl ?? media.url!" class="w-full h-full object-cover" preload="metadata" muted></video>
                                            } @else {
                                                <img [src]="media.previewUrl ?? media.url!" alt="multimedia" class="w-full h-full object-cover" (error)="hideBrokenImage($event)" />
                                            }
                                        } @else {
                                            <div class="w-full h-full flex flex-col items-center justify-center gap-1 text-surface-300 dark:text-surface-600">
                                                <i [class]="media.type === 'video' ? 'pi pi-video text-2xl' : 'pi pi-image text-2xl'"></i>
                                            </div>
                                        }

                                        @if (media.is_primary) {
                                            <span class="absolute top-1 left-1 bg-primary text-primary-contrast text-xs font-medium px-2 py-0.5 rounded-full"> <i class="pi pi-star mr-1"></i>Principal </span>
                                        }

                                        <div class="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-surface-0/90 dark:bg-surface-900/90 shadow-sm p-0.5">
                                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" [size]="'small'" severity="secondary" title="Editar" (onClick)="openMediaEditor.emit({ variant: v, index: m })" />
                                            <p-button icon="pi pi-times" [rounded]="true" [text]="true" [size]="'small'" severity="danger" title="Quitar" (onClick)="removeMedia.emit({ variant: v, index: m })" />
                                        </div>
                                    </div>
                                }

                                <button
                                    type="button"
                                    class="aspect-square rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 flex flex-col items-center justify-center gap-1 text-surface-400 dark:text-surface-500 hover:text-primary hover:border-primary transition-colors cursor-pointer"
                                    (click)="addMedia.emit(v)"
                                >
                                    <i class="pi pi-plus text-xl"></i>
                                    <span class="text-xs">Agregar</span>
                                </button>
                            </div>
                            <small class="text-muted-color mt-2 block">Haz clic sobre una miniatura para editarla. Solo una puede ser principal.</small>
                        </section>
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="onClose.emit()" />
                    <p-button label="Guardar variante" icon="pi pi-check" (onClick)="save.emit()" />
                </div>
            </ng-template>
        </p-drawer>

        <app-stock-adjust-dialog [visible]="adjustVisible()" [context]="adjustContext()" (visibleChange)="adjustVisible.set($event)" (adjusted)="onStockAdjusted($event)" />

        <app-stock-movements-dialog [visible]="historyVisible()" [context]="historyContext()" (visibleChange)="historyVisible.set($event)" />

        <p-toast />
    `
})
export class VariantDrawer {
    visible = input.required<boolean>();
    variant = input.required<VariantDraft | null>();
    isNewVariant = input.required<boolean>();
    formError = input<string | null>(null);
    selectedAttributes = input.required<Attribute[]>();

    visibleChange = output<boolean>();
    save = output<void>();
    onClose = output<void>();
    hasSaleChange = output<VariantDraft>();
    saleDatesChange = output<VariantDraft>();
    setVariantAttribute = output<{ variant: VariantDraft; type: string; value: string | null }>();
    addMedia = output<VariantDraft>();
    openMediaEditor = output<{ variant: VariantDraft; index: number }>();
    removeMedia = output<{ variant: VariantDraft; index: number }>();

    private messageService = inject(MessageService);

    adjustVisible = signal(false);
    adjustContext = signal<StockAdjustContext | null>(null);

    historyVisible = signal(false);
    historyContext = signal<{ id: string; sku: string; product_name?: string | null } | null>(null);

    constructor() {
        useBodyScrollLock(this.visible);
    }

    hideBrokenImage = hideBrokenImage;

    onHasSaleToggle(value: boolean) {
        const variant = this.variant();

        if (!variant) return;
        variant.has_sale = value;
        this.hasSaleChange.emit(variant);
    }

    onSaleDateChange() {
        const variant = this.variant();

        if (!variant) return;
        this.saleDatesChange.emit(variant);
    }

    reservedQty(variant: VariantDraft): number {
        return variant.reserved_qty ?? 0;
    }

    available(variant: VariantDraft): number {
        if (variant.available !== undefined && variant.available !== null) return variant.available;

        return (variant.stock ?? 0) - this.reservedQty(variant);
    }

    isLow(variant: VariantDraft): boolean {
        if (variant.is_low !== undefined && variant.is_low !== null) return variant.is_low;

        return this.available(variant) <= 0;
    }

    resolvedAttributeValue(ao: Attribute, value: string | undefined): string | undefined {
        if (!value) return value;
        const normalized = value.trim().toLowerCase();
        const match = ao.options.find((o) => o.value.trim().toLowerCase() === normalized);

        return match ? match.value : value;
    }

    attributeOptions(ao: Attribute, value: string | undefined): AttributeOptionValue[] {
        if (!value) return ao.options;
        const options = ao.options;

        if (options.some((o) => o.value === value)) return options;
        const normalized = value.trim().toLowerCase();

        if (options.some((o) => o.value.trim().toLowerCase() === normalized)) return options;

        return [...options, { value }];
    }

    openAdjust(variant: VariantDraft) {
        this.adjustContext.set({
            id: variant.id!,
            sku: variant.sku,
            product_name: null,
            stock: variant.stock ?? 0,
            reserved_qty: this.reservedQty(variant),
            available: this.available(variant)
        });
        this.adjustVisible.set(true);
    }

    onStockAdjusted(data: VariantStock) {
        const variant = this.variant();

        if (variant) {
            variant.stock = data.stock;
            variant.reserved_qty = data.reserved_qty;
            variant.available = data.available;
            variant.is_low = data.is_low;
        }
    }

    openHistory(variant: VariantDraft) {
        this.historyContext.set({
            id: variant.id!,
            sku: variant.sku,
            product_name: null
        });
        this.historyVisible.set(true);
    }
}
