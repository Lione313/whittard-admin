import { Component, input, output, signal, computed, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

export interface DataTableColumn {
    field: string;
    header: string;
    sortable?: boolean;
    width?: string;
    type?: 'text' | 'tag' | 'date' | 'currency' | 'custom';
    tagSeverity?: (value: any) => 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast';
    tagLabel?: (value: any) => string;
    currencyCode?: string;
    dateFormat?: string;
}

/**
 * editMode:
 *   'modal'  → emite onEdit, el padre abre su dialog
 *   'route'  → navega a editRoute(row) o editRouteFn(row)
 *   null     → botón editar no aparece
 */
export type EditMode = 'modal' | 'route';

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, InputIconModule, IconFieldModule, TagModule, ToolbarModule, ToastModule, ConfirmDialogModule, SkeletonModule, TooltipModule],
    template: `
        <!-- Toolbar -->
        @if (showToolbar()) {
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    @if (createLabel()) {
                        <p-button [label]="createLabel()!" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="handleCreate()" />
                    }
                    @if (showDeleteSelected()) {
                        <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined (onClick)="onDeleteSelected.emit(selectedRows())" [disabled]="!selectedRows().length" />
                    }
                </ng-template>
                <ng-template #end>
                    <ng-content select="[toolbar-end]" />
                </ng-template>
            </p-toolbar>
        }

        <!-- Tabla -->
        <p-table
            #dt
            [value]="loading() ? skeletonRows : data()"
            [rows]="rows()"
            [paginator]="paginator()"
            [globalFilterFields]="searchFields()"
            [tableStyle]="tableStyle()"
            [(selection)]="selectedRowsValue"
            [rowHover]="true"
            [dataKey]="dataKey()"
            [currentPageReportTemplate]="pageReportTemplate()"
            [showCurrentPageReport]="showPageReport()"
            [rowsPerPageOptions]="rowsPerPageOptions()"
            [lazy]="lazy()"
            [totalRecords]="totalRecords()"
            (onLazyLoad)="onLazyLoad.emit($event)"
        >
            <!-- Caption / Búsqueda -->
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">{{ tableTitle() }}</h5>
                    @if (searchFields().length) {
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="searchPlaceholder()" />
                        </p-iconfield>
                    }
                </div>
            </ng-template>

            <!-- Header -->
            <ng-template #header>
                <tr>
                    @if (selectable()) {
                        <th style="width: 3rem">
                            <p-tableHeaderCheckbox />
                        </th>
                    }
                    @for (col of columns(); track col.field) {
                        <th [pSortableColumn]="col.sortable ? col.field : ''" [style.min-width]="col.width ?? 'auto'">
                            {{ col.header }}
                            @if (col.sortable) {
                                <p-sortIcon [field]="col.field" />
                            }
                        </th>
                    }
                    @if (hasActionsCol()) {
                        <th style="min-width: 8rem"></th>
                    }
                </tr>
            </ng-template>

            <!-- Body -->
            <ng-template #body let-row>
                <tr>
                    @if (selectable()) {
                        <td style="width: 3rem">
                            <p-tableCheckbox [value]="row" />
                        </td>
                    }

                    @for (col of columns(); track col.field) {
                        <td [style.min-width]="col.width ?? 'auto'">
                            @if (loading()) {
                                <p-skeleton height="1.5rem" />
                            } @else if (col.type === 'tag') {
                                <p-tag [value]="col.tagLabel ? col.tagLabel(getNestedValue(row, col.field)) : getNestedValue(row, col.field)" [severity]="col.tagSeverity ? col.tagSeverity(getNestedValue(row, col.field)) : 'info'" />
                            } @else if (col.type === 'date') {
                                {{ getNestedValue(row, col.field) | date: col.dateFormat ?? 'dd/MM/yyyy' }}
                            } @else if (col.type === 'currency') {
                                {{ getNestedValue(row, col.field) | currency: col.currencyCode ?? 'PEN' : 'symbol' : '1.2-2' }}
                            } @else if (col.type === 'custom') {
                                <ng-container *ngTemplateOutlet="customCellTemplate() ?? null; context: { $implicit: row, col: col }" />
                            } @else {
                                {{ getNestedValue(row, col.field) }}
                            }
                        </td>
                    }

                    <!-- Columna acciones (edit + delete) -->
                    @if (hasActionsCol()) {
                        <td>
                            <div class="flex gap-2">
                                @if (editMode()) {
                                    <p-button icon="pi pi-pencil" severity="secondary" [rounded]="true" [outlined]="true" pTooltip="Editar" tooltipPosition="top" (click)="handleEdit(row)" />
                                }
                                @if (showDelete()) {
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" pTooltip="Eliminar" tooltipPosition="top" (click)="onDelete.emit(row)" />
                                }
                            </div>
                        </td>
                    }
                </tr>
            </ng-template>

            <!-- Empty Message dentro de la tabla -->
            <ng-template #emptymessage>
                @if (!loading()) {
                    <tr>
                        <td [attr.colspan]="totalCols()" class="text-center py-6 text-surface-500">
                            {{ emptyMessage() }}
                        </td>
                    </tr>
                }
            </ng-template>
        </p-table>
    `
})
export class DataTable<T extends Record<string, any> = Record<string, any>> {
    @ViewChild('dt') dt!: Table;

