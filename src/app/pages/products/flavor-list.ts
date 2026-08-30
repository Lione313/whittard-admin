import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { FlavorService } from '@/app/features/products/services/flavor.service';
import { Flavor, FlavorPayload } from '@/app/features/products/models/flavor.model';
import { DataTableComponent, TableColumn } from '@/app/shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-flavor-list',
    standalone: true,
    imports: [FormsModule, ButtonModule, RippleModule, ToastModule, DialogModule, InputTextModule, MessageModule, DataTableComponent, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <ng-template #toolbarActionsTemplate>
            <p-button label="Nuevo Sabor" icon="pi pi-plus" (onClick)="openNew()" />
        </ng-template>

        <app-data-table [title]="'Listado de Sabores'" [data]="flavors()" [columns]="columns" [globalFilterFields]="['name']" [rows]="10" [toolbarActions]="toolbarActionsTemplate" [actionsTemplate]="actionsTemplate" />

        <ng-template #actionsTemplate let-flavor>
            <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" (onClick)="editFlavor(flavor)" />
            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="deleteFlavor(flavor)" />
        </ng-template>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [style]="{ width: '560px' }" [header]="form.id ? 'Editar Sabor' : 'Nuevo Sabor'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-medium mb-2">Nombre *</label>
                        <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Ej: Vainilla" />
                        @if (submitted && !form.name.trim()) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                    </div>
                    <p-message severity="info" text="Los sabores se usan para clasificar productos. Eliminar un sabor no elimina productos, solo quita la asociación." />
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveFlavor()" />
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class FlavorList implements OnInit {
    private flavorService = inject(FlavorService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    flavors = signal<Flavor[]>([]);
    saving = signal(false);
    dialogVisible = signal(false);
    submitted = false;

    form = {
        id: null as string | null,
        name: ''
    };

    columns: TableColumn[] = [
        { field: 'name', header: 'Nombre', sortable: true },
        { field: 'products_count', header: 'Productos' }
    ];

    ngOnInit() {
        this.loadFlavors();
    }

    loadFlavors() {
        this.flavorService.list().subscribe({
            next: (res) => {
                this.flavors.set(res.data);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 });
            }
        });
    }

    openNew() {
        this.form = { id: null, name: '' };
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    editFlavor(flavor: Flavor) {
        this.form = {
            id: flavor.id,
            name: flavor.name
        };
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    hideDialog() {
        this.dialogVisible.set(false);
        this.submitted = false;
    }

    saveFlavor() {
        this.submitted = true;
        if (!this.form.name?.trim()) return;

        this.saving.set(true);
        const payload: FlavorPayload = { name: this.form.name.trim() };

        const action = this.form.id ? this.flavorService.update(this.form.id, payload) : this.flavorService.create(payload);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.hideDialog();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadFlavors();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    deleteFlavor(flavor: Flavor) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el sabor "${flavor.name}"? Se quitará de ${flavor.products_count} producto${flavor.products_count === 1 ? '' : 's'} sin eliminarlos.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.flavorService.remove(flavor.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadFlavors();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
                    }
                });
            }
        });
    }
}
