import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';

import { TaxService } from '@/app/features/tax/services/tax.service';
import { TaxClass, TaxClassPayload } from '@/app/features/tax/models/tax.model';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

interface ClassForm {
    id: string | null;
    name: string;
    code: string;
    rate: number | null;
}

function emptyForm(): ClassForm {
    return { id: null, name: '', code: '', rate: null };
}

@Component({
    selector: 'app-tax-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, ToastModule, ConfirmDialogModule, TagModule, TableModule, DialogModule, InputTextModule, InputNumberModule, MessageModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card p-0!">
            <div class="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                    <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Clases de impuesto</h5>
                    <small class="text-muted-color block mt-1">Cada clase lleva su tasa IGV (%) aplicable en Perú. Los productos se asignan a una clase.</small>
                </div>
                <p-button label="Nueva clase" icon="pi pi-plus" (onClick)="openNew()" />
            </div>

            <div class="overflow-x-auto">
                <p-table [value]="classes()" [loading]="loading()" [showLoader]="false" [rows]="10" [paginator]="true" [rowsPerPageOptions]="[10, 20, 50]" [rowHover]="true" dataKey="id" [tableStyle]="{ 'min-width': '44rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 14rem">Nombre</th>
                            <th style="min-width: 10rem">Código</th>
                            <th style="min-width: 8rem">Tasa (IGV %)</th>
                            <th style="width: 9rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-taxClass>
                        <tr>
                            <td class="font-medium">{{ taxClass.name }}</td>
                            <td><p-tag [value]="taxClass.code" severity="secondary" /></td>
                            <td class="font-semibold">{{ taxClass.rate }}%</td>
                            <td>
                                <div class="flex items-center justify-end gap-1">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar" (onClick)="editClass(taxClass)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar" (onClick)="deleteClass(taxClass)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #loadingbody>
                        <tr>
                            <td colspan="4">
                                <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                    <i class="pi pi-spin pi-spinner"></i>
                                    <span>Cargando clases de impuesto...</span>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="4" class="text-center p-8 text-muted-color">No hay clases de impuesto.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [header]="form.id ? 'Editar clase de impuesto' : 'Nueva clase de impuesto'" [modal]="true" [style]="{ width: '480px' }">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    @if (formError()) {
                        <p-message severity="error" [text]="formError() ?? undefined" />
                    }
                    <div>
                        <label class="block font-medium mb-2">Nombre *</label>
                        <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Ej: General (IGV)" />
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Código *</label>
                        <input pInputText [(ngModel)]="form.code" class="w-full" placeholder="Ej: general" />
                        <small class="text-muted-color mt-1 block">Código único usado internamente (máx. 50 caracteres).</small>
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Tasa (IGV %) *</label>
                        <p-inputnumber [(ngModel)]="form.rate" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" [max]="100" class="w-full" />
                        <small class="text-muted-color mt-1 block">Valor entre 0 y 100. Ej: 18.00 = IGV Perú.</small>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveClass()" />
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class TaxList implements OnInit {
    private taxService = inject(TaxService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    classes = signal<TaxClass[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = signal(false);
    formError = signal<string | null>(null);

    form: ClassForm = emptyForm();

    ngOnInit() {
        this.loadClasses();
    }

    private loadClasses() {
        this.loading.set(true);
        this.classes.set([]);
        this.taxService.listClasses().subscribe({
            next: (res) => {
                this.classes.set(res.data ?? []);
                this.loading.set(false);
            },
            error: (err) => {
                this.classes.set([]);
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    openNew() {
        this.form = emptyForm();
        this.formError.set(null);
        this.dialogVisible.set(true);
    }

    editClass(taxClass: TaxClass) {
        this.form = { id: taxClass.id, name: taxClass.name, code: taxClass.code, rate: taxClass.rate };
        this.formError.set(null);
        this.dialogVisible.set(true);
    }

    closeDialog() {
        this.dialogVisible.set(false);
        this.formError.set(null);
    }

    saveClass() {
        const error = this.validate();

        if (error) {
            this.formError.set(error);

            return;
        }

        this.formError.set(null);
        this.saving.set(true);

        const payload: TaxClassPayload = {
            name: this.form.name.trim(),
            code: this.form.code.trim(),
            rate: this.form.rate ?? 0
        };

        const action = this.form.id ? this.taxService.updateClass(this.form.id, payload) : this.taxService.createClass(payload);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.closeDialog();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadClasses();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    private validate(): string | null {
        if (!this.form.name.trim()) return 'El nombre es obligatorio.';
        if (!this.form.code.trim()) return 'El código es obligatorio.';
        if (this.form.code.trim().length > 50) return 'El código no puede superar los 50 caracteres.';
        if (this.form.rate === null || this.form.rate === undefined) return 'La tasa es obligatoria.';
        if (this.form.rate < 0 || this.form.rate > 100) return 'La tasa debe estar entre 0 y 100.';

        return null;
    }

    deleteClass(taxClass: TaxClass) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la clase "${taxClass.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.taxService.removeClass(taxClass.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadClasses();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }
}
