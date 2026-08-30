import { Component, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { MediaAcceptance } from '@/app/shared/utils/media';
import { useBodyScrollLock } from '@/app/shared/utils/scroll-lock';
import { MediaDraft } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-product-media-editor',
    standalone: true,
    imports: [FormsModule, ButtonModule, SelectModule, CheckboxModule, DialogModule, MediaPickerComponent],
    template: `
        <p-dialog [visible]="visible()" (visibleChange)="visibleChange.emit($event)" [header]="isNew() ? 'Agregar multimedia' : 'Editar multimedia'" [modal]="true" [style]="{ width: '480px' }">
            <ng-template #content>
                @if (media(); as m) {
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-3">
                            <div class="flex-1">
                                <label class="block font-medium mb-2">Tipo</label>
                                <p-select [ngModel]="m.type" (ngModelChange)="onTypeChange($event)" [options]="mediaTypeOptions()" optionLabel="label" optionValue="value" emptyMessage="Sin resultados" class="w-full" />
                            </div>
                            <div class="flex-1">
                                <label class="block font-medium mb-2">Principal</label>
                                <p-checkbox [binary]="true" [ngModel]="m.is_primary" (ngModelChange)="onPrimaryChange($event)" inputId="media-primary-check" />
                            </div>
                        </div>
                        <app-media-picker
                            [url]="m.url"
                            [file]="m.file"
                            [accept]="acceptance().extensions"
                            [maxSize]="acceptance().maxBytes"
                            [kind]="m.type === 'video' ? 'video' : 'image'"
                            (urlChange)="urlChange.emit($event)"
                            (fileChange)="fileChange.emit($event)"
                        />
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="onClose.emit()" />
                    <p-button label="Guardar" icon="pi pi-check" (onClick)="save.emit()" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class MediaEditorDialog {
    visible = input.required<boolean>();
    media = input.required<MediaDraft | null>();
    isNew = input.required<boolean>();
    mediaTypeOptions = input.required<{ label: string; value: string }[]>();
    acceptance = input.required<MediaAcceptance>();

    visibleChange = output<boolean>();
    onClose = output<void>();
    save = output<void>();
    urlChange = output<string | null>();
    fileChange = output<File | null>();

    constructor() {
        useBodyScrollLock(this.visible);
    }

    onTypeChange(value: string) {
        const media = this.media();

        if (!media) return;
        media.type = value === 'video' ? 'video' : 'image';
    }

    onPrimaryChange(value: boolean) {
        const media = this.media();

        if (!media) return;
        media.is_primary = value;
    }
}
