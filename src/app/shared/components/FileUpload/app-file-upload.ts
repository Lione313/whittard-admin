import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule, FileUploadModule, ButtonModule],
    template: `
        <div class="flex flex-col gap-2">
            <label *ngIf="label" class="block font-medium text-surface-900 dark:text-surface-0">
                {{ label }} <span *ngIf="required" class="text-red-500">*</span>
            </label>

            <!-- Archivo Seleccionado / Cargado -->
            <div *ngIf="selectedFileName()" class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-800">
                <div class="flex items-center gap-3 overflow-hidden">
                    <i class="pi pi-file text-2xl text-primary"></i>
                    <div class="flex flex-col truncate">
                        <span class="font-medium text-sm truncate">{{ selectedFileName() }}</span>
                        <span *ngIf="fileSize()" class="text-xs text-muted-color">{{ fileSize() }}</span>
                    </div>
                </div>
                <p-button icon="pi pi-times" severity="secondary" [rounded]="true" [text]="true" (onClick)="removeFile()" />
            </div>

            <!-- Subidor de archivos -->
            <p-fileupload 
                *ngIf="!selectedFileName()"
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
                        <i class="pi pi-file-export text-4xl text-muted-color mb-2"></i>
                        <span class="text-muted-color text-sm text-center">Arrastra aquí tu documento o archivo.</span>
                        <small class="text-xs text-muted-color mt-1">Máximo: {{ maxFileSize / 1000000 }} MB</small>
                    </div>
                </ng-template>
            </p-fileupload>
        </div>
    `
})
export class FileUploadComponent {
    @Input() label: string = '';
    @Input() required: boolean = false;
    @Input() accept: string = '.pdf,.doc,.docx,.xls,.xlsx,.zip';
    @Input() maxFileSize: number = 10000000; // 10MB por defecto
    @Input() chooseLabel: string = 'Seleccionar Archivo';

    @Output() onFileSelected = new EventEmitter<File | null>();

    selectedFileName = signal<string | null>(null);
    fileSize = signal<string | null>(null);

    onSelectFile(event: any): void {
        const file: File = event.files[0];
        if (file) {
            this.selectedFileName.set(file.name);
            this.fileSize.set(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
            this.onFileSelected.emit(file);
        }
    }

    removeFile(): void {
        this.selectedFileName.set(null);
        this.fileSize.set(null);
        this.onFileSelected.emit(null);
    }
}