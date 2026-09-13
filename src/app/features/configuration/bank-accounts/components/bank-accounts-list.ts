import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { DataTable, DataTableColumn } from '@/app/shared/components/data-table/DataTable';
import { BankAccountService } from '../services/bank-account.service';
import { BankAccountDialog } from './bank-account-dialog';
import { BankAccount } from '../models/bank-account.model';
import { Pagination, PaginatedResult } from '@/app/core/models/api.model';

@Component({
    selector: 'app-bank-accounts-list',
    standalone: true,
    imports: [CommonModule, ToastModule, ConfirmDialogModule, DataTable, BankAccountDialog],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />

        <div class="card p-6">
            <app-data-table
                [data]="accounts()"
                [columns]="columns"
                [loading]="loading()"
                tableTitle="Cuentas Bancarias"
                searchPlaceholder="Buscar por Marca..."
                createLabel="Nueva Cuenta"
                [searchFields]="['brand', 'bank_name', 'account_number']"
                editMode="modal"
                [showDelete]="true"
              
                [totalRecords]="pagination()?.total ?? 0"
                [rows]="15"
                (onCreate)="openDialog()"
                (onEdit)="openDialog($event)"
                emptyMessage="No hay registros para Cuentas Bancarias"
                (onDelete)="confirmDelete($event)"
                (onLazyLoad)="onPageChange($event)"
            />
        </div>

        <app-bank-account-dialog
            [(visible)]="displayModal"
            [account]="selectedAccount"
            (saved)="onAccountSaved()"
        />
    `,
})
export class BankAccountsList implements OnInit {
    private service             = inject(BankAccountService);
    private route               = inject(ActivatedRoute);
    private messageService      = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    accounts   = signal<BankAccount[]>([]);
    pagination = signal<Pagination | null>(null);
    loading    = signal(false);

    displayModal    = false;
    selectedAccount: BankAccount | null = null;

    columns: DataTableColumn[] = [
        { field: 'brand',         header: 'Marca',            sortable: true, width: '12rem' },
        { field: 'bankName',      header: 'Entidad Bancaria', sortable: true, width: '14rem' },
        { field: 'accountNumber', header: 'Nro. Cuenta',      width: '14rem' },
        { field: 'cci',           header: 'CCI',              width: '14rem' },
        {
            field: 'currency', header: 'Moneda', type: 'tag', width: '8rem',
            tagLabel:    (v) => v,
            tagSeverity: (v) => v === 'USD' ? 'warn' : 'info',
        },
        {
            field: 'isActive', header: 'Estado', type: 'tag', width: '8rem',
            tagLabel:    (v) => v ? 'Activo' : 'Inactivo',
            tagSeverity: (v) => v ? 'success' : 'danger',
        },
    ];

    ngOnInit(): void {
        const result = this.route.snapshot.data['result'] as PaginatedResult<BankAccount>;
        this.accounts.set(result.items);
        this.pagination.set(result.pagination);
    }

    load(page = 1): void {
        this.loading.set(true);
        this.service.getAll({ page, per_page: 15 }).subscribe({
            next: (res) => {
                this.accounts.set(res.data.items);
                this.pagination.set(res.data.pagination);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas' });
                this.loading.set(false);
            },
        });
    }

    onPageChange(event: any): void {
        const page = (event.first ?? 0) / (event.rows ?? 15) + 1;
        this.load(page);
    }

    openDialog(account: BankAccount | null = null): void {
        this.selectedAccount = account;
        this.displayModal    = true;
    }

    onAccountSaved(): void {
        this.load(this.pagination()?.current_page ?? 1);
    }

    confirmDelete(account: BankAccount): void {
        this.confirmationService.confirm({
            message:     `¿Estás seguro de eliminar la cuenta de ${account.bankName}?`,
            header:      'Confirmar eliminación',
            icon:        'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept:      () => this.delete(account),
        });
    }

    private delete(account: BankAccount): void {
        this.service.delete(account.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cuenta bancaria eliminada' });
                this.load(this.pagination()?.current_page ?? 1);
            },
        });
    }
}