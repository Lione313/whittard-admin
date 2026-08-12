import { Component, input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

export interface TableColumn {
    field: string;
    header: string;
    sortable?: boolean;
}

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, TableModule, InputTextModule, ButtonModule, ToolbarModule, IconFieldModule, InputIconModule],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <ng-container *ngTemplateOutlet="toolbarActions() ?? null" />
            </ng-template>
        </p-toolbar>

        <div class="card p-0!">
            <p-table
                #dt
                [value]="data()"
                [rows]="rows()"
                [paginator]="paginator()"
                [globalFilterFields]="globalFilterFields()"
                [tableStyle]="{ 'min-width': '50rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                [showCurrentPageReport]="true"
            >
                <ng-template pTemplate="caption">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">{{ title() }}</h5>
                        <p-iconField iconPosition="left">
                            <p-inputIcon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                        </p-iconField>
                    </div>
                </ng-template>

                <ng-template pTemplate="header">
                    <tr>
                        @for (col of columns(); track col.field) {
                            <th [pSortableColumn]="col.sortable ? col.field : undefined">
                                {{ col.header }}
                                @if (col.sortable) {
                                    <p-sortIcon [field]="col.field" />
                                }
                            </th>
                        }
                        @if (actionsTemplate()) {
                            <th class="text-center">Acciones</th>
                        }
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-rowData>
                    <tr>
                        @for (col of columns(); track col.field) {
                            <td>{{ rowData[col.field] }}</td>
                        }
                        @if (actionsTemplate()) {
                            <td class="text-center">
                                <ng-container *ngTemplateOutlet="actionsTemplate()!; context: { $implicit: rowData }"> </ng-container>
                            </td>
                        }
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td [attr.colspan]="columns().length + (actionsTemplate() ? 1 : 0)" class="text-center p-4 text-muted-color">No se encontraron registros.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class DataTableComponent {
    title = input<string>('Listado');
    data = input.required<any[]>();
    columns = input.required<TableColumn[]>();
    globalFilterFields = input<string[]>([]);
    rows = input<number>(10);
    paginator = input<boolean>(true);
    actionsTemplate = input<TemplateRef<any> | null>(null);
    toolbarActions = input<TemplateRef<any> | null>(null);
}
