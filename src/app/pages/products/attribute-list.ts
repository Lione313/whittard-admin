import { Component, inject, OnInit, signal } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';

import { AttributeService } from '@/app/features/products/services/attribute.service';
import { Attribute } from '@/app/features/products/models/attribute.model';
import { DataTableComponent, TableColumn } from '@/app/shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { SWATCH_ACCEPTANCE } from '@/app/shared/utils/media';
import { formatApiError } from '@/app/shared/utils/api-error';

interface AttributeOptionDraft {
    value: string;
    image_url?: string | null;
    color_hex?: string | null;
    order?: number;
    file?: File | null;
    swatch_mode?: 'none' | 'image' | 'color';
}

interface AttributeFormDraft {
    id?: string;
    type: string;
    label: string;
    options: AttributeOptionDraft[];
}

const COLOR_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

@Component({
    selector: 'app-attribute-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, ToastModule, DialogModule, InputTextModule, SelectModule, ColorPickerModule, DataTableComponent, ConfirmDialogComponent, MediaPickerComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <ng-template #toolbarActionsTemplate>
            <p-button label="Nuevo Atributo" icon="pi pi-plus" (onClick)="openNew()" />
        </ng-template>

        <app-data-table [title]="'Catálogo de Atributos'" [data]="attributes()" [columns]="columns" [globalFilterFields]="['type', 'label']" [rows]="10" [toolbarActions]="toolbarActionsTemplate" [actionsTemplate]="actionsTemplate" />

        <ng-template #actionsTemplate let-attribute>
            <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" (onClick)="editAttribute(attribute)" />
            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="deleteAttribute(attribute)" />
        </ng-template>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [style]="{ width: '640px' }" [header]="form.id ? 'Editar Atributo' : 'Nuevo Atributo'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2">Nombre visible *</label>
                            <input pInputText [ngModel]="form.label" (ngModelChange)="onLabelChange($event)" class="w-full" placeholder="Ej: Presentación" autofocus />
                            <small class="text-muted-color block mt-1">Etiqueta que ve el cliente.</small>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2">Tipo</label>
                            <input pInputText [(ngModel)]="form.type" (ngModelChange)="onTypeChange()" class="w-full" placeholder="Se genera desde el nombre" />
                            <small class="text-muted-color block mt-1">Identificador técnico. Se autocompleta con el nombre; puedes ajustarlo.</small>
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block font-medium">Opciones</label>
                            <p-button label="Agregar opción" icon="pi pi-plus" severity="secondary" text (onClick)="addOption()" />
                        </div>
                        <div class="flex flex-col gap-3">
                            @for (opt of form.options; track opt; let j = $index) {
                                <div class="flex flex-col gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium w-24 shrink-0">Valor</span>
                                        <input pInputText [(ngModel)]="opt.value" class="flex-1" placeholder="Ej: Lata Metálica" />
                                        <p-button icon="pi pi-times" severity="danger" text [rounded]="true" title="Quitar opción" (onClick)="removeOption(j)" />
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium w-24 shrink-0">Swatch</span>
                                        <div class="flex-1 flex items-center gap-3">
                                            <p-select [ngModel]="swatchType(opt)" (ngModelChange)="setSwatchType(opt, $event)" [options]="swatchTypeOptions" optionLabel="label" optionValue="value" class="w-32 shrink-0" />
                                            @if (swatchType(opt) === 'image') {
                                                <app-media-picker
                                                    class="flex-1"
                                                    [url]="opt.image_url ?? null"
                                                    [file]="opt.file ?? null"
                                                    [accept]="SWATCH_ACCEPTANCE.extensions"
                                                    [maxSize]="SWATCH_ACCEPTANCE.maxBytes"
                                                    kind="image"
                                                    previewClass="w-10 h-10"
                                                    (urlChange)="onSwatchUrlChange(j, $event)"
                                                    (fileChange)="onSwatchFileChange(j, $event)"
                                                />
                                            } @else if (swatchType(opt) === 'color') {
                                                <div class="flex items-center gap-2">
                                                    <p-colorpicker [ngModel]="opt.color_hex" (ngModelChange)="onSwatchColorChange(j, $event)" [style]="{ width: '2rem', height: '2rem' }" />
                                                    <input pInputText [ngModel]="opt.color_hex" (ngModelChange)="onSwatchColorChange(j, $event)" class="w-32 font-mono" placeholder="#RRGGBB" />
                                                </div>
                                            } @else {
                                                <small class="text-muted-color">Sin representación visual.</small>
                                            }
                                        </div>
                                    </div>
                                </div>
                            } @empty {
                                <small class="text-muted-color">Sin opciones. Agrega al menos una.</small>
                            }
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveAttribute()" />
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class AttributeList implements OnInit {
    private attributeService = inject(AttributeService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private cdr = inject(ChangeDetectorRef);

    attributes = signal<Attribute[]>([]);
    saving = signal(false);
    dialogVisible = signal(false);
    submitted = false;
    typeEdited = false;

    form: AttributeFormDraft = { type: '', label: '', options: [] };

    SWATCH_ACCEPTANCE = SWATCH_ACCEPTANCE;

    swatchTypeOptions = [
        { label: 'Ninguno', value: 'none' },
        { label: 'Imagen', value: 'image' },
        { label: 'Color', value: 'color' }
    ];

    columns: TableColumn[] = [
        { field: 'label', header: 'Nombre', sortable: true },
        { field: 'type', header: 'Tipo', sortable: true },
        { field: 'options_count', header: 'Opciones' }
    ];

    ngOnInit() {
        this.loadAttributes();
    }

    loadAttributes() {
        this.attributeService.list().subscribe({
            next: (res) => this.attributes.set(res.data.map((a) => ({ ...a, options_count: a.options_count ?? a.options?.length ?? 0 }))),
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 })
        });
    }

    openNew() {
        this.form = { type: '', label: '', options: [] };
        this.typeEdited = false;
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    editAttribute(attribute: Attribute) {
        this.form = {
            id: attribute.id,
            type: attribute.type,
            label: attribute.label,
            options: (attribute.options ?? []).map((o) => {
                const swatch_mode = o.color_hex ? 'color' : o.image_url ? 'image' : 'none';
                return { value: o.value, image_url: o.image_url ?? null, color_hex: o.color_hex ?? null, order: o.order ?? 0, swatch_mode };
            })
        };
        this.typeEdited = false;
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    hideDialog() {
        this.dialogVisible.set(false);
        this.submitted = false;
    }

    onLabelChange(label: string) {
        this.form.label = label;
        if (!this.typeEdited) {
            this.form.type = this.slugify(label);
        }
    }

    onTypeChange() {
        this.typeEdited = true;
    }

    private slugify(value: string): string {
        return (value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    addOption() {
        this.form.options = [...this.form.options, { value: '', image_url: null, color_hex: null, order: this.form.options.length, swatch_mode: 'none' }];
    }

    removeOption(index: number) {
        this.form.options = this.form.options.filter((_, i) => i !== index);
    }

    swatchType(opt: AttributeOptionDraft): 'none' | 'image' | 'color' {
        return opt.swatch_mode ?? 'none';
    }

    setSwatchType(opt: AttributeOptionDraft, type: 'none' | 'image' | 'color' | null) {
        opt.swatch_mode = type ?? 'none';
        if (type === 'image') {
            opt.color_hex = null;
        } else if (type === 'color') {
            opt.image_url = null;
            opt.file = null;
        } else {
            opt.image_url = null;
            opt.file = null;
            opt.color_hex = null;
        }
        this.cdr.detectChanges();
    }

    onSwatchFileChange(index: number, file: File | null) {
        this.form.options[index] = { ...this.form.options[index], file, image_url: null, color_hex: null, swatch_mode: file ? 'image' : 'none' };
        this.form.options = [...this.form.options];
        this.cdr.detectChanges();
    }

    onSwatchUrlChange(index: number, url: string | null) {
        this.form.options[index] = { ...this.form.options[index], file: null, image_url: url, color_hex: null, swatch_mode: url ? 'image' : 'none' };
        this.form.options = [...this.form.options];
        this.cdr.detectChanges();
    }

    onSwatchColorChange(index: number, color: string | null) {
        this.form.options[index] = { ...this.form.options[index], file: null, image_url: null, color_hex: color, swatch_mode: color ? 'color' : 'none' };
        this.form.options = [...this.form.options];
        this.cdr.detectChanges();
    }

    saveAttribute() {
        this.submitted = true;
        if (!this.form.label?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre visible es obligatorio.', life: 4000 });
            return;
        }
        if (!this.form.type?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La clave técnica es obligatoria.', life: 4000 });
            return;
        }
        if (!this.form.options.length) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Debe existir al menos una opción.', life: 4000 });
            return;
        }

        for (const [i, opt] of this.form.options.entries()) {
            if (!opt.value?.trim()) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: `La opción ${i + 1} debe tener un valor.`, life: 4000 });
                return;
            }
            const hasImage = !!(opt.image_url || opt.file);
            const hasColor = !!opt.color_hex;
            if (hasImage && hasColor) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: `La opción "${opt.value}" no puede tener imagen y color a la vez.`, life: 4000 });
                return;
            }
            if (opt.color_hex && !COLOR_HEX_REGEX.test(opt.color_hex)) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: `El color "${opt.color_hex}" debe estar en formato hexadecimal (#RRGGBB).`, life: 4000 });
                return;
            }
        }

        this.saving.set(true);
        const formData = new FormData();
        formData.append('type', this.form.type.trim());
        formData.append('label', this.form.label.trim());
        this.form.options.forEach((opt, oi) => {
            formData.append(`options[${oi}][value]`, opt.value.trim());
            if (opt.file) {
                formData.append(`options[${oi}][file]`, opt.file);
            } else if (opt.image_url) {
                formData.append(`options[${oi}][image_url]`, opt.image_url);
            } else if (opt.color_hex) {
                formData.append(`options[${oi}][color_hex]`, opt.color_hex);
            }
            formData.append(`options[${oi}][order]`, String(opt.order ?? oi));
        });

        const action = this.form.id ? this.attributeService.update(this.form.id, formData) : this.attributeService.create(formData);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.hideDialog();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadAttributes();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    deleteAttribute(attribute: Attribute) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el atributo "${attribute.label}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.attributeService.remove(attribute.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadAttributes();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }
}
