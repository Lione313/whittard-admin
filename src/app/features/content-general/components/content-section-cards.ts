import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { ContentSectionRow, PageSection } from '../models/content.model';

const TYPE_LABELS: Record<string, string> = {
    slider: 'Slider',
    banner_split: 'Banner dividido',
    banner: 'Banner',
    promo: 'Promoción',
    section_title: 'Título de sección',
    legal_content: 'Contenido legal',
    complaints_content: 'Libro de reclamaciones',
    faq_content: 'Preguntas frecuentes',
    cards: 'Tarjetas',
    physical_stores: 'Tiendas Físicas',
    contact_main: 'Contacto principal',
    contact_profile: 'Perfil de contacto',
    logo_header: 'Logo header',
    logo_footer: 'Logo footer',
    footer_info: 'Información del footer',
    social_links: 'Redes sociales',
    newsletter: 'Newsletter'
};

@Component({
    selector: 'app-content-section-cards',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        @if (rows().length === 0) {
            <div class="text-muted-color p-10 text-center">No se encontraron secciones.</div>
        } @else {
            <div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                @for (row of rows(); track row.id) {
                    <div class="border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="text-surface-900 dark:text-surface-0 truncate font-semibold">{{ row.section.name }}</div>
                                <div class="text-muted-color truncate font-mono text-xs">{{ row.section.identifier }}</div>
                            </div>
                            <p-tag [value]="statusLabel(row.section)" [severity]="statusSeverity(row.section)" />
                        </div>

                        @if (showPage()) {
                            <div class="text-xs">
                                <span class="text-surface-700 dark:text-surface-200 font-medium">{{ row.pageTitle }}</span>
                                <span class="text-muted-color block font-mono">{{ row.pageSlug }}</span>
                            </div>
                        }

                        <div class="flex items-center justify-between gap-2">
                            <p-tag [value]="typeLabel(row.section.type)" severity="secondary" />
                            <span class="text-muted-color text-xs">{{ formatDate(row.section) }}</span>
                        </div>

                        <div class="border-surface-200 dark:border-surface-700 mt-auto flex justify-end border-t pt-3">
                            <a pButton [routerLink]="['/content-general/edit', row.pageSlug, row.section.identifier, row.section.id]" label="Editar" icon="pi pi-pencil" size="small" severity="secondary" [outlined]="true"></a>
                        </div>
                    </div>
                }
            </div>
        }
    `
})
export class ContentSectionCards {
    rows = input.required<ContentSectionRow[]>();
    showPage = input<boolean>(false);

    typeLabel(type: string): string {
        return TYPE_LABELS[type] ?? type;
    }

    statusLabel(section: PageSection): string {
        if (section.is_active === false) return 'Inactiva';
        if (section.content_data?.has_draft) return 'Borrador';

        return 'Publicado';
    }

    statusSeverity(section: PageSection): 'success' | 'warn' | 'secondary' {
        if (section.is_active === false) return 'secondary';
        if (section.content_data?.has_draft) return 'warn';

        return 'success';
    }

    formatDate(section: PageSection): string {
        const iso = section.content_data?.updated_at ?? section.updated_at;

        if (!iso) return '—';

        return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}
