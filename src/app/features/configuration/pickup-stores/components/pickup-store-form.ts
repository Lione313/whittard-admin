import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { PickupStoreService } from '../services/pickup-store.service';

@Component({
    selector: 'app-pickup-store-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, ButtonModule, InputTextModule, ToggleSwitchModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card p-6 space-y-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold">{{ isEdit() ? 'Editar Punto de Recojo' : 'Nuevo Punto de Recojo' }}</h1>
                    <p class="text-surface-500 text-sm mt-1">Completa los datos del punto de recojo en tienda.</p>
                </div>
                <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="goBack()" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Nombre <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="name" placeholder="Ej: Tienda Miraflores" />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Dirección</label>
                    <input pInputText [(ngModel)]="address" placeholder="Ej: Av. Larco 123, Miraflores" />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Horario</label>
                    <input pInputText [(ngModel)]="schedule" placeholder="Ej: Lunes a Domingo · 10:00 AM - 10:00 PM" />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Orden</label>
                    <input pInputText type="number" [(ngModel)]="sortOrder" min="0" />
                </div>

                <div class="flex items-center gap-3">
                    <p-toggleswitch [(ngModel)]="isActive" />
                    <span class="text-sm font-medium">{{ isActive ? 'Punto de recojo activo' : 'Punto de recojo inactivo' }}</span>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-surface-200">
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="goBack()" />
                <p-button [label]="isEdit() ? 'Actualizar' : 'Crear'" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
            </div>
        </div>
    `
})
export class PickupStoreForm implements OnInit {
    private service = inject(PickupStoreService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private toast = inject(MessageService);

    storeId = signal<number | null>(null);
    isEdit = computed(() => !!this.storeId());
    saving = signal(false);

    name = '';
    address = '';
    schedule = '';
    sortOrder = 0;
    isActive = true;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.storeId.set(+id);
            this.load(+id);
        }
    }

    load(id: number): void {
        this.service.getById(id).subscribe({
            next: (res) => {
                const s = res.data;

                this.name = s.name;
                this.address = s.address ?? '';
                this.schedule = s.schedule ?? '';
                this.sortOrder = s.sort_order ?? 0;
                this.isActive = s.is_active;
            }
        });
    }

    save(): void {
        if (!this.name.trim()) {
            this.toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El nombre es obligatorio' });

            return;
        }

        this.saving.set(true);

        const payload = {
            name: this.name.trim(),
            address: this.address.trim() || null,
            schedule: this.schedule.trim() || null,
            sort_order: this.sortOrder,
            is_active: this.isActive
        };

        const req$ = this.isEdit() ? this.service.update(this.storeId()!, payload) : this.service.create(payload);

        req$.subscribe({
            next: () => {
                this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Punto de recojo guardado correctamente' });
                this.router.navigateByUrl('/configuration/recojo-en-tienda');
            },
            error: (err) => {
                const msg = err?.errors ? Object.values(err.errors).flat().join(' ') : err?.message || 'Ocurrió un error al guardar';

                this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
                this.saving.set(false);
            }
        });
    }

    goBack(): void {
        this.router.navigateByUrl('/configuration/recojo-en-tienda');
    }
}
