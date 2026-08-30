import { Component, effect, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InventoryService } from '@/app/features/inventory/services/inventory.service';
import { StockMovement, StockMovementType, STOCK_MOVEMENT_TYPE_OPTIONS } from '@/app/features/inventory/models/inventory.model';
import { useBodyScrollLock } from '@/app/shared/utils/scroll-lock';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-stock-movements-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-dialog [visible]="visible()" (visibleChange)="visibleChange.emit($event)" [header]="'Historial de stock'" [modal]="true" [style]="{ width: '560px' }" [maximizable]="true">
            <ng-template #content>
                @if (context(); as ctx) {
                    @if (ctx.product_name) {
                        <div class="mb-4 font-medium">{{ ctx.product_name }}</div>
                    }
                }

                @if (loading()) {
                    <div class="flex flex-col items-center justify-center gap-2 py-10 text-muted-color">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                        <span>Cargando movimientos...</span>
                    </div>
                } @else if (movements().length === 0) {
                    <div class="flex flex-col items-center justify-center gap-2 py-10 text-muted-color">
                        <i class="pi pi-inbox text-2xl"></i>
                        <span>Aún no hay movimientos registrados.</span>
                    </div>
                } @else {
                    <div class="relative">
                        <div class="absolute left-[13px] top-1 bottom-1 w-px bg-surface-200 dark:bg-surface-700"></div>
                        <div class="flex flex-col gap-4">
                            @for (movement of movements(); track movement.id) {
                                <div class="flex items-start gap-3">
                                    <span class="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" [class]="dotClass(movement.type)">
                                        <i [class]="dotIcon(movement.type)" class="text-xs"></i>
                                    </span>
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="font-medium text-sm">{{ movementTypeLabel(movement.type) }}</span>
                                            <span [class]="movement.quantity >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 font-semibold'"> {{ movement.quantity >= 0 ? '+' : '' }}{{ movement.quantity }} </span>
                                        </div>
                                        @if (movement.reason) {
                                            <p class="m-0 mt-0.5 text-sm text-muted-color">{{ movement.reason }}</p>
                                        }
                                        <span class="block mt-0.5 text-xs text-muted-color">{{ movement.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                    <div class="flex items-center justify-between mt-5 pt-4 border-t border-surface-100 dark:border-surface-800">
                        <span class="text-sm text-muted-color">{{ total() }} movimiento{{ total() === 1 ? '' : 's' }}</span>
                        <div class="flex items-center gap-1">
                            <p-button icon="pi pi-chevron-left" [rounded]="true" [text]="true" severity="secondary" [disabled]="page() <= 1" title="Anterior" (onClick)="changePage(page() - 1)" />
                            <span class="px-2 text-sm text-muted-color">{{ page() }} / {{ lastPage() }}</span>
                            <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true" severity="secondary" [disabled]="page() >= lastPage()" title="Siguiente" (onClick)="changePage(page() + 1)" />
                        </div>
                    </div>
                }
            </ng-template>
        </p-dialog>

        <p-toast />
    `
})
export class StockMovementsDialog {
    visible = input.required<boolean>();
    context = input.required<{ id: string; sku: string; product_name?: string | null } | null>();

    visibleChange = output<boolean>();

    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    readonly movementTypeOptions = STOCK_MOVEMENT_TYPE_OPTIONS;

    movements = signal<StockMovement[]>([]);
    loading = signal(false);
    total = signal(0);
    page = signal(1);
    lastPage = signal(1);

    private readonly perPage = 10;

    constructor() {
        useBodyScrollLock(this.visible);

        effect(() => {
            if (this.visible() && this.context()) {
                this.page.set(1);
                this.load();
            }
        });
    }

    load() {
        const ctx = this.context();

        if (!ctx) return;

        this.loading.set(true);
        this.inventoryService.stockMovements(ctx.id, { page: this.page(), per_page: this.perPage }).subscribe({
            next: (res) => {
                this.movements.set(res.data.items ?? []);
                this.total.set(res.data.pagination?.total ?? 0);
                this.lastPage.set(res.data.pagination?.last_page ?? 1);
                this.loading.set(false);
            },
            error: (err) => {
                this.movements.set([]);
                this.total.set(0);
                this.lastPage.set(1);
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    changePage(next: number) {
        this.page.set(next);
        this.load();
    }

    movementTypeLabel(type: StockMovementType): string {
        return this.movementTypeOptions.find((o) => o.value === type)?.label ?? type;
    }

    dotClass(type: StockMovementType): string {
        switch (type) {
            case 'in':
                return 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400';
            case 'out':
                return 'bg-red-100 dark:bg-red-500/20 text-red-500';
            case 'reserved':
                return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
            case 'released':
                return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
            default:
                return 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300';
        }
    }

    dotIcon(type: StockMovementType): string {
        switch (type) {
            case 'in':
                return 'pi pi-arrow-down';
            case 'out':
                return 'pi pi-arrow-up';
            case 'reserved':
                return 'pi pi-lock';
            case 'released':
                return 'pi pi-unlock';
            default:
                return 'pi pi-pencil';
        }
    }
}
