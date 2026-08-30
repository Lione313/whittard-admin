import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { formatFileSize, isImageUrl, validateMediaFile } from '@/app/shared/utils/media';

@Component({
    selector: 'app-media-picker',
    standalone: true,
    imports: [FormsModule, ButtonModule],
    template: `
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
                <div [class]="'rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-0 dark:bg-surface-800 flex items-center justify-center overflow-hidden shrink-0 ' + previewClass()">
                    @if (file()) {
                        @if (kind() === 'video') {
                            <video [src]="previewUrl()" class="w-full h-full object-cover" preload="metadata" muted></video>
                        } @else if (kind() === 'document') {
                            <i class="pi pi-file text-surface-300 text-2xl"></i>
                        } @else {
                            <img [src]="previewUrl()" [alt]="file()!.name" class="w-full h-full object-cover" (error)="hideImg($event)" />
                        }
                    } @else if (url()) {
                        @if (kind() === 'video') {
                            <video [src]="url()!" class="w-full h-full object-cover" preload="metadata" muted></video>
                        } @else if (kind() === 'document') {
                            <i class="pi pi-file text-surface-300 text-2xl"></i>
                        } @else if (isImageUrl(url())) {
                            <img [src]="url()!" [alt]="'preview'" class="w-full h-full object-cover" (error)="hideImg($event)" />
                        } @else {
                            <i class="pi pi-file text-surface-300 text-2xl"></i>
                        }
                    } @else {
                        <i [class]="(kind() === 'video' ? 'pi pi-video' : kind() === 'document' ? 'pi pi-file' : 'pi pi-image') + ' text-surface-300 text-xl'"></i>
                    }
                </div>

                <div class="flex flex-col gap-1 flex-1 min-w-0">
                    <div class="flex items-center gap-1">
                        <p-button label="Seleccionar" icon="pi pi-upload" severity="secondary" [text]="true" [size]="'small'" (onClick)="openFileDialog()" />
                        @if (file() || url()) {
                            <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true" [size]="'small'" title="Quitar" (onClick)="clear()" />
                        }
                    </div>
                    @if (file()) {
                        <small class="text-muted-color truncate">{{ file()!.name }} ({{ formatSize(file()!.size) }})</small>
                    }
                    @if (error()) {
                        <small class="text-red-500">{{ error() }}</small>
                    }
                </div>
            </div>

            <input #fileInput type="file" class="hidden" [accept]="acceptAttr()" (change)="onFileSelected($event)" />
        </div>
    `
})
export class MediaPickerComponent {
    url = input<string | null>(null);
    file = input<File | null>(null);
    accept = input<string[]>([]);
    maxSize = input<number>(20 * 1024 * 1024);
    kind = input<'image' | 'video' | 'document'>('image');
    previewClass = input<string>('w-14 h-14');

    urlChange = output<string | null>();
    fileChange = output<File | null>();

    error = signal<string | null>(null);
    previewUrl = signal<string | null>(null);

    private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    private objectUrl: string | null = null;

    constructor() {
        effect(() => {
            this.revokePreview();
            const file = this.file();

            if (file) {
                this.objectUrl = URL.createObjectURL(file);
                this.previewUrl.set(this.objectUrl);
            } else {
                this.previewUrl.set(null);
            }
        });
    }

    acceptAttr(): string {
        return this.accept()
            .map((ext) => `.${ext}`)
            .join(',');
    }

    openFileDialog() {
        this.fileInput()?.nativeElement.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        input.value = '';

        if (!file) return;

        const validationError = validateMediaFile(file, { extensions: this.accept(), maxBytes: this.maxSize() });

        if (validationError) {
            this.error.set(validationError);

            return;
        }

        this.error.set(null);
        this.fileChange.emit(file);
    }

    clear() {
        this.fileChange.emit(null);
        this.urlChange.emit(null);
        this.error.set(null);
    }

    hideImg(event: Event) {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    formatSize(bytes: number): string {
        return formatFileSize(bytes);
    }

    isImageUrl(url: string | null): boolean {
        return isImageUrl(url);
    }

    private revokePreview() {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }
}
