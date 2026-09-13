import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BankAccount, BankAccountPayload } from '../models/bank-account.model';
import { BankAccountService } from '../services/bank-account.service';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-bank-account-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        ToggleSwitchModule,
        ButtonModule
    ],
    template: `
        <p-dialog 
            [(visible)]="visible" 
            (onHide)="onClose()" 
            [header]="account ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'" 
            [modal]="true" 
            [style]="{ width: '450px' }" 
            styleClass="p-fluid">
            
            <form [formGroup]="accountForm" (ngSubmit)="saveAccount()" class="flex flex-col gap-4 pt-2">
                <div class="flex flex-col gap-1">
                    <label for="bankName" class="font-semibold text-sm">Banco *</label>
                    <input pInputText id="bankName" formControlName="bankName" placeholder="Ej: BCP, BBVA, Interbank" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="brand" class="font-semibold text-sm">Marca / Alias (Opcional)</label>
                    <input pInputText id="brand" formControlName="brand" placeholder="Ej: Cuenta Corriente Empresa" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="accountNumber" class="font-semibold text-sm">Número de Cuenta *</label>
                    <input pInputText id="accountNumber" formControlName="accountNumber" placeholder="0011-0123-..." />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="cci" class="font-semibold text-sm">CCI (Opcional)</label>
                    <input pInputText id="cci" formControlName="cci" placeholder="002-191-..." />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="holderName" class="font-semibold text-sm">Titular de la Cuenta *</label>
                    <input pInputText id="holderName" formControlName="holderName" placeholder="Nombre o Razón Social" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label for="accountType" class="font-semibold text-sm">Tipo de Cuenta *</label>
                        <p-select id="accountType" formControlName="accountType" [options]="accountTypeOptions" optionLabel="label" optionValue="value" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label for="currency" class="font-semibold text-sm">Moneda *</label>
                        <p-select id="currency" formControlName="currency" [options]="currencyOptions" optionLabel="label" optionValue="value" />
                    </div>
                </div>

                <div class="flex flex-col gap-1 mt-2">
                    <label class="font-semibold text-sm mb-1">Estado</label>
                    <div class="flex items-center gap-2">
                        <p-toggleswitch formControlName="isActive" />
                        <span class="text-sm">{{ accountForm.get('isActive')?.value ? 'Activo' : 'Inactivo' }}</span>
                    </div>
                </div>

                <div class="flex justify-end gap-2 mt-4">
                    <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="onClose()" />
                    <p-button label="Guardar" type="submit" [loading]="saving()" [disabled]="accountForm.invalid" />
                </div>
            </form>
        </p-dialog>
    `
})
export class BankAccountDialog implements OnChanges {
    private fb = inject(FormBuilder);
    private bankAccountService = inject(BankAccountService);
    private messageService = inject(MessageService);

    @Input() visible = false;
    @Input() account: BankAccount | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<void>();

    saving = signal<boolean>(false);

    currencyOptions = [
        { label: 'Soles (PEN)', value: 'PEN' },
        { label: 'Dólares (USD)', value: 'USD' }
    ];

    accountTypeOptions = [
        { label: 'Ahorros', value: 'savings' },
        { label: 'Corriente', value: 'checking' }
    ];

    accountForm: FormGroup = this.fb.group({
        bankName: ['', Validators.required],
        brand: [''],
        accountNumber: ['', Validators.required],
        cci: [''],
        holderName: ['', Validators.required],
        accountType: ['savings', Validators.required],
        currency: ['PEN', Validators.required],
        isActive: [true]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            if (this.account) {
                const acc = this.account as any;
                this.accountForm.patchValue({
                    bankName: acc.bankName || acc.bank_name,
                    brand: acc.brand || '',
                    accountNumber: acc.accountNumber || acc.account_number,
                    cci: acc.cci || '',
                    holderName: acc.holderName || acc.holder_name,
                    accountType: acc.accountType || acc.account_type || 'savings',
                    currency: acc.currency || 'PEN',
                    isActive: acc.isActive ?? acc.is_active ?? true
                });
            } else {
                this.accountForm.reset({
                    bankName: '',
                    brand: '',
                    accountNumber: '',
                    cci: '',
                    holderName: '',
                    accountType: 'savings',
                    currency: 'PEN',
                    isActive: true
                });
            }
        }
    }

    onClose(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveAccount(): void {
        if (this.accountForm.invalid) return;

        this.saving.set(true);
        const formValues = this.accountForm.value;

        const payload: BankAccountPayload = {
            bank_name: formValues.bankName,
            brand: formValues.brand,
            account_number: formValues.accountNumber,
            cci: formValues.cci,
            holder_name: formValues.holderName,
            account_type: formValues.accountType,
            currency: formValues.currency,
            is_active: formValues.isActive
        };

        const request$ = this.account
            ? this.bankAccountService.update(this.account.id, payload)
            : this.bankAccountService.create(payload);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Cuenta ${this.account ? 'actualizada' : 'creada'} correctamente`
                });
                this.saving.set(false);
                this.saved.emit();
                this.onClose();
            },
            error: (err) => {
                const detail = err?.error?.message || 'No se pudo guardar la cuenta';
                this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail });
                this.saving.set(false);
            }
        });
    }
}