import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { OrderService } from '@/app/features/orders/services/order.service';
import { DELIVERY_METHOD_LABELS, Order, ORDER_STATUS_OPTIONS, OrderStatus, OrderVoucher, PAYMENT_METHOD_LABELS } from '@/app/features/orders/models/order.model';
import { formatApiError } from '@/app/shared/utils/api-error';
import { CurrencyFormatPipe } from '@/app/shared/pipes/currency-format.pipe';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TableModule, ToastModule, TagModule, ButtonModule, SelectModule, CurrencyFormatPipe],
    providers: [MessageService],
    template: `
        @if (loading()) {
            <div class="card p-16 flex items-center justify-center text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else if (order(); as order) {
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" severity="secondary" routerLink="/orders" />
                        <div>
                            <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">Orden {{ order.number }}</h1>
                            <small class="text-muted-color">{{ order.created_at | date: 'dd/MM/yyyy HH:mm' }}</small>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <p-select [options]="statusOptions" [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)" optionLabel="label" optionValue="value" styleClass="w-44" />
                        <p-button label="Actualizar estado" icon="pi pi-check" [loading]="saving()" [disabled]="selectedStatus() === order.status" (onClick)="saveStatus()" />
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <div class="card">
                        <p class="text-muted-color mb-2 text-xs font-semibold uppercase">Cliente</p>
                        <p class="m-0 font-medium text-surface-900 dark:text-surface-0">{{ customerName(order) }}</p>
                        <small class="text-muted-color block">{{ order.customer?.email || '—' }}</small>
                        <small class="text-muted-color block">{{ order.customer?.phone || '—' }}</small>
                        @if (order.customer?.document_number) {
                            <small class="text-muted-color block">{{ order.customer?.document_type | uppercase }}: {{ order.customer?.document_number }}</small>
                        }
                    </div>

                    <div class="card">
                        <p class="text-muted-color mb-2 text-xs font-semibold uppercase">Entrega</p>
                        <p class="m-0 font-medium text-surface-900 dark:text-surface-0">{{ deliveryLabel(order) }}</p>
                        <small class="text-muted-color block">{{ addressLabel(order) }}</small>
                    </div>

                    <div class="card">
                        <p class="text-muted-color mb-2 text-xs font-semibold uppercase">Pago</p>
                        <p class="m-0 font-medium text-surface-900 dark:text-surface-0">{{ paymentLabel(order) }}</p>
                        <small class="text-muted-color block">Estado: {{ order.payment_status }}</small>
                        @if (order.coupon_code) {
                            <small class="text-muted-color block">Cupón: {{ order.coupon_code }}</small>
                        }
                    </div>
                </div>

                @if (order.voucher; as voucher) {
                    <div class="card">
                        <p class="text-muted-color mb-3 text-xs font-semibold uppercase">Comprobante de transferencia</p>
                        <div class="flex flex-wrap items-start gap-4">
                            @if (isVoucherImage(voucher)) {
                                <a [href]="voucher.url" target="_blank" rel="noopener" class="block">
                                    <img [src]="voucher.url" alt="Comprobante de pago" class="border-surface-200 dark:border-surface-700 max-h-72 rounded-lg border object-contain" />
                                </a>
                            } @else {
                                <a pButton [href]="voucher.url" target="_blank" rel="noopener" label="Ver comprobante (PDF)" icon="pi pi-file-pdf" severity="secondary" [outlined]="true"></a>
                            }

                            <div class="text-sm">
                                <p class="m-0">
                                    <span class="text-muted-color">Código de operación:</span>
                                    <span class="ml-1 font-medium">{{ voucher.operation_code || '—' }}</span>
                                </p>
                                <p class="m-0 mt-1">
                                    <span class="text-muted-color">Subido:</span>
                                    <span class="ml-1 font-medium">{{ voucher.uploaded_at ? (voucher.uploaded_at | date: 'dd/MM/yyyy HH:mm') : '—' }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                }

                <div class="card p-0!">
                    <p-table [value]="order.items" [tableStyle]="{ 'min-width': '48rem' }">
                        <ng-template #header>
                            <tr>
                                <th>Producto</th>
                                <th style="width: 8rem">SKU</th>
                                <th style="width: 6rem">Cant.</th>
                                <th style="width: 8rem">Precio</th>
                                <th style="width: 8rem">Total</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-item>
                            <tr>
                                <td class="font-medium text-surface-900 dark:text-surface-0">{{ item.name }}</td>
                                <td class="text-muted-color">{{ item.sku || '—' }}</td>
                                <td>{{ item.quantity }}</td>
                                <td>{{ item.promo_price ?? item.unit_price | currencyFormat }}</td>
                                <td class="font-semibold">{{ item.line_total | currencyFormat }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="flex justify-end">
                    <div class="card w-full max-w-sm">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-muted-color">Subtotal</span>
                            <span>{{ order.subtotal | currencyFormat }}</span>
                        </div>
                        @if (order.discount > 0) {
                            <div class="flex items-center justify-between text-sm text-emerald-600">
                                <span>Descuento</span>
                                <span>-{{ order.discount | currencyFormat }}</span>
                            </div>
                        }
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-muted-color">Envío</span>
                            <span>{{ order.shipping | currencyFormat }}</span>
                        </div>
                        <div class="mt-2 flex items-center justify-between border-t border-surface-200 pt-2 font-semibold dark:border-surface-700">
                            <span>Total</span>
                            <span>{{ order.total | currencyFormat }}</span>
                        </div>
                    </div>
                </div>

                @if (order.notes) {
                    <div class="card">
                        <p class="text-muted-color mb-1 text-xs font-semibold uppercase">Notas</p>
                        <p class="m-0 text-sm">{{ order.notes }}</p>
                    </div>
                }
            </div>
        } @else {
            <div class="card p-12 text-center text-muted-color">Orden no encontrada.</div>
        }
        <p-toast />
    `
})
export class OrderDetail implements OnInit {
    private orderService = inject(OrderService);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    order = signal<Order | null>(null);
    loading = signal(false);
    saving = signal(false);
    selectedStatus = signal<OrderStatus | null>(null);

