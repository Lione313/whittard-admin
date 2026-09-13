import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-video-upload',
    standalone: true,
    imports: [CommonModule, FileUploadModule, ButtonModule],
    template: `
        <div class="flex flex-col gap-2">
            <label *ngIf="label" class="block font-medium text-surface-900 dark:text-surface-0">
                {{ label }} <span *ngIf="required" class="text-red-500">*</span>
            </label>

            <!-- Previsualización de Video -->
            <div *ngIf="previewUrl()" class="relative w-full max-w-md p-2 border border-surface-200 dark:border-surface-700 rounded-lg flex flex-col items-center gap-2">
                <video controls class="w-full max-h-60 rounded bg-black">
                    <source [src]="previewUrl()" />
                    Tu navegador no soporta reproducción de video.
                </video>
                <p-button 
                    icon="pi pi-trash" 
                    severity="danger" 
                    [text]="true" 
                    label="Remover video" 
                    (onClick)="removeVideo()" 
                    styleClass="p-button-sm w-full" />
            </div>

            <!-- Cargador PrimeNG -->
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
                        <i class="pi pi-video text-4xl text-muted-color mb-2"></i>
                        <span class="text-muted-color text-sm text-center">Arrastra aquí tu archivo de video o selecciona uno.</span>
                        <small class="text-xs text-muted-color mt-1">Máximo: {{ maxFileSize / 1000000 }} MB</small>
                    </div>
                </ng-template>
            </p-fileupload>
        </div>
    `
})
export class VideoUploadComponent {
    @Input() label: string = '';
    @Input() required: boolean = false;
    @Input() accept: string = 'video/mp4, video/webm, video/ogg';
    @Input() maxFileSize: number = 20000000; // 20MB por defecto
    @Input() chooseLabel: string = 'Seleccionar Video';
    @Input() set initialUrl(url: string | null | undefined) {
        if (url) this.previewUrl.set(url);
    }

    @Output() onFileSelected = new EventEmitter<File | null>();

    previewUrl = signal<string | null>(null);

    onSelectFile(event: any): void {
        const file: File = event.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            this.previewUrl.set(url);
            this.onFileSelected.emit(file);
        }
    }

    removeVideo(): void {
        this.previewUrl.set(null);
        this.onFileSelected.emit(null);
    }
}