import { Component, effect, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { InventoryService } from '@/app/features/inventory/services/inventory.service';
import { useBodyScrollLock } from '@/app/shared/utils/scroll-lock';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-stock-threshold-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, MessageModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-dialog [visible]="visible()" (visibleChange)="visibleChange.emit($event)" [header]="'Umbral de stock bajo'" [modal]="true" [style]="{ width: '420px' }" [closable]="false">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    @if (loadError()) {
                        <p-message severity="error" [text]="loadError() ?? undefined" />
                    }

                    <div>
                        <p class="m-0 text-sm text-muted-color">Una variante se marca como "Stock bajo" cuando su disponible (stock − reservado) es menor o igual a este valor. Se aplica a todo el catálogo.</p>
                    </div>

                    @if (loading()) {
                        <div class="flex items-center justify-center gap-2 py-4 text-muted-color">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>Cargando umbral...</span>
                        </div>
                    } @else {
                        <div>
                            <label class="block font-medium mb-2">Umbral (unidades)</label>
                            <p-inputnumber [(ngModel)]="threshold" [min]="0" [showClear]="true" class="w-full" placeholder="Ej. 5" />
                            <small class="text-muted-color mt-1 block">Vacío o 0 = solo alerta cuando no hay stock.</small>
                        </div>
                    }
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="close()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" [disabled]="loading()" (onClick)="save()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-toast />
    `
})
export class StockThresholdDialog {
    visible = input.required<boolean>();

    visibleChange = output<boolean>();
    saved = output<void>();

    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    threshold = signal<number | null>(null);
    loading = signal(true);
    saving = signal(false);
    loadError = signal<string | null>(null);

    constructor() {
        useBodyScrollLock(this.visible);

        effect(() => {
            if (this.visible()) {
                this.loadThreshold();
            }
        });
    }

    private loadThreshold() {
        this.loading.set(true);
        this.loadError.set(null);
        this.inventoryService.getLowStockThreshold().subscribe({
            next: (res) => {
                this.threshold.set(res.data.low_stock_threshold);
                this.loading.set(false);
            },
            error: (err) => {
                this.loading.set(false);
                this.loadError.set(formatApiError(err));
            }
        });
    }

    save() {
        this.saving.set(true);
        this.inventoryService.setLowStockThreshold(this.threshold() ?? null).subscribe({
            next: (res) => {
                this.saving.set(false);
                this.threshold.set(res.data.low_stock_threshold);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.saved.emit();
                this.close();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    close() {
        this.visibleChange.emit(false);
    }
}
