import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { environment } from '@/environments/environment.development';
import { DataTable, DataTableColumn } from '@/app/shared/components/data-table/DataTable';
import { PhysicalStoreService } from '../services/physical-store.service';
import { PhysicalStore, PhysicalStoreSection } from '../models/physical-store.model';

@Component({
    selector: 'app-physical-store-section-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, ConfirmDialogModule, ButtonModule, DialogModule, InputTextModule, ToggleSwitchModule, DataTable],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />

        <!-- Dialog editar sección -->
        <p-dialog header="Configuración de la página" [(visible)]="showSectionDialog" [modal]="true" [style]="{ width: '480px' }">
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Título <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="sectionTitle" placeholder="Ej: Nuestras Tiendas" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Subtítulo</label>
                    <input pInputText [(ngModel)]="sectionSubtitle" placeholder="Ej: Encuéntranos en..." />
                </div>
                <div class="flex items-center gap-3">
                    <p-toggleswitch [(ngModel)]="sectionActive" />
                    <span class="text-sm">{{ sectionActive ? 'Sección activa' : 'Sección inactiva' }}</span>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="showSectionDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="savingSection()" (onClick)="saveSection()" />
            </ng-template>
        </p-dialog>

        <div class="card p-6">
            <!-- Header página -->
            <div class="flex items-start justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">
                        {{ section()?.title || 'Tiendas Físicas' }}
                    </h1>
                    @if (section()?.subtitle) {
                        <p class="text-surface-500 dark:text-surface-400 mt-1 mb-0">
                            {{ section()!.subtitle }}
                        </p>
                    }
                </div>
                <p-button label="Configurar página" icon="pi pi-cog" severity="secondary" [outlined]="true" (onClick)="openSectionDialog()" />
            </div>

            <!-- Tabla tiendas -->
            <app-data-table
                [data]="stores()"
                [columns]="columns"
                [loading]="loading()"
                createLabel="Nueva Tienda"
                createMode="route"
                createRoute="/configuration/tiendas-fisicas/create"
                editMode="route"
                [editRouteFn]="editRoute"
                [showDelete]="true"
                [searchFields]="['name', 'address']"
                emptyMessage="No hay registros para Tiendas Fisicas"
                [customCellTemplate]="logoTpl"
                (onDelete)="confirmDelete($event)"
            />
        </div>

        <ng-template #logoTpl let-row let-col="col">
            @if (col.field === 'logo_url') {
                <img [src]="getLogoUrl(row.logo_url)" [alt]="row.name" class="w-20 h-20 object-contain rounded border border-surface-200 bg-surface-50" (error)="$any($event.target).src = 'demo/images/placeholder.jpg'" />
            }
        </ng-template>
    `
})
export class PhysicalStoreSectionList implements OnInit {
    private service = inject(PhysicalStoreService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    stores = signal<PhysicalStore[]>([]);
    section = signal<PhysicalStoreSection | null>(null);
    loading = signal(false);
    savingSection = signal(false);

    showSectionDialog = false;
    sectionTitle = '';
    sectionSubtitle = '';
    sectionActive = true;

    columns: DataTableColumn[] = [
        { field: 'logo_url', header: 'Logo', type: 'custom', width: '6rem' },
        { field: 'name', header: 'Nombre', sortable: true, width: '16rem' },
        { field: 'address', header: 'Dirección', width: '20rem' },
        { field: 'order', header: 'Orden', width: '6rem' },
        { field: 'is_active', header: 'Estado', type: 'tag', width: '8rem', tagLabel: (v) => (v ? 'Activo' : 'Inactivo'), tagSeverity: (v) => (v ? 'success' : 'danger') },
        { field: 'updated_at', header: 'Actualizado', type: 'date', width: '10rem' }
    ];

    editRoute = (row: PhysicalStore) => `/configuration/tiendas-fisicas/${row.id}/edit`;

    ngOnInit(): void {
        this.loadSection();
        this.loadStores();
    }

    getLogoUrl(path: string | null | undefined): string {
        if (!path) return 'assets/placeholder.png';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    loadSection(): void {
        this.service.getSection().subscribe({
            next: (res) => this.section.set(res.data)
        });
    }

    loadStores(): void {
        this.loading.set(true);
        this.service.getStores().subscribe({
            next: (res) => {
                this.stores.set(res.data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }
    openSectionDialog(): void {
        const s = this.section();
        if (s) {
            this.sectionTitle = s.title;
            this.sectionSubtitle = s.subtitle ?? '';
            this.sectionActive = s.is_active;
            this.showSectionDialog = true;
        }
    }

    saveSection(): void {
        if (!this.sectionTitle.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Requerido', detail: 'El título es obligatorio' });
            return;
        }
        this.savingSection.set(true);
        const fd = new FormData();
        fd.append('title', this.sectionTitle);
        fd.append('subtitle', this.sectionSubtitle);
        fd.append('is_active', this.sectionActive ? '1' : '0');

        this.service.updateSection(fd).subscribe({
            next: (res) => {
                this.section.set(res.data);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada' });
                this.showSectionDialog = false;
                this.savingSection.set(false);
            },
            error: () => {
                this.savingSection.set(false);
            }
        });
    }

    confirmDelete(store: PhysicalStore): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la tienda "${store.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => this.delete(store)
        });
    }

    private delete(store: PhysicalStore): void {
        this.service.deleteStore(store.id!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Tienda "${store.name}" eliminada` });
                this.loadStores();
            }
        });
    }
}
