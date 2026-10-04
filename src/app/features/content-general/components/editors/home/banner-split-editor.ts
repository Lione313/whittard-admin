import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { PageSection } from '../../../models/content.model';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

export interface BannerSplitContent extends Record<string, unknown> {
    is_visible: boolean;
    layout: 'image_left' | 'image_right';
    image: string | File | null;
    title: string;
    subtitle: string;
    button_text: string;
    button_url: string;
    preview_image?: string | null;
}

@Component({
    selector: 'app-banner-split-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule, SelectButtonModule, DividerModule, ImageUploadComponent],
    template: `
        <div class="space-y-6">
            <!-- HEADER -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Banner dividido con imagen y contenido de texto.</p>
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
                <!-- COLUMNA IZQUIERDA: IMAGEN + LAYOUT -->
                <div class="flex flex-col gap-4">
                    <!-- LAYOUT SELECTOR -->
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                        <label class="block text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300"> <i class="pi pi-arrows-h mr-2 text-primary"></i>Disposición </label>
                        <p-select-button [(ngModel)]="content.layout" [options]="layoutOptions" optionLabel="label" optionValue="value" class="w-full">
                            <ng-template #item let-opt>
                                <div class="flex items-center gap-2 px-1">
                                    <i [class]="opt.icon"></i>
                                    <span class="text-sm">{{ opt.label }}</span>
                                </div>
                            </ng-template>
                        </p-select-button>

                        <!-- PREVIEW VISUAL DEL LAYOUT -->
                        <div class="mt-3 flex gap-1 h-8 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
                            @if (content.layout === 'image_left') {
                                <div class="w-1/2 bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">IMG</div>
                                <div class="w-1/2 bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] text-surface-500 font-bold">TEXTO</div>
                            } @else {
                                <div class="w-1/2 bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] text-surface-500 font-bold">TEXTO</div>
                                <div class="w-1/2 bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">IMG</div>
                            }
                        </div>
                    </div>

                    <!-- IMAGEN -->
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                        <label class="block text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300"> <i class="pi pi-image mr-2 text-primary"></i>Imagen del Banner </label>
                        @if (mountImage) {
                            <app-image-upload label="Recomendado: 800×500px" [initialUrl]="getInitialImageUrl()" (onFileSelected)="onImageSelected($event)" />
                        }
                    </div>
                </div>

                <!-- COLUMNA DERECHA: CAMPOS DE TEXTO -->
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex flex-col gap-4">
                    <p class="text-sm font-semibold text-surface-700 dark:text-surface-300"><i class="pi pi-align-left mr-2 text-primary"></i>Contenido de Texto</p>

                    <div>
                        <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título</label>
                        <input pInputText type="text" [(ngModel)]="content.title" placeholder="Ej: Discover NEW Summer Favourites" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Subtítulo / Descripción</label>
                        <textarea pTextarea [(ngModel)]="content.subtitle" placeholder="Ej: From calming infusions and refreshing instant teas..." [rows]="4" class="w-full resize-none"></textarea>
                    </div>

                    <p-divider />

                    <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Botón (opcional)</p>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Texto del Botón</label>
                            <input pInputText type="text" [(ngModel)]="content.button_text" placeholder="Ej: Shop Now" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">URL del Botón</label>
                            <input pInputText type="text" [(ngModel)]="content.button_url" placeholder="Ej: /category/summer" class="w-full" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- PREVIEW DEL BANNER -->
            @if (hasPreview()) {
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                    <p class="text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300"><i class="pi pi-eye mr-2 text-primary"></i>Vista Previa</p>
                    <div class="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 min-h-32" [class.flex-row-reverse]="content.layout === 'image_right'">
                        <!-- IMAGEN -->
                        <div class="w-1/2 bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            @if (getPreviewUrl()) {
                                <img [src]="getPreviewUrl()" class="w-full h-full object-cover max-h-48" />
                            } @else {
                                <div class="w-full h-full flex items-center justify-center min-h-32">
                                    <i class="pi pi-image text-3xl text-surface-400"></i>
                                </div>
                            }
                        </div>
                        <!-- TEXTO -->
                        <div class="w-1/2 p-6 flex flex-col justify-center gap-2">
                            <h3 class="font-bold text-lg text-surface-900 dark:text-surface-0 leading-tight">
                                {{ content.title || 'Sin título' }}
                            </h3>
                            <p class="text-sm text-surface-500 line-clamp-3">
                                {{ content.subtitle || 'Sin descripción' }}
                            </p>
                            @if (content.button_text) {
                                <div class="mt-2">
                                    <span class="inline-block px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
                                        {{ content.button_text }}
                                    </span>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
        </div>
    `
})
export class BannerSplitEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    mountImage = false;

    content: BannerSplitContent = {
        is_visible: true,
        layout: 'image_left',
        image: null,
        title: '',
        subtitle: '',
        button_text: '',
        button_url: '',
        preview_image: null
    };

    layoutOptions = [
        { label: 'Imagen izquierda', value: 'image_left', icon: 'pi pi-align-left' },
        { label: 'Imagen derecha', value: 'image_right', icon: 'pi pi-align-right' }
    ];

    private classUrlPipe = new ClassUrlPipe();

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as BannerSplitContent | undefined;
        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                layout: raw.layout ?? 'image_left',
                image: raw.image ?? null,
                title: raw.title ?? '',
                subtitle: raw.subtitle ?? '',
                button_text: raw.button_text ?? '',
                button_url: raw.button_url ?? '',
                preview_image: null
            };
        }
        // montar imagen después de que ngOnInit seteó los valores
        setTimeout(() => (this.mountImage = true), 0);
    }

    onImageSelected(file: File | null): void {
        this.content.image = file;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => (this.content.preview_image = e.target.result);
            reader.readAsDataURL(file);
        } else {
            this.content.preview_image = null;
        }
    }

    getInitialImageUrl(): string | null {
        if (typeof this.content.image === 'string' && this.content.image) return this.classUrlPipe.transform(this.content.image);
        return null;
    }

    getPreviewUrl(): string | null {
        if (this.content.preview_image) return this.content.preview_image;
        if (typeof this.content.image === 'string' && this.content.image) return this.classUrlPipe.transform(this.content.image);
        return null;
    }

    hasPreview(): boolean {
        return !!(this.content.title || this.content.subtitle || this.getPreviewUrl());
    }

    onSave(): void {
        if (this.content.image instanceof File) {
            const fd = new FormData();
            fd.append('content[is_visible]', this.content.is_visible ? '1' : '0');
            fd.append('content[layout]', this.content.layout);
            fd.append('content[title]', this.content.title || '');
            fd.append('content[subtitle]', this.content.subtitle || '');
            fd.append('content[button_text]', this.content.button_text || '');
            fd.append('content[button_url]', this.content.button_url || '');
            fd.append('content[image]', this.content.image);
            this.save.emit(fd);
        } else {
            this.save.emit({
                is_visible: this.content.is_visible,
                layout: this.content.layout,
                image: this.content.image,
                title: this.content.title,
                subtitle: this.content.subtitle,
                button_text: this.content.button_text,
                button_url: this.content.button_url
            });
        }
    }
}
