import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ContentService } from '../services/content.service';
import { Page, PageSection } from '../models/content.model';

import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-content-general-grid',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        TabsModule, 
        ButtonModule, 
        InputTextModule, 
        IconFieldModule, 
        InputIconModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card p-6">
            <!-- HEADER -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">
                        <i class="pi pi-objects-column text-xl"></i>
                        Contenido General
                    </h1>
                    <p class="text-gray-500 text-sm">Gestiona las secciones visuales y el contenido dinámico de tu plataforma.</p>
                </div>

                <p-iconField iconPosition="left" class="w-full md:w-80">
                    <p-inputIcon styleClass="pi pi-search" />
                    <input pInputText type="text" [(ngModel)]="searchQuery" placeholder="Buscar sección en todas las páginas..." class="w-full" />
                </p-iconField>
            </div>

            <!-- CONTENIDO -->
            @if (pages().length > 0) {
                <p-tabs [(value)]="activeTab">
                    <!-- TABS -->
                    <p-tablist>
                        @for (page of pages(); track page.id) {
                            <p-tab [value]="page.slug">
                                <span class="flex items-center gap-2 font-medium">
                                    <i class="pi pi-globe text-xs"></i>
                                    {{ page.title }}
                                    <span class="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                                        {{ page.sections?.length || 0 }}
                                    </span>
                                </span>
                            </p-tab>
                        }
                    </p-tablist>

                    <!-- PANELS -->
                    <p-tabpanels class="pt-6">
                        @for (page of pages(); track page.id) {
                            <p-tabpanel [value]="page.slug">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    @for (section of filterSections(page.sections); track section.id) {
                                        <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-44">
                                            <div>
                                                <span class="text-xs text-surface-400 block font-mono truncate mb-1">
                                                    https://dev-daryza.playgrouplatam.com/
                                                </span>
                                                <span class="text-xs uppercase tracking-wider font-semibold text-surface-400 block">
                                                    SECCIÓN
                                                </span>
                                                <h3 class="text-base font-bold text-surface-800 dark:text-surface-100 mt-0.5 truncate">
                                                    {{ section.name }}
                                                </h3>
                                            </div>

                                            <div class="flex justify-between items-center pt-2">
                                                <i class="pi pi-layers text-surface-400 text-lg"></i>
                                                <p-button label="EDITAR" icon="pi pi-pencil" size="small" severity="secondary" [rounded]="true" (onClick)="navigateToEdit(page.slug, section.identifier, section.id)" />
                                            </div>
                                        </div>
                                    }
                                </div>
                            </p-tabpanel>
                        }
                    </p-tabpanels>
                </p-tabs>
            } @else {
                <!-- ESTADO VACÍO -->
                <div class="flex flex-col items-center justify-center py-16 text-center">
                    <i class="pi pi-file text-4xl text-surface-400 mb-4"></i>
                    <h2 class="text-lg font-semibold">No hay páginas disponibles</h2>
                    <p class="text-sm text-surface-500 mt-1">No se encontraron páginas de contenido.</p>
                </div>
            }
        </div>
    `
})
export class ContentGeneralGrid implements OnInit {
    private contentService = inject(ContentService);
    private router         = inject(Router);
    private messageService = inject(MessageService);

    pages = signal<Page[]>([]);
    activeTab = signal<string>('');
    searchQuery = '';

    ngOnInit(): void {
        this.checkRedirectToast();
        this.loadPages();
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

    loadPages(): void {
        this.contentService.getPages().subscribe({
            next: (pages: Page[]) => {
                this.pages.set(pages);

                if (pages.length > 0) {
                    this.activeTab.set(pages[0].slug);
                }
            },
            error: (err: unknown) => {
                console.error('Error getPages():', err);
            }
        });
    }

    filterSections(sections?: PageSection[]): PageSection[] {
        if (!sections) {
            return [];
        }

        const query = this.searchQuery.trim().toLowerCase();

        if (!query) {
            return sections;
        }

        return sections.filter((section) => section.name.toLowerCase().includes(query));
    }

    navigateToEdit(slug: string, identifier: string, id: number): void {
        this.router.navigate(['/content-general/edit', slug, identifier, id]);
    }
}