    private router = inject(Router);

    // ─── Data ─────────────────────────────────────────────────────────────────
    data = input<T[]>([]);
    columns = input.required<DataTableColumn[]>();
    loading = input<boolean>(false);
    tableTitle = input<string>('');
    emptyMessage = input<string>('Sin resultados');

    // ─── Editar ───────────────────────────────────────────────────────────────
    /**
     * 'modal' → emite onEdit con la row, el padre maneja el dialog
     * 'route' → navega usando editRouteFn(row)
     *  null   → botón editar no aparece
     */
    editMode = input<EditMode | null>(null);
    editRouteFn = input<((row: T) => string | any[]) | null>(null);

    // ─── Eliminar ─────────────────────────────────────────────────────────────
    showDelete = input<boolean>(false);

    // ─── Selección bulk ───────────────────────────────────────────────────────
    selectable = input<boolean>(false);
    showDeleteSelected = input<boolean>(false);

    // ─── Toolbar ──────────────────────────────────────────────────────────────
    showToolbar = input<boolean>(true);
    /**
     * createLabel + createMode:
     *   'modal' → emite onCreate
     *   'route' → navega a createRoute()
     */
    createLabel = input<string | null>(null);
    createMode = input<'modal' | 'route'>('modal');
    createRoute = input<string | null>(null);

    // ─── Paginación ───────────────────────────────────────────────────────────
    paginator = input<boolean>(true);
    rows = input<number>(10);
    rowsPerPageOptions = input<number[]>([10, 20, 30]);
    showPageReport = input<boolean>(true);
    pageReportTemplate = input<string>('Mostrando {first} a {last} de {totalRecords} registros');

    // ─── Tabla ────────────────────────────────────────────────────────────────
    dataKey = input<string>('id');
    tableStyle = input<Record<string, string>>({ 'min-width': '75rem' });
    searchFields = input<string[]>([]);
    searchPlaceholder = input<string>('Buscar...');

    // ─── Lazy ─────────────────────────────────────────────────────────────────
    lazy = input<boolean>(false);
    totalRecords = input<number>(0);

    // ─── Custom cell ──────────────────────────────────────────────────────────
    customCellTemplate = input<TemplateRef<any> | null>(null);

    // ─── Outputs ──────────────────────────────────────────────────────────────
    onCreate = output<void>();
    onEdit = output<T>();
    onDelete = output<T>();
    onDeleteSelected = output<T[]>();
    onLazyLoad = output<any>();

    // ─── Estado interno ───────────────────────────────────────────────────────
    private _selectedRows = signal<T[]>([]);

    get selectedRowsValue(): T[] {
        return this._selectedRows();
    }
    set selectedRowsValue(val: T[]) {
        this._selectedRows.set(val ?? []);
    }

    selectedRows = this._selectedRows.asReadonly();
    skeletonRows = Array(5).fill({});

    hasActionsCol = computed(() => !!this.editMode() || this.showDelete());

    totalCols = computed(() => this.columns().length + (this.selectable() ? 1 : 0) + (this.hasActionsCol() ? 1 : 0));

    // ─── Handlers ─────────────────────────────────────────────────────────────
    handleCreate() {
        if (this.createMode() === 'route' && this.createRoute()) {
            this.router.navigateByUrl(this.createRoute()!);
        } else {
            this.onCreate.emit();
        }
    }

    handleEdit(row: T) {
        if (this.editMode() === 'route') {
            const fn = this.editRouteFn();
            if (fn) {
                const route = fn(row);
                typeof route === 'string' ? this.router.navigateByUrl(route) : this.router.navigate(route);
            }
        } else {
            this.onEdit.emit(row);
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getNestedValue(obj: Record<string, any>, path: string): any {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }
}
