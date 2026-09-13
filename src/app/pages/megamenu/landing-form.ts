import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import { LandingService } from '@/app/features/megamenu/services/landing.service';
import { NavigationService } from '@/app/features/megamenu/services/navigation.service';
import { LANDING_STATUS_OPTIONS, Landing, LandingStatus } from '@/app/features/megamenu/models/landing.model';
import { emptySectionsState, LANDING_IMAGE_ACCEPTANCE, LandingBannerSlide, LandingSectionsState } from '@/app/features/megamenu/models/landing-content.model';
import { CatalogOption, rootCategoryOptions } from '@/app/features/megamenu/utils/catalog';
import { SeoData, isSeoEmpty, normalizeSeoData } from '@/app/shared/models/seo.model';
import { SeoPanel } from '@/app/shared/components/seo-panel/seo-panel';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { formatApiError } from '@/app/shared/utils/api-error';
import { ApiError } from '@/app/core/models/api-error.model';
import { LandingSectionsEditor } from './landing-sections-editor';

interface ChosenCategory {
    id: string;
    name: string;
    slug: string;
    landing_slug: string | null;
}

@Component({
    selector: 'app-landing-form',
    standalone: true,
    imports: [DatePipe, FormsModule, ButtonModule, ToastModule, InputTextModule, SelectModule, MessageModule, TagModule, SeoPanel, MediaPickerComponent, LandingSectionsEditor],
    providers: [MessageService],
    template: `
        <div class="flex items-center gap-3 mb-6">
            <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">{{ isEdit() ? 'Editar Landing' : 'Nueva Landing' }}</h1>
            @if (landing()?.status) {
                <p-tag [value]="landing()?.status === 'published' ? 'Publicado' : 'Borrador'" [severity]="landing()?.status === 'published' ? 'success' : 'secondary'" />
            }
        </div>

        @if (loading()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <span>Cargando landing...</span>
            </div>
        } @else {
            <div class="grid grid-cols-1 xl:grid-cols-[1.5fr_0.5fr] gap-4 items-start">
                <div class="min-w-0 flex flex-col gap-4">
                    @if (formError()) {
                        <p-message severity="error" [text]="formError() ?? undefined" />

                        @if (serverMessages().length > 0) {
                            <div class="border border-red-400! bg-red-50! dark:bg-red-950/30 rounded-lg px-4 py-3 text-sm flex flex-col gap-1.5">
                                @for (issue of serverMessages(); track $index) {
                                    <div class="flex items-start gap-2 text-red-600! dark:text-red-300!">
                                        <i class="pi pi-exclamation-circle mt-0.5 text-xs"></i>
                                        <span
                                            ><b>{{ issue.field }}:</b> {{ issue.message }}</span
                                        >
                                    </div>
                                }
                            </div>
                        }
                    }

                    <div class="card !m-0">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Datos generales</span>
                        <small class="block text-muted-color mt-0.5 mb-4">Identificación de la página y su relación con el catálogo.</small>

                        <div class="flex flex-col gap-4">
                            <div>
                                <label class="block font-medium mb-2">Título *</label>
                                <input pInputText [ngModel]="title()" (ngModelChange)="title.set($event ?? ''); fieldErrors.set({})" class="w-full" placeholder="Ej: Recetas con té" />
                                @if (fieldErrors()['title']) {
                                    <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>{{ fieldErrors()['title'] }}</small>
                                }
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Slug</label>
                                <input pInputText [ngModel]="slug()" (ngModelChange)="slug.set(($event ?? '').trim())" class="w-full" placeholder="Se genera desde el título o la categoría si se omite" />
                                <small class="text-muted-color mt-1 block">Sin espacios. Ej: recetas-con-te</small>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Categoría principal *</label>
                                <p-select
                                    [ngModel]="chosenCategory()?.id ?? null"
                                    (ngModelChange)="onCategoryChange($event)"
                                    [options]="selectableCategories()"
                                    optionLabel="label"
                                    optionValue="id"
                                    placeholder="Selecciona una categoría principal"
                                    emptyMessage="Sin resultados"
                                    filter
                                    appendTo="body"
                                    class="w-full"
                                />
                                <small class="text-muted-color mt-1 block">La landing siempre pertenece a una categoría principal (raíz) del catálogo. Las subcategorías no pueden tener landing y cada categoría admite una sola.</small>
                                @if (categoryConflict()) {
                                    <p-message severity="warn" text="Esta categoría ya tiene una landing configurada. Elige otra categoría o edita la landing existente." styleClass="mt-2 w-full block" />
                                }
                                @if (fieldErrors()['category']) {
                                    <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>{{ fieldErrors()['category'] }}</small>
                                }
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Miniatura</label>
                                <app-media-picker [url]="thumbnailUrl()" [file]="thumbnailFile()" [kind]="'image'" [accept]="imageAcceptance.extensions" [maxSize]="imageAcceptance.maxBytes" (fileChange)="thumbnailFile.set($event)" />
                                <small class="text-muted-color mt-1 block">Se usa en el carrusel “Landings destacadas” de la web.</small>
                            </div>
                        </div>
                    </div>

                    <div class="card !m-0">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Contenido</span>
                        <small class="block text-muted-color mt-0.5 mb-4">Configura las 5 secciones de la landing en el orden en que se mostrarán.</small>

                        <app-landing-sections-editor [value]="loadedSections()" (valueChange)="onSectionsChanged($event)" />
                        @if (fieldErrors()['content']) {
                            <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>{{ fieldErrors()['content'] }}</small>
                        }
                    </div>

                    <app-seo-panel [value]="seo()" (valueChange)="seo.set($event)" />
                </div>

                <div class="min-w-0 xl:sticky xl:top-28 flex flex-col gap-3">
                    <div class="card !m-0">
                        <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Publicación</span>
                        <div class="flex flex-col gap-4 mt-3">
                            <div>
                                <label class="block font-medium mb-2">Estado</label>
                                <p-select [(ngModel)]="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                            </div>
                            @if (landing()?.published_at) {
                                <div class="text-sm text-muted-color flex items-center gap-2">
                                    <i class="pi pi-calendar text-xs"></i>
                                    <span>Publicada el {{ landing()?.published_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                                </div>
                            }
                            <small class="text-muted-color block">Al guardar como "Publicado" el backend fija <span class="font-mono text-xs">published_at</span>.</small>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2.5 pt-1">
                        <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" styleClass="w-full" (onClick)="save()" />
                        <p-button label="Volver" severity="secondary" [text]="true" styleClass="w-full border border-surface-300! dark:border-surface-600" (onClick)="cancel()" />
                    </div>
                </div>
            </div>
        }

        <p-toast />
    `
})
export class LandingForm implements OnInit {
    private landingService = inject(LandingService);
    private navigationService = inject(NavigationService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly statusOptions = LANDING_STATUS_OPTIONS;
    readonly imageAcceptance = LANDING_IMAGE_ACCEPTANCE;

    loading = signal(false);
    saving = signal(false);
    isEdit = signal(false);
    formError = signal<string | null>(null);
    fieldErrors = signal<Record<string, string>>({});
    serverMessages = signal<{ field: string; message: string }[]>([]);

    landing = signal<Landing | null>(null);
    title = signal('');
    slug = signal('');
    thumbnailUrl = signal<string | null>(null);
    thumbnailFile = signal<File | null>(null);
    status: LandingStatus = 'draft';
    chosenCategory = signal<ChosenCategory | null>(null);
    seo = signal<SeoData | null>(null);

    loadedSections = signal<LandingSectionsState | null>(null);
    sections = signal<LandingSectionsState | null>(null);

    categories = signal<CatalogOption[]>([]);

    selectableCategories = computed(() => {
        const options = [...this.categories()];
        const chosen = this.chosenCategory();

        if (chosen && !options.some((option) => option.id === chosen.id)) {
            options.unshift({ id: chosen.id, name: chosen.name, slug: chosen.slug, landing_slug: chosen.landing_slug, label: chosen.name, isRoot: true });
        }

        return options;
    });

    categoryConflict = computed(() => {
        const chosen = this.chosenCategory();

        return !!chosen && !!chosen.landing_slug;
    });

    private landingId: string | null = null;

    ngOnInit() {
        this.landingId = this.route.snapshot.paramMap.get('id');
        this.isEdit.set(!!this.landingId);

        this.loadCategories();

        const empty = emptySectionsState();

        this.loadedSections.set(empty);
        this.sections.set(empty);

        if (this.landingId) {
            this.loadLanding(this.landingId);
        } else {
            this.status = 'draft';
        }
    }

    onCategoryChange(id: string | null | undefined) {
        this.fieldErrors.set({});

        if (!id) {
            this.chosenCategory.set(null);

            return;
        }

        const option = this.selectableCategories().find((c) => c.id === id);

        this.chosenCategory.set(option ? { id: option.id, name: option.name, slug: option.slug, landing_slug: option.landing_slug } : null);
    }

    onSectionsChanged(state: LandingSectionsState) {
        this.sections.set(state);
        this.fieldErrors.set({});
    }

    save() {
        this.formError.set(null);
        this.serverMessages.set([]);

        if (!this.title().trim()) {
            this.fieldErrors.set({ title: 'El título es obligatorio.' });

            return;
        }

        const category = this.chosenCategory();

        if (!category) {
            this.fieldErrors.set({ category: 'La landing siempre debe asociarse a una categoría principal.' });

            return;
        }

        const state = this.sections() ?? this.loadedSections() ?? emptySectionsState();
        const form = this.buildForm(state, category.id);

        this.saving.set(true);
        this.formError.set(null);
        this.fieldErrors.set({});
        this.serverMessages.set([]);

        const action = this.landingId ? this.landingService.update(this.landingId, form) : this.landingService.create(form);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);

                const landing = res.data;

                if (!this.landingId) {
                    this.messageService.add({ severity: 'success', summary: 'Landing creada', detail: res.message, life: 3000 });
                    void this.router.navigate(['/megamenu/landings']);

                    return;
                }

                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.applyLanding(landing);
            },
            error: (err) => {
                this.saving.set(false);

                if (err instanceof ApiError && err.errors) {
                    this.handleValidationErrors(err.errors);

                    return;
                }

                this.formError.set(formatApiError(err));
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    cancel() {
        void this.router.navigate(['/megamenu/landings']);
    }

    private buildForm(state: LandingSectionsState, categoryId: string): FormData {
        const form = new FormData();

        form.append('title', this.title().trim());
        form.append('category_id', categoryId);
        form.append('status', this.status);
        // Indica al backend que esta petición reemplaza TODO el contenido:
        // si una sección no viaja, se guarda vacía.
        form.append('sections_mode', 'replace');

        const slugValue = this.slug().trim();

        if (slugValue) form.append('slug', slugValue);

        const thumbnailFile = this.thumbnailFile();

        if (thumbnailFile) {
            form.append('thumbnail', thumbnailFile);
        } else {
            form.append('thumbnail_url', this.thumbnailUrl()?.trim() || '');
        }

        let slideIndex = 0;

        for (const slide of state.banner) {
            if (!slideHasMedia(slide)) continue;

            form.append(`banner[${slideIndex}][type]`, slide.type);
            form.append(`banner[${slideIndex}][is_active]`, slide.is_active ? '1' : '0');
            form.append(`banner[${slideIndex}][orden]`, String(slideIndex + 1));

            if (slide.link_url?.trim()) form.append(`banner[${slideIndex}][link_url]`, slide.link_url.trim());

            if (slide.type === 'video') {
                if (slide.video_file) {
                    form.append(`banner[${slideIndex}][video_file]`, slide.video_file, slide.video_file.name);
                } else if (slide.video_url) {
                    form.append(`banner[${slideIndex}][video_url]`, slide.video_url);
                }
            } else {
                if (slide.desktop_image_file) {
                    form.append(`banner[${slideIndex}][desktop_image_file]`, slide.desktop_image_file, slide.desktop_image_file.name);
                } else if (slide.desktop_image_url) {
                    form.append(`banner[${slideIndex}][desktop_image_url]`, slide.desktop_image_url);
                }

                if (slide.mobile_image_file) {
                    form.append(`banner[${slideIndex}][mobile_image_file]`, slide.mobile_image_file, slide.mobile_image_file.name);
                } else if (slide.mobile_image_url) {
                    form.append(`banner[${slideIndex}][mobile_image_url]`, slide.mobile_image_url);
                }
            }

            slideIndex++;
        }

        appendIds(form, 'category_ids', state.category_ids);
        appendIds(
            form,
            'recommended_product_ids',
            state.products.map((product) => product.id)
        );
        appendIds(form, 'featured_landing_ids', state.featured_landing_ids);

        const finalSection = state.final_section;

        if (finalSection && (finalSection.title?.trim() || finalSection.image_url?.trim() || finalSection.content_html?.trim() || finalSection.image_file)) {
            if (finalSection.title?.trim()) form.append('final_section[title]', finalSection.title.trim());

            if (finalSection.image_file) {
                form.append('final_section[image]', finalSection.image_file, finalSection.image_file.name);
            } else if (finalSection.image_url?.trim()) {
                form.append('final_section[image_url]', finalSection.image_url.trim());
            }

            if (finalSection.content_html?.trim()) form.append('final_section[content_html]', finalSection.content_html);
        }

        const seoValue = this.seo();

        if (seoValue && !isSeoEmpty(seoValue)) {
            form.append('seo[meta_title]', seoValue.meta_title ?? '');
            form.append('seo[meta_description]', seoValue.meta_description ?? '');
            form.append('seo[canonical_url]', seoValue.canonical_url ?? '');
            form.append('seo[robots]', seoValue.robots ?? '');
            form.append('seo[og_title]', seoValue.og_title ?? '');
            form.append('seo[og_description]', seoValue.og_description ?? '');
            form.append('seo[og_image]', seoValue.og_image ?? '');
            form.append('seo[noindex]', seoValue.noindex ? '1' : '0');

            const keywords = Array.isArray(seoValue.keywords) ? seoValue.keywords.filter(Boolean) : [];

            if (keywords.length > 0) {
                for (const keyword of keywords) form.append('seo[keywords][]', keyword);
            } else {
                form.append('seo[keywords][]', '');
            }
        }

        return form;
    }

    private loadLanding(id: string) {
        this.loading.set(true);

        this.landingService.get(id).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.applyLanding(res.data);
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    private applyLanding(landing: Landing) {
        this.landing.set(landing);
        this.title.set(landing.title);
        this.slug.set(landing.slug);
        this.thumbnailUrl.set(landing.thumbnail_url ?? null);
        this.thumbnailFile.set(null);
        this.status = landing.status;
        this.landingId = landing.id;

        if (landing.category) {
            this.chosenCategory.set({ id: landing.category.id, name: landing.category.name, slug: landing.category.slug, landing_slug: null });
        } else {
            this.chosenCategory.set(null);
        }

        const seoValue = normalizeSeoData(landing.seo);

        this.seo.set(seoValue && !isSeoEmpty(seoValue) ? seoValue : null);

        const state: LandingSectionsState = {
            banner: landing.banner ?? [],
            category_ids: landing.category_ids ?? [],
            products: (landing.recommended_product_ids ?? []).map((id) => ({ id, name: 'Cargando...', code: '…' })),
            featured_landing_ids: landing.featured_landing_ids ?? [],
            final_section: landing.final_section ?? null
        };

        this.loadedSections.set(state);
        this.sections.set(state);
        this.formError.set(null);
        this.fieldErrors.set({});
    }

    private loadCategories() {
        this.navigationService.getCatalog().subscribe({
            next: (res) => this.categories.set(rootCategoryOptions(res.data?.categories)),
            error: () => this.categories.set([])
        });
    }

    private handleValidationErrors(errors: Record<string, string[]>) {
        const map: Record<string, string> = {};
        const issues: { field: string; message: string }[] = [];

        for (const key of Object.keys(errors)) {
            const field = key.split('.')[0];
            const message = errors[key].join(' · ');
            const label = landingFieldLabel(field);

            issues.push({ field: label, message });

            if (field === 'category_id' || field === 'category_slug') {
                map['category'] = map['category'] ? `${map['category']} · ${message}` : message;
            } else {
                map[field] = message;
            }
        }

        this.serverMessages.set(issues);

        if (Object.keys(map).length === 0) {
            this.formError.set('No se pudo guardar la landing.');
        } else {
            this.fieldErrors.set(map);
            this.formError.set('No se pudo guardar la landing. Corrige los campos marcados.');
        }
    }
}

function slideHasMedia(slide: LandingBannerSlide): boolean {
    if (slide.type === 'video') return Boolean(slide.video_file || slide.video_url);

    return Boolean(slide.desktop_image_file || slide.desktop_image_url);
}

function landingFieldLabel(field: string): string {
    switch (field) {
        case 'title':
            return 'Título';
        case 'slug':
            return 'Slug';
        case 'category_id':
        case 'category_slug':
            return 'Categoría principal';
        case 'thumbnail':
        case 'thumbnail_url':
            return 'Miniatura';
        case 'banner':
            return 'Hero Banner (sección 1)';
        case 'category_ids':
            return 'Carrusel de categorías (sección 2)';
        case 'recommended_product_ids':
            return 'Productos recomendados (sección 3)';
        case 'featured_landing_ids':
            return 'Landings destacadas (sección 4)';
        case 'final_section':
            return 'Sección editorial (sección 5)';
        case 'seo':
            return 'SEO';
        default:
            return field;
    }
}

function appendIds(form: FormData, key: string, ids: string[]): void {
    for (const id of ids) {
        form.append(`${key}[]`, id);
    }
}
