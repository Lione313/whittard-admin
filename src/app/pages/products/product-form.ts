import { Component, inject, OnDestroy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ProductFormStore } from '@/app/features/products/services/product-form.store';
import { BasicInfoPanel } from '@/app/features/products/components/product-form/basic-info-panel';
import { DescriptionsPanel } from '@/app/features/products/components/product-form/descriptions-panel';
import { ProductSettingsPanel } from '@/app/features/products/components/product-form/product-settings-panel';
import { VariantModeSelector } from '@/app/features/products/components/product-form/variant-mode-selector';
import { AttributesPanel } from '@/app/features/products/components/product-form/attributes-panel';
import { VariantsPanel } from '@/app/features/products/components/product-form/variants-panel';
import { VariantDrawer } from '@/app/features/products/components/product-form/variant-drawer';
import { MediaEditorDialog } from '@/app/features/products/components/product-form/media-editor-dialog';
import { RelatedProductsPanel } from '@/app/features/products/components/product-form/related-products-panel';
import { SeoPanel } from '@/app/shared/components/seo-panel/seo-panel';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ConfirmDialogModule,
        BasicInfoPanel,
        DescriptionsPanel,
        ProductSettingsPanel,
        VariantModeSelector,
        AttributesPanel,
        VariantsPanel,
        VariantDrawer,
        MediaEditorDialog,
        RelatedProductsPanel,
        SeoPanel
    ],
    providers: [ProductFormStore, MessageService],
    template: `
        <div class="flex items-center gap-3 mb-6">
            <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">{{ store.isEdit ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
            <span [class]="store.statusBadgeClass()" class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                <i [class]="store.statusBadgeIcon()"></i>
                {{ store.statusBadgeLabel() }}
            </span>
        </div>

        @if (store.loading()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <span>Cargando producto...</span>
            </div>
        } @else {
            <div class="grid grid-cols-1 xl:grid-cols-[1.5fr_0.5fr] gap-4 items-start">
                <div class="min-w-0 flex flex-col gap-4">
                    <app-product-basic-info [form]="store.form" [validated]="store.validated()" (fieldChange)="store.patchForm($event)" />
                    <app-product-descriptions [form]="store.form" (fieldChange)="store.patchForm($event)" />

                    <app-variant-mode-selector [productType]="store.productType()" (typeChange)="store.onProductTypeChange($event)" />
                    @if (store.productType() === 'variable') {
                        <app-product-attributes-panel [attributes]="store.sortedCatalogAttributes()" [attributeIds]="store.attributeIds()" (toggleAttribute)="store.toggleAttribute($event.id, $event.selected)" />
                    }
                    <app-product-variants-panel
                        [productType]="store.productType()"
                        [variants]="store.variants()"
                        [selectedAttributes]="store.selectedAttributes()"
                        (addVariant)="store.addVariant()"
                        (editVariant)="store.editVariant($event)"
                        (setVariantPrimary)="store.setVariantPrimary($event.variant, $event.checked)"
                        (toggleVariantActive)="store.toggleVariantActive($event.variant, $event.active)"
                        (moveVariant)="store.moveVariant($event.index, $event.dir)"
                        (removeVariant)="store.removeVariant($event)"
                    />
                    <app-seo-panel [value]="store.seo()" (valueChange)="store.onSeoChange($event)" />

                    <app-related-products
                        [combinableIds]="store.combinableIds()"
                        [similarIds]="store.similarIds()"
                        [options]="store.relatedProductOptions()"
                        (searchChange)="store.searchRelatedProducts($event)"
                        (combinableChange)="store.onCombinableChange($event)"
                        (similarChange)="store.onSimilarChange($event)"
                    />
                </div>

                <div class="min-w-0 xl:sticky xl:top-28 flex flex-col gap-3">
                    <app-product-settings
                        [form]="store.form"
                        [validated]="store.validated()"
                        [parentCategoryId]="store.parentCategoryId()"
                        [parentCategoryOptions]="store.parentCategoryOptions()"
                        [subcategoryOptions]="store.subcategoryOptions()"
                        [status]="store.status()"
                        [statusOptions]="store.statusOptions"
                        [taxClassId]="store.taxClassId()"
                        [taxClassOptions]="store.taxClassOptions()"
                        [attributions]="store.attributions()"
                        [attributionIds]="store.attributionIds()"
                        [selectedAttributions]="store.selectedAttributions()"
                        [flavors]="store.flavors()"
                        [flavorIds]="store.flavorIds()"
                        [selectedFlavors]="store.selectedFlavors()"
                        (parentCategoryChange)="store.onParentCategoryChange($event)"
                        (subcategoryChange)="store.onSubcategoryChange($event)"
                        (statusChange)="store.onStatusChange($event)"
                        (taxClassChange)="store.onTaxClassChange($event)"
                        (attributionIdsChange)="store.onAttributionIdsChange($event)"
                        (flavorIdsChange)="store.onFlavorIdsChange($event)"
                    />
                    <div class="flex flex-col gap-2.5 pt-4">
                        <p-button label="Guardar" icon="pi pi-check" [loading]="store.saving()" styleClass="w-full" (onClick)="store.save()" />
                        <p-button label="Volver" severity="secondary" [text]="true" styleClass="w-full border border-surface-300! dark:border-surface-600" (onClick)="store.confirmDiscard()" />
                    </div>
                </div>
            </div>
        }

        <app-product-variant-drawer
            [attr.data-p-scrollblocker-active]="store.variantDrawerVisible() ? 'true' : undefined"
            [visible]="store.variantDrawerVisible()"
            [variant]="store.editingVariant()"
            [isNewVariant]="store.isNewVariant()"
            [formError]="store.variantFormError()"
            [selectedAttributes]="store.selectedAttributes()"
            (visibleChange)="store.onVariantDrawerVisibleChange($event)"
            (save)="store.saveVariantDraft()"
            (onClose)="store.closeVariantDrawer()"
            (hasSaleChange)="store.onHasSaleChange($event)"
            (saleDatesChange)="store.onSaleDatesChange($event)"
            (setVariantAttribute)="store.setVariantAttribute($event.variant, $event.type, $event.value)"
            (addMedia)="store.addMedia($event)"
            (openMediaEditor)="store.openMediaEditor($event.variant, $event.index)"
            (removeMedia)="store.removeMedia($event.variant, $event.index)"
        />

        <app-product-media-editor
            [visible]="store.mediaEditorVisible()"
            [media]="store.mediaEditor()"
            [isNew]="store.mediaEditorIndex() === -1"
            [mediaTypeOptions]="store.mediaTypeOptions"
            [acceptance]="store.GALLERY_ACCEPTANCE"
            (visibleChange)="store.setMediaEditorVisible($event)"
            (onClose)="store.closeMediaEditor()"
            (save)="store.saveMediaEditor()"
            (urlChange)="store.onMediaEditorUrlChange($event)"
            (fileChange)="store.onMediaEditorFileChange($event)"
        />

        <p-confirmdialog />
        <p-toast />
    `
})
export class ProductForm implements OnInit, OnDestroy {
    readonly store = inject(ProductFormStore);
    private route = inject(ActivatedRoute);

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            this.store.init({ id: params.get('id') });
        });
    }

    ngOnDestroy() {
        this.store.destroy();
    }
}
