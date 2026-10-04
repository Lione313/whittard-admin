import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { DataTable, DataTableColumn } from '@/app/shared/components/data-table/DataTable';
import { PickupStoreService } from '../services/pickup-store.service';
import { PickupStore } from '../models/pickup-store.model';

@Component({
    selector: 'app-pickup-stores-list',
    standalone: true,
    imports: [CommonModule, ToastModule, ConfirmDialogModule, DataTable],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />

        <div class="card p-6">
            <app-data-table
                [data]="stores()"
                [columns]="columns"
                [loading]="loading()"
                createLabel="Nuevo Punto de Recojo"
                createMode="route"
                createRoute="/configuration/recojo-en-tienda/create"
                editMode="route"
                [editRouteFn]="editRoute"
                [showDelete]="true"
                [searchFields]="['name', 'address', 'schedule']"
                emptyMessage="No hay puntos de recojo registrados"
                (onDelete)="confirmDelete($event)"
            />
        </div>
    `
})
export class PickupStoresList implements OnInit {
    private service = inject(PickupStoreService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    stores = signal<PickupStore[]>([]);
    loading = signal(false);

    columns: DataTableColumn[] = [
        { field: 'name', header: 'Nombre', sortable: true, width: '16rem' },
        { field: 'address', header: 'Dirección', width: '20rem' },
        { field: 'schedule', header: 'Horario', width: '16rem' },
        { field: 'sort_order', header: 'Orden', width: '6rem' },
        { field: 'is_active', header: 'Estado', type: 'tag', width: '8rem', tagLabel: (v) => (v ? 'Activo' : 'Inactivo'), tagSeverity: (v) => (v ? 'success' : 'danger') },
        { field: 'updated_at', header: 'Actualizado', type: 'date', width: '10rem' }
    ];

    editRoute = (row: PickupStore) => `/configuration/recojo-en-tienda/${row.id}/edit`;

    ngOnInit(): void {
        this.loadStores();
    }

    loadStores(): void {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (res) => {
                this.stores.set(res.data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    confirmDelete(store: PickupStore): void {
        this.confirmationService.confirm({
            message: `¿Eliminar el punto de recojo "${store.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => this.delete(store)
        });
    }

    private delete(store: PickupStore): void {
        this.service.delete(store.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Punto de recojo "${store.name}" eliminado` });
                this.loadStores();
            }
        });
    }
}
