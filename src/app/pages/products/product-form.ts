import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';

import { RichTextEditorComponent } from '@/app/shared/components/rich-text-editor/rich-text-editor';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { formatApiError } from '@/app/shared/utils/api-error';
import { GALLERY_ACCEPTANCE, isVideoFile } from '@/app/shared/utils/media';
import { ProductService } from '@/app/features/products/services/product.service';
import { CategoryService } from '@/app/features/products/services/category.service';
import { AttributionService } from '@/app/features/products/services/attribution.service';
import { AttributeService } from '@/app/features/products/services/attribute.service';
import { PendingChangesService } from '@/app/features/products/services/pending-changes.service';
import { ProductStatus } from '@/app/features/products/models/product.model';
import { Category } from '@/app/features/products/models/category.model';
import { Attribution } from '@/app/features/products/models/attribution.model';
import { Attribute, AttributeOptionValue } from '@/app/features/products/models/attribute.model';
import { LoadingSpinnerComponent } from '@/app/shared/components/loading-spinner/loading-spinner';

interface MediaDraft {
    type: 'image' | 'video';
    url: string | null;
    file: File | null;
    is_primary: boolean;
    order: number;
    previewUrl?: string | null;
}

interface VariantDraft {
    uid: string;
    id?: string;
    sku: string;
    price: number | null;
    sale_price: number | null;
    sale_price_starts_at: string | null;
    sale_price_ends_at: string | null;
    has_sale: boolean;
    sale_starts_at_date: Date | null;
    sale_ends_at_date: Date | null;
    stock: number | null;
    is_primary: boolean;
    is_active: boolean;
    attributes: Record<string, string>;
    media: MediaDraft[];
}

