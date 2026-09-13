import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DataViewModule } from 'primeng/dataview';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { SlideItem } from '../hero-slider-editor';

@Component({
    selector: 'app-slide-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToggleSwitchModule, TooltipModule, TagModule, DataViewModule, ClassUrlPipe],
    template: `
        @if (slides.length === 0) {
            <div class="text-center py-12 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-900">
                <i class="pi pi-images text-4xl text-surface-400 mb-2 block"></i>
                <p class="text-surface-600 dark:text-surface-400 font-medium mb-3">No hay slides creados.</p>
                <p-button label="Crear primer slide" icon="pi pi-plus" (onClick)="add.emit()" />
            </div>
        } @else {
            <p-dataview [value]="slides" layout="list">
                <ng-template #list let-items>
                    <div class="flex flex-col gap-3">
                        @for (slide of items; track slide.id; let i = $index) {
                            <div
                                class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-sm hover:shadow-md transition-all"
                                [class.opacity-50]="!slide.is_active"
                            >
                                <!-- ORDEN -->
                                <div class="flex sm:flex-col items-center gap-2 sm:gap-1">
                                    <button pButton icon="pi pi-chevron-up" class="p-button-text p-button-sm !p-1" [disabled]="i === 0" (click)="move.emit({ index: i, direction: -1 })"></button>
                                    <span class="text-xs font-mono font-bold bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">#{{ i + 1 }}</span>
                                    <button pButton icon="pi pi-chevron-down" class="p-button-text p-button-sm !p-1" [disabled]="i === slides.length - 1" (click)="move.emit({ index: i, direction: 1 })"></button>
                                </div>

                                <!-- PREVIEW -->
                                <div class="w-full sm:w-40 h-20 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-hidden relative flex items-center justify-center border border-surface-200 dark:border-surface-700 flex-shrink-0">
                                    @if (slide.type === 'video') {
                                        @if (getVideoPreview(slide)) {
                                            <video [src]="getVideoPreview(slide) | classUrl" class="w-full h-full object-cover" muted loop autoplay></video>
                                        } @else {
                                            <i class="pi pi-video text-3xl text-surface-400"></i>
                                        }
                                    } @else if (getImagePreview(slide)) {
                                        <img [src]="getImagePreview(slide) | classUrl" class="w-full h-full object-cover" />
                                    } @else {
                                        <i class="pi pi-image text-3xl text-surface-400"></i>
                                    }
                                </div>

                                <!-- INFO -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <p-tag [value]="getTypeLabel(slide.type)" [severity]="getTypeSeverity(slide.type)" />
                                    </div>
                                    <h4 class="font-bold text-base truncate text-surface-900 dark:text-surface-0">
                                        {{ slide.title || 'Sin título' }}
                                    </h4>
                                    <p class="text-xs text-surface-500 truncate mt-0.5">{{ slide.subtitle || 'Sin subtítulo' }}</p>
                                    @if (slide.type === 'image_link' && slide.url) {
                                        <p class="text-xs text-primary truncate mt-1"><i class="pi pi-link mr-1"></i>{{ slide.url }}</p>
                                    }
                                </div>

                                <!-- ACCIONES -->
                                <div class="flex items-center gap-3 flex-shrink-0">
                                    <p-toggleSwitch [(ngModel)]="slide.is_active" pTooltip="Activo/Inactivo" />
                                    <p-button icon="pi pi-pencil" severity="secondary" [rounded]="true" (onClick)="edit.emit({ slide, index: i })" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" (onClick)="delete.emit(i)" />
                                </div>
                            </div>
                        }
                    </div>
                </ng-template>
            </p-dataview>
        }
    `
})
export class SlideListComponent {
    @Input() slides: SlideItem[] = [];
    @Output() add = new EventEmitter<void>();
    @Output() edit = new EventEmitter<{ slide: SlideItem; index: number }>();
    @Output() delete = new EventEmitter<number>();
    @Output() move = new EventEmitter<{ index: number; direction: number }>();

    getImagePreview(slide: SlideItem): string | null {
        const result = slide.preview_desktop ?? (typeof slide.src_desktop === 'string' ? slide.src_desktop : null);
        return result;
    }

    getVideoPreview(slide: SlideItem): string | null {
        if (slide.preview_video) return slide.preview_video;
        if (typeof slide.video_url === 'string') return slide.video_url;
        return null;
    }

    getTypeLabel(type: string): string {
        const map: Record<string, string> = {
            image: 'Imagen',
            image_link: 'Imagen con URL',
            video: 'Video'
        };
        return map[type] ?? type;
    }

    getTypeSeverity(type: string): 'success' | 'info' | 'warn' {
        const map: Record<string, 'success' | 'info' | 'warn'> = {
            image: 'success',
            image_link: 'info',
            video: 'warn'
        };
        return map[type] ?? 'info';
    }
}