    readonly statusOptions = ORDER_STATUS_OPTIONS;

    ngOnInit(): void {
        this.fetch();
    }

    saveStatus(): void {
        const order = this.order();
        const status = this.selectedStatus();

        if (!order || !status || status === order.status) return;

        this.saving.set(true);

        this.orderService.updateStatus(order.id, status).subscribe({
            next: (response) => {
                this.order.set(response.data);
                this.saving.set(false);
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado actualizado correctamente.', life: 3000 });
            },
            error: (error) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    customerName(order: Order): string {
        const name = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ');

        return name || '—';
    }

    deliveryLabel(order: Order): string {
        return DELIVERY_METHOD_LABELS[order.delivery_method] ?? order.delivery_method;
    }

    paymentLabel(order: Order): string {
        return PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method;
    }

    isVoucherImage(voucher: OrderVoucher): boolean {
        if (voucher.mime_type) return voucher.mime_type.startsWith('image/');

        return /\.(jpe?g|png|webp|gif)$/i.test(voucher.url);
    }

    addressLabel(order: Order): string {
        if (order.delivery_method === 'pickup') {
            return order.pickup_store?.name ?? 'Recojo en tienda';
        }

        const address = order.shipping_address;

        if (!address) return '—';

        return [address['address'], address['district'], address['province'], address['department']].filter((part): part is string => typeof part === 'string' && part.trim() !== '').join(', ') || '—';
    }

    private fetch(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id) return;

        this.loading.set(true);

        this.orderService.get(id).subscribe({
            next: (response) => {
                this.order.set(response.data);
                this.selectedStatus.set(response.data.status);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }
}
