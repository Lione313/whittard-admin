import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { AttributionService } from '@/app/features/products/services/attribution.service';
import { Attribution } from '@/app/features/products/models/attribution.model';
import { DataTableComponent, TableColumn } from '@/app/shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { MediaPickerComponent } from '@/app/shared/components/media-picker/media-picker';
import { BADGE_ACCEPTANCE } from '@/app/shared/utils/media';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-attribution-list',
    standalone: true,
    imports: [FormsModule, ButtonModule, RippleModule, ToastModule, DialogModule, InputTextModule, DataTableComponent, ConfirmDialogComponent, MediaPickerComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <ng-template #toolbarActionsTemplate>
            <p-button label="Nuevo Sello" icon="pi pi-plus" (onClick)="openNew()" />
        </ng-template>

        <app-data-table [title]="'Listado de Sellos'" [data]="attributions()" [columns]="columns" [globalFilterFields]="['name']" [rows]="10" [toolbarActions]="toolbarActionsTemplate" [actionsTemplate]="actionsTemplate" />

        <ng-template #actionsTemplate let-attribution>
            <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" (onClick)="editAttribution(attribution)" />
            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="deleteAttribution(attribution)" />
        </ng-template>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [style]="{ width: '560px' }" [header]="form.id ? 'Editar Sello' : 'Nuevo Sello'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-medium mb-2">Nombre *</label>
                        <input pInputText [(ngModel)]="form.name" class="w-full" />
                        @if (submitted && !form.name.trim()) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Imagen del Sello</label>
                        <app-media-picker
                            [url]="form.image_url || null"
                            [file]="form.file"
                            [accept]="BADGE_ACCEPTANCE.extensions"
                            [maxSize]="BADGE_ACCEPTANCE.maxBytes"
                            kind="image"
                            (urlChange)="onUrlChange($event)"
                            (fileChange)="onFileChange($event)"
                        />
                        @if (submitted && !form.id && !form.file && !form.image_url.trim()) {
                            <small class="text-red-500">Debe subir una imagen.</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveAttribution()" />
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class AttributionList implements OnInit {
    private attributionService = inject(AttributionService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    attributions = signal<Attribution[]>([]);
    // loading = signal(false);
    saving = signal(false);
    dialogVisible = signal(false);
    submitted = false;

    form = {
        id: null as string | null,
        name: '',
        image_url: '',
        file: null as File | null
    };

    BADGE_ACCEPTANCE = BADGE_ACCEPTANCE;

    columns: TableColumn[] = [
        { field: 'name', header: 'Nombre', sortable: true },
        { field: 'products_count', header: 'Productos' }
    ];

    ngOnInit() {
        this.loadAttributions();
    }

    loadAttributions() {
        this.attributionService.list().subscribe({
            next: (res) => {
                this.attributions.set(res.data);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 });
            }
        });
    }

    openNew() {
        this.form = { id: null, name: '', image_url: '', file: null };
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    editAttribution(attribution: Attribution) {
        this.form = {
            id: attribution.id,
            name: attribution.name,
            image_url: attribution.image_url ?? '',
            file: null
        };
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    hideDialog() {
        this.dialogVisible.set(false);
        this.submitted = false;
    }

    onFileChange(file: File | null) {
        this.form.file = file;
        if (file) this.form.image_url = '';
    }

    onUrlChange(url: string | null) {
        this.form.image_url = url ?? '';
        if (url) this.form.file = null;
    }

    saveAttribution() {
        this.submitted = true;
        if (!this.form.name?.trim()) return;

        if (!this.form.id && !this.form.file && !this.form.image_url?.trim()) return;

        this.saving.set(true);

        const form = new FormData();

        form.append('name', this.form.name.trim());

        if (this.form.id) {
            form.append('image_url', this.form.image_url);
            if (this.form.file) form.append('file', this.form.file);
        } else {
            if (this.form.file) form.append('file', this.form.file);
            else form.append('image_url', this.form.image_url);
        }

        const action = this.form.id ? this.attributionService.update(this.form.id, form) : this.attributionService.create(form);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.hideDialog();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadAttributions();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    deleteAttribution(attribution: Attribution) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el sello "${attribution.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.attributionService.remove(attribution.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadAttributions();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
                    }
                });
            }
        });
    }
}
