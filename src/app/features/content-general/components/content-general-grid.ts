import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { environment } from '@/environments/environment.development';

import { ContentService } from '../services/content.service';
import { ContentSectionRow, Page, PageSection } from '../models/content.model';
import { ContentSectionCards } from './content-section-cards';

const PAGE_SLUG_MAP: Record<string, string> = {
    home: '',
    nosotros: 'nosotros',
    'about-us': 'nosotros',
    contacto: 'contacto',
    contact: 'contacto',
    'politicas-de-privacidad': 'politicas-de-privacidad',
    'terminos-y-condiciones': 'terminos-y-condiciones',
    'preguntas-frecuentes': 'preguntas-frecuentes',
    'claims-book': 'libro-de-reclamaciones',
    'libro-de-reclamaciones': 'libro-de-reclamaciones'
};

@Component({
    selector: 'app-content-general-grid',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, TabsModule, ToastModule, ContentSectionCards],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <h1 class="text-surface-900 dark:text-surface-0 m-0 flex items-center gap-2 text-xl font-semibold">
                    <i class="pi pi-objects-column text-primary"></i>
                    Contenido de Páginas
                </h1>
                <small class="text-muted-color mt-0.5 block"> Administra las secciones de cada página. {{ totalSections() }} secciones en {{ pages().length }} páginas. </small>
            </div>

            <p-iconField iconPosition="left" class="w-full lg:w-80">
                <p-inputIcon styleClass="pi pi-search" />
                <input pInputText type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar sección en todas las páginas..." class="w-full" />
            </p-iconField>
        </div>

        @if (loading()) {
            <div class="card text-muted-color flex items-center justify-center p-16">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else if (pages().length === 0) {
            <div class="card flex flex-col items-center justify-center py-16 text-center">
                <i class="pi pi-file text-surface-400 mb-4 text-4xl"></i>
                <h2 class="text-lg font-semibold">No hay páginas disponibles</h2>
                <p class="text-muted-color mt-1 text-sm">No se encontraron páginas de contenido.</p>
            </div>
        } @else if (isSearching()) {
            <div class="card p-0!">
                <div class="border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div>
                        <h5 class="text-surface-900 dark:text-surface-0 m-0 text-lg font-semibold">Resultados de búsqueda</h5>
                        <small class="text-muted-color">{{ searchResults().length }} coincidencia(s) para "{{ searchQuery().trim() }}"</small>
                    </div>
                    <p-button label="Limpiar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="searchQuery.set('')" />
                </div>

                <app-content-section-cards [rows]="searchResults()" [showPage]="true" />
            </div>
        } @else {
            <p-tabs [(value)]="activeTab">
                <p-tablist>
                    @for (page of pages(); track page.id) {
                        <p-tab [value]="page.slug">
                            <span class="flex items-center gap-2 font-medium">
                                {{ page.title }}
                                <span class="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-full px-2 py-0.5 text-xs font-semibold">
                                    {{ page.sections?.length || 0 }}
                                </span>
                            </span>
                        </p-tab>
                    }
                </p-tablist>

                <p-tabpanels class="pt-4">
                    @for (page of pages(); track page.id) {
                        <p-tabpanel [value]="page.slug">
                            <div class="card p-0!">
                                <div class="border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3 border-b p-4">
                                    <div>
                                        <h5 class="text-surface-900 dark:text-surface-0 m-0 text-lg font-semibold">{{ page.title }}</h5>
                                        <small class="text-muted-color font-mono">
                                            {{ hasPublicPage(page.slug) ? getPageUrl(page.slug) : 'Contenido transversal (no tiene ruta propia)' }}
                                        </small>
                                    </div>
                                    @if (hasPublicPage(page.slug)) {
                                        <p-button label="Ver página" icon="pi pi-external-link" size="small" [text]="true" (onClick)="openPage(page.slug)" />
                                    }
                                </div>

                                <app-content-section-cards [rows]="rowsForPage(page)" />
                            </div>
                        </p-tabpanel>
                    }
                </p-tabpanels>
            </p-tabs>
        }
    `
})
export class ContentGeneralGrid implements OnInit {
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);
    readonly frontendUrl = environment.frontendUrl;

    pages = signal<Page[]>([]);
    loading = signal(false);
    activeTab = signal<string>('');
    searchQuery = signal('');

    totalSections = computed(() => this.pages().reduce((sum, page) => sum + (page.sections?.length ?? 0), 0));

    isSearching = computed(() => this.searchQuery().trim().length > 0);

    searchResults = computed<ContentSectionRow[]>(() => {
        const query = this.searchQuery().trim().toLowerCase();

        if (!query) return [];

        const results: ContentSectionRow[] = [];

        for (const page of this.pages()) {
            for (const section of page.sections ?? []) {
                if (this.matches(section, query)) {
                    results.push(this.toRow(page, section));
                }
            }
        }

        return results;
    });

    ngOnInit(): void {
        this.checkRedirectToast();
        this.loadPages();
    }

    rowsForPage(page: Page): ContentSectionRow[] {
        return (page.sections ?? []).map((section) => this.toRow(page, section));
    }

    getPageUrl(slug: string): string {
        const mappedRoute = PAGE_SLUG_MAP[slug] ?? slug;

        return mappedRoute ? `${this.frontendUrl}/${mappedRoute}` : `${this.frontendUrl}/`;
    }

    hasPublicPage(slug: string): boolean {
        return PAGE_SLUG_MAP[slug] !== undefined;
    }

    openPage(slug: string): void {
        window.open(this.getPageUrl(slug), '_blank', 'noopener');
    }

    private toRow(page: Page, section: PageSection): ContentSectionRow {
        return { id: section.id, pageSlug: page.slug, pageTitle: page.title, section };
    }

    private matches(section: PageSection, query: string): boolean {
        return [section.name, section.identifier, section.type].some((value) => (value ?? '').toLowerCase().includes(query));
    }

    private checkRedirectToast(): void {
        const toastData = history.state?.toast;

        if (toastData) {
            // Se usa setTimeout para asegurar que PrimeNG inicialice el <p-toast /> en el DOM
            setTimeout(() => {
                this.messageService.add(toastData);
            }, 0);
        }
    }

    private loadPages(): void {
        this.loading.set(true);

        this.contentService.getPages().subscribe({
            next: (pages) => {
                this.pages.set(pages);
                this.loading.set(false);

                if (pages.length > 0) {
                    this.activeTab.set(pages[0].slug);
                }
            },
            error: (err: unknown) => {
                this.loading.set(false);
                console.error('Error getPages():', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las páginas.', life: 5000 });
            }
        });
    }
}
