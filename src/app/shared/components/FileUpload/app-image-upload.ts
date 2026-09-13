import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-image-upload',
    standalone: true,
    imports: [CommonModule, FileUploadModule, ButtonModule],
    template: `
        <div class="flex flex-col gap-2">
            <label *ngIf="label" class="block font-medium text-surface-900 dark:text-surface-0">
                {{ label }} <span *ngIf="required" class="text-red-500">*</span>
            </label>

            <!-- Previsualización si existe imagen -->
            <div *ngIf="previewUrl()" class="relative w-full max-w-xs p-2 border border-surface-200 dark:border-surface-700 rounded-lg flex flex-col items-center gap-2">
                <img [src]="previewUrl()" alt="Preview" class="max-h-48 rounded object-contain w-full bg-surface-50 dark:bg-surface-800 p-2" />
                <p-button 
                    icon="pi pi-trash" 
                    severity="danger" 
                    [text]="true" 
                    label="Remover imagen" 
                    (onClick)="removeImage()" 
                    styleClass="p-button-sm w-full" />
            </div>

            <!-- Cargador de archivos -->
            <p-fileupload 
                *ngIf="!previewUrl()"
                mode="advanced" 
                [accept]="accept" 
                [maxFileSize]="maxFileSize"
                [customUpload]="true"
                (onSelect)="onSelectFile($event)"
                [chooseLabel]="chooseLabel"
                [showUploadButton]="false"
                [showCancelButton]="false">
                <ng-template #empty>
                    <div class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-lg cursor-pointer">
                        <i class="pi pi-image text-4xl text-muted-color mb-2"></i>
                        <span class="text-muted-color text-sm text-center">Arrastra aquí una imagen / SVG o haz clic en elegir.</span>
                        <small class="text-xs text-muted-color mt-1">Máximo: {{ maxFileSize / 1000000 }} MB</small>
                    </div>
                </ng-template>
            </p-fileupload>
        </div>
    `
})
export class ImageUploadComponent {
    @Input() label: string = '';
    @Input() required: boolean = false;
    @Input() accept: string = 'image/png, image/jpeg, image/webp, image/svg+xml';
    @Input() maxFileSize: number = 2000000; // 2MB por defecto
    @Input() chooseLabel: string = 'Seleccionar Imagen';
    @Input() set initialUrl(url: string | null | undefined) {
        if (url) this.previewUrl.set(url);
    }

    @Output() onFileSelected = new EventEmitter<File | null>();

    previewUrl = signal<string | null>(null);

    onSelectFile(event: any): void {
        const file: File = event.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => this.previewUrl.set(e.target.result);
            reader.readAsDataURL(file);
            this.onFileSelected.emit(file);
        }
    }

    removeImage(): void {
        this.previewUrl.set(null);
        this.onFileSelected.emit(null);
    }
}