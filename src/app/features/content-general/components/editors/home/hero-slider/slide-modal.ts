import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';
import { VideoUploadComponent } from '@/app/shared/components/FileUpload/app-video-upload';
import { SlideItem, SlideType } from '../hero-slider-editor';

@Component({
    selector: 'app-slide-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, SelectModule, DialogModule, ImageUploadComponent, VideoUploadComponent],
    template: `
        <p-dialog [(visible)]="visible" [header]="isEditing ? 'Editar Slide' : 'Nuevo Slide'" [modal]="true" [style]="{ width: '680px' }" (onHide)="cancel.emit()">
            <div class="flex flex-col gap-5 pt-2">
                <!-- TIPO -->
                <div>
                    <label class="block text-sm font-semibold mb-2">Tipo de Slide</label>
                    <div class="flex gap-3">
                        @for (opt of typeOptions; track opt.value) {
                            <button
                                type="button"
                                class="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer"
                                [class]="slide.type === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-surface-200 dark:border-surface-700 hover:border-surface-400'"
                                (click)="slide.type = opt.value"
                            >
                                <i [class]="opt.icon + ' text-2xl'"></i>
                                <span class="text-xs font-semibold">{{ opt.label }}</span>
                            </button>
                        }
                    </div>
                </div>

                <!-- TÍTULO & SUBTÍTULO (no para video) -->
                @if (slide.type !== 'video') {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold mb-1">Título</label>
                            <input pInputText type="text" [(ngModel)]="slide.title" placeholder="Ej: Flavours From The Garden" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-1">Subtítulo</label>
                            <input pInputText type="text" [(ngModel)]="slide.subtitle" placeholder="Ej: Since 1886" class="w-full" />
                        </div>
                    </div>
                }

                <!-- IMÁGENES (image e image_link) -->
                @if (slide.type === 'image' || slide.type === 'image_link') {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                        @if (mountMedia) {
                            <app-image-upload label="Imagen Desktop (1920×600)" [initialUrl]="getInitialDesktopUrl()" (onFileSelected)="onFileSelected($event, 'src_desktop')" />
                            <app-image-upload label="Imagen Móvil (600×800)" [initialUrl]="getInitialMobileUrl()" (onFileSelected)="onFileSelected($event, 'src_mobile')" />
                        }
                    </div>

                    <!-- URL (solo image_link) -->
                    @if (slide.type === 'image_link') {
                        <div>
                            <label class="block text-sm font-semibold mb-1">URL de Destino</label>
                            <input pInputText type="text" [(ngModel)]="slide.url" placeholder="Ej: /category/summer" class="w-full" />
                        </div>
                    }
                }

                <!-- VIDEO -->
                @if (slide.type === 'video') {
                    <div class="border-t border-surface-200 dark:border-surface-700 pt-4">
                        @if (mountMedia) {
                            <app-video-upload label="Archivo de Video (MP4 / WebM / OGG)" [initialUrl]="getInitialVideoUrl()" (onFileSelected)="onVideoFileSelected($event)" />
                        }
                    </div>
                }

                <!-- ESTADO -->
                <div class="flex items-center gap-3 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <p-toggleSwitch [(ngModel)]="slide.is_active" />
                    <span class="text-sm font-medium">
                        {{ slide.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
            </div>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (onClick)="cancel.emit()" />
                <p-button label="Guardar Slide" icon="pi pi-check" (onClick)="confirm.emit(slide)" />
            </ng-template>
        </p-dialog>
    `
})
export class SlideModalComponent implements OnChanges {
    @Input() visible = false;
    @Input() isEditing = false;
    @Input() slideData!: SlideItem;
    @Output() confirm = new EventEmitter<SlideItem>();
    @Output() cancel = new EventEmitter<void>();

    slide!: SlideItem;
    mountMedia = false;

    private classUrlPipe = new ClassUrlPipe();

    typeOptions: { label: string; value: SlideType; icon: string }[] = [
        { label: 'Imagen', value: 'image', icon: 'pi pi-image' },
        { label: 'Imagen con URL', value: 'image_link', icon: 'pi pi-link' },
        { label: 'Video', value: 'video', icon: 'pi pi-video' }
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['slideData'] && this.slideData) {
            this.slide = JSON.parse(JSON.stringify(this.slideData));
            // restaurar File refs
            if (this.slideData.src_desktop instanceof File) this.slide.src_desktop = this.slideData.src_desktop;
            if (this.slideData.src_mobile instanceof File) this.slide.src_mobile = this.slideData.src_mobile;
            if (this.slideData.video_url instanceof File) this.slide.video_url = this.slideData.video_url;
        }

        if (changes['visible']) {
            if (this.visible) {
                this.mountMedia = false;
                setTimeout(() => (this.mountMedia = true), 0);
            } else {
                this.mountMedia = false;
            }
        }
    }

    getInitialDesktopUrl(): string | null {
        if (this.slide?.preview_desktop) return this.slide.preview_desktop;
        if (typeof this.slide?.src_desktop === 'string' && this.slide.src_desktop) return this.classUrlPipe.transform(this.slide.src_desktop);
        return null;
    }

    getInitialMobileUrl(): string | null {
        if (this.slide?.preview_mobile) return this.slide.preview_mobile;
        if (typeof this.slide?.src_mobile === 'string' && this.slide.src_mobile) return this.classUrlPipe.transform(this.slide.src_mobile);
        return null;
    }

    getInitialVideoUrl(): string | null {
        if (this.slide?.preview_video) return this.slide.preview_video;
        if (typeof this.slide?.video_url === 'string' && this.slide.video_url) return this.classUrlPipe.transform(this.slide.video_url);
        return null;
    }

    onFileSelected(file: File | null, field: 'src_desktop' | 'src_mobile'): void {
        this.slide[field] = file;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                if (field === 'src_desktop') this.slide.preview_desktop = e.target.result;
                if (field === 'src_mobile') this.slide.preview_mobile = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            if (field === 'src_desktop') this.slide.preview_desktop = null;
            if (field === 'src_mobile') this.slide.preview_mobile = null;
        }
    }

    onVideoFileSelected(file: File | null): void {
        this.slide.video_url = file;
        this.slide.preview_video = file ? URL.createObjectURL(file) : null;
    }
}
