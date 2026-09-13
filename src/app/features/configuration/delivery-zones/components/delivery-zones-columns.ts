import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DeliveryZoneService } from '../services/delivery-zone.service';
import { UbigeoItem, DeliveryGlobalConfig } from '../models/delivery-zone.model';

@Component({
    selector: 'app-delivery-zones-columns',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, ToastModule, DialogModule, TooltipModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="p-6 space-y-6 max-w-full overflow-x-hidden">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-200">
                <div>
                    <h1 class="text-2xl font-bold">Zonas de Delivery</h1>
                    <div class="flex items-center gap-2 text-sm text-surface-500 mt-1">
                        <span>Todos</span>
                        @if (selectedDepartment()) {
                            <span>›</span>
                            <span class="font-medium">{{ selectedDepartment()!.name }}</span>
                        }
                        @if (selectedProvince()) {
                            <span>›</span>
                            <span class="font-medium">{{ selectedProvince()!.name }}</span>
                        }
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-3 bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-xs">
                        <div class="flex items-center gap-1 border-r border-surface-200 pr-3">
                            <span class="text-surface-500">Mín. Delivery Gratis:</span>
                            <span class="font-bold">S/ {{ minFreeShippingAmount() | number:'1.2-2' }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-surface-500">Mín. Compra:</span>
                            <span class="font-bold">S/ {{ minOrderAmount() | number:'1.2-2' }}</span>
                        </div>
                    </div>
                    <p-button icon="pi pi-cog" label="Configurar Montos" severity="secondary" [outlined]="true" size="small" (onClick)="openConfigModal()" />
                </div>
            </div>

            <!-- Miller Columns -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                <!-- Departamentos -->
                <div class="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm flex flex-col">
                    <div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex justify-between items-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Departamentos</span>
                        <span class="bg-surface-200 text-surface-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ departments().length }}</span>
                    </div>
                    <div class="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
                        @for (dep of departments(); track dep.code) {
                            <div
                                (click)="selectDepartment(dep)"
                                [class.bg-surface-100]="selectedDepartment()?.code === dep.code"
                                class="px-3 py-2.5 flex items-center gap-2 hover:bg-surface-50 cursor-pointer transition-colors"
                            >
                                <!-- Indicador cobertura -->
                                <span
                                    class="w-2 h-2 rounded-full shrink-0"
                                    [class.bg-green-400]="dep.has_coverage"
                                    [class.bg-surface-200]="!dep.has_coverage"
                                    [pTooltip]="dep.has_coverage ? 'Con cobertura' : 'Sin cobertura'"
                                ></span>

                                <span class="text-sm font-medium flex-1 truncate">{{ dep.name }}</span>

                                @if (dep.has_coverage) {
                                    <!-- Precio -->
                                    <p-inputNumber
                                        [(ngModel)]="dep.price"
                                        mode="decimal"
                                        [minFractionDigits]="2"
                                        [min]="0"
                                        styleClass="w-24"
                                        inputStyleClass="text-xs px-2 py-1"
                                        (click)="$event.stopPropagation()"
                                    />
                                    <p-button icon="pi pi-save" severity="success" [text]="true" size="small"
                                        pTooltip="Guardar precio" tooltipPosition="top"
                                        [loading]="saving() === dep.code"
                                        (onClick)="savePrice(dep, 'department', $event)" />
                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                                        pTooltip="Quitar cobertura" tooltipPosition="top"
                                        (onClick)="removePrice(dep, $event)" />
                                } @else {
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" size="small"
                                        pTooltip="Agregar cobertura" tooltipPosition="top"
                                        (onClick)="addCoverage(dep, 'department', $event)" />
                                }

                                <i class="pi pi-chevron-right text-xs text-surface-400 shrink-0"></i>
                            </div>
                        }
                    </div>
                </div>

                <!-- Provincias -->
                <div class="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm flex flex-col">
                    <div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex justify-between items-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Provincias</span>
                        <span class="bg-surface-200 text-surface-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ provinces().length }}</span>
                    </div>
                    <div class="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
                        @if (!selectedDepartment()) {
                            <div class="p-8 text-center text-sm text-surface-400">Selecciona un departamento</div>
                        }
                        @for (prov of provinces(); track prov.code) {
                            <div
                                (click)="selectProvince(prov)"
                                [class.bg-surface-100]="selectedProvince()?.code === prov.code"
                                class="px-3 py-2.5 flex items-center gap-2 hover:bg-surface-50 cursor-pointer transition-colors"
                            >
                                <span
                                    class="w-2 h-2 rounded-full shrink-0"
                                    [class.bg-green-400]="prov.has_coverage && !prov.inherited_price"
                                    [class.bg-blue-300]="prov.inherited_price"
                                    [class.bg-surface-200]="!prov.has_coverage"
                                    [pTooltip]="prov.inherited_price ? 'Precio heredado del dpto' : prov.has_coverage ? 'Precio propio' : 'Sin cobertura'"
                                ></span>

                                <span class="text-sm font-medium flex-1 truncate">{{ prov.name }}</span>

                                @if (!prov.inherited_price && prov.has_coverage) {
                                    <p-inputNumber
                                        [(ngModel)]="prov.price"
                                        mode="decimal"
                                        [minFractionDigits]="2"
                                        [min]="0"
                                        styleClass="w-24"
                                        inputStyleClass="text-xs px-2 py-1"
                                        (click)="$event.stopPropagation()"
                                    />
                                    <p-button icon="pi pi-save" severity="success" [text]="true" size="small"
                                        pTooltip="Guardar precio" tooltipPosition="top"
                                        [loading]="saving() === prov.code"
                                        (onClick)="savePrice(prov, 'province', $event)" />
                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                                        pTooltip="Quitar precio propio" tooltipPosition="top"
                                        (onClick)="removePrice(prov, $event)" />
                                } @else if (prov.inherited_price) {
                                    <span class="text-xs text-blue-400 shrink-0">S/ {{ prov.price | number:'1.2-2' }}</span>
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" size="small"
                                        pTooltip="Agregar precio propio" tooltipPosition="top"
                                        (onClick)="addCoverage(prov, 'province', $event)" />
                                } @else {
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" size="small"
                                        pTooltip="Agregar cobertura" tooltipPosition="top"
                                        (onClick)="addCoverage(prov, 'province', $event)" />
                                }

                                <i class="pi pi-chevron-right text-xs text-surface-400 shrink-0"></i>
                            </div>
                        }
                    </div>
                </div>

                <!-- Distritos -->
                <div class="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm flex flex-col">
                    <div class="px-4 py-3 bg-surface-50 border-b border-surface-200 flex justify-between items-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Distritos</span>
                        <span class="bg-surface-200 text-surface-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ districts().length }}</span>
                    </div>
                    <div class="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
                        @if (!selectedProvince()) {
                            <div class="p-8 text-center text-sm text-surface-400">Selecciona una provincia</div>
                        }
                        @for (dist of districts(); track dist.code) {
                            <div class="px-3 py-2.5 flex items-center gap-2 hover:bg-surface-50 transition-colors">
                                <span
                                    class="w-2 h-2 rounded-full shrink-0"
                                    [class.bg-green-400]="dist.has_coverage && !dist.inherited_price"
                                    [class.bg-blue-300]="dist.inherited_price"
                                    [class.bg-surface-200]="!dist.has_coverage"
                                    [pTooltip]="dist.inherited_price ? 'Precio heredado' : dist.has_coverage ? 'Precio propio' : 'Sin cobertura'"
                                ></span>

                                <span class="text-sm font-medium flex-1 truncate">{{ dist.name }}</span>

                                @if (!dist.inherited_price && dist.has_coverage) {
                                    <p-inputNumber
                                        [(ngModel)]="dist.price"
                                        mode="decimal"
                                        [minFractionDigits]="2"
                                        [min]="0"
                                        styleClass="w-24"
                                        inputStyleClass="text-xs px-2 py-1"
                                        (click)="$event.stopPropagation()"
                                    />
                                    <p-button icon="pi pi-save" severity="success" [text]="true" size="small"
                                        pTooltip="Guardar precio" tooltipPosition="top"
                                        [loading]="saving() === dist.code"
                                        (onClick)="savePrice(dist, 'district', $event)" />
                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                                        pTooltip="Quitar precio propio" tooltipPosition="top"
                                        (onClick)="removePrice(dist, $event)" />
                                } @else if (dist.inherited_price) {
                                    <span class="text-xs text-blue-400 shrink-0">S/ {{ dist.price | number:'1.2-2' }}</span>
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" size="small"
                                        pTooltip="Agregar precio propio" tooltipPosition="top"
                                        (onClick)="addCoverage(dist, 'district', $event)" />
                                } @else {
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" size="small"
                                        pTooltip="Agregar cobertura" tooltipPosition="top"
                                        (onClick)="addCoverage(dist, 'district', $event)" />
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal config montos -->
        <p-dialog header="Configuración de Delivery" [(visible)]="showConfigModal" [modal]="true" [style]="{width: '400px'}">
            <div class="space-y-4 pt-2">
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Monto mínimo para delivery gratis</label>
                    <p-inputNumber [(ngModel)]="tempMinFreeShipping" mode="currency" currency="PEN" locale="es-PE" [min]="0" styleClass="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Monto mínimo de compra</label>
                    <p-inputNumber [(ngModel)]="tempMinOrder" mode="currency" currency="PEN" locale="es-PE" [min]="0" styleClass="w-full" />
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="showConfigModal.set(false)" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="savingConfig()" (onClick)="saveGlobalSettings()" />
            </ng-template>
        </p-dialog>
    `
})
export class DeliveryZonesColumnsComponent implements OnInit {
    private route               = inject(ActivatedRoute);
    private deliveryZoneService = inject(DeliveryZoneService);
    private messageService      = inject(MessageService);

    departments = signal<UbigeoItem[]>([]);
    provinces   = signal<UbigeoItem[]>([]);
    districts   = signal<UbigeoItem[]>([]);

    selectedDepartment = signal<UbigeoItem | null>(null);
    selectedProvince   = signal<UbigeoItem | null>(null);

    showConfigModal       = signal(false);
    minFreeShippingAmount = signal(0);
    minOrderAmount        = signal(0);
    saving                = signal<string | null>(null);
    savingConfig          = signal(false);

    tempMinFreeShipping = 0;
    tempMinOrder        = 0;

    ngOnInit(): void {
        const initialData = this.route.snapshot.data['departments'] as UbigeoItem[];
        this.departments.set(initialData || []);
        this.loadGlobalSettings();
    }

    loadGlobalSettings(): void {
        this.deliveryZoneService.getGlobalConfig().subscribe({
            next: (config) => {
                this.minFreeShippingAmount.set(config.min_free_shipping_amount ?? 0);
                this.minOrderAmount.set(config.min_order_amount ?? 0);
                this.tempMinFreeShipping = this.minFreeShippingAmount();
                this.tempMinOrder        = this.minOrderAmount();
            }
        });
    }

    openConfigModal(): void {
        this.tempMinFreeShipping = this.minFreeShippingAmount();
        this.tempMinOrder        = this.minOrderAmount();
        this.showConfigModal.set(true);
    }

    selectDepartment(dep: UbigeoItem): void {
        this.selectedDepartment.set(dep);
        this.selectedProvince.set(null);
        this.districts.set([]);
        this.deliveryZoneService.getProvinces(dep.code).subscribe(data => this.provinces.set(data));
    }

    selectProvince(prov: UbigeoItem): void {
        this.selectedProvince.set(prov);
        const dep = this.selectedDepartment();
        this.deliveryZoneService.getDistricts(prov.code, dep?.code).subscribe(data => this.districts.set(data));
    }

    savePrice(item: UbigeoItem, level: 'department' | 'province' | 'district', event: Event): void {
        event.stopPropagation();
        this.saving.set(item.code);

        const dep  = this.selectedDepartment();
        const prov = this.selectedProvince();

        this.deliveryZoneService.savePrice({
            ubigeo_code:     item.code,
            price:           item.price ?? 0,
            is_active:       true,
            level,
            department_code: level !== 'department' ? dep?.code : undefined,
            province_code:   level === 'district' ? prov?.code : undefined,
        }).subscribe({
            next: () => {
                item.has_coverage    = true;
                item.inherited_price = false;
                this.saving.set(null);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `Precio de ${item.name} actualizado.` });
                this.refreshLevel(level);
            },
            error: (err) => {
                const msg = err?.errors ? Object.values(err.errors).flat().join(' ') : err?.message || 'Error al guardar';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                this.saving.set(null);
            }
        });
    }

    addCoverage(item: UbigeoItem, level: 'department' | 'province' | 'district', event: Event): void {
        event.stopPropagation();
        item.price        = item.price ?? 0;
        item.has_coverage = true;
        item.inherited_price = false;

        // Actualizar la señal para forzar re-render
        this.updateItemInSignal(item, level);
    }

    removePrice(item: UbigeoItem, event: Event): void {
        event.stopPropagation();
        if (!item.delivery_zone_id) {
            item.has_coverage    = false;
            item.inherited_price = false;
            item.price           = null;
            return;
        }

        this.deliveryZoneService.deleteZone(item.delivery_zone_id).subscribe({
            next: () => {
                item.delivery_zone_id = null;
                item.has_coverage     = false;
                item.inherited_price  = false;
                item.price            = null;
                this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Cobertura de ${item.name} removida.` });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover la cobertura.' });
            }
        });
    }

    private refreshLevel(level: 'department' | 'province' | 'district'): void {
        if (level === 'department') {
            this.deliveryZoneService.getDepartments().subscribe(data => this.departments.set(data));
        } else if (level === 'province') {
            const dep = this.selectedDepartment();
            if (dep) this.deliveryZoneService.getProvinces(dep.code).subscribe(data => this.provinces.set(data));
        } else {
            const prov = this.selectedProvince();
            const dep  = this.selectedDepartment();
            if (prov) this.deliveryZoneService.getDistricts(prov.code, dep?.code).subscribe(data => this.districts.set(data));
        }
    }

    private updateItemInSignal(item: UbigeoItem, level: 'department' | 'province' | 'district'): void {
        if (level === 'department') {
            this.departments.update(list => list.map(d => d.code === item.code ? { ...d, ...item } : d));
        } else if (level === 'province') {
            this.provinces.update(list => list.map(p => p.code === item.code ? { ...p, ...item } : p));
        } else {
            this.districts.update(list => list.map(d => d.code === item.code ? { ...d, ...item } : d));
        }
    }

    saveGlobalSettings(): void {
        this.savingConfig.set(true);
        this.deliveryZoneService.saveGlobalConfig({
            min_free_shipping_amount: this.tempMinFreeShipping,
            min_order_amount:         this.tempMinOrder,
        }).subscribe({
            next: () => {
                this.minFreeShippingAmount.set(this.tempMinFreeShipping);
                this.minOrderAmount.set(this.tempMinOrder);
                this.showConfigModal.set(false);
                this.savingConfig.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Montos actualizados correctamente.' });
            },
            error: (err) => {
                const msg = err?.errors ? Object.values(err.errors).flat().join(' ') : err?.message || 'Error al guardar';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                this.savingConfig.set(false);
            }
        });
    }
}