import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';

interface PhoneItem {
    id: number;
    label: string;
    value: string;
}
interface EmailItem {
    id: number;
    label: string;
    value: string;
}
interface OfficeItem {
    id: number;
    title: string;
    address: string;
}
interface ScheduleItem {
    id: number;
    label: string;
    value: string;
}
interface PaymentItem {
    id: string;
    key: string;
    sort_order: number;
}

export interface FooterInfoContent extends Record<string, unknown> {
    is_visible: boolean;
    phones: PhoneItem[];
    emails: EmailItem[];
    offices: OfficeItem[];
    schedules: ScheduleItem[];
    payment_methods: PaymentItem[];
}

@Component({
    selector: 'app-footer-info-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Configura los datos de contacto, direcciones, horarios y métodos de pago del pie de página.</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- TELÉFONOS (Máx 3) -->
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold text-surface-800 dark:text-surface-100"><i class="pi pi-phone mr-2 text-primary"></i>Teléfonos (Máx. 3)</h3>
                        @if (content.phones.length < 3) {
                            <p-button label="Agregar" icon="pi pi-plus" size="small" outlined (onClick)="addPhone()" />
                        }
                    </div>
                    @for (phone of content.phones; track phone.id; let i = $index) {
                        <div class="flex gap-2 items-center">
                            <input pInputText [(ngModel)]="phone.label" placeholder="Etiqueta (Ej. Móvil)" class="w-1/3" />
                            <input pInputText [(ngModel)]="phone.value" placeholder="Número" class="w-2/3" />
                            <p-button icon="pi pi-trash" severity="danger" text (onClick)="removePhone(i)" />
                        </div>
                    }
                </div>

                <!-- CORREOS (Máx 3) -->
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold text-surface-800 dark:text-surface-100"><i class="pi pi-envelope mr-2 text-primary"></i>Correos (Máx. 3)</h3>
                        @if (content.emails.length < 3) {
                            <p-button label="Agregar" icon="pi pi-plus" size="small" outlined (onClick)="addEmail()" />
                        }
                    </div>
                    @for (email of content.emails; track email.id; let i = $index) {
                        <div class="flex gap-2 items-center">
                            <input pInputText [(ngModel)]="email.label" placeholder="Etiqueta" class="w-1/3" />
                            <input pInputText [(ngModel)]="email.value" placeholder="Correo" class="w-2/3" />
                            <p-button icon="pi pi-trash" severity="danger" text (onClick)="removeEmail(i)" />
                        </div>
                    }
                </div>

                <!-- OFICINAS / DIRECCIONES (Máx 3) -->
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold text-surface-800 dark:text-surface-100"><i class="pi pi-map-marker mr-2 text-primary"></i>Oficinas (Máx. 3)</h3>
                        @if (content.offices.length < 3) {
                            <p-button label="Agregar" icon="pi pi-plus" size="small" outlined (onClick)="addOffice()" />
                        }
                    </div>
                    @for (office of content.offices; track office.id; let i = $index) {
                        <div class="space-y-2 border-b border-surface-100 pb-3">
                            <div class="flex gap-2 items-center">
                                <input pInputText [(ngModel)]="office.title" placeholder="Título (Ej. Oficina Central)" class="w-full" />
                                <p-button icon="pi pi-trash" severity="danger" text (onClick)="removeOffice(i)" />
                            </div>
                            <input pInputText [(ngModel)]="office.address" placeholder="Dirección completa" class="w-full" />
                        </div>
                    }
                </div>

                <!-- HORARIOS (Máx 3) -->
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold text-surface-800 dark:text-surface-100"><i class="pi pi-clock mr-2 text-primary"></i>Horarios (Máx. 3)</h3>
                        @if (content.schedules.length < 3) {
                            <p-button label="Agregar" icon="pi pi-plus" size="small" outlined (onClick)="addSchedule()" />
                        }
                    </div>
                    @for (sched of content.schedules; track sched.id; let i = $index) {
                        <div class="flex gap-2 items-center">
                            <input pInputText [(ngModel)]="sched.label" placeholder="Etiqueta" class="w-1/3" />
                            <input pInputText [(ngModel)]="sched.value" placeholder="Horario" class="w-2/3" />
                            <p-button icon="pi pi-trash" severity="danger" text (onClick)="removeSchedule(i)" />
                        </div>
                    }
                </div>
            </div>

            <!-- MÉTODOS DE PAGO (Con Drag & Drop y vista previa de tarjetas/pagos) -->
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-semibold text-surface-800 dark:text-surface-100"><i class="pi pi-credit-card mr-2 text-primary"></i>Métodos de Pago</h3>
                        <p class="text-xs text-surface-500">Arrastra o usa las flechas para ordenar los métodos de pago que se muestran en la web.</p>
                    </div>
                </div>
                <div class="space-y-2">
                    @for (method of content.payment_methods; track method.key; let i = $index) {
                        <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-surface-400">#{{ i + 1 }}</span>
                                <span class="font-semibold capitalize text-surface-800 dark:text-surface-200">{{ method.key }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <p-button icon="pi pi-arrow-up" [disabled]="i === 0" size="small" text (onClick)="movePayment(i, -1)" />
                                <p-button icon="pi pi-arrow-down" [disabled]="i === content.payment_methods.length - 1" size="small" text (onClick)="movePayment(i, 1)" />
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    `
})
export class FooterInfoEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<Record<string, unknown>>();

    content: FooterInfoContent = {
        is_visible: true,
        phones: [],
        emails: [],
        offices: [],
        schedules: [],
        payment_methods: []
    };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as FooterInfoContent | undefined;
        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                phones: raw.phones ? [...raw.phones] : [],
                emails: raw.emails ? [...raw.emails] : [],
                offices: raw.offices ? [...raw.offices] : [],
                schedules: raw.schedules ? [...raw.schedules] : [],
                payment_methods: raw.payment_methods ? [...raw.payment_methods] : []
            };
        }
    }

    addPhone() {
        if (this.content.phones.length < 3) this.content.phones.push({ id: Date.now(), label: '', value: '' });
    }
    removePhone(i: number) {
        this.content.phones.splice(i, 1);
    }

    addEmail() {
        if (this.content.emails.length < 3) this.content.emails.push({ id: Date.now(), label: '', value: '' });
    }
    removeEmail(i: number) {
        this.content.emails.splice(i, 1);
    }

    addOffice() {
        if (this.content.offices.length < 3) this.content.offices.push({ id: Date.now(), title: '', address: '' });
    }
    removeOffice(i: number) {
        this.content.offices.splice(i, 1);
    }

    addSchedule() {
        if (this.content.schedules.length < 3) this.content.schedules.push({ id: Date.now(), label: '', value: '' });
    }
    removeSchedule(i: number) {
        this.content.schedules.splice(i, 1);
    }

    movePayment(index: number, direction: number) {
        const target = index + direction;
        if (target < 0 || target >= this.content.payment_methods.length) return;
        const temp = this.content.payment_methods[index];
        this.content.payment_methods[index] = this.content.payment_methods[target];
        this.content.payment_methods[target] = temp;
        this.content.payment_methods.forEach((item, idx) => (item.sort_order = idx + 1));
    }

    onSave(): void {
        this.save.emit({ ...this.content });
    }
}
