import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../services/content.service';
import { PageSection } from '../models/content.model';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { LegalContentEditor } from './editors/legals/legal-content-editor';
import { ComplaintsContentEditor } from './editors/legals/complaints-content-editor';
import { FaqContentEditor } from './editors/legals/faq-content-editor';
import { EditorNotFoundComponent } from '@/app/shared/components/conten-general/editor-not-found.component';

@Component({
    selector: 'app-section-editor-container',
    standalone: true,
    imports: [
        CommonModule, 
        ButtonModule, 
        ToastModule, 
        LegalContentEditor, 
        ComplaintsContentEditor, 
        FaqContentEditor,
        EditorNotFoundComponent
    ],
    providers: [MessageService],
    template: `
        <div class="p-6">
            <p-toast />

            <button pButton icon="pi pi-arrow-left" label="Volver" class="p-button-text p-button-plain mb-4 p-0" (click)="goBack()"></button>

            @if (section(); as currentSection) {
                <div class="mb-6">
                    <h1 class="text-2xl font-bold">{{ currentSection.name }}</h1>
                    <p class="text-gray-500 text-sm">Editando sección de la página "{{ pageSlug() }}"</p>
                </div>

                @switch (currentSection.type) {
                    @case ('legal_content') {
                        <app-legal-content-editor [section]="currentSection" [loading]="isSaving()" (save)="onSave($event)" />
                    }
                    @case ('complaints_content') {
                        <app-complaints-content-editor [section]="currentSection" [loading]="isSaving()" (save)="onSave($event)" />
                    }
                    @case ('faq_content') {
                        <app-faq-content-editor [section]="currentSection" [loading]="isSaving()" (save)="onSave($event)" />
                    }
                    @default {
                        <app-editor-not-found [sectionType]="currentSection.type" />
                    }
                }
            } @else {
                <div class="mb-6">
                    <h1 class="text-2xl font-bold">Cargando sección...</h1>
                    <p class="text-gray-500 text-sm">Editando sección de la página "{{ pageSlug() }}"</p>
                </div>
            }
        </div>
    `
})
export class SectionEditorContainer implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);

    section = signal<PageSection | null>(null);
    pageSlug = signal<string>('');
    isSaving = signal<boolean>(false);

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug') || '';
        const identifier = this.route.snapshot.paramMap.get('identifier') || '';
        const id = Number(this.route.snapshot.paramMap.get('id'));

        this.pageSlug.set(slug);

        if (slug && identifier && id) {
            this.loadSection(slug, identifier, id);
        }
    }

    loadSection(slug: string, identifier: string, id: number): void {
        this.contentService.getSection(slug, identifier, id).subscribe({
            next: (data: PageSection) => this.section.set(data),
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la información de la sección.',
                    life: 4000
                });
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    onSave(content: Record<string, unknown> | FormData): void {
        const currentSection = this.section();
        if (!currentSection || this.isSaving()) return;

        const slug = this.pageSlug();
        const identifier = currentSection.identifier;
        const id = currentSection.id;

        this.isSaving.set(true);

        const call = content instanceof FormData 
            ? this.contentService.updateSectionForm(slug, identifier, id, content) 
            : this.contentService.updateSection(slug, identifier, id, content);

        call.subscribe({
            next: () => {
                this.isSaving.set(false);
                const sectionName = currentSection.name || 'solicitada';

                this.router.navigate(['/content-general'], {
                    state: {
                        toast: {
                            severity: 'success',
                            summary: 'Sección Actualizada',
                            detail: `La sección "${sectionName}" de la página "${slug}" ha sido actualizada correctamente.`,
                            life: 4000
                        }
                    }
                });
            },
            error: (err) => {
                this.isSaving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'Ocurrió un error al actualizar la sección.',
                    life: 5000
                });
            }
        });
    }
}