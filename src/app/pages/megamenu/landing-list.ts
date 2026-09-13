import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { LandingService } from '@/app/features/megamenu/services/landing.service';
import { NavigationService } from '@/app/features/megamenu/services/navigation.service';
import { LANDING_STATUS_OPTIONS, landingStatusLabel, Landing, LandingStatus } from '@/app/features/megamenu/models/landing.model';
import { flattenCatalogOptions } from '@/app/features/megamenu/utils/catalog';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-landing-list',
    standalone: true,
    imports: [DatePipe, FormsModule, ButtonModule, ToastModule, TableModule, ToolbarModule, InputTextModule, SelectModule, TagModule, IconFieldModule, InputIconModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="Nueva Landing" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <div class="card p-4! mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <p-iconfield iconPosition="left">
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" [ngModel]="query()" (ngModelChange)="query.set($event ?? '')" placeholder="Buscar por título o slug..." class="w-full md:w-72" />
                </p-iconfield>
                <p-select
                    [ngModel]="statusFilter()"
                    (ngModelChange)="onStatusFilterChange($event)"
                    [options]="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Estado"
                    emptyMessage="Sin resultados"
                    showClear
                    class="w-full md:w-48"
                />
                <p-select
                    [ngModel]="categoryFilter()"
                    (ngModelChange)="onCategoryFilterChange($event)"
                    [options]="categoryOptions()"
                    optionLabel="label"
                    optionValue="id"
                    placeholder="Categoría asociada"
                    emptyMessage="Sin resultados"
                    filter
                    showClear
                    class="w-full md:w-64"
                />
            </div>
        </div>

        <div class="card p-0!">
            <p-table
                [value]="filteredLandings()"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="15"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
                dataKey="id"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} landings"
            >
                <ng-template #caption>
                    <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Landings</h5>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th style="width: 5rem">Miniatura</th>
                        <th style="min-width: 14rem">Título</th>
                        <th style="min-width: 12rem">Slug / URL</th>
                        <th style="min-width: 12rem">Categoría</th>
                        <th style="min-width: 8rem">Estado</th>
                        <th style="min-width: 10rem">Publicado</th>
                        <th style="width: 12rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-landing>
                    <tr>
                        <td>
                            @if (landing.thumbnail_url) {
                                <img [src]="landing.thumbnail_url" alt="Miniatura de {{ landing.title }}" class="w-10 h-10 rounded-md object-cover" loading="lazy" />
                            } @else {
                                <div class="w-10 h-10 rounded-md bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-muted-color">
                                    <i class="pi pi-image text-sm"></i>
                                </div>
                            }
                        </td>
                        <td class="font-medium">{{ landing.title }}</td>
                        <td>
                            <div class="font-mono text-sm">{{ landing.slug }}</div>
                            <div class="text-xs text-muted-color">{{ landing.url }}</div>
                        </td>
                        <td>
                            <div class="flex items-center gap-2">
                                <span>{{ landing.category?.name ?? '—' }}</span>
                                @if (landing.category) {
                                    <p-tag [value]="landing.category.slug" severity="secondary" styleClass="font-mono text-xs" />
                                }
                            </div>
                        </td>
                        <td>
                            <p-tag [value]="statusLabel(landing.status)" [severity]="landing.status === 'published' ? 'success' : 'secondary'" />
                        </td>
                        <td class="text-muted-color">
                            @if (landing.published_at) {
                                {{ landing.published_at | date: 'dd/MM/yyyy HH:mm' }}
                            } @else {
                                —
                            }
                        </td>
                        <td>
                            <div class="flex items-center justify-end gap-1">
                                <p-button
                                    [icon]="landing.status === 'published' ? 'pi pi-eye-slash' : 'pi pi-send'"
                                    [rounded]="true"
                                    [text]="true"
                                    [severity]="landing.status === 'published' ? 'warn' : 'success'"
                                    [title]="landing.status === 'published' ? 'Despublicar' : 'Publicar'"
                                    [loading]="busyId() === landing.id"
                                    (onClick)="togglePublish(landing)"
                                />
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar" (onClick)="editLanding(landing)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar" (onClick)="deleteLanding(landing)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #loadingbody>
                    <tr>
                        <td colspan="7">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando landings...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center p-8 text-muted-color">No se encontraron landings.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class LandingList implements OnInit {
    private landingService = inject(LandingService);
    private navigationService = inject(NavigationService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    landings = signal<Landing[]>([]);
    loading = signal(false);
    busyId = signal<string | null>(null);

    query = signal('');
    statusFilter = signal<LandingStatus | null>(null);
    categoryFilter = signal<string | null>(null);

    categoryOptions = signal<{ id: string; label: string }[]>([]);

    readonly statusOptions = LANDING_STATUS_OPTIONS;
    readonly statusLabel = landingStatusLabel;

    filteredLandings = computed(() => {
        const term = this.query().trim().toLowerCase();

        if (!term) return this.landings();

        return this.landings().filter((landing) => landing.title.toLowerCase().includes(term) || landing.slug.toLowerCase().includes(term) || (landing.category?.name.toLowerCase().includes(term) ?? false));
    });

    ngOnInit() {
        this.loadLandings();
        this.loadCategoryOptions();
    }

    openNew() {
        void this.router.navigate(['/megamenu/landings/new']);
    }

    editLanding(landing: Landing) {
        void this.router.navigate(['/megamenu/landings', landing.id, 'edit']);
    }

    togglePublish(landing: Landing) {
        if (this.busyId()) return;

        const nextStatus: LandingStatus = landing.status === 'published' ? 'draft' : 'published';

        this.busyId.set(landing.id);
        this.landingService.updateStatus(landing.id, nextStatus).subscribe({
            next: () => {
                this.busyId.set(null);
                this.messageService.add({
                    severity: 'success',
                    summary: nextStatus === 'published' ? 'Publicada' : 'Despublicada',
                    detail: `La landing "${landing.title}" fue ${nextStatus === 'published' ? 'publicada' : 'despublicada'}.`,
                    life: 3000
                });
                this.loadLandings();
            },
            error: (err) => {
                this.busyId.set(null);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    deleteLanding(landing: Landing) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la landing "${landing.title}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Sí, eliminar',
            accept: () => {
                this.landingService.remove(landing.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Landing eliminada. Sus enlaces del menú se quitaron automáticamente.', life: 4000 });
                        this.loadLandings();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }

    onStatusFilterChange(value: LandingStatus | null) {
        this.statusFilter.set(value ?? null);
        this.loadLandings();
    }

    onCategoryFilterChange(value: string | null) {
        this.categoryFilter.set(value ?? null);
        this.loadLandings();
    }

    private loadLandings() {
        this.loading.set(true);
        this.landings.set([]);

        this.landingService.list({ status: this.statusFilter(), category_id: this.categoryFilter() }).subscribe({
            next: (res) => {
                this.landings.set(Array.isArray(res.data) ? res.data : []);
                this.loading.set(false);
            },
            error: (err) => {
                this.landings.set([]);
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    private loadCategoryOptions() {
        this.navigationService.getCatalog().subscribe({
            next: (res) => {
                this.categoryOptions.set(
                    flattenCatalogOptions(res.data?.categories)
                        .filter((option) => option.isRoot)
                        .map((option) => ({ id: option.id, label: option.label }))
                );
            },
            error: () => this.categoryOptions.set([])
        });
    }
}
