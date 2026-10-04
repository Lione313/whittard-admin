import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';

import { OrderService } from '@/app/features/orders/services/order.service';
import { Order, ORDER_STATUS_META, ORDER_STATUS_OPTIONS, PAYMENT_METHOD_LABELS } from '@/app/features/orders/models/order.model';
import { formatApiError } from '@/app/shared/utils/api-error';
import { CurrencyFormatPipe } from '@/app/shared/pipes/currency-format.pipe';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ToastModule, TagModule, InputTextModule, IconFieldModule, InputIconModule, ButtonModule, SelectModule, RippleModule, CurrencyFormatPipe],
    providers: [MessageService],
    template: `
        <div class="card p-0!">
            <p-table
                [value]="orders()"
                [lazy]="true"
                [loading]="loading()"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '80rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Órdenes</h5>
                            <small class="text-muted-color block mt-0.5">Pedidos realizados desde la tienda.</small>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="onStatusChange($event)" optionLabel="label" optionValue="value" placeholder="Todos los estados" [showClear]="true" styleClass="w-full md:w-48" />
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar N° o cliente..." class="w-full md:w-64" />
                            </p-iconfield>
                            <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" severity="secondary" title="Recargar" (onClick)="reload()" />
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="min-width: 11rem">N° Orden</th>
                        <th style="min-width: 16rem">Cliente</th>
                        <th style="min-width: 8rem">Estado</th>
                        <th style="min-width: 9rem">Pago</th>
                        <th style="min-width: 7rem">Total</th>
                        <th style="min-width: 9rem">Fecha</th>
                    </tr>
                </ng-template>

                <ng-template #body let-order>
                    <tr class="cursor-pointer" (click)="open(order)">
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ order.number }}</td>
                        <td>
                            <div class="min-w-0">
                                <span class="block font-medium text-surface-900 dark:text-surface-0 truncate">{{ customerName(order) }}</span>
                                <small class="text-muted-color block truncate">{{ order.customer?.email || '—' }}</small>
                            </div>
                        </td>
                        <td>
                            <p-tag [value]="statusLabel(order)" [severity]="statusSeverity(order)" />
                        </td>
                        <td class="text-muted-color">{{ paymentLabel(order) }}</td>
                        <td class="font-semibold text-surface-900 dark:text-surface-0">{{ order.total | currencyFormat }}</td>
                        <td class="text-muted-color">{{ order.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center p-10 text-muted-color">No hay órdenes registradas.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
        <p-toast />
    `
})
export class OrderList implements OnInit, OnDestroy {
    private orderService = inject(OrderService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    orders = signal<Order[]>([]);
    loading = signal(false);
    totalRecords = signal(0);
    rowsPerPage = signal(15);
    search = signal('');
    status = signal<string | null>(null);

    readonly statusOptions = ORDER_STATUS_OPTIONS;

    private search$ = new Subject<string>();
    private currentPage = 1;

    ngOnInit(): void {
        this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((value) => {
            this.search.set(value);
            this.currentPage = 1;
            this.fetch();
        });

        this.fetch();
    }

    ngOnDestroy(): void {
        this.search$.complete();
    }

    load(event: TableLazyLoadEvent): void {
        this.currentPage = (event.first ?? 0) / (event.rows ?? this.rowsPerPage()) + 1;
        this.rowsPerPage.set(event.rows ?? 15);
        this.fetch();
    }

    reload(): void {
        this.fetch();
    }

    onSearchChange(value: string): void {
        this.search$.next(value);
    }

    onStatusChange(value: string | null): void {
        this.status.set(value);
        this.currentPage = 1;
        this.fetch();
    }

    open(order: Order): void {
        this.router.navigate(['/orders', order.id]);
    }

    customerName(order: Order): string {
        const name = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ');

        return name || '—';
    }

    statusLabel(order: Order): string {
        return ORDER_STATUS_META[order.status]?.label ?? order.status;
    }

    statusSeverity(order: Order) {
        return ORDER_STATUS_META[order.status]?.severity ?? 'secondary';
    }

    paymentLabel(order: Order): string {
        return PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method;
    }

    private fetch(): void {
        this.loading.set(true);

        this.orderService
            .list({
                page: this.currentPage,
                per_page: this.rowsPerPage(),
                search: this.search() || undefined,
                status: this.status() || undefined
            })
            .subscribe({
                next: (response) => {
                    this.orders.set(response.data.items);
                    this.totalRecords.set(response.data.pagination.total);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
                }
            });
    }
}
