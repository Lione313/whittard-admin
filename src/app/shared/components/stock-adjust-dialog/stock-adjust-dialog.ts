import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { InventoryService } from '@/app/features/inventory/services/inventory.service';
import { VariantStock } from '@/app/features/inventory/models/inventory.model';
import { useBodyScrollLock } from '@/app/shared/utils/scroll-lock';
import { formatApiError } from '@/app/shared/utils/api-error';

export interface StockAdjustContext {
    id: string;
    sku: string;
    product_name?: string | null;
    stock: number;
    reserved_qty: number;
    available: number;
}

@Component({
    selector: 'app-stock-adjust-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, InputNumberModule, SelectButtonModule, MessageModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-dialog [visible]="visible()" (visibleChange)="onVisibleChange($event)" [header]="'Ajustar stock'" [modal]="true" [style]="{ width: '420px' }" [closable]="false">
            <ng-template #content>
                @if (context(); as ctx) {
                    <div class="flex flex-col gap-4">
                        @if (error()) {
                            <p-message severity="error" [text]="error() ?? undefined" />
                        }

                        <p class="m-0 text-sm text-muted-color">
                            {{ ctx.sku }} · Stock actual: <span class="font-semibold text-surface-900 dark:text-surface-0">{{ ctx.stock }}</span>
                        </p>

                        <div>
                            <label class="block font-medium mb-2">Tipo</label>
                            <p-selectbutton [options]="operationOptions" optionLabel="label" optionValue="value" [ngModel]="operation" (ngModelChange)="operation = $event" class="w-full" />
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Cantidad *</label>
                            <p-inputnumber [(ngModel)]="quantity" [min]="1" class="w-full" />
                            <small class="text-muted-color mt-1 block">{{ operation === 'in' ? 'Suma unidades al stock.' : 'Resta unidades del stock.' }}</small>
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Motivo *</label>
                            <input pInputText [(ngModel)]="reasonInput" class="w-full" placeholder="Ej: Reposición de proveedor" />
                        </div>
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="close()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="confirm()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-toast />
    `
})
export class StockAdjustDialog {
    visible = input.required<boolean>();
    context = input.required<StockAdjustContext | null>();

    adjusted = output<VariantStock>();
    visibleChange = output<boolean>();

    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    readonly operationOptions = [
        { label: 'Entrada (+)', value: 'in' as const },
        { label: 'Salida (−)', value: 'out' as const }
    ];

    operation: 'in' | 'out' = 'in';
    quantity: number | null = null;
    reasonInput = signal('');
    saving = signal(false);
    error = signal<string | null>(null);

    constructor() {
        useBodyScrollLock(this.visible);
    }

    onVisibleChange(visible: boolean) {
        this.visibleChange.emit(visible);
        if (!visible) this.reset();
    }

    close() {
        this.visibleChange.emit(false);
        this.reset();
    }

    confirm() {
        const ctx = this.context();

        if (!ctx) return;

        if (this.quantity === null || this.quantity === undefined || this.quantity <= 0) {
            this.error.set('La cantidad debe ser mayor a cero.');

            return;
        }

        if (!this.reasonInput().trim()) {
            this.error.set('Debe indicar el motivo del ajuste.');

            return;
        }

        if (this.operation === 'out' && this.quantity > ctx.available) {
            this.error.set(`La salida (${this.quantity}) supera el disponible (${ctx.available}). Revisa el stock reservado.`);

            return;
        }

        this.error.set(null);
        this.saving.set(true);
        const quantity = this.operation === 'in' ? this.quantity : -this.quantity;

        this.inventoryService.adjustStock(ctx.id, { quantity, reason: this.reasonInput().trim() }).subscribe({
            next: (res) => {
                this.saving.set(false);
                this.adjusted.emit(res.data);
                this.messageService.add({ severity: 'success', summary: 'Stock ajustado', detail: res.message, life: 3000 });
                this.close();
            },
            error: (err) => {
                this.saving.set(false);
                this.error.set(formatApiError(err));
            }
        });
    }

    private reset() {
        this.operation = 'in';
        this.quantity = null;
        this.reasonInput.set('');
        this.error.set(null);
        this.saving.set(false);
    }
}
