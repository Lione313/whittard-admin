import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';
import { ClassUrlPipe } from '@/app/shared/pipes/class-url.pipe';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

export interface StoreItem {
    name: string;
    logo: string | File | null;
    address: string | null;
    url: string | null;
    url_text: string | null;
    order: number;
    is_active: boolean;
}

export interface PhysicalStoresContent extends Record<string, unknown> {
    is_visible: boolean;
    title: string;
    subtitle: string;
    stores: StoreItem[];
}

@Component({
    selector: 'app-physical-stores-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, ImageUploadComponent],
    template: `
        <div class="space-y-6">
            <!-- HEADER -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Sección de tiendas físicas (nombre, logo, dirección y enlace).</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <!-- TÍTULO / SUBTÍTULO -->
            <div class="grid gap-4 md:grid-cols-2">
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título de la sección</label>
                    <input pInputText type="text" [(ngModel)]="content.title" placeholder="Ej: Nuestras Tiendas" class="w-full" />
                </div>
                <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Subtítulo</label>
                    <input pInputText type="text" [(ngModel)]="content.subtitle" placeholder="Ej: Encuéntranos en..." class="w-full" />
                </div>
            </div>

            <!-- TIENDAS -->
            <div class="flex flex-col gap-3">
                @for (store of content.stores; track $index; let i = $index) {
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">Tienda {{ i + 1 }}</span>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2">
                                    <p-toggleSwitch [(ngModel)]="store.is_active" />
                                    <span class="text-xs text-surface-500">{{ store.is_active ? 'Activa' : 'Inactiva' }}</span>
                                </div>
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" title="Eliminar" (onClick)="removeStore(i)" />
                            </div>
                        </div>

                        <div class="grid gap-3 md:grid-cols-2">
                            <div class="md:col-span-2">
                                <app-image-upload label="Logo" chooseLabel="Subir Logo" [initialUrl]="getLogoUrl(store)" (onFileSelected)="onLogoSelected(i, $event)" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Nombre <span class="text-red-500">*</span></label>
                                <input pInputText type="text" [(ngModel)]="store.name" placeholder="Ej: Tienda Centro" class="w-full" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Dirección</label>
                                <input pInputText type="text" [(ngModel)]="store.address" placeholder="Ej: Av. Larco 123, Miraflores" class="w-full" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">URL</label>
                                <input pInputText type="text" [(ngModel)]="store.url" placeholder="https://maps.google.com/..." class="w-full" />
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Texto del link</label>
                                    <input pInputText type="text" [(ngModel)]="store.url_text" placeholder="Ej: Ver en mapa" class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Orden</label>
                                    <input pInputText type="number" [(ngModel)]="store.order" min="0" class="w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <p-button label="Agregar tienda" icon="pi pi-plus" [outlined]="true" (onClick)="addStore()" />
        </div>
    `
})
export class PhysicalStoresEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    private classUrlPipe = new ClassUrlPipe();

    content: PhysicalStoresContent = { is_visible: true, title: '', subtitle: '', stores: [] };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as PhysicalStoresContent | undefined;

        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                title: raw.title ?? '',
                subtitle: raw.subtitle ?? '',
                stores: Array.isArray(raw.stores)
                    ? raw.stores.map((store) => ({
                          name: store?.name ?? '',
                          logo: store?.logo ?? null,
                          address: store?.address ?? null,
                          url: store?.url ?? null,
                          url_text: store?.url_text ?? null,
                          order: store?.order ?? 0,
                          is_active: this.toBool(store?.is_active)
                      }))
                    : []
            };
        }
    }

    addStore(): void {
        this.content.stores = [
            ...this.content.stores,
            {
                name: '',
                logo: null,
                address: null,
                url: null,
                url_text: null,
                order: this.content.stores.length,
                is_active: true
            }
        ];
    }

    private toBool(value: unknown): boolean {
        if (typeof value === 'string') return value !== '0' && value.toLowerCase() !== 'false';

        return value !== false && value !== 0 && value !== null && value !== undefined;
    }

    removeStore(index: number): void {
        this.content.stores = this.content.stores.filter((_, i) => i !== index);
    }

    onLogoSelected(index: number, file: File | null): void {
        this.content.stores = this.content.stores.map((store, i) => (i === index ? { ...store, logo: file } : store));
    }

    getLogoUrl(store: StoreItem): string | null {
        if (typeof store.logo === 'string' && store.logo) return this.classUrlPipe.transform(store.logo);

        return null;
    }

    onSave(): void {
        const hasFile = this.content.stores.some((store) => store.logo instanceof File);

        if (hasFile) {
            const fd = new FormData();

            fd.append('content[is_visible]', this.content.is_visible ? '1' : '0');
            fd.append('content[title]', this.content.title || '');
            fd.append('content[subtitle]', this.content.subtitle || '');

            this.content.stores.forEach((store, i) => {
                fd.append(`content[stores][${i}][name]`, store.name || '');
                fd.append(`content[stores][${i}][address]`, store.address ?? '');
                fd.append(`content[stores][${i}][url]`, store.url ?? '');
                fd.append(`content[stores][${i}][url_text]`, store.url_text ?? '');
                fd.append(`content[stores][${i}][order]`, String(store.order ?? 0));
                fd.append(`content[stores][${i}][is_active]`, store.is_active ? '1' : '0');

                if (store.logo instanceof File) {
                    fd.append(`content[stores][${i}][logo]`, store.logo);
                } else if (typeof store.logo === 'string') {
                    fd.append(`content[stores][${i}][logo]`, store.logo);
                }
            });

            this.save.emit(fd);
        } else {
            this.save.emit({
                is_visible: this.content.is_visible,
                title: this.content.title,
                subtitle: this.content.subtitle,
                stores: this.content.stores.map((store) => ({
                    name: store.name,
                    logo: typeof store.logo === 'string' ? store.logo : null,
                    address: store.address,
                    url: store.url,
                    url_text: store.url_text,
                    order: store.order,
                    is_active: store.is_active
                }))
            });
        }
    }
}
