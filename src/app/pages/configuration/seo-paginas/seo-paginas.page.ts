import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

import { PageSeoService } from '@/app/features/page-seo/services/page-seo.service';
import { PageSeo } from '@/app/features/page-seo/models/page-seo.model';
import { SeoPanel } from '@/app/shared/components/seo-panel/seo-panel';
import { isSeoEmpty, normalizeSeoData, SeoData } from '@/app/shared/models/seo.model';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-page-seo',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TooltipModule, SeoPanel, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                    <i class="pi pi-search text-primary"></i>
                    SEO de Páginas
                </h1>
                <small class="text-muted-color block mt-0.5">Optimiza el título, la descripción y Open Graph de las páginas estáticas públicas.</small>
            </div>

            @if (selectedId()) {
                <div class="flex items-center gap-3">
                    @if (currentDirty()) {
                        <span class="text-xs font-medium text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Cambios sin guardar
                        </span>
                    }
                    <p-button label="Guardar cambios" icon="pi pi-check" [loading]="saving()" [disabled]="!currentDirty()" (onClick)="save()" />
                </div>
            }
        </div>

        @if (loading()) {
            <div class="card p-16 flex items-center justify-center text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else {
            <div class="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_340px] gap-4 items-start">
                <div class="card !p-2">
                    <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-color">Páginas ({{ pages().length }})</div>

                    <div class="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
                        @for (page of pages(); track page.id) {
                            <button
                                type="button"
                                (click)="select(page.id)"
                                class="group w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border border-transparent"
                                [ngClass]="page.id === selectedId() ? 'bg-primary/10 border-primary/30' : 'hover:bg-surface-100 dark:hover:bg-surface-800'"
                            >
                                <span class="min-w-0 flex-1">
                                    <span class="block text-sm font-medium truncate text-surface-900 dark:text-surface-0">{{ page.name }}</span>
                                    <span class="block text-xs text-muted-color truncate font-mono">{{ page.path }}</span>
                                </span>

                                <span class="flex items-center gap-1.5 shrink-0">
                                    @if (isDirty(page.id)) {
                                        <span class="w-2 h-2 rounded-full bg-amber-500" pTooltip="Cambios sin guardar" tooltipPosition="left"></span>
                                    } @else if (page.seo?.noindex) {
                                        <i class="pi pi-eye-slash text-xs text-amber-500" pTooltip="No indexada" tooltipPosition="left"></i>
                                    } @else if (isConfigured(page)) {
                                        <i class="pi pi-check-circle text-xs text-green-500" pTooltip="SEO configurado" tooltipPosition="left"></i>
                                    } @else {
                                        <i class="pi pi-circle text-xs text-surface-300 dark:text-surface-600" pTooltip="Sin configurar" tooltipPosition="left"></i>
                                    }
                                </span>
                            </button>
                        }
                    </div>
                </div>

                <div>
                    @if (selectedId()) {
                        <app-seo-panel [value]="seo()" (valueChange)="onSeoChange($event)" />
                    } @else {
                        <div class="card min-h-[320px] flex flex-col items-center justify-center text-center text-muted-color gap-3">
                            <i class="pi pi-search text-4xl opacity-40"></i>
                            <div>
                                <p class="font-medium text-surface-700 dark:text-surface-200 m-0">Selecciona una página</p>
                                <small>Elige una página de la lista para editar su SEO.</small>
                            </div>
                        </div>
                    }
                </div>

                @if (selectedId()) {
                    <div class="flex flex-col gap-4 xl:sticky xl:top-4">
                        <div class="card">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Vista previa en Google</span>
                                <i class="pi pi-google text-muted-color"></i>
                            </div>

                            <div class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 p-4">
                                <div class="flex items-center gap-2.5 mb-1.5">
                                    <span class="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-300">W</span>
                                    <div class="leading-tight min-w-0">
                                        <div class="text-xs text-surface-800 dark:text-surface-100">Whittard Perú</div>
                                        <div class="text-[0.7rem] text-surface-500 truncate">{{ previewUrl() }}</div>
                                    </div>
                                </div>
                                <div class="text-[#1a0dab] dark:text-blue-400 text-lg leading-snug line-clamp-2">{{ previewTitle() }}</div>
                                <p class="text-sm text-surface-600 dark:text-surface-300 mt-1 mb-0 line-clamp-2" [ngClass]="{ 'italic text-muted-color': descriptionIsFallback() }">
                                    {{ previewDescription() }}
                                </p>
                            </div>

                            <div class="mt-4 flex flex-col gap-1.5">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-muted-color">Título</span>
                                    <span [ngClass]="titleLengthClass()">{{ titleLength() }}/60</span>
                                </div>
                                <div class="h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                    <div class="h-full rounded-full transition-all" [ngClass]="barClass(titleLength(), 60, 50)" [style.width.%]="barWidth(titleLength(), 60)"></div>
                                </div>

                                <div class="flex items-center justify-between text-xs mt-2">
                                    <span class="text-muted-color">Meta descripción</span>
                                    <span [ngClass]="descriptionLengthClass()">{{ descriptionLength() }}/160</span>
                                </div>
                                <div class="h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                    <div class="h-full rounded-full transition-all" [ngClass]="barClass(descriptionLength(), 160, 140)" [style.width.%]="barWidth(descriptionLength(), 160)"></div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="text-xs font-semibold uppercase tracking-wide text-muted-color mb-3">Vista previa al compartir</div>

                            <div class="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                                @if (previewImage()) {
                                    <img [src]="previewImage()" alt="Imagen de Open Graph" class="w-full h-40 object-cover" />
                                } @else {
                                    <div class="w-full h-40 bg-surface-100 dark:bg-surface-800 flex flex-col items-center justify-center text-muted-color gap-1">
                                        <i class="pi pi-image text-2xl"></i>
                                        <span class="text-xs">Sin imagen Open Graph</span>
                                    </div>
                                }
                                <div class="p-3 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
                                    <div class="text-[0.65rem] uppercase tracking-wide text-surface-500 truncate">{{ previewUrl() }}</div>
                                    <div class="font-semibold text-sm text-surface-900 dark:text-surface-0 line-clamp-2 mt-0.5">{{ ogTitle() }}</div>
                                    <p class="text-xs text-surface-600 dark:text-surface-300 m-0 mt-0.5 line-clamp-2">{{ ogDescription() }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        }
    `
})
export class PageSeoPage implements OnInit {
    private pageSeoService = inject(PageSeoService);
    private messageService = inject(MessageService);

    pages = signal<PageSeo[]>([]);
    loading = signal(false);
    saving = signal(false);
    selectedId = signal<string | null>(null);
    seo = signal<SeoData | null>(null);

    private drafts = signal<Record<string, SeoData | null>>({});

    selectedPage = computed(() => this.pages().find((page) => page.id === this.selectedId()) ?? null);

    currentDirty = computed(() => {
        const id = this.selectedId();

        return id ? this.isDirty(id) : false;
    });

    previewTitle = computed(() => this.seo()?.meta_title?.trim() || this.selectedPage()?.name || 'Título de la página');
    previewDescription = computed(() => this.seo()?.meta_description?.trim() || 'Añade una meta descripción para mejorar cómo aparece esta página en los resultados de búsqueda.');
    descriptionIsFallback = computed(() => !this.seo()?.meta_description?.trim());
    previewUrl = computed(() => `www.whittardperu.com${this.selectedPage()?.path ?? '/'}`);
    previewImage = computed(() => this.seo()?.og_image?.trim() || null);
    ogTitle = computed(() => this.seo()?.og_title?.trim() || this.previewTitle());
    ogDescription = computed(() => this.seo()?.og_description?.trim() || this.previewDescription());

    titleLength = computed(() => (this.seo()?.meta_title ?? '').trim().length);
    descriptionLength = computed(() => (this.seo()?.meta_description ?? '').trim().length);
    titleLengthClass = computed(() => this.lengthClass(this.titleLength(), 60, 50));
    descriptionLengthClass = computed(() => this.lengthClass(this.descriptionLength(), 160, 140));

    ngOnInit(): void {
        this.load();
    }

    isConfigured(page: PageSeo): boolean {
        const seo = normalizeSeoData(page.seo);

        return seo ? !isSeoEmpty(seo) : false;
    }

    isDirty(id: string): boolean {
        const draft = this.drafts()[id];

        if (draft === undefined) return false;

        const page = this.pages().find((item) => item.id === id);

        return JSON.stringify(draft) !== JSON.stringify(normalizeSeoData(page?.seo));
    }

    barWidth(length: number, max: number): number {
        return Math.min(100, Math.round((length / max) * 100));
    }

    barClass(length: number, max: number, warn: number): string {
        if (length === 0) return 'bg-surface-300 dark:bg-surface-600';
        if (length > max) return 'bg-red-500';
        if (length > warn) return 'bg-amber-500';

        return 'bg-green-500';
    }

    select(id: string): void {
        this.selectedId.set(id);

        const draft = this.drafts()[id];
        const page = this.pages().find((item) => item.id === id);

        this.seo.set(draft !== undefined ? draft : normalizeSeoData(page?.seo));
    }

    onSeoChange(value: SeoData | null): void {
        this.seo.set(value);

        const id = this.selectedId();

        if (id) {
            this.drafts.update((drafts) => ({ ...drafts, [id]: value }));
        }
    }

    save(): void {
        const id = this.selectedId();

        if (!id) return;

        this.saving.set(true);

        this.pageSeoService.update(id, { seo: this.seo() }).subscribe({
            next: (response) => {
                this.saving.set(false);
                this.pages.update((pages) => pages.map((page) => (page.id === id ? response.data : page)));
                this.drafts.update((drafts) => {
                    const next = { ...drafts };

                    delete next[id];

                    return next;
                });
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'SEO actualizado correctamente.', life: 3000 });
            },
            error: (error) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private lengthClass(length: number, max: number, warn: number): string {
        if (length === 0) return 'text-muted-color';
        if (length > max) return 'text-red-500';
        if (length > warn) return 'text-amber-500';

        return 'text-green-600';
    }

    private load(): void {
        this.loading.set(true);

        this.pageSeoService.list().subscribe({
            next: (response) => {
                this.pages.set(response.data);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }
}
