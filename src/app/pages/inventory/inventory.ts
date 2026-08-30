import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';

import { InventoryService } from '@/app/features/inventory/services/inventory.service';
import { AdjustBatchPayload, InventoryFilter, InventoryItem, InventorySummary } from '@/app/features/inventory/models/inventory.model';
import { formatApiError } from '@/app/shared/utils/api-error';
import { CurrencyFormatPipe } from '@/app/shared/pipes/currency-format.pipe';
import { StockAdjustContext, StockAdjustDialog } from '@/app/shared/components/stock-adjust-dialog/stock-adjust-dialog';
import { StockMovementsDialog } from '@/app/shared/components/stock-movements-dialog/stock-movements-dialog';
import { StockThresholdDialog } from '@/app/shared/components/stock-threshold-dialog/stock-threshold-dialog';

@Component({
    selector: 'app-inventory-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        TagModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        DialogModule,
        InputNumberModule,
        MessageModule,
        CurrencyFormatPipe,
        StockAdjustDialog,
        StockMovementsDialog,
        StockThresholdDialog
    ],
    providers: [MessageService],
    template: `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="card !m-0 !p-4 flex flex-col gap-1">
                <span class="text-sm text-muted-color">Stock bajo</span>
                <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary()?.low_stock_count ?? '—' }}</span>
                <span class="text-xs text-muted-color">{{ summary()?.total_variants ?? 0 }} variantes</span>
            </div>
            <div class="card !m-0 !p-4 flex flex-col gap-1">
                <span class="text-sm text-muted-color">Agotados</span>
                <span class="text-2xl font-bold text-red-500">{{ summary()?.out_of_stock_count ?? '—' }}</span>
                <span class="text-xs text-muted-color">sin disponible</span>
            </div>
            <div class="card !m-0 !p-4 flex flex-col gap-1">
                <span class="text-sm text-muted-color">Unidades disponibles</span>
                <span class="text-2xl font-bold">{{ summary()?.total_available ?? '—' }}</span>
                <span class="text-xs text-muted-color">{{ summary()?.total_reserved ?? 0 }} reservadas</span>
            </div>
            <div class="card !m-0 !p-4 flex flex-col gap-1">
                <span class="text-sm text-muted-color">Valor del inventario</span>
                <span class="text-2xl font-bold">{{ summary()?.inventory_value ?? 0 | currencyFormat }}</span>
                <span class="text-xs text-muted-color">{{ summary()?.total_products ?? 0 }} productos</span>
            </div>
        </div>

        <div class="card p-0!">
            <p-table
                #dt
                [value]="rows()"
                [lazy]="true"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '80rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} variantes"
                [showCurrentPageReport]="true"
                [(selection)]="selection"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Inventario</h5>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-select
                                [ngModel]="filter()"
                                (ngModelChange)="onFilterChange($event)"
                                [options]="filterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Disponibilidad"
                                emptyMessage="Sin resultados"
                                showClear
                                class="w-full md:w-44"
                            />
                            <p-button label="Umbral de stock" icon="pi pi-sliders-h" severity="secondary" [outlined]="true" (onClick)="thresholdVisible.set(true)" />
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por SKU o producto..." class="w-full md:w-64" />
                            </p-iconfield>
                            @if (selection().length > 0) {
                                <p-button label="Ajustar en lote" icon="pi pi-sliders-h" severity="secondary" [outlined]="true" (onClick)="openBatchAdjust()" />
                            }
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="width: 3rem">
                            <p-tableHeaderCheckbox />
                        </th>
                        <th pSortableColumn="sku" style="min-width: 11rem">SKU <p-sortIcon field="sku" /></th>
                        <th style="min-width: 14rem">Producto</th>
                        <th pSortableColumn="stock" style="min-width: 6rem">Stock <p-sortIcon field="stock" /></th>
                        <th pSortableColumn="reserved_qty" style="min-width: 6rem">Reservado <p-sortIcon field="reserved_qty" /></th>
                        <th pSortableColumn="available" style="min-width: 6rem">Disponible <p-sortIcon field="available" /></th>
                        <th style="min-width: 7rem">Estado</th>
                        <th style="width: 8rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-row>
                    <tr>
                        <td><p-tableCheckbox [value]="row" /></td>
                        <td class="font-mono font-medium">{{ row.sku }}</td>
                        <td class="font-medium">{{ row.product_name }}</td>
                        <td class="text-muted-color">{{ row.stock }}</td>
                        <td class="text-muted-color">{{ row.reserved_qty }}</td>
                        <td>
                            <span [class]="row.available <= 0 ? 'text-red-500 font-semibold' : 'font-semibold'">{{ row.available }}</span>
                        </td>
                        <td>
                            @if (row.available <= 0) {
                                <p-tag value="Agotado" severity="danger" />
                            } @else if (row.is_low) {
                                <p-tag value="Stock bajo" severity="warn" />
                            } @else {
                                <p-tag value="Disponible" severity="success" />
                            }
                        </td>
                        <td>
                            <div class="flex items-center justify-end gap-1">
                                <p-button icon="pi pi-history" [rounded]="true" [text]="true" severity="secondary" title="Historial" (onClick)="openHistory(row)" />
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Ajustar stock" (onClick)="openAdjust(row)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td [attr.colspan]="8">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando inventario...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center p-16">
                            <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                <i class="pi pi-inbox text-3xl"></i>
                                <span>No se encontraron variantes.</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <app-stock-adjust-dialog [visible]="adjustVisible()" [context]="adjustContext()" (visibleChange)="adjustVisible.set($event)" (adjusted)="onAdjusted()" />

        <app-stock-movements-dialog [visible]="historyVisible()" [context]="historyContext()" (visibleChange)="historyVisible.set($event)" />

        <app-stock-threshold-dialog [visible]="thresholdVisible()" (visibleChange)="thresholdVisible.set($event)" (saved)="onAdjusted()" />

        <p-dialog [visible]="batchVisible()" (visibleChange)="batchVisible.set($event)" header="Ajustar stock en lote" [modal]="true" [style]="{ width: '440px' }" [blockScroll]="true" [closable]="false">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    @if (batchError()) {
                        <p-message severity="error" [text]="batchError() ?? undefined" />
                    }
                    <div>
                        <span class="text-sm text-muted-color">Se ajustarán</span>
                        <span class="block text-lg font-semibold">{{ selection().length }} variante{{ selection().length === 1 ? '' : 's' }}</span>
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Cantidad *</label>
                        <p-inputnumber [(ngModel)]="batchQuantity" class="w-full" />
                        <small class="text-muted-color mt-1 block">Positivo = entrada, negativo = salida. Se aplica a todas las seleccionadas.</small>
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Motivo</label>
                        <input pInputText [(ngModel)]="batchReason" class="w-full" placeholder="Ej: Reposición de proveedor" />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeBatchAdjust()" />
                    <p-button label="Ajustar" icon="pi pi-check" [loading]="batchSaving()" (onClick)="confirmBatchAdjust()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-toast />
    `
})
export class InventoryManagement implements OnInit, OnDestroy {
    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    @ViewChild('dt') dt!: Table;

