import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

export interface LogoContent extends Record<string, unknown> {
    is_visible: boolean;
    src: string | File | null;
    alt: string;
}

@Component({
    selector: 'app-logo-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, ImageUploadComponent],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Logotipo que aparece en el {{ isHeader ? 'encabezado' : 'pie de página' }} del sitio.</p>
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
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
                    <app-image-upload
                        label="Archivo del Logo (PNG, SVG o WebP)"
                        accept="image/png, image/svg+xml, image/webp"
                        [initialUrl]="getInitialUrl()"
                        (onFileSelected)="onImageSelected($event)" />
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
                    <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Texto alternativo (alt)</label>
                    <input pInputText type="text" [(ngModel)]="content.alt"
                        placeholder="Ej: Whittard Chelsea 1886" class="w-full" />
                    <p class="text-xs text-surface-400 mt-1">Usado por lectores de pantalla y SEO.</p>
                </div>
            </div>
        </div>
    `
})
export class LogoEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();
    
    content: LogoContent = { is_visible: true, src: null, alt: '' };
    private classUrlPipe = new ClassUrlPipe();

    get isHeader(): boolean {
        return this.section?.type === 'logo_header';
    }

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as LogoContent | undefined;
        if (raw) {
            this.content = { is_visible: raw.is_visible ?? true, src: raw.src ?? null, alt: raw.alt ?? '' };
        }
    }

    onImageSelected(file: File | null): void {
        this.content.src = file;
    }

    getInitialUrl(): string | null {
        if (typeof this.content.src === 'string' && this.content.src)
            return this.classUrlPipe.transform(this.content.src);
        return null;
    }

    onSave(): void {
        if (this.content.src instanceof File) {
            const fd = new FormData();
            fd.append('content[is_visible]', this.content.is_visible ? '1' : '0');
            fd.append('content[alt]', this.content.alt || '');
            fd.append('content[src]', this.content.src);
            this.save.emit(fd);
        } else {
            this.save.emit({ is_visible: this.content.is_visible, src: this.content.src, alt: this.content.alt });
        }
    }
}