import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoComplete } from 'primeng/autocomplete';
import type { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/types/autocomplete';

import { NavigationService } from '@/app/features/megamenu/services/navigation.service';
import { CatalogOption, rootCategoryOptions } from '@/app/features/megamenu/utils/catalog';
import { ProductListItem } from '@/app/features/products/models/product.model';
import { ProductService } from '@/app/features/products/services/product.service';
import { RichTextEditorComponent } from '@/app/shared/components/rich-text-editor/rich-text-editor';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { LandingBannerSlide, LandingFinalSection, LandingProductSelection, LandingSectionsState, LANDING_IMAGE_ACCEPTANCE, LANDING_VIDEO_ACCEPTANCE, emptyBannerSlide, emptySectionsState } from '@/app/features/megamenu/models/landing-content.model';

interface LandingOption {
    id: string;
    title: string;
    slug: string;
}

interface ProductSuggestion {
    id: string;
    name: string;
    code: string;
    label: string;
}

@Component({
    selector: 'app-landing-sections-editor',
    standalone: true,
    imports: [FormsModule, AutoComplete, ButtonModule, CheckboxModule, InputTextModule, SelectModule, RichTextEditorComponent, MediaPickerComponent],
    template: `
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <small class="text-muted-color">Define el contenido por secciones en el orden en que se mostrará. Usa las flechas para reordenar.</small>
            </div>

            <!-- 1. Hero Banner -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="block font-semibold text-surface-900 dark:text-surface-0">1 · Hero Banner</span>
                        <small class="text-muted-color block">Diapositivas que se renderizan con el componente Banner (imagen desktop/móvil o video, con enlace opcional).</small>
                    </div>
                    <p-button icon="pi pi-plus" label="Añadir slide" severity="secondary" [text]="true" (onClick)="addBannerSlide()" />
                </div>

                @for (slide of bannerSlides; track $index) {
                    <div class="border-t border-surface-100 dark:border-surface-800 pt-3 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-medium mb-1 text-sm">Tipo</label>
                            <p-select [(ngModel)]="slide.type" (ngModelChange)="emit()" [options]="slideTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                        </div>
                        <div class="flex items-center gap-2">
                            <p-checkbox [binary]="true" [(ngModel)]="slide.is_active" (ngModelChange)="emit()" inputId="banner_active" />
                            <label class="font-medium text-sm" for="banner_active">Activo</label>
                            <p-button class="ml-auto" icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === 0" (onClick)="move(bannerSlides, $index, -1)" />
                            <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === bannerSlides.length - 1" (onClick)="move(bannerSlides, $index, 1)" />
                            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeAt(bannerSlides, $index)" />
                        </div>

                        @if (slide.type === 'video') {
                            <div class="md:col-span-2">
                                <label class="block font-medium mb-1 text-sm">Video * <span class="text-muted-color font-normal">(MP4, WebM o MOV)</span></label>
                                <app-media-picker
                                    [url]="slide.video_url ?? null"
                                    [file]="slide.video_file ?? null"
                                    [kind]="'video'"
                                    [accept]="videoAcceptance.extensions"
                                    [maxSize]="videoAcceptance.maxBytes"
                                    (fileChange)="setSlideFile(slide, 'video_file', $event)"
                                />
                            </div>
                        } @else {
                            <div>
                                <label class="block font-medium mb-1 text-sm">Imagen desktop *</label>
                                <app-media-picker
                                    [url]="slide.desktop_image_url ?? null"
                                    [file]="slide.desktop_image_file ?? null"
                                    [kind]="'image'"
                                    [accept]="imageAcceptance.extensions"
                                    [maxSize]="imageAcceptance.maxBytes"
                                    (fileChange)="setSlideFile(slide, 'desktop_image_file', $event)"
                                />
                            </div>
                            <div>
                                <label class="block font-medium mb-1 text-sm">Imagen móvil <span class="text-muted-color font-normal">(opcional)</span></label>
                                <app-media-picker
                                    [url]="slide.mobile_image_url ?? null"
                                    [file]="slide.mobile_image_file ?? null"
                                    [kind]="'image'"
                                    [accept]="imageAcceptance.extensions"
                                    [maxSize]="imageAcceptance.maxBytes"
                                    (fileChange)="setSlideFile(slide, 'mobile_image_file', $event)"
                                />
                            </div>
                        }

                        <div class="md:col-span-2">
                            <label class="block font-medium mb-1 text-sm">Enlace al hacer clic <span class="text-muted-color font-normal">(opcional)</span></label>
                            <input pInputText [(ngModel)]="slide.link_url" (ngModelChange)="emit()" class="w-full" placeholder="/landing/... o /catalogo/... o https://..." />
                        </div>
                    </div>
                }

                @if (bannerSlides.length === 0) {
                    <p class="text-muted-color m-0 text-sm">Sin slides. Usa “Añadir slide” para crear el primero.</p>
                }
            </div>

            <!-- 2. Categorías destacadas -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="block font-semibold text-surface-900 dark:text-surface-0">2 · Carrusel de categorías</span>
                        <small class="text-muted-color block">Selecciona categorías del catálogo; se muestran como carrusel enlazado al catálogo.</small>
                    </div>
                    <p-button icon="pi pi-plus" label="Añadir" severity="secondary" [text]="true" (onClick)="addCategory()" />
                </div>

                @for (categoryId of categoryIds; track $index) {
                    <div class="border-t border-surface-100 dark:border-surface-800 pt-3 mt-3 flex items-center gap-2 flex-wrap">
                        <p-select
                            [(ngModel)]="categoryIds[$index]"
                            (ngModelChange)="emit()"
                            [options]="categoryOptions()"
                            optionLabel="label"
                            optionValue="id"
                            placeholder="Selecciona una categoría"
                            emptyMessage="Sin resultados"
                            filter
                            appendTo="body"
                            class="w-full md:flex-1"
                        />
                        <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === 0" (onClick)="move(categoryIds, $index, -1)" />
                        <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === categoryIds.length - 1" (onClick)="move(categoryIds, $index, 1)" />
                        <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeAt(categoryIds, $index)" />
                    </div>
                }

                @if (categoryIds.length === 0) {
                    <p class="text-muted-color m-0 text-sm">Sin categorías seleccionadas.</p>
                }
            </div>

            <!-- 3. Productos recomendados -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="block font-semibold text-surface-900 dark:text-surface-0">3 · Productos recomendados</span>
                        <small class="text-muted-color block">Busca productos y agrégalos; la web resuelve su tarjeta automáticamente. Mínimo 3 letras.</small>
                    </div>
                </div>

                <p-autoComplete
                    [(ngModel)]="productSearchValue"
                    [suggestions]="productSuggestions"
                    (completeMethod)="searchProducts($event)"
                    (onSelect)="addProduct($event)"
                    optionLabel="label"
                    placeholder="Buscar por nombre o código..."
                    [minLength]="3"
                    [delay]="400"
                    appendTo="body"
                    styleClass="w-full"
                >
                    <ng-template #item let-item>
                        <div class="flex items-center justify-between gap-3 py-0.5">
                            <span class="font-medium">{{ item.label }}</span>
                            <span class="text-xs text-muted-color font-mono">{{ item.code }}</span>
                        </div>
                    </ng-template>
                </p-autoComplete>

                @for (product of products; track product.id; let i = $index) {
                    <div class="border-t border-surface-100 dark:border-surface-800 pt-3 mt-3 flex items-center gap-2 flex-wrap">
                        <div class="min-w-0 flex-1">
                            <div class="font-medium truncate">{{ product.name }}</div>
                            <div class="text-xs text-muted-color font-mono">{{ product.code }}</div>
                        </div>
                        <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="i === 0" (onClick)="move(products, i, -1)" />
                        <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="i === products.length - 1" (onClick)="move(products, i, 1)" />
                        <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeAt(products, i)" />
                    </div>
                }

                @if (products.length === 0) {
                    <p class="text-muted-color m-0 text-sm mt-2">Sin productos seleccionados.</p>
                }
            </div>

            <!-- 4. Landings destacadas -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="block font-semibold text-surface-900 dark:text-surface-0">4 · Carrusel de landings destacadas</span>
                        <small class="text-muted-color block">Selecciona otras landings publicadas; se muestran con su miniatura y nombre.</small>
                    </div>
                    <p-button icon="pi pi-plus" label="Añadir" severity="secondary" [text]="true" (onClick)="addLanding()" />
                </div>

                @for (landingId of featuredLandingIds; track $index) {
                    <div class="border-t border-surface-100 dark:border-surface-800 pt-3 mt-3 flex items-center gap-2 flex-wrap">
                        <p-select
                            [(ngModel)]="featuredLandingIds[$index]"
                            (ngModelChange)="emit()"
                            [options]="landingOptions()"
                            optionLabel="label"
                            optionValue="id"
                            placeholder="Selecciona una landing"
                            emptyMessage="Sin resultados"
                            filter
                            appendTo="body"
                            class="w-full md:flex-1"
                        />
                        <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === 0" (onClick)="move(featuredLandingIds, $index, -1)" />
                        <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="$index === featuredLandingIds.length - 1" (onClick)="move(featuredLandingIds, $index, 1)" />
                        <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeAt(featuredLandingIds, $index)" />
                    </div>
                }

                @if (featuredLandingIds.length === 0) {
                    <p class="text-muted-color m-0 text-sm">Sin landings destacadas.</p>
                }
            </div>

            <!-- 5. Sección editorial final -->
            <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <span class="block font-semibold text-surface-900 dark:text-surface-0">5 · Sección editorial</span>
                        <small class="text-muted-color block">Sección final con título, imagen opcional y contenido enriquecido.</small>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1 text-sm">Título</label>
                        <input pInputText [(ngModel)]="finalSection.title" (ngModelChange)="emit()" class="w-full" maxlength="150" placeholder="Ej: Nuestro compromiso" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1 text-sm">Imagen <span class="text-muted-color font-normal">(opcional)</span></label>
                        <app-media-picker
                            [url]="finalSection.image_url ?? null"
                            [file]="finalSection.image_file ?? null"
                            [kind]="'image'"
                            [accept]="imageAcceptance.extensions"
                            [maxSize]="imageAcceptance.maxBytes"
                            (fileChange)="setFinalImage($event)"
                        />
                    </div>
                </div>
                <div class="mt-3">
                    <label class="block font-medium mb-1 text-sm">Contenido enriquecido (HTML)</label>
                    <app-rich-text-editor [(ngModel)]="finalSection.content_html" (ngModelChange)="emit()" placeholder="Escribe el contenido de la sección..." [minHeight]="'160px'" />
                </div>
            </div>
        </div>
    `
})
export class LandingSectionsEditor implements OnInit, OnChanges {
    @Input() value: LandingSectionsState | null = null;
    @Output() valueChange = new EventEmitter<LandingSectionsState>();

    private navigationService = inject(NavigationService);
    private productService = inject(ProductService);

    readonly slideTypeOptions: { label: string; value: 'image' | 'video' }[] = [
        { label: 'Imagen', value: 'image' },
        { label: 'Video', value: 'video' }
    ];

    readonly imageAcceptance = LANDING_IMAGE_ACCEPTANCE;
    readonly videoAcceptance = LANDING_VIDEO_ACCEPTANCE;

    bannerSlides: LandingBannerSlide[] = [];
    categoryIds: (string | null)[] = [];
    products: LandingProductSelection[] = [];
    featuredLandingIds: (string | null)[] = [];
    finalSection: LandingFinalSection = {};

    categoryOptionsValue: CatalogOption[] = [];
    landingOptionsValue: LandingOption[] = [];

    productSuggestions: ProductSuggestion[] = [];
    productSearchValue: ProductSuggestion | null = null;
    productLoading = false;

    categoryOptions(): CatalogOption[] {
        const options = [...this.categoryOptionsValue];

        for (const id of this.categoryIds) {
            if (id && !options.some((option) => option.id === id)) {
                options.unshift({ id, name: 'Categoría seleccionada', slug: '', landing_slug: null, label: 'Categoría seleccionada', isRoot: false });
            }
        }

        return options;
    }

    landingOptions(): { id: string; label: string }[] {
        const options = this.landingOptionsValue.map((landing) => ({
            id: landing.id,
            label: `${landing.title} (/${landing.slug})`
        }));

        for (const id of this.featuredLandingIds) {
            if (id && !options.some((option) => option.id === id)) {
                options.unshift({ id, label: 'Landing seleccionada' });
            }
        }

        return options;
    }

    ngOnInit() {
        this.loadCatalog();
        this.loadLandings();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['value']) {
            this.loadValue(this.value);
        }
    }

    addBannerSlide() {
        this.bannerSlides = [...this.bannerSlides, emptyBannerSlide()];
        this.emit();
    }

    setSlideFile(slide: LandingBannerSlide, key: 'desktop_image_file' | 'mobile_image_file' | 'video_file', file: File | null) {
        slide[key] = file;
        this.emit();
    }

    setFinalImage(file: File | null) {
        this.finalSection.image_file = file ?? undefined;
        this.emit();
    }

    addCategory() {
        this.categoryIds = [...this.categoryIds, null];
        this.emit();
    }

    addLanding() {
        this.featuredLandingIds = [...this.featuredLandingIds, null];
        this.emit();
    }

    addProduct(event: AutoCompleteSelectEvent) {
        const suggestion = event.value as ProductSuggestion | undefined;
        const id = suggestion?.id;

        if (!id || this.products.some((product) => product.id === id)) return;

        this.products = [...this.products, { id, name: suggestion.name, code: suggestion.code }];
        this.productSearchValue = null;
        this.productSuggestions = [];
        this.emit();
    }

    searchProducts(event: AutoCompleteCompleteEvent) {
        const query = (event.query ?? '').trim();

        if (query.length < 3) {
            this.productSuggestions = [];

            return;
        }

        this.productLoading = true;

        this.productService.list({ search: query, per_page: 20, status: 'published' }).subscribe({
            next: (res) => {
                this.productSuggestions = this.mapSuggestions(res.data?.items ?? []);
                this.productLoading = false;
            },
            error: () => {
                this.productSuggestions = [];
                this.productLoading = false;
            }
        });
    }

    removeAt<T>(list: T[], index: number) {
        list.splice(index, 1);
        this.emit();
    }

    move<T>(list: T[], index: number, direction: -1 | 1) {
        const target = index + direction;

        if (target < 0 || target >= list.length) return;

        const [item] = list.splice(index, 1);

        list.splice(target, 0, item);
        this.emit();
    }

    emit() {
        this.valueChange.emit(this.snapshot());
    }

    private loadValue(value: LandingSectionsState | null) {
        const state = value ?? emptySectionsState();

        this.bannerSlides = Array.isArray(state.banner) ? state.banner.map((slide) => ({ ...emptyBannerSlide(), ...slide })) : [];

        this.categoryIds = Array.isArray(state.category_ids) ? [...state.category_ids] : [];

        this.products = Array.isArray(state.products) ? state.products.filter((product) => product?.id).map((product) => ({ id: product.id, name: product.name || 'Cargando...', code: product.code || '…' })) : [];
        this.loadProductDetails();

        this.featuredLandingIds = Array.isArray(state.featured_landing_ids) ? [...state.featured_landing_ids] : [];

        this.finalSection = state.final_section ? { ...state.final_section } : {};
    }

    private loadProductDetails() {
        for (const product of this.products) {
            if (!product.id || (product.name && product.name !== 'Cargando...')) continue;

            this.productService.get(product.id).subscribe({
                next: (res) => {
                    const detail = res.data;
                    const target = this.products.find((item) => item.id === product.id);

                    if (!target || !detail) return;

                    target.name = detail.name;
                    target.code = detail.code;
                },
                error: () => {
                    const target = this.products.find((item) => item.id === product.id);

                    if (target) target.name = 'Producto no disponible';
                }
            });
        }
    }

    private snapshot(): LandingSectionsState {
        const banner = this.bannerSlides.map((slide, index) => ({
            ...slide,
            orden: index + 1
        }));

        const categories = this.categoryIds.filter((id): id is string => !!id);
        const landings = this.featuredLandingIds.filter((id): id is string => !!id);
        const finalSection: LandingFinalSection = {};

        if (this.finalSection.title?.trim()) finalSection.title = this.finalSection.title.trim();
        if (this.finalSection.image_url?.trim()) finalSection.image_url = this.finalSection.image_url.trim();
        if (this.finalSection.content_html?.trim()) finalSection.content_html = this.finalSection.content_html;
        if (this.finalSection.image_file) finalSection.image_file = this.finalSection.image_file;

        return {
            banner,
            category_ids: categories,
            products: this.products.filter((product) => !!product.id).map((product) => ({ id: product.id, name: product.name, code: product.code })),
            featured_landing_ids: landings,
            final_section: Object.keys(finalSection).length > 0 ? finalSection : null
        };
    }

    private mapSuggestions(items: ProductListItem[]): ProductSuggestion[] {
        return items.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            label: item.name
        }));
    }

    private loadCatalog() {
        this.navigationService.getCatalog().subscribe({
            next: (res) => {
                this.categoryOptionsValue = rootCategoryOptions(res.data?.categories);
            },
            error: () => {
                this.categoryOptionsValue = [];
            }
        });
    }

    private loadLandings() {
        this.navigationService.getPublishedLandings().subscribe({
            next: (res) => {
                this.landingOptionsValue = Array.isArray(res.data?.landings) ? res.data.landings : [];
            },
            error: () => {
                this.landingOptionsValue = [];
            }
        });
    }
}