function normalizeMediaType(type: string): 'image' | 'video' {
    return type?.toLowerCase() === 'video' ? 'video' : 'image';
}

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        MultiSelectModule,
        CheckboxModule,
        TabsModule,
        TableModule,
        MessageModule,
        ChipModule,
        DrawerModule,
        DialogModule,
        DatePickerModule,
        ToggleSwitchModule,
        ConfirmDialogModule,
        SelectButtonModule,
        RichTextEditorComponent,
        MediaPickerComponent
        // LoadingSpinnerComponent
    ],
    providers: [MessageService],
    template: `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">{{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
                    <span [class]="statusBadgeClass()" class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                        <i [class]="statusBadgeIcon()"></i>
                        {{ statusBadgeLabel() }}
                    </span>
                </div>
            </div>
            <div class="flex gap-2">
                <p-button label="Descartar" icon="pi pi-times" severity="secondary" text (onClick)="confirmDiscard()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
            </div>
        </div>

        @if (isEdit) {
            <div class="flex flex-wrap items-center gap-3 mb-6">
                <span class="font-medium text-surface-900 dark:text-surface-0">Tipo de producto</span>
                <p-selectbutton [options]="productTypeOptions" optionLabel="label" optionValue="value" [ngModel]="productType()" (ngModelChange)="onProductTypeChange($event)" [allowEmpty]="false" />
            </div>
        }

        @if (loading()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <span>Cargando producto...</span>
            </div>
        } @else {
            <p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)">
                <p-tablist>
                    <p-tab value="general">
                        <span class="flex items-center gap-2">
                            <i class="pi pi-info-circle"></i>
                            Información General
                            @if (generalIssues() > 0) {
                                <span class="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">{{ generalIssues() }}</span>
                            }
                        </span>
                    </p-tab>
                    @if (productType() === 'variable') {
                        <p-tab value="attributes">
                            <span class="flex items-center gap-2">
                                <i class="pi pi-tags"></i>
                                Atributos
                                @if (attributeIds().length > 0) {
                                    <span class="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-semibold">{{ attributeIds().length }}</span>
                                }
                            </span>
                        </p-tab>
                    }
                    <p-tab value="variants">
                        <span class="flex items-center gap-2">
                            <i class="pi pi-box"></i>
                            {{ productType() === 'simple' ? 'Variante' : 'Variantes' }}
                            @if (variantsIssues() > 0) {
                                <span class="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold">{{ variantsIssues() }}</span>
                            }
                        </span>
                    </p-tab>
                </p-tablist>

                <p-tabpanels>
                    <p-tabpanel value="general">
                        <div class="flex flex-col gap-4">
                            <div class="card !m-0 !p-0">
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Nombre *</label>
                                        <input pInputText [ngModel]="form.name" (ngModelChange)="setForm('name', $event)" class="w-full" placeholder="Ej: Té Verde Matcha Ceremonial" />
                                        @if (validated() && !form.name.trim()) {
                                            <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>El nombre es obligatorio.</small>
                                        }
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Slug</label>
                                        <input pInputText [ngModel]="form.slug" (ngModelChange)="setForm('slug', $event)" class="w-full" placeholder="Se genera automáticamente si se omite" />
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Código</label>
                                        <input pInputText [ngModel]="form.code" (ngModelChange)="setForm('code', $event)" class="w-full" placeholder="Se genera automáticamente si se omite" />
                                        <small class="text-muted-color mt-1 block">Código único del producto (ej. WTC-2026-MAT-01). Si lo dejas vacío, se genera desde el nombre.</small>
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Marca *</label>
                                        <input pInputText [ngModel]="form.brand" (ngModelChange)="setForm('brand', $event)" class="w-full" placeholder="Ej: Whittard of Chelsea" />
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">País de Origen</label>
                                        <input pInputText [ngModel]="form.country_of_origin" (ngModelChange)="setForm('country_of_origin', $event)" class="w-full" placeholder="Ej: Japón" />
                                    </div>
                                </div>
                            </div>

                            <div class="card !m-0 !p-0">
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Categoría *</label>
                                        <p-select
                                            [ngModel]="parentCategoryId()"
                                            (ngModelChange)="onParentCategoryChange($event)"
                                            [options]="parentCategoryOptions()"
                                            optionLabel="name"
                                            optionValue="id"
                                            placeholder="Seleccionar categoría"
                                            showClear
                                            filter
                                            class="w-full"
                                        />
                                        @if (validated() && !form.category_id) {
                                            <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>Debes seleccionar una categoría.</small>
                                        }
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Subcategoría *</label>
                                        <p-select
                                            [ngModel]="form.category_id"
                                            (ngModelChange)="onSubcategoryChange($event)"
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
                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Estado</label>
                                        <p-select [ngModel]="status()" (ngModelChange)="onStatusChange($event)" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                                        <small class="text-muted-color mt-1 block">Borrador no se muestra en la tienda; Publicado sí.</small>
                                    </div>
                                    <div class="col-span-12 md:col-span-6">
                                        <div class="flex flex-col gap-3">
                                            <div>
                                                <label class="block font-medium mb-2">Sellos</label>
                                                <p-multiselect
                                                    [ngModel]="attributionIds()"
                                                    (ngModelChange)="onAttributionIdsChange($event)"
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
                                            </div>
                                            @if (selectedAttributions().length) {
                                                <div class="flex flex-wrap gap-2">
                                                    @for (a of selectedAttributions(); track a.id) {
                                                        <p-chip [label]="a.name" [image]="a.image_url || undefined" />
                                                    }
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card !m-0 !p-0">
                                <div class="flex flex-col gap-4">
                                    <div>
                                        <label class="block font-medium mb-2">Descripción Corta</label>
                                        <div class="relative">
                                            <textarea
                                                pTextarea
                                                [ngModel]="form.short_description"
                                                (ngModelChange)="setForm('short_description', $event)"
                                                rows="3"
                                                class="w-full"
                                                [maxlength]="160"
                                                placeholder="Resumen breve que se muestra en listados y búsquedas."
                                            ></textarea>
                                            <span class="absolute bottom-2 right-3 text-xs text-muted-color pointer-events-none" [class.text-red-500]="form.short_description.length >= 160" [class.font-medium]="form.short_description.length >= 160"
                                                >{{ form.short_description.length }}/160</span
                                            >
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block font-medium mb-2">Descripción Larga</label>
                                        <app-rich-text-editor [(ngModel)]="form.long_description" (ngModelChange)="markDirty()" [minHeight]="'180px'" [placeholder]="'Descripción larga...'" />
                                    </div>
                                    <div>
                                        <label class="block font-medium mb-2">Ingredientes</label>
                                        <app-rich-text-editor [(ngModel)]="form.ingredients_description" (ngModelChange)="markDirty()" [minHeight]="'180px'" [placeholder]="'Ingredientes...'" />
                                    </div>
                                    <div>
                                        <label class="block font-medium mb-2">Especificaciones</label>
                                        <app-rich-text-editor [(ngModel)]="form.specifications_description" (ngModelChange)="markDirty()" [minHeight]="'180px'" [placeholder]="'Especificaciones...'" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <p-tabpanel value="attributes">
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Atributos · {{ attributeIds().length }} seleccionados</span>

                                @if (sortedCatalogAttributes().length) {
                                    <div class="card !p-0 overflow-hidden">
                                        <div class="flex flex-col">
                                            @for (a of sortedCatalogAttributes(); track a.id; let last = $last) {
                                                <div class="flex items-start gap-3 px-4 py-3" [ngClass]="last ? '' : 'border-b border-surface-100 dark:border-surface-800'">
                                                    <p-checkbox [binary]="true" [ngModel]="isAttributeSelected(a.id)" (ngModelChange)="toggleAttribute(a.id, $event)" [inputId]="'attr-' + a.id" class="mt-1" />
                                                    <label for="attr-{{ a.id }}" class="flex-1 cursor-pointer select-none">
                                                        <span class="block font-medium text-surface-900 dark:text-surface-0">{{ a.label }}</span>
                                                        @if (isAttributeSelected(a.id)) {
                                                            @if (a.options.length) {
                                                                <span class="flex flex-wrap gap-1.5 mt-2">
                                                                    @for (opt of a.options; track opt) {
                                                                        <span
                                                                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200"
                                                                        >
                                                                            @if (opt.image_url) {
                                                                                <img [src]="opt.image_url" alt="" class="w-4 h-4 rounded-full object-cover" />
                                                                            }
                                                                            {{ opt.value }}
                                                                        </span>
                                                                    }
                                                                </span>
                                                            } @else {
                                                                <span class="block mt-1 text-sm text-muted-color">Sin valores en el catálogo.</span>
                                                            }
                                                        } @else {
                                                            <span class="block mt-0.5 text-sm text-muted-color">{{ a.options.length }} {{ a.options.length === 1 ? 'valor' : 'valores' }}</span>
                                                        }
                                                    </label>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                } @else {
                                    <div class="card !p-8 flex flex-col items-center justify-center gap-2 text-center text-muted-color">
                                        <i class="pi pi-tags text-3xl"></i>
                                        <span>Aún no hay atributos en el catálogo.</span>
                                    </div>
                                }
                            </div>
                        </div>
                    </p-tabpanel>

                    <p-tabpanel value="variants">
                        <div class="flex flex-col gap-4">
                            @if (productType() === 'simple') {
                                <p-message severity="info" text="Producto simple: este producto se guarda con una única variante." />
                            }

                            <div class="card !m-0 !p-0">
                                <p-table [value]="variants()" [dataKey]="'uid'" [rowHover]="true" [tableStyle]="{ 'min-width': '72rem' }">
                                    <ng-template #caption>
                                        <div class="flex items-center justify-end">
                                            <p-button label="Agregar variante" icon="pi pi-plus" [disabled]="productType() === 'simple' && variants().length > 0" (onClick)="addVariant()" />
                                        </div>
                                    </ng-template>

                                    <ng-template #header>
                                        <tr>
                                            <th style="min-width: 4.5rem"></th>
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
                                                @if (primaryMedia(variant); as media) {
                                                    <img [src]="media.previewUrl ?? media.url!" alt="" class="w-12 h-12 rounded-lg object-cover border border-surface-200 dark:border-surface-700" (error)="onMediaImgError($event)" />
                                                } @else {
                                                    <div class="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
                                                        <i class="pi pi-image"></i>
                                                    </div>
                                                }
                                            </td>
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
                                                            <span
                                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200"
                                                            >
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
                                                <p-toggleswitch [ngModel]="variant.is_active" (ngModelChange)="toggleVariantActive(variant, $event)" />
                                            </td>
                                            <td>
                                                <div class="flex items-center justify-center gap-1">
                                                    <p-button
                                                        [icon]="variant.is_primary ? 'pi pi-star-fill' : 'pi pi-star'"
                                                        [rounded]="true"
                                                        [text]="true"
                                                        [severity]="variant.is_primary ? 'warn' : 'secondary'"
                                                        title="Marcar como principal"
                                                        (onClick)="setVariantPrimary(variant, !variant.is_primary)"
                                                    />
                                                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar variante" (onClick)="editVariant(variant)" />
                                                    <p-button icon="pi pi-arrow-up" [rounded]="true" [text]="true" severity="secondary" [disabled]="rowIndex === 0" title="Subir" (onClick)="moveVariant(rowIndex, -1)" />
                                                    <p-button icon="pi pi-arrow-down" [rounded]="true" [text]="true" severity="secondary" [disabled]="rowIndex === variants().length - 1" title="Bajar" (onClick)="moveVariant(rowIndex, 1)" />
                                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar variante" (onClick)="removeVariant(rowIndex)" />
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>

                                    <ng-template #emptymessage>
                                        <tr>
                                            <td [attr.colspan]="totalCols()" class="text-center p-10">
                                                <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                                    <i class="pi pi-box text-3xl"></i>
                                                    <span>Aún no hay variantes. Haz clic en "Agregar variante" para crear la primera.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        }

        <p-drawer [visible]="variantDrawerVisible()" (visibleChange)="onVariantDrawerVisibleChange($event)" [header]="isNewVariant() ? 'Nueva variante' : 'Editar variante'" position="right" [style]="{ width: '480px' }" [blockScroll]="true">
            <ng-template #content>
                @if (editingVariant(); as variant) {
                    <div class="flex flex-col gap-5">
                        @if (variantFormError()) {
                            <p-message severity="error" [text]="variantFormError() ?? undefined" />
                        }

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Identificación</span>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">SKU *</label>
                                <input pInputText [(ngModel)]="variant.sku" class="w-full" placeholder="Ej: WTC-MAT-LAT-100" autofocus />
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
                                                [ngModel]="resolvedAttributeValue(ao, variant.attributes[ao.type])"
                                                (ngModelChange)="setVariantAttribute(variant, ao.type, $event)"
                                                [options]="attributeOptions(ao, variant.attributes[ao.type])"
                                                optionLabel="value"
                                                optionValue="value"
                                                placeholder="Seleccionar {{ ao.label.toLowerCase() }}"
                                                showClear
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
                                    <p-inputnumber [(ngModel)]="variant.price" mode="decimal" [minFractionDigits]="2" class="w-full" />
                                </div>
                                <div>
                                    <label class="block font-medium mb-2">Stock</label>
                                    <p-inputnumber [(ngModel)]="variant.stock" [min]="0" class="w-full" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Oferta</span>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div class="flex items-center gap-3">
                                    <p-checkbox [binary]="true" [(ngModel)]="variant.has_sale" inputId="variant-has-sale" (ngModelChange)="onHasSaleChange(variant)" />
                                    <label for="variant-has-sale" class="font-medium cursor-pointer">Aplicar precio de oferta</label>
                                </div>

                                @if (variant.has_sale) {
                                    <div class="flex flex-col gap-3">
                                        <div>
                                            <label class="block font-medium mb-2">Precio de oferta *</label>
                                            <p-inputnumber [(ngModel)]="variant.sale_price" mode="decimal" [minFractionDigits]="2" class="w-full" />
                                        </div>
                                        <div class="grid grid-cols-12 gap-3">
                                            <div class="col-span-6">
                                                <label class="block font-medium mb-2">Inicio *</label>
                                                <p-datepicker [(ngModel)]="variant.sale_starts_at_date" (ngModelChange)="onSaleDatesChange(variant)" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
                                            </div>
                                            <div class="col-span-6">
                                                <label class="block font-medium mb-2">Fin *</label>
                                                <p-datepicker [(ngModel)]="variant.sale_ends_at_date" (ngModelChange)="onSaleDatesChange(variant)" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
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
                                    <p-toggleswitch [(ngModel)]="variant.is_primary" inputId="variant-primary-switch" />
                                    <label for="variant-primary-switch" class="font-medium cursor-pointer">
                                        Variante principal
                                        <i class="pi pi-star text-amber-500 ml-1"></i>
                                    </label>
                                </div>
                                <small class="text-muted-color">La variante que el Frontend preselecciona al abrir el producto. Solo una por producto.</small>

                                <div class="flex items-center gap-3">
                                    <p-toggleswitch [(ngModel)]="variant.is_active" inputId="variant-active-switch" />
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
                                <span class="text-sm text-muted-color">{{ variant.media.length }} {{ variant.media.length === 1 ? 'archivo' : 'archivos' }}</span>
                                <p-button label="Agregar" icon="pi pi-plus" severity="secondary" text (onClick)="addMedia(variant)" />
                            </div>
                            <div class="grid grid-cols-3 gap-3">
                                @for (media of variant.media; track media; let m = $index) {
                                    <div class="relative aspect-square rounded-xl border border-surface-200 dark:border-surface-600 overflow-hidden bg-surface-50 dark:bg-surface-800 group">
                                        @if (media.previewUrl || media.url) {
                                            @if (media.type === 'video') {
                                                <video [src]="media.previewUrl ?? media.url!" class="w-full h-full object-cover" preload="metadata" muted></video>
                                            } @else {
                                                <img [src]="media.previewUrl ?? media.url!" alt="multimedia" class="w-full h-full object-cover" (error)="onMediaImgError($event)" />
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
                                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" [size]="'small'" severity="secondary" title="Editar" (onClick)="openMediaEditor(variant, m)" />
                                            <p-button icon="pi pi-times" [rounded]="true" [text]="true" [size]="'small'" severity="danger" title="Quitar" (onClick)="removeMedia(variant, m)" />
                                        </div>
                                    </div>
                                }

                                <button
                                    type="button"
                                    class="aspect-square rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 flex flex-col items-center justify-center gap-1 text-surface-400 dark:text-surface-500 hover:text-primary hover:border-primary transition-colors cursor-pointer"
                                    (click)="addMedia(variant)"
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
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeVariantDrawer()" />
                    <p-button label="Guardar variante" icon="pi pi-check" (onClick)="saveVariantDraft()" />
                </div>
            </ng-template>
        </p-drawer>

        <p-dialog [visible]="mediaEditorVisible()" (visibleChange)="mediaEditorVisible.set($event)" [header]="mediaEditorIndex() === -1 ? 'Agregar multimedia' : 'Editar multimedia'" [modal]="true" [style]="{ width: '480px' }">
            <ng-template #content>
                @if (mediaEditor(); as media) {
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-3">
                            <div class="flex-1">
                                <label class="block font-medium mb-2">Tipo</label>
                                <p-select [(ngModel)]="media.type" [options]="mediaTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                            </div>
                            <div class="flex-1">
                                <label class="block font-medium mb-2">Principal</label>
                                <p-checkbox [binary]="true" [(ngModel)]="media.is_primary" inputId="media-primary-check" />
                            </div>
                        </div>
                        <app-media-picker
                            [url]="media.url"
                            [file]="media.file"
                            [accept]="GALLERY_ACCEPTANCE.extensions"
                            [maxSize]="GALLERY_ACCEPTANCE.maxBytes"
                            [kind]="media.type === 'video' ? 'video' : 'image'"
                            (urlChange)="onMediaEditorUrlChange($event)"
                            (fileChange)="onMediaEditorFileChange($event)"
                        />
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeMediaEditor()" />
                    <p-button label="Guardar" icon="pi pi-check" (onClick)="saveMediaEditor()" />
                </div>
            </ng-template>
        </p-dialog>

        <div class="sticky bottom-0 z-20  mt-8 px-8 py-4 bg-surface-0/95 dark:bg-surface-950/95 backdrop-blur border-t border-surface-200 dark:border-surface-800 flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm text-muted-color flex items-center gap-2">
                <i class="pi pi-save"></i>
                @if (saving()) {
                    Guardando cambios...
                } @else {
                    Los cambios se guardan al presionar el botón Guardar.
                }
            </span>
            <div class="flex gap-2">
                <p-button label="Descartar" icon="pi pi-times" severity="secondary" text (onClick)="confirmDiscard()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
            </div>
        </div>

        <p-confirmdialog />
        <p-toast />
    `
})
export class ProductForm implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private attributionService = inject(AttributionService);
    private attributeService = inject(AttributeService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private pendingChanges = inject(PendingChangesService);

    isEdit = false;
    id: string | null = null;

    loading = signal(false);
    saving = signal(false);

    status = signal<ProductStatus>('draft');
    activeTab = signal('general');
    validated = signal(false);
    variantFormError = signal<string | null>(null);
    private formVersion = signal(0);

    productType = signal<'simple' | 'variable'>('simple');

    productTypeOptions = [
        { label: 'Producto simple', value: 'simple' },
        { label: 'Producto variable', value: 'variable' }
    ];

    onTabChange(value: string | number | undefined) {
        this.activeTab.set(value == null ? 'general' : String(value));
    }

    form = {
        name: '',
        slug: '',
        code: '',
        brand: '',
        country_of_origin: '',
        parent_category_id: null as string | null,
        category_id: null as string | null,
        short_description: '',
        long_description: '',
        ingredients_description: '',
        specifications_description: ''
    };

    variants = signal<VariantDraft[]>([]);
    catalogAttributes = signal<Attribute[]>([]);
    attributeIds = signal<string[]>([]);
    attributionIds = signal<string[]>([]);

    variantDrawerVisible = signal(false);
    editingVariant = signal<VariantDraft | null>(null);

    mediaEditorVisible = signal(false);
    mediaEditorIndex = signal(-1);
    mediaEditor = signal<MediaDraft | null>(null);
    mediaEditorVariant = signal<VariantDraft | null>(null);

    isNewVariant = computed(() => {
        const draft = this.editingVariant();
        return draft ? !this.variants().some((v) => v.uid === draft.uid) : true;
    });

    categories = signal<Category[]>([]);
    attributions = signal<Attribution[]>([]);

    private uidCounter = 0;

    statusOptions: { label: string; value: ProductStatus }[] = [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
        { label: 'Archivado', value: 'archived' }
    ];

    mediaTypeOptions = [
        { label: 'Imagen', value: 'image' },
        { label: 'Video', value: 'video' }
    ];

    GALLERY_ACCEPTANCE = GALLERY_ACCEPTANCE;

    totalCols = computed(() => 7);

    statusBadgeLabel = computed(() => this.statusOptions.find((o) => o.value === this.status())?.label ?? 'Borrador');

    statusBadgeClass = computed(() => {
        switch (this.status()) {
            case 'published':
                return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300';
            case 'archived':
                return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300';
            default:
                return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
        }
    });

    statusBadgeIcon = computed(() => {
        switch (this.status()) {
            case 'published':
                return 'pi pi-check-circle';
            case 'archived':
                return 'pi pi-archive';
            default:
                return 'pi pi-pencil';
        }
    });

    generalIssues = computed(() => {
        this.formVersion();
        if (!this.validated()) return 0;
        let n = 0;
        if (!this.form.name.trim()) n++;
        if (!this.form.category_id) n++;
        return n;
    });

    variantsIssues = computed(() => {
        this.formVersion();
        if (!this.validated()) return 0;
        const variants = this.variants();
        let n = 0;
        if (variants.length === 0) n++;
        if (variants.filter((v) => v.is_primary).length > 1) n++;
        for (const v of variants) {
            if (!v.sku?.trim()) n++;
            if (v.price === null || v.price === undefined || v.price <= 0) n++;
            if (v.sale_price !== null && v.sale_price !== undefined && v.price !== null && v.price !== undefined && v.sale_price > v.price) n++;
            if (v.has_sale) {
                if (v.sale_price === null || v.sale_price === undefined || v.sale_price <= 0) n++;
                if (!v.sale_price_starts_at || !v.sale_price_ends_at) n++;
                if (v.sale_starts_at_date && v.sale_ends_at_date && v.sale_ends_at_date <= v.sale_starts_at_date) n++;
            }
        }
        return n;
    });

    parentCategoryId = signal<string | null>(null);

    parentCategoryOptions = computed(() =>
        this.categories()
            .filter((c) => !c.parent)
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    subcategoryOptions = computed(() => {
        const parentId = this.parentCategoryId();
        if (!parentId) return [];
        return this.categories()
            .filter((c) => c.parent?.id === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    onParentCategoryChange(parentId: string | null) {
        this.parentCategoryId.set(parentId);
        this.form.parent_category_id = parentId;
        this.form.category_id = null;
        this.markDirty();
    }

    onSubcategoryChange(categoryId: string | null) {
        this.form.category_id = categoryId;
        this.markDirty();
    }

    onStatusChange(value: ProductStatus) {
        this.status.set(value);
        this.markDirty();
    }

    onProductTypeChange(type: 'simple' | 'variable') {
        if (type === this.productType()) return;

        if (type === 'simple') {
            const variantCount = this.variants().length;
            if (variantCount > 1) {
                this.confirmationService.confirm({
                    header: 'Cambiar a producto simple',
                    message: `Este producto tiene ${variantCount} variantes. Al cambiar a producto simple se conservará solo la primera variante y se quitarán los atributos seleccionados. ¿Deseas continuar?`,
                    acceptLabel: 'Cambiar',
                    rejectLabel: 'Cancelar',
                    acceptIcon: 'pi pi-check',
                    rejectIcon: 'pi pi-times',
                    acceptButtonStyleClass: 'p-button-danger',
                    accept: () => {
                        this.variants.set([{ ...this.variants()[0], attributes: {} }]);
                        this.attributeIds.set([]);
                        this.productType.set('simple');
                        this.activeTab.set(this.activeTab() === 'attributes' ? 'variants' : this.activeTab());
                        this.markDirty();
                    }
                });
                return;
            }
            this.variants.set(this.variants().map((v) => ({ ...v, attributes: {} })));
            this.attributeIds.set([]);
        }

        this.productType.set(type);
        if (type === 'simple' && this.activeTab() === 'attributes') {
            this.activeTab.set('variants');
        }
        this.markDirty();
    }

    setForm<K extends keyof typeof this.form>(key: K, value: (typeof this.form)[K]) {
        this.form[key] = value;
        this.markDirty();
    }

    markDirty() {
        this.formVersion.update((n) => n + 1);
        this.pendingChanges.markDirty();
    }

    private syncVariantAttributes() {
        if (this.catalogAttributes().length === 0) return;
        const validTypes = new Set(this.selectedAttributes().map((a) => a.type));
        this.variants.update((vs) =>
            vs.map((v) => {
                const attributes = { ...v.attributes };
                let changed = false;
                for (const key of Object.keys(attributes)) {
                    if (!validTypes.has(key)) {
                        delete attributes[key];
                        changed = true;
                    }
                }
                return changed ? { ...v, attributes } : v;
            })
        );
    }

    selectedAttributes = computed(() => {
        const ids = this.attributeIds();
        return this.catalogAttributes()
            .filter((a) => ids.includes(a.id))
            .map((a) => ({ ...a, options: [...a.options].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)) }));
    });

    selectedAttributions = computed(() => {
        const ids = this.attributionIds();
        return this.attributions().filter((a) => ids.includes(a.id));
    });

    sortedCatalogAttributes = computed(() => [...this.catalogAttributes()].sort((a, b) => a.label.localeCompare(b.label)).map((a) => ({ ...a, options: [...a.options].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)) })));

    isAttributeSelected(id: string): boolean {
        return this.attributeIds().includes(id);
    }

    toggleAttribute(id: string, selected: boolean) {
        this.attributeIds.update((ids) => (selected ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));
        this.syncVariantAttributes();
        this.markDirty();
    }

    onAttributionIdsChange(ids: string[] | null) {
        this.attributionIds.set(Array.isArray(ids) ? ids : []);
        this.markDirty();
    }

    ngOnInit() {
        this.loadCategories();
        this.loadAttributions();
        this.loadCatalogAttributes();

        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.isEdit = true;
                this.id = id;
                this.loadProduct(id);
            }
        });

        this.route.queryParamMap.subscribe((query) => {
            if (this.isEdit) return;
            const type = query.get('type');
            if (type === 'simple' || type === 'variable') {
                this.productType.set(type);
            }
        });
    }

    loadCategories() {
        this.categoryService.list().subscribe({
            next: (res) => this.categories.set(res.data),
            error: () => this.categories.set([])
        });
    }

    loadAttributions() {
        this.attributionService.list().subscribe({
            next: (res) => this.attributions.set(res.data),
            error: () => this.attributions.set([])
        });
    }

    loadCatalogAttributes() {
        this.attributeService.list().subscribe({
            next: (res) => this.catalogAttributes.set(res.data),
            error: () => this.catalogAttributes.set([])
        });
    }

    loadProduct(id: string) {
        this.loading.set(true);
        this.productService.get(id).subscribe({
            next: (res) => {
                const p = res.data;
                this.form = {
                    name: p.name ?? '',
                    slug: p.slug ?? '',
                    code: p.code ?? '',
                    brand: p.brand ?? '',
                    country_of_origin: p.country_of_origin ?? '',
                    parent_category_id: p.category?.parent?.id ?? null,
                    category_id: p.category?.id ?? null,
                    short_description: p.descriptions?.short ?? '',
                    long_description: p.descriptions?.long ?? '',
                    ingredients_description: p.descriptions?.ingredients ?? '',
                    specifications_description: p.descriptions?.specifications ?? ''
                };
                this.status.set(p.status);
                this.productType.set((p.attributes ?? []).length > 0 || (p.variants ?? []).length > 1 ? 'variable' : 'simple');
                this.parentCategoryId.set(p.category?.parent?.id ?? null);
                this.attributionIds.set((p.attributions ?? []).map((a) => a.id));
                this.attributeIds.set((p.attributes ?? []).map((a) => a.id));
                this.variants.set(
                    (p.variants ?? []).map((v) => {
                        const has_sale = v.sale_price != null && v.sale_price !== undefined;
                        return {
                            uid: this.nextUid(),
                            id: v.id,
                            sku: v.sku,
                            price: v.price,
                            sale_price: v.sale_price,
                            sale_price_starts_at: v.sale_price_starts_at ?? null,
                            sale_price_ends_at: v.sale_price_ends_at ?? null,
                            has_sale,
                            sale_starts_at_date: has_sale ? this.parseApiDate(v.sale_price_starts_at) : null,
                            sale_ends_at_date: has_sale ? this.parseApiDate(v.sale_price_ends_at) : null,
                            stock: v.stock,
                            is_primary: v.is_primary ?? false,
                            is_active: v.is_active ?? true,
                            attributes: { ...(v.attributes ?? {}) },
                            media: (v.media ?? []).map((m) => ({ type: normalizeMediaType(m.type), url: m.url, file: null, is_primary: m.is_primary, order: m.order }))
                        };
                    })
                );
                this.syncVariantAttributes();
                this.loading.set(false);
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 });
            }
        });
    }

    private nextUid(): string {
        this.uidCounter++;
        return `v-${Date.now()}-${this.uidCounter}`;
    }

    // Variantes
    addVariant() {
        this.variantFormError.set(null);
        this.editingVariant.set({
            uid: this.nextUid(),
            sku: '',
            price: null,
            sale_price: null,
            sale_price_starts_at: null,
            sale_price_ends_at: null,
            has_sale: false,
            sale_starts_at_date: null,
            sale_ends_at_date: null,
            stock: 0,
            is_primary: this.variants().length === 0,
            is_active: true,
            attributes: {},
            media: []
        });
        this.variantDrawerVisible.set(true);
        this.markDirty();
    }

    editVariant(variant: VariantDraft) {
        this.variantFormError.set(null);
        this.editingVariant.set({
            uid: variant.uid,
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            sale_price: variant.sale_price,
            sale_price_starts_at: variant.sale_price_starts_at ?? null,
            sale_price_ends_at: variant.sale_price_ends_at ?? null,
            has_sale: variant.has_sale,
            sale_starts_at_date: variant.sale_starts_at_date ?? null,
            sale_ends_at_date: variant.sale_ends_at_date ?? null,
            stock: variant.stock,
            is_primary: variant.is_primary,
            is_active: variant.is_active,
            attributes: { ...variant.attributes },
            media: variant.media.map((m) => ({ ...m }))
        });
        this.variantDrawerVisible.set(true);
    }

    setVariantPrimary(variant: VariantDraft, checked: boolean) {
        this.variants.update((vs) => vs.map((v) => (v.uid === variant.uid ? { ...v, is_primary: checked } : checked ? { ...v, is_primary: false } : v)));
        this.markDirty();
    }

    toggleVariantActive(variant: VariantDraft, active: boolean) {
        this.variants.update((vs) => vs.map((v) => (v.uid === variant.uid ? { ...v, is_active: active } : v)));
        this.markDirty();
    }

    onHasSaleChange(variant: VariantDraft) {
        if (!variant.has_sale) {
            variant.sale_price = null;
            variant.sale_price_starts_at = null;
            variant.sale_price_ends_at = null;
            variant.sale_starts_at_date = null;
            variant.sale_ends_at_date = null;
        }
        this.markDirty();
    }

    onSaleDatesChange(variant: VariantDraft) {
        variant.sale_price_starts_at = variant.sale_starts_at_date ? this.formatApiDate(variant.sale_starts_at_date) : null;
        variant.sale_price_ends_at = variant.sale_ends_at_date ? this.formatApiDate(variant.sale_ends_at_date) : null;
    }

    variantAttributeChips(variant: VariantDraft): { type: string; label: string; value: string }[] {
        const attrs = this.selectedAttributes();
        return Object.entries(variant.attributes).map(([type, value]) => {
            const attr = attrs.find((a) => a.type === type);
            return { type, label: attr?.label ?? type, value };
        });
    }

    primaryMedia(variant: VariantDraft): MediaDraft | null {
        return variant.media.find((m) => m.is_primary) ?? variant.media[0] ?? null;
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

    private parseApiDate(value: string | null | undefined): Date | null {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    private formatApiDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }

    salePeriodLabel(variant: VariantDraft): string {
        const end = variant.sale_ends_at_date;
        if (!end) return 'Oferta';
        return `Oferta hasta ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getFullYear()}`;
    }

    saveVariantDraft() {
        const draft = this.editingVariant();
        if (!draft) return;

        this.variantFormError.set(null);

        const fail = (detail: string) => {
            this.variantFormError.set(detail);
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail, life: 4000 });
        };

        if (!draft.sku?.trim()) {
            fail('El SKU de la variante es obligatorio.');
            return;
        }
        if (draft.price === null || draft.price === undefined || draft.price <= 0) {
            fail('El precio de la variante debe ser mayor a cero.');
            return;
        }

        if (draft.has_sale) {
            if (draft.sale_price === null || draft.sale_price === undefined || draft.sale_price <= 0) {
                fail('Debe indicar un precio de oferta mayor a cero.');
                return;
            }
            if (draft.sale_price > draft.price) {
                fail('El precio de oferta no puede ser mayor al precio regular.');
                return;
            }
            if (!draft.sale_starts_at_date) {
                fail('Debe indicar la fecha de inicio del precio de oferta.');
                return;
            }
            if (!draft.sale_ends_at_date) {
                fail('Debe indicar la fecha de fin del precio de oferta.');
                return;
            }
            if (draft.sale_ends_at_date <= draft.sale_starts_at_date) {
                fail('La fecha de fin no puede ser anterior a la fecha de inicio.');
                return;
            }
        } else {
            draft.sale_price = null;
            draft.sale_price_starts_at = null;
            draft.sale_price_ends_at = null;
            draft.sale_starts_at_date = null;
            draft.sale_ends_at_date = null;
        }

        this.onSaleDatesChange(draft);

        this.variants.update((vs) => {
            const index = vs.findIndex((v) => v.uid === draft.uid);
            let next: VariantDraft[];
            if (index === -1) {
                next = [...vs, draft];
            } else {
                const copy = [...vs];
                copy[index] = draft;
                next = copy;
            }
            if (draft.is_primary) {
                next = next.map((v) => (v.uid === draft.uid ? v : { ...v, is_primary: false }));
            }
            return next;
        });
        this.markDirty();
        this.closeVariantDrawer();
    }

    closeVariantDrawer() {
        this.editingVariant.set(null);
        this.variantDrawerVisible.set(false);
    }

    onVariantDrawerVisibleChange(visible: boolean) {
        this.variantDrawerVisible.set(visible);
        if (!visible) {
            this.editingVariant.set(null);
            this.variantFormError.set(null);
        }
    }

    removeVariant(index: number) {
        this.variants.update((vs) => vs.filter((_, i) => i !== index));
        this.markDirty();
    }

    moveVariant(index: number, dir: number) {
        this.variants.update((vs) => {
            const target = index + dir;
            if (target < 0 || target >= vs.length) return vs;
            const copy = [...vs];
            [copy[index], copy[target]] = [copy[target], copy[index]];
            return copy;
        });
        this.markDirty();
    }

    setVariantAttribute(variant: VariantDraft, type: string, value: string | null) {
        if (value) {
            variant.attributes = { ...variant.attributes, [type]: value };
        } else {
            const copy = { ...variant.attributes };
            delete copy[type];
            variant.attributes = copy;
        }
        this.markDirty();
    }

    addMedia(variant: VariantDraft) {
        this.mediaEditorVariant.set(variant);
        this.mediaEditorIndex.set(-1);
        this.mediaEditor.set({ type: 'image', url: null, file: null, is_primary: variant.media.length === 0, order: variant.media.length + 1 });
        this.mediaEditorVisible.set(true);
    }

    openMediaEditor(variant: VariantDraft, index: number) {
        const media = variant.media[index];
        if (!media) return;
        this.mediaEditorVariant.set(variant);
        this.mediaEditorIndex.set(index);
        this.mediaEditor.set({ ...media });
        this.mediaEditorVisible.set(true);
    }

    closeMediaEditor() {
        this.mediaEditorVisible.set(false);
        this.mediaEditor.set(null);
        this.mediaEditorVariant.set(null);
        this.mediaEditorIndex.set(-1);
    }

    saveMediaEditor() {
        const variant = this.mediaEditorVariant();
        const media = this.mediaEditor();
        const index = this.mediaEditorIndex();
        if (!variant || !media) return;

        const next = variant.media.map((m) => ({ ...m, is_primary: false }));

        if (index === -1) {
            this.setMediaPreview(media);
            variant.media = [...next, media];
        } else {
            const existing = variant.media[index];
            if (existing?.previewUrl && existing.previewUrl !== media.previewUrl) URL.revokeObjectURL(existing.previewUrl);
            this.setMediaPreview(media);
            next[index] = media;
            variant.media = next;
        }

        this.closeMediaEditor();
        this.markDirty();
    }

    private setMediaPreview(media: MediaDraft) {
        if (media.file) {
            if (media.previewUrl) URL.revokeObjectURL(media.previewUrl);
            media.previewUrl = URL.createObjectURL(media.file);
        } else {
            media.previewUrl = null;
        }
    }

    removeMedia(variant: VariantDraft, index: number) {
        const removed = variant.media[index];
        if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        variant.media = variant.media.filter((_, i) => i !== index);
        this.markDirty();
    }

    onMediaEditorFileChange(file: File | null) {
        const media = this.mediaEditor();
        if (!media) return;
        media.file = file;
        media.url = null;
        if (file && isVideoFile(file)) media.type = 'video';
        else if (file) media.type = 'image';
        this.setMediaPreview(media);
        this.mediaEditor.set({ ...media });
    }

    onMediaEditorUrlChange(url: string | null) {
        const media = this.mediaEditor();
        if (!media) return;
        media.url = url;
        media.file = null;
        this.setMediaPreview(media);
        this.mediaEditor.set({ ...media });
    }

    onMediaImgError(event: Event) {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    save() {
        if (!this.validate()) return;

        this.saving.set(true);
        const formData = this.buildFormData();

        const action = this.isEdit && this.id ? this.productService.update(this.id, formData) : this.productService.create(formData);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.pendingChanges.clear();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.router.navigate(['/products/list']);
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 6000 });
            }
        });
    }

    private buildFormData(): FormData {
        const form = new FormData();

        form.append('name', this.form.name);
        if (this.form.slug?.trim()) form.append('slug', this.form.slug.trim());
        if (this.form.code?.trim()) form.append('code', this.form.code.trim());
        if (this.form.category_id) form.append('category_id', this.form.category_id);
        form.append('brand', this.form.brand);
        form.append('country_of_origin', this.form.country_of_origin);
        form.append('short_description', this.toNullableHtml(this.form.short_description) ?? '');
        form.append('long_description', this.toNullableHtml(this.form.long_description) ?? '');
        form.append('ingredients_description', this.toNullableHtml(this.form.ingredients_description) ?? '');
        form.append('specifications_description', this.toNullableHtml(this.form.specifications_description) ?? '');
        form.append('status', this.status());

        const attributionIds = this.attributionIds();
        if (attributionIds.length > 0) {
            for (const id of attributionIds) form.append('attribution_ids[]', id);
        } else {
            form.append('attribution_ids[]', '');
        }

        const attributeIds = this.attributeIds();
        if (attributeIds.length > 0) {
            for (const id of attributeIds) form.append('attribute_ids[]', id);
        } else {
            form.append('attribute_ids[]', '');
        }

        this.variants().forEach((v, vi) => {
            if (this.isEdit && v.id) form.append(`variants[${vi}][id]`, v.id);
            form.append(`variants[${vi}][sku]`, v.sku);
            form.append(`variants[${vi}][price]`, String(v.price ?? 0));
            form.append(`variants[${vi}][sale_price]`, v.sale_price !== null && v.sale_price !== undefined ? String(v.sale_price) : '');
            if (v.has_sale && v.sale_price !== null && v.sale_price !== undefined) {
                form.append(`variants[${vi}][sale_price_starts_at]`, v.sale_price_starts_at ?? '');
                form.append(`variants[${vi}][sale_price_ends_at]`, v.sale_price_ends_at ?? '');
            }
            form.append(`variants[${vi}][stock]`, String(v.stock ?? 0));
            form.append(`variants[${vi}][is_primary]`, v.is_primary ? '1' : '0');
            form.append(`variants[${vi}][is_active]`, v.is_active === false ? '0' : '1');
            form.append(`variants[${vi}][order]`, String(vi + 1));
            const variantTypes = new Set(this.selectedAttributes().map((a) => a.type));
            Object.entries(v.attributes).forEach(([key, value]) => {
                if (variantTypes.has(key)) form.append(`variants[${vi}][attributes][${key}]`, value);
            });
            v.media.forEach((m, mi) => {
                if (!m.file && !m.url) return;
                form.append(`variants[${vi}][media][${mi}][type]`, m.type);
                form.append(`variants[${vi}][media][${mi}][is_primary]`, m.is_primary ? '1' : '0');
                form.append(`variants[${vi}][media][${mi}][order]`, String(m.order ?? mi));
                if (m.file) {
                    form.append(`variants[${vi}][media][${mi}][file]`, m.file);
                } else if (m.url) {
                    form.append(`variants[${vi}][media][${mi}][url]`, m.url);
                }
            });
        });

        return form;
    }

    private toNullableHtml(html: string): string | null {
        const source = html ?? '';
        if (!source.trim()) return null;

        const doc = new DOMParser().parseFromString(source, 'text/html');
        const hasContent = (doc.body.textContent ?? '').trim() !== '';

        return hasContent ? source.trim() : null;
    }

    private validate(): boolean {
        this.validated.set(true);

        if (this.generalIssues() > 0) {
            this.activeTab.set('general');
            if (!this.form.name.trim()) {
                this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'El nombre del producto es obligatorio.', life: 4000 });
            } else {
                this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'Debe seleccionar una categoría.', life: 4000 });
            }
            return false;
        }

        if (this.variantsIssues() > 0) {
            this.activeTab.set('variants');
            const variants = this.variants();
            if (variants.length === 0) {
                this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'Debe existir al menos una variante.', life: 4000 });
            } else if (variants.filter((v) => v.is_primary).length > 1) {
                this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'Solo una variante puede marcarse como principal.', life: 4000 });
            } else {
                for (const v of variants) {
                    if (!v.sku?.trim()) {
                        this.messageService.add({ severity: 'error', summary: 'Validación', detail: 'Todas las variantes deben tener un SKU.', life: 4000 });
                        break;
                    }
                    if (v.price === null || v.price === undefined || v.price <= 0) {
                        this.messageService.add({ severity: 'error', summary: 'Validación', detail: `La variante "${v.sku}" debe tener un precio mayor a cero.`, life: 4000 });
                        break;
                    }
                    if (v.sale_price !== null && v.sale_price !== undefined && v.sale_price > v.price) {
                        this.messageService.add({ severity: 'error', summary: 'Validación', detail: `El precio de oferta de "${v.sku}" no puede ser mayor al precio regular.`, life: 4000 });
                        break;
                    }
                    if (v.has_sale) {
                        if (v.sale_price === null || v.sale_price === undefined || v.sale_price <= 0) {
                            this.messageService.add({ severity: 'error', summary: 'Validación', detail: `La variante "${v.sku}" debe indicar un precio de oferta.`, life: 4000 });
                            break;
                        }
                        if (!v.sale_price_starts_at || !v.sale_price_ends_at) {
                            this.messageService.add({ severity: 'error', summary: 'Validación', detail: `La variante "${v.sku}" debe indicar inicio y fin de la promoción.`, life: 4000 });
                            break;
                        }
                        if (v.sale_starts_at_date && v.sale_ends_at_date && v.sale_ends_at_date <= v.sale_starts_at_date) {
                            this.messageService.add({ severity: 'error', summary: 'Validación', detail: `La fecha de fin de la promoción de "${v.sku}" no puede ser anterior a la de inicio.`, life: 4000 });
                            break;
                        }
                    }
                }
            }
            return false;
        }

        return true;
    }

    confirmDiscard() {
        if (!this.pendingChanges.hasChanges()) {
            this.goBack();
            return;
        }
        this.confirmationService.confirm({
            header: 'Descartar cambios',
            message: 'Tienes cambios sin guardar. Si sales de esta página, perderás todo lo que no hayas guardado.',
            acceptLabel: 'Descartar',
            rejectLabel: 'Volver al formulario',
            acceptIcon: 'pi pi-trash',
            rejectIcon: 'pi pi-arrow-left',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.goBack()
        });
    }

    goBack() {
        this.pendingChanges.clear();
        this.router.navigate(['/products/list']);
    }

    ngOnDestroy() {
        for (const v of this.variants()) {
            for (const m of v.media) {
                if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
            }
        }
    }
}
