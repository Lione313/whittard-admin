import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { formatApiError } from '@/app/shared/utils/api-error';
import { GALLERY_ACCEPTANCE, isVideoFile } from '@/app/shared/utils/media';
import { Attribute } from '../models/attribute.model';
import { Attribution } from '../models/attribution.model';
import { Category } from '../models/category.model';
import { ProductStatus } from '../models/product.model';
import { emptyFormValue, MediaDraft, ProductFormValue, ProductType, VariantDraft } from '../models/product-form.model';
import { buildProductFormData, formatApiDate, toFormValue, toVariantDraft } from '../utils/product-form.mapper';
import { generalIssues as countGeneralIssues, validateVariantDraft, variantIssues as countVariantIssues } from '../utils/product-form.validator';
import { AttributeService } from './attribute.service';
import { AttributionService } from './attribution.service';
import { CategoryService } from './category.service';
import { PendingChangesService } from './pending-changes.service';
import { ProductService } from './product.service';

export interface ProductFormInit {
    id: string | null;
}

@Injectable()
export class ProductFormStore {
    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private attributionService = inject(AttributionService);
    private attributeService = inject(AttributeService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private pendingChanges = inject(PendingChangesService);
    private router = inject(Router);

    isEdit = false;
    id: string | null = null;

    loading = signal(false);
    saving = signal(false);

    status = signal<ProductStatus>('draft');
    validated = signal(false);
    private formVersion = signal(0);

    productType = signal<ProductType>('simple');

    form: ProductFormValue = emptyFormValue();

    variants = signal<VariantDraft[]>([]);
    catalogAttributes = signal<Attribute[]>([]);
    attributeIds = signal<string[]>([]);
    attributionIds = signal<string[]>([]);

    variantDrawerVisible = signal(false);
    editingVariant = signal<VariantDraft | null>(null);
    variantFormError = signal<string | null>(null);

    mediaEditorVisible = signal(false);
    mediaEditorIndex = signal(-1);
    mediaEditor = signal<MediaDraft | null>(null);
    mediaEditorVariant = signal<VariantDraft | null>(null);

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

    readonly GALLERY_ACCEPTANCE = GALLERY_ACCEPTANCE;

    isNewVariant = computed(() => {
        const draft = this.editingVariant();
        return draft ? !this.variants().some((v) => v.uid === draft.uid) : true;
    });

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
        return countGeneralIssues(this.form);
    });

    variantsIssues = computed(() => {
        this.formVersion();
        if (!this.validated()) return 0;
        return countVariantIssues(this.variants());
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

    init(options: ProductFormInit) {
        this.reset();
        this.isEdit = !!options.id;
        this.id = options.id;
        this.loadReferenceData();
        if (options.id) {
            this.loadProduct(options.id);
        } else {
            this.ensureInitialVariant();
        }
    }

    private reset() {
        this.isEdit = false;
        this.id = null;
        this.loading.set(false);
        this.saving.set(false);
        this.status.set('draft');
        this.validated.set(false);
        this.formVersion.set(0);
        this.productType.set('simple');
        this.form = emptyFormValue();
        this.parentCategoryId.set(null);
        this.attributeIds.set([]);
        this.attributionIds.set([]);
        this.variants.set([]);
        this.variantFormError.set(null);
        this.variantDrawerVisible.set(false);
        this.editingVariant.set(null);
        this.mediaEditorVisible.set(false);
        this.mediaEditorIndex.set(-1);
        this.mediaEditor.set(null);
        this.mediaEditorVariant.set(null);
        this.categories.set([]);
        this.attributions.set([]);
        this.catalogAttributes.set([]);
    }

    patchForm(patch: Partial<ProductFormValue>) {
        Object.assign(this.form, patch);
        this.markDirty();
    }

    markDirty() {
        this.formVersion.update((n) => n + 1);
        this.pendingChanges.markDirty();
    }

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

    onProductTypeChange(type: ProductType) {
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
                        this.markDirty();
                    }
                });
                return;
            }
            this.variants.set(this.variants().map((v) => ({ ...v, attributes: {} })));
            this.attributeIds.set([]);
        }

        this.productType.set(type);
        if (type === 'simple') {
            this.ensureInitialVariant();
        }
        this.markDirty();
    }

    private ensureInitialVariant() {
        if (this.variants().length > 0) return;
        this.variants.set([
            {
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
                is_primary: true,
                is_active: true,
                attributes: {},
                media: []
            }
        ]);
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

    toggleAttribute(id: string, selected: boolean) {
        this.attributeIds.update((ids) => (selected ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)));
        this.syncVariantAttributes();
        this.markDirty();
    }

    onAttributionIdsChange(ids: string[] | null) {
        this.attributionIds.set(Array.isArray(ids) ? ids : []);
        this.markDirty();
    }

    private loadReferenceData() {
        this.loadCategories();
        this.loadAttributions();
        this.loadCatalogAttributes();
    }

    private loadCategories() {
        this.categoryService.list().subscribe({
            next: (res) => this.categories.set(res.data),
            error: () => this.categories.set([])
        });
    }

    private loadAttributions() {
        this.attributionService.list().subscribe({
            next: (res) => this.attributions.set(res.data),
            error: () => this.attributions.set([])
        });
    }

    private loadCatalogAttributes() {
        this.attributeService.list().subscribe({
            next: (res) => this.catalogAttributes.set(res.data),
            error: () => this.catalogAttributes.set([])
        });
    }

    private loadProduct(id: string) {
        this.loading.set(true);
        this.productService.get(id).subscribe({
            next: (res) => {
                const p = res.data;
                this.form = toFormValue(p);
                this.status.set(p.status);
                this.productType.set((p.attributes ?? []).length > 0 || (p.variants ?? []).length > 1 ? 'variable' : 'simple');
                this.parentCategoryId.set(p.category?.parent?.id ?? null);
                this.attributionIds.set((p.attributions ?? []).map((a) => a.id));
                this.attributeIds.set((p.attributes ?? []).map((a) => a.id));
                this.variants.set((p.variants ?? []).map((v) => toVariantDraft(v, () => this.nextUid())));
                this.syncVariantAttributes();
                if (this.productType() === 'simple') {
                    this.ensureInitialVariant();
                }
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
        variant.sale_price_starts_at = variant.sale_starts_at_date ? formatApiDate(variant.sale_starts_at_date) : null;
        variant.sale_price_ends_at = variant.sale_ends_at_date ? formatApiDate(variant.sale_ends_at_date) : null;
    }

    saveVariantDraft() {
        const draft = this.editingVariant();
        if (!draft) return;

        this.variantFormError.set(null);

        const error = validateVariantDraft(draft);
        if (error) {
            this.variantFormError.set(error);
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: error, life: 4000 });
            return;
        }

        if (!draft.has_sale) {
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

    setMediaEditorVisible(visible: boolean) {
        this.mediaEditorVisible.set(visible);
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

    save() {
        if (!this.validate()) return;

        this.saving.set(true);
        const formData = buildProductFormData({
            form: this.form,
            status: this.status(),
            attributionIds: this.attributionIds(),
            attributeIds: this.attributeIds(),
            variants: this.variants(),
            selectedAttributeTypes: new Set(this.selectedAttributes().map((a) => a.type)),
            isEdit: this.isEdit
        });

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

    private validate(): boolean {
        this.validated.set(true);

        if (this.generalIssues() > 0) {
            const detail = !this.form.name.trim() ? 'El nombre del producto es obligatorio.' : 'Debe seleccionar una categoría.';
            this.messageService.add({ severity: 'error', summary: 'Validación', detail, life: 4000 });
            return false;
        }

        if (this.variantsIssues() > 0) {
            const variants = this.variants();
            let detail: string;
            if (variants.length === 0) {
                detail = 'Debe existir al menos una variante.';
            } else if (variants.filter((v) => v.is_primary).length > 1) {
                detail = 'Solo una variante puede marcarse como principal.';
            } else {
                detail = '';
                for (const v of variants) {
                    if (!v.sku?.trim()) {
                        detail = 'Todas las variantes deben tener un SKU.';
                        break;
                    }
                    if (v.price === null || v.price === undefined || v.price <= 0) {
                        detail = `La variante "${v.sku}" debe tener un precio mayor a cero.`;
                        break;
                    }
                    if (v.sale_price !== null && v.sale_price !== undefined && v.price !== null && v.price !== undefined && v.sale_price > v.price) {
                        detail = `El precio de oferta de "${v.sku}" no puede ser mayor al precio regular.`;
                        break;
                    }
                    if (v.has_sale) {
                        if (v.sale_price === null || v.sale_price === undefined || v.sale_price <= 0) {
                            detail = `La variante "${v.sku}" debe indicar un precio de oferta.`;
                            break;
                        }
                        if (!v.sale_price_starts_at || !v.sale_price_ends_at) {
                            detail = `La variante "${v.sku}" debe indicar inicio y fin de la promoción.`;
                            break;
                        }
                        if (v.sale_starts_at_date && v.sale_ends_at_date && v.sale_ends_at_date <= v.sale_starts_at_date) {
                            detail = `La fecha de fin de la promoción de "${v.sku}" no puede ser anterior a la de inicio.`;
                            break;
                        }
                    }
                }
            }
            this.messageService.add({ severity: 'error', summary: 'Validación', detail, life: 4000 });
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

    destroy() {
        for (const v of this.variants()) {
            for (const m of v.media) {
                if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
            }
        }
    }
}
