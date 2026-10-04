import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

export interface BannerContent extends Record<string, unknown> {
    is_visible: boolean;
    src_desktop: string | File | null;
    src_mobile: string | File | null;
    link_url: string;
    preview_desktop?: string | null;
    preview_mobile?: string | null;
}

@Component({
    selector: 'app-banner-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, ImageUploadComponent],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Imagen (escritorio y móvil) con enlace opcional.</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                    <label class="block text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300"> <i class="pi pi-desktop mr-2 text-primary"></i>Imagen escritorio </label>
                    @if (mountImages) {
                        <app-image-upload label="Recomendado: 1920×600px" [initialUrl]="getInitialUrl('src_desktop')" (onFileSelected)="onImageSelected('src_desktop', $event)" />
                    }
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                    <label class="block text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300"> <i class="pi pi-mobile mr-2 text-primary"></i>Imagen móvil </label>
                    @if (mountImages) {
                        <app-image-upload label="Recomendado: 800×800px" [initialUrl]="getInitialUrl('src_mobile')" (onFileSelected)="onImageSelected('src_mobile', $event)" />
                    }
                </div>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Enlace (opcional)</label>
                <input pInputText type="text" [(ngModel)]="content.link_url" placeholder="Ej: /catalogo/ofertas" class="w-full" />
            </div>
        </div>
    `
})
export class BannerEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    mountImages = false;

    content: BannerContent = {
        is_visible: true,
        src_desktop: null,
        src_mobile: null,
        link_url: '',
        preview_desktop: null,
        preview_mobile: null
    };

    private classUrlPipe = new ClassUrlPipe();

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as BannerContent | undefined;

        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                src_desktop: raw.src_desktop ?? null,
                src_mobile: raw.src_mobile ?? null,
                link_url: raw.link_url ?? '',
                preview_desktop: null,
                preview_mobile: null
            };
        }

        setTimeout(() => (this.mountImages = true), 0);
    }

    onImageSelected(field: 'src_desktop' | 'src_mobile', file: File | null): void {
        this.content[field] = file;
    }

    getInitialUrl(field: 'src_desktop' | 'src_mobile'): string | null {
        const value = this.content[field];

        if (typeof value === 'string' && value) {
            return this.classUrlPipe.transform(value);
        }

        return null;
    }

    onSave(): void {
        const hasFile = this.content.src_desktop instanceof File || this.content.src_mobile instanceof File;

        if (hasFile) {
            const fd = new FormData();

            fd.append('content[is_visible]', this.content.is_visible ? '1' : '0');
            fd.append('content[link_url]', this.content.link_url || '');

            if (this.content.src_desktop instanceof File) {
                fd.append('content[src_desktop]', this.content.src_desktop);
            }

            if (this.content.src_mobile instanceof File) {
                fd.append('content[src_mobile]', this.content.src_mobile);
            }

            this.save.emit(fd);

            return;
        }

        this.save.emit({
            is_visible: this.content.is_visible,
            src_desktop: this.content.src_desktop,
            src_mobile: this.content.src_mobile,
            link_url: this.content.link_url
        });
    }
}
