import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataTable, DataTableColumn } from '@/app/shared/components/data-table/DataTable';
import { ScriptService } from '../services/script.service';
import { Script } from '../models/script.model';
import { PaginatedResult } from '@/app/core/models/api.model';
import { TableLazyLoadEvent } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-scripts-list',
    standalone: true,
    imports: [DataTable, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <app-data-table
            caption="Scripts"
            [data]="items()"
            [columns]="columns"
            [loading]="loading()"
            [lazy]="true"
            [totalRecords]="total()"
            [rows]="15"
            [searchFields]="['name', 'identifier']"
            createLabel="Nuevo script"
            createMode="route"
            createRoute="/configuration/scripts/create"
            editMode="route"
            emptyMessage="No hay registros para Scripts"
            [editRouteFn]="editRoute"
            [showDelete]="true"
            (onDelete)="onDelete($event)"
            (onLazyLoad)="onPageChange($event)"
        />
    `
})
export class ScriptsList implements OnInit {
    initialData = input.required<PaginatedResult<Script>>();

    private scriptService = inject(ScriptService);
    private router = inject(Router);
    private toast = inject(MessageService);

    items = signal<Script[]>([]);
    total = signal(0);
    loading = signal(false);

    columns: DataTableColumn[] = [
        { field: 'name', header: 'Nombre', sortable: true },
        { field: 'identifier', header: 'Identificador', sortable: true },
        { field: 'consentType.label', header: 'Consentimiento' },
        { field: 'order', header: 'Orden', sortable: true, width: '6rem' },
        {
            field: 'isActive',
            header: 'Estado',
            type: 'tag',
            tagLabel: (v) => (v ? 'Activo' : 'Inactivo'),
            tagSeverity: (v) => (v ? 'success' : 'danger')
        },
        { field: 'createdAt', header: 'Creado', type: 'date', dateFormat: 'dd/MM/yyyy' }
    ];

    editRoute = (row: Script) => `/configuration/scripts/${row.id}/edit`;

    ngOnInit(): void {
        const data = this.initialData();
        this.items.set(data.items);
        this.total.set(data.pagination.total);
    }

    onPageChange(event: TableLazyLoadEvent): void {
        const page = (event.first ?? 0) / (event.rows ?? 15) + 1;
        this.load(page, event.rows ?? 15);
    }

    load(page: number, perPage = 15): void {
        this.loading.set(true);
        this.scriptService.getAll({ page, per_page: perPage }).subscribe({
            next: (res) => {
                this.items.set(res.data.items);
                this.total.set(res.data.pagination.total);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    onDelete(script: Script): void {
        this.scriptService.delete(script.id).subscribe({
            next: () => {
                this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Script eliminado correctamente.' });
                this.load(1);
            },
            error: () => {
                this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el script.' });
            }
        });
    }
}