    rows = signal<InventoryItem[]>([]);
    loading = signal(false);
    totalRecords = signal(0);
    rowsPerPage = signal(15);
    search = signal('');
    filter = signal<InventoryFilter | null>(null);
    sortField = signal('sku');
    sortOrder = signal<'asc' | 'desc'>('asc');
    summary = signal<InventorySummary | null>(null);
    selection = signal<InventoryItem[]>([]);

    adjustVisible = signal(false);
    adjustContext = signal<StockAdjustContext | null>(null);

    thresholdVisible = signal(false);

    historyVisible = signal(false);
    historyContext = signal<{ id: string; sku: string; product_name?: string | null } | null>(null);

    batchVisible = signal(false);
    batchQuantity: number | null = null;
    batchReason = '';
    batchError = signal<string | null>(null);
    batchSaving = signal(false);

    private search$ = new Subject<string>();

    readonly filterOptions = [
        { label: 'Stock bajo', value: 'low' as const },
        { label: 'Agotados', value: 'out_of_stock' as const },
        { label: 'Disponible', value: 'available' as const }
    ];

    ngOnInit() {
        this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.resetAndLoad());
        this.loadSummary();
    }

    ngOnDestroy() {
        this.search$.complete();
    }

    private loadSummary() {
        this.inventoryService.summary().subscribe({
            next: (res) => this.summary.set(res.data),
            error: () => this.summary.set(null)
        });
    }

    load(event: TableLazyLoadEvent) {
        const page = event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
        const perPage = event.rows ?? this.rowsPerPage();

        this.rowsPerPage.set(perPage);

        let sort = 'sku';
        let direction: 'asc' | 'desc' = 'asc';

        if (event.sortField && typeof event.sortField === 'string') {
            sort = event.sortField;
            direction = event.sortOrder === -1 ? 'desc' : 'asc';
        }

        this.loading.set(true);
        this.rows.set([]);
        this.inventoryService
            .list({
                page,
                per_page: perPage,
                search: this.search() || undefined,
                filter: this.filter() ?? undefined,
                sort,
                direction
            })
            .subscribe({
                next: (res) => {
                    this.rows.set(res.data.items ?? []);
                    this.totalRecords.set(res.data.pagination?.total ?? 0);
                    this.selection.set([]);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.rows.set([]);
                    this.totalRecords.set(0);
                    this.loading.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
                }
            });
    }

    onSearchChange(value: string) {
        this.search.set(value ?? '');
        this.search$.next(this.search());
    }

    onFilterChange(value: InventoryFilter | null) {
        this.filter.set(value ?? null);
        this.resetAndLoad();
    }

    resetAndLoad() {
        this.dt?.reset();
    }

    openAdjust(item: InventoryItem) {
        this.adjustContext.set({
            id: item.id,
            sku: item.sku,
            product_name: item.product_name,
            stock: item.stock,
            reserved_qty: item.reserved_qty,
            available: item.available
        });
        this.adjustVisible.set(true);
    }

    onAdjusted() {
        this.resetAndLoad();
        this.loadSummary();
    }

    openHistory(item: InventoryItem) {
        this.historyContext.set({
            id: item.id,
            sku: item.sku,
            product_name: item.product_name
        });
        this.historyVisible.set(true);
    }

    openBatchAdjust() {
        this.batchQuantity = null;
        this.batchReason = '';
        this.batchError.set(null);
        this.batchVisible.set(true);
    }

    closeBatchAdjust() {
        this.batchVisible.set(false);
        this.batchError.set(null);
    }

    confirmBatchAdjust() {
        if (this.selection().length === 0) {
            this.batchError.set('No hay variantes seleccionadas.');

            return;
        }

        if (this.batchQuantity === null || this.batchQuantity === undefined || this.batchQuantity === 0) {
            this.batchError.set('La cantidad debe ser distinta de cero.');

            return;
        }

        this.batchError.set(null);
        this.batchSaving.set(true);

        const payload: AdjustBatchPayload = {
            items: this.selection().map((item) => ({ variant_id: item.id, quantity: this.batchQuantity! })),
            reason: this.batchReason.trim() || undefined
        };

        this.inventoryService.adjustBatch(payload).subscribe({
            next: (res) => {
                this.batchSaving.set(false);
                this.closeBatchAdjust();
                this.messageService.add({ severity: 'success', summary: 'Lote ajustado', detail: res.message, life: 3000 });
                this.resetAndLoad();
                this.loadSummary();
            },
            error: (err) => {
                this.batchSaving.set(false);
                this.batchError.set(formatApiError(err));
            }
        });
    }
}
