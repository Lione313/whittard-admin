import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { PhysicalStoreService } from '../services/physical-store.service';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

@Component({
    selector: 'app-physical-store-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, ButtonModule, InputTextModule, ToggleSwitchModule, ImageUploadComponent],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card p-6 space-y-8">
            <!-- HEADER -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold">
                        {{ isEdit() ? 'Editar Tienda' : 'Nueva Tienda' }}
                    </h1>
                    <p class="text-surface-500 text-sm mt-1">Completa los datos de la tienda física.</p>
                </div>
                <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="goBack()" />
            </div>

            <!-- CAMPOS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Logo con ImageUploadComponent -->
                <div class="md:col-span-2">
                   <app-image-upload label="Logo" chooseLabel="Subir Logo" [initialUrl]="currentLogoUrl()" (onFileSelected)="onLogoSelected($event)" />
                </div>

                <!-- Nombre -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Nombre <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="name" placeholder="Ej: Tienda Centro" />
                </div>

                <!-- Dirección -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Dirección</label>
                    <input pInputText [(ngModel)]="address" placeholder="Ej: Av. Larco 123, Miraflores" />
                </div>

                <!-- URL -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">URL</label>
                    <input pInputText [(ngModel)]="url" placeholder="https://maps.google.com/..." />
                </div>

                <!-- Texto del link -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Texto del link</label>
                    <input pInputText [(ngModel)]="urlText" placeholder="Ej: Ver en mapa" />
                </div>

                <!-- Orden -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Orden</label>
                    <input pInputText type="number" [(ngModel)]="order" min="0" />
                </div>

                <!-- Activo -->
                <div class="flex items-center gap-3">
                    <p-toggleswitch [(ngModel)]="isActive" />
                    <span class="text-sm font-medium">{{ isActive ? 'Tienda activa' : 'Tienda inactiva' }}</span>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="flex justify-end gap-3 pt-4 border-t border-surface-200">
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="goBack()" />
                <p-button [label]="isEdit() ? 'Actualizar' : 'Crear Tienda'" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
            </div>
        </div>
    `
})
export class PhysicalStoreForm implements OnInit {
    private service = inject(PhysicalStoreService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private toast = inject(MessageService);

    storeId = signal<number | null>(null);
    isEdit = computed(() => !!this.storeId());
    saving = signal(false);

    // Campos
    name = '';
    address = '';
    url = '';
    urlText = '';
    order = 1;
    isActive = true;
    logoFile: File | null = null;
    currentLogoUrl = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.storeId.set(+id);
            this.load(+id);
        }
    }

    load(id: number): void {
        this.service.getStoreById(id).subscribe({
            next: (res) => {
                const s = res.data;
                this.name = s.name;
                this.address = s.address ?? '';
                this.url = s.url ?? '';
                this.urlText = s.url_text ?? '';
                this.order = s.order;
                this.isActive = s.is_active;
                this.currentLogoUrl.set(s.logo_url ?? '');
            }
        });
    }

    onLogoSelected(file: File | null): void {
        this.logoFile = file;
    }

    save(): void {
        if (!this.name.trim()) {
            this.toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El nombre es obligatorio' });
            return;
        }

        this.saving.set(true);
        const fd = new FormData();
        fd.append('name', this.name);
        fd.append('address', this.address);
        fd.append('url', this.url);
        fd.append('url_text', this.urlText);
        fd.append('order', String(this.order));
        fd.append('is_active', this.isActive ? '1' : '0');

        if (this.logoFile) {
            fd.append('logo', this.logoFile);
        }

        const req$ = this.isEdit() ? this.service.updateStore(this.storeId()!, fd) : this.service.createStore(fd);

        req$.subscribe({
            next: () => {
                this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Tienda guardada correctamente' });
                  this.router.navigateByUrl('/configuration/tiendas-fisicas');
            },
            error: (err) => {
                const msg = err?.errors ? Object.values(err.errors).flat().join(' ') : err?.message || 'Ocurrió un error al guardar';
                this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
                this.saving.set(false);
            }
        });
    }

    goBack(): void {
        this.router.navigateByUrl('/configuration/tiendas-fisicas');
    }
}
