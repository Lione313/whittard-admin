import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { CustomerService } from '@/app/features/customers/services/customer.service';
import { Customer } from '@/app/features/customers/models/customer.model';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ToastModule, TagModule, InputTextModule, IconFieldModule, InputIconModule, ButtonModule, RippleModule],
    providers: [MessageService],
    template: `
        <div class="card p-0!">
            <p-table
                #dt
                [value]="customers()"
                [lazy]="true"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '85rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Clientes</h5>
                            <small class="text-muted-color block mt-0.5">Cuentas del storefront con sus datos de contacto.</small>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por nombre o email..." class="w-full md:w-64" />
                            </p-iconfield>
                            <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" severity="secondary" title="Recargar" (onClick)="resetAndLoad()" />
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="min-width: 15rem">Cliente</th>
                        <th style="min-width: 15rem">Email</th>
                        <th style="min-width: 9rem">Teléfono</th>
                        <th style="min-width: 7rem">Estado</th>
                        <th style="min-width: 7rem">Direcciones</th>
                        <th style="min-width: 7rem">Facturación</th>
                        <th style="min-width: 8rem">Registro</th>
                    </tr>
                </ng-template>

                <ng-template #body let-customer>
                    <tr class="cursor-pointer" (click)="openDetail(customer)">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-xs font-semibold text-surface-700 dark:text-surface-200 shrink-0">
                                    {{ initials(customer) }}
                                </div>
                                <div class="min-w-0">
                                    <span class="block font-medium text-surface-900 dark:text-surface-0 truncate hover:underline hover:decoration-2 hover:underline-offset-2">{{ fullName(customer) }}</span>
                                    @if (customer.source) {
                                        <p-tag [value]="sourceLabel(customer.source)" [severity]="sourceSeverity(customer.source)" styleClass="mt-1" />
                                    }
                                </div>
                            </div>
                        </td>
                        <td>
                            @if (customer.email) {
                                <span>{{ customer.email }}</span>
                            } @else {
                                <span class="text-muted-color">—</span>
                            }
                        </td>
                        <td>
                            @if (customer.phone) {
                                <span class="whitespace-nowrap">{{ customer.phone }}</span>
                            } @else {
                                <span class="text-muted-color">—</span>
                            }
                        </td>
                        <td>
                            <p-tag [value]="customer.is_active ? 'Activo' : 'Inactivo'" [severity]="customer.is_active ? 'success' : 'danger'" />
                        </td>
                        <td class="text-muted-color">{{ customer.addresses_count }}</td>
                        <td class="text-muted-color">{{ customer.billing_profiles_count }}</td>
                        <td class="text-muted-color whitespace-nowrap">{{ customer.created_at | date: 'dd/MM/yyyy' }}</td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td [attr.colspan]="7">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando clientes...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center p-16">
                            <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                <i class="pi pi-inbox text-3xl"></i>
                                <span>No se encontraron clientes.</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-toast />
    `
})
export class CustomerList implements OnInit, OnDestroy {
    private customerService = inject(CustomerService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    @ViewChild('dt') dt!: Table;

    customers = signal<Customer[]>([]);
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
        this.customers.set([]);
        this.customerService
            .list({
                page,
                per_page: perPage,
                search: this.search() || undefined
            })
            .subscribe({
                next: (res) => {
                    this.customers.set(res.data.items ?? []);
                    this.totalRecords.set(res.data.pagination?.total ?? 0);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.customers.set([]);
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

    openDetail(customer: Customer) {
        this.router.navigate(['/customers', customer.id]);
    }

    fullName(customer: Customer): string {
        return [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Sin nombre';
    }

    initials(customer: Customer): string {
        const name = this.fullName(customer);

        if (name === 'Sin nombre') return '?';

        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('');
    }

    sourceLabel(source: string | null): string {
        switch (source) {
            case 'storefront':
                return 'Tienda web';
            case 'whatsapp':
                return 'WhatsApp';
            case 'facebook':
                return 'Facebook';
            case 'instagram':
                return 'Instagram';
            case 'marketplace':
                return 'Marketplace';
            default:
                return source ? source.charAt(0).toUpperCase() + source.slice(1) : '—';
        }
    }

    sourceSeverity(source: string | null): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        switch (source) {
            case 'storefront':
                return 'info';
            case 'whatsapp':
                return 'success';
            case 'facebook':
                return 'contrast';
            case 'instagram':
                return 'warn';
            default:
                return 'secondary';
        }
    }
}
