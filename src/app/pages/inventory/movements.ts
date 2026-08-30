import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { InventoryService } from '@/app/features/inventory/services/inventory.service';
import { GlobalStockMovement } from '@/app/features/inventory/models/inventory.model';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-inventory-movements',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ToastModule, InputTextModule, IconFieldModule, InputIconModule],
    providers: [MessageService],
    template: `
        <div class="card p-0!">
            <p-table
                #dt
                [value]="movements()"
                [lazy]="true"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Movimientos de inventario</h5>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por SKU..." class="w-full md:w-56" />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="min-width: 10rem">SKU</th>
                        <th style="min-width: 14rem">Producto</th>
                        <th style="min-width: 6rem">Cantidad</th>
                        <th style="min-width: 12rem">Motivo</th>
                        <th style="min-width: 9rem">Fecha</th>
                    </tr>
                </ng-template>

                <ng-template #body let-movement>
                    <tr>
                        <td class="font-mono font-medium">{{ movement.variant?.sku ?? '—' }}</td>
                        <td class="font-medium">{{ movement.variant?.product_name ?? '—' }}</td>
                        <td>
                            <span [class]="movement.quantity >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 font-semibold'"> {{ movement.quantity >= 0 ? '+' : '' }}{{ movement.quantity }} </span>
                        </td>
                        <td class="text-muted-color">{{ movement.reason || '—' }}</td>
                        <td class="text-muted-color">{{ movement.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td [attr.colspan]="5">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando movimientos...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="5" class="text-center p-16">
                            <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                <i class="pi pi-inbox text-3xl"></i>
                                <span>Sin movimientos registrados.</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-toast />
    `
})
export class InventoryMovements implements OnInit, OnDestroy {
    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    @ViewChild('dt') dt!: Table;

    movements = signal<GlobalStockMovement[]>([]);
    loading = signal(false);
    totalRecords = signal(0);
    rowsPerPage = signal(15);
    search = signal('');

    private search$ = new Subject<string>();

    ngOnInit() {
        this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.resetAndLoad());
    }

    ngOnDestroy() {
        this.search$.complete();
    }

    load(event: TableLazyLoadEvent) {
        const page = event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
        const perPage = event.rows ?? this.rowsPerPage();

        this.rowsPerPage.set(perPage);

        this.loading.set(true);
        this.movements.set([]);
        this.inventoryService
            .movements({
                page,
                per_page: perPage,
                sku: this.search() || undefined
            })
            .subscribe({
                next: (res) => {
                    this.movements.set(res.data.items ?? []);
                    this.totalRecords.set(res.data.pagination?.total ?? 0);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.movements.set([]);
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

    resetAndLoad() {
        this.dt?.reset();
    }
}
