import { Component, OnDestroy, OnInit, ViewContainerRef, ComponentRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../services/content.service';
import { PageSection } from '../models/content.model';
import { EDITOR_REGISTRY } from './editor-registry';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { EditorNotFoundComponent } from '@/app/shared/components/conten-general/editor-not-found.component';

@Component({
    selector: 'app-section-editor-container',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToastModule, SkeletonModule, EditorNotFoundComponent],
    providers: [MessageService],
    template: `
        <div class="p-6">
            <p-toast />

            <button pButton icon="pi pi-arrow-left" label="Volver" class="p-button-text p-button-plain mb-4 p-0" (click)="goBack()"></button>

            @if (section(); as s) {
                <div class="mb-6">
                    <h1 class="text-2xl font-bold">{{ s.name }}</h1>
                    <p class="text-gray-500 text-sm">Editando sección de la página "{{ pageSlug() }}"</p>
                </div>

                <ng-container #editorHost />

                @if (!editorFound()) {
                    <app-editor-not-found [sectionType]="s.type" />
                }
            } @else {
                <div class="mb-6">
                    <p-skeleton height="2rem" width="16rem" class="mb-2" />
                    <p-skeleton height="1rem" width="24rem" />
                </div>
                <p-skeleton height="400px" />
            }
        </div>
    `
})
export class SectionEditorContainer implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);

    private editorHost = viewChild('editorHost', { read: ViewContainerRef });

    section = signal<PageSection | null>(null);
    pageSlug = signal<string>('');
    isSaving = signal<boolean>(false);
    editorFound = signal<boolean>(true);

    private editorRef: ComponentRef<unknown> | null = null;

    constructor() {
        // Cuando la sección (y su host en el template) están listos → monta el editor.
        effect(() => {
            const s = this.section();
            const host = this.editorHost();

            if (!s || !host) return;
            this.mountEditor(s, host);
        });
    }

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug') || '';
        const identifier = this.route.snapshot.paramMap.get('identifier') || '';
        const id = Number(this.route.snapshot.paramMap.get('id'));

        this.pageSlug.set(slug);
        if (slug && identifier && id) this.loadSection(slug, identifier, id);
    }

    ngOnDestroy(): void {
        this.editorRef?.destroy();
    }

    private mountEditor(section: PageSection, host: ViewContainerRef): void {
        // Intentamos buscar por type o por identifier por si acaso difieren en BD
        const editorType = EDITOR_REGISTRY[section.type] || EDITOR_REGISTRY[section.identifier];

        this.editorFound.set(!!editorType);

        if (!editorType) return;

        // Montamos dentro del host del template (queda dentro de la tarjeta/contenedor).
        this.editorRef?.destroy();
        this.editorRef = host.createComponent(editorType);

        this.editorRef.setInput('section', section);
        this.editorRef.setInput(
            'loading',
            untracked(() => this.isSaving())
        );

        const instance = this.editorRef.instance as { save?: { subscribe?: (fn: (payload: FormData | Record<string, unknown>) => void) => void } };

        instance.save?.subscribe?.((payload) => {
            this.onSave(payload);
        });

        this.editorRef.changeDetectorRef.detectChanges();
    }

    loadSection(slug: string, identifier: string, id: number): void {
        this.contentService.getSection(slug, identifier, id).subscribe({
            next: (data) => this.section.set(data),
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la sección.',
                    life: 4000
                })
        });
    }

    goBack(): void {
        this.location.back();
    }

    onSave(content: Record<string, unknown> | FormData): void {
        const s = this.section();

        if (!s || this.isSaving()) return;

        this.isSaving.set(true);
        this.editorRef?.setInput('loading', true);

        const slug = this.pageSlug();
        const identifier = s.identifier;
        const id = s.id;

        const call = content instanceof FormData ? this.contentService.updateSectionForm(slug, identifier, id, content) : this.contentService.updateSection(slug, identifier, id, content);

        call.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.editorRef?.setInput('loading', false);

                this.router.navigate(['/content-general'], {
                    state: {
                        toast: {
                            severity: 'success',
                            summary: 'Sección Actualizada',
                            detail: `"${s.name}" actualizada correctamente.`,
                            life: 4000
                        }
                    }
                });
            },
            error: (err) => {
                this.isSaving.set(false);
                this.editorRef?.setInput('loading', false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'Error al actualizar la sección.',
                    life: 5000
                });
            }
        });
    }
}
