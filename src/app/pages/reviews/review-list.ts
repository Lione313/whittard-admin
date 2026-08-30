import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';

import { ReviewService } from '@/app/features/reviews/services/review.service';
import { REVIEW_RATING_OPTIONS, REVIEW_STATUS_OPTIONS, Review, ReviewFilters, ReviewStatus } from '@/app/features/reviews/models/review.model';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-review-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, RippleModule, ToastModule, ConfirmDialogModule, TagModule, InputTextModule, SelectModule, IconFieldModule, InputIconModule, DialogModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card p-0!">
            <p-table
                #dt
                [value]="filteredReviews()"
                [lazy]="true"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '80rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} reseñas"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Reseñas</h5>
                            <small class="text-muted-color block mt-1">Modera las reseñas de los clientes. Solo las aprobadas se publican en la tienda.</small>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-select
                                [ngModel]="statusFilter()"
                                (ngModelChange)="onStatusChange($event)"
                                [options]="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Estado"
                                emptyMessage="Sin resultados"
                                showClear
                                class="w-full md:w-44"
                            />
                            <p-select
                                [ngModel]="ratingFilter()"
                                (ngModelChange)="onRatingChange($event)"
                                [options]="ratingOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Calificación"
                                emptyMessage="Sin resultados"
                                showClear
                                class="w-full md:w-44"
                            />
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por producto, cliente o texto..." class="w-full md:w-64" />
                            </p-iconfield>
                            <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" severity="secondary" title="Recargar" (onClick)="resetAndLoad()" />
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="min-width: 12rem">Producto</th>
                        <th style="min-width: 12rem">Cliente</th>
                        <th style="min-width: 7rem">Rating</th>
                        <th style="min-width: 18rem">Reseña</th>
                        <th style="min-width: 8rem">Compra verificada</th>
                        <th style="min-width: 9rem">Estado</th>
                        <th style="min-width: 9rem">Fecha</th>
                        <th style="width: 12rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-review>
                    <tr [class]="review.status === 'pending' ? 'bg-amber-50/60 dark:bg-amber-500/10' : ''">
                        <td>
                            <div class="flex flex-col">
                                <span class="font-medium">{{ review.product?.name ?? '—' }}</span>
                                @if (review.product?.code) {
                                    <small class="text-muted-color font-mono">{{ review.product?.code }}</small>
                                }
                            </div>
                        </td>
                        <td>
                            <div class="flex items-center gap-2">
                                <div class="w-9 h-9 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-xs font-semibold text-surface-700 dark:text-surface-200 shrink-0">
                                    {{ initials(review.customer?.name) }}
                                </div>
                                <div class="min-w-0">
                                    <span class="block font-medium truncate">{{ review.customer?.name ?? 'Anónimo' }}</span>
                                    @if (review.customer?.email) {
                                        <small class="text-muted-color block truncate">{{ review.customer?.email }}</small>
                                    }
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="flex items-center gap-2 whitespace-nowrap">
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ review.rating }}</span>
                                <span class="text-sm text-amber-500">
                                    {{ '★'.repeat(review.rating) }}<span class="text-surface-300 dark:text-surface-600">{{ '★'.repeat(5 - review.rating) }}</span>
                                </span>
                            </div>
                        </td>
                        <td>
                            @if (review.title) {
                                <span class="block font-medium">{{ review.title }}</span>
                            }
                            <span class="text-muted-color line-clamp-2">{{ review.body }}</span>
                        </td>
                        <td>
                            @if (review.is_verified) {
                                <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap"> <i class="pi pi-check-circle"></i>Verificada </span>
                            } @else {
                                <span class="text-muted-color">—</span>
                            }
                        </td>
                        <td><p-tag [value]="statusLabel(review.status)" [severity]="statusSeverity(review.status)" [icon]="statusIcon(review.status)" /></td>
                        <td class="text-muted-color whitespace-nowrap">{{ review.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <div class="flex items-center justify-end gap-1">
                                <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" title="Ver detalle" (onClick)="openDetail(review)" />
                                @if (review.status === 'pending') {
                                    <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="success" title="Aprobar" (onClick)="approve(review)" />
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" title="Rechazar" (onClick)="reject(review)" />
                                } @else if (review.status === 'rejected') {
                                    <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="success" title="Aprobar" (onClick)="approve(review)" />
                                } @else {
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" title="Rechazar" (onClick)="reject(review)" />
                                }
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar" (onClick)="remove(review)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td colspan="8">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando reseñas...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center p-16">
                            <div class="flex flex-col items-center justify-center gap-2 text-muted-color">
                                <i class="pi pi-inbox text-3xl"></i>
                                <span>No se encontraron reseñas.</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [visible]="detailVisible()" (visibleChange)="detailVisible.set($event)" header="Detalle de la reseña" [modal]="true" [style]="{ width: '620px' }">
            <ng-template #content>
                @if (selected(); as review) {
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-sm font-semibold text-surface-700 dark:text-surface-200 shrink-0">
                                    {{ initials(review.customer?.name) }}
                                </div>
                                <div class="min-w-0">
                                    <span class="block font-semibold text-surface-900 dark:text-surface-0 truncate">{{ review.customer?.name ?? 'Cliente anónimo' }}</span>
                                    <small class="text-muted-color block">{{ review.product?.name ?? 'Producto' }} · {{ review.created_at | date: 'dd/MM/yyyy HH:mm' }}</small>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                @if (review.is_verified) {
                                    <p-tag value="Verificada" severity="info" />
                                }
                                <p-tag [value]="statusLabel(review.status)" [severity]="statusSeverity(review.status)" [icon]="statusIcon(review.status)" />
                            </div>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Calificación</span>
                            <span class="flex items-center gap-2 text-lg">
                                <span class="text-amber-500"
                                    >{{ '★'.repeat(review.rating) }}<span class="text-surface-300 dark:text-surface-600">{{ '★'.repeat(5 - review.rating) }}</span></span
                                >
                                <span class="text-sm text-muted-color font-medium">{{ review.rating }} / 5</span>
                            </span>
                        </div>

                        @if (review.title) {
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Título</span>
                                <span class="font-medium">{{ review.title }}</span>
                            </div>
                        }

                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Comentario</span>
                            <p class="m-0 text-surface-700 dark:text-surface-200 whitespace-pre-wrap">{{ review.body }}</p>
                        </div>

                        @if (review.images?.length) {
                            <div class="flex flex-col gap-2">
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Imágenes</span>
                                <div class="flex flex-wrap gap-2">
                                    @for (img of review.images; track img) {
                                        <a [href]="img" target="_blank" rel="noopener noreferrer" title="Abrir imagen">
                                            <img [src]="img" alt="Imagen de la reseña" class="w-24 h-24 object-cover rounded-lg border border-surface-200 dark:border-surface-700 hover:opacity-80 transition-opacity" />
                                        </a>
                                    }
                                </div>
                            </div>
                        }

                        <div class="flex justify-end gap-2 border-t border-surface-200 dark:border-surface-700 pt-4">
                            @if (review.status === 'approved') {
                                <p-button label="Rechazar" icon="pi pi-times" severity="danger" (onClick)="reject(review)" />
                            } @else {
                                <p-button label="Aprobar" icon="pi pi-check" severity="success" (onClick)="approve(review)" />
                            }
                        </div>
                    </div>
                }
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class ReviewList implements OnInit, OnDestroy {
    private reviewService = inject(ReviewService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('dt') dt!: Table;

    reviews = signal<Review[]>([]);
    loading = signal(false);
    totalRecords = signal(0);
    rowsPerPage = signal(15);
    detailVisible = signal(false);
    selected = signal<Review | null>(null);

    statusFilter = signal<ReviewStatus | null>(null);
    ratingFilter = signal<number | null>(null);
    searchQuery = signal('');
    activeSearch = signal('');

    private search$ = new Subject<string>();

    readonly statusOptions = REVIEW_STATUS_OPTIONS.map(({ label, value }) => ({ label, value }));
    readonly ratingOptions = REVIEW_RATING_OPTIONS;

    filteredReviews = computed(() => {
        const query = this.activeSearch().trim().toLowerCase();

        if (!query) return this.reviews();

        return this.reviews().filter(
            (r) => r.title?.toLowerCase().includes(query) || r.body?.toLowerCase().includes(query) || r.customer?.name?.toLowerCase().includes(query) || r.product?.name?.toLowerCase().includes(query) || r.product?.code?.toLowerCase().includes(query)
        );
    });

    ngOnInit() {
        this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((term) => this.activeSearch.set(term));
    }

    ngOnDestroy() {
        this.search$.complete();
    }

    load(event: TableLazyLoadEvent) {
        const page = event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
        const perPage = event.rows ?? this.rowsPerPage();

        this.rowsPerPage.set(perPage);

        const filters: ReviewFilters = {
            page,
            per_page: perPage,
            status: this.statusFilter() ?? undefined,
            rating: this.ratingFilter() ?? undefined
        };

        this.loading.set(true);
        this.reviews.set([]);
        this.reviewService.list(filters).subscribe({
            next: (res) => {
                this.reviews.set(res.data.items ?? []);
                this.totalRecords.set(res.data.pagination?.total ?? 0);
                this.loading.set(false);
            },
            error: (err) => {
                this.reviews.set([]);
                this.totalRecords.set(0);
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    onStatusChange(value: ReviewStatus | null) {
        this.statusFilter.set(value ?? null);
        this.resetAndLoad();
    }

    onRatingChange(value: number | null) {
        this.ratingFilter.set(value ?? null);
        this.resetAndLoad();
    }

    onSearchChange(value: string) {
        this.searchQuery.set(value ?? '');
        this.search$.next(this.searchQuery());
    }

    resetAndLoad() {
        this.dt?.reset();
    }

    openDetail(review: Review) {
        this.selected.set(review);
        this.detailVisible.set(true);
    }

    approve(review: Review) {
        this.moderate(review, 'approved');
    }

    reject(review: Review) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de rechazar la reseña de "${review.customer?.name ?? 'cliente anónimo'}"?`,
            header: 'Rechazar reseña',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.moderate(review, 'rejected')
        });
    }

    private moderate(review: Review, status: 'approved' | 'rejected') {
        this.reviewService.moderate(review.id, status).subscribe({
            next: (res) => {
                const approved = status === 'approved';

                this.messageService.add({
                    severity: approved ? 'success' : 'warn',
                    summary: approved ? 'Reseña aprobada' : 'Reseña rechazada',
                    detail: res.message,
                    life: 3000
                });
                this.detailVisible.set(false);
                this.selected.set(null);
                this.applyModeration(review, status);
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
        });
    }

    private applyModeration(review: Review, status: 'approved' | 'rejected') {
        const activeFilter = this.statusFilter();

        if (activeFilter && activeFilter !== status) {
            this.reviews.update((list) => list.filter((r) => r.id !== review.id));
            this.totalRecords.update((n) => Math.max(0, n - 1));
            this.backfillIfEmpty();
        } else {
            this.reviews.update((list) => list.map((r) => (r.id === review.id ? { ...r, status } : r)));
        }
    }

    remove(review: Review) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la reseña de "${review.customer?.name ?? 'cliente anónimo'}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.reviewService.remove(review.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Reseña eliminada', detail: res.message, life: 3000 });
                        this.detailVisible.set(false);
                        this.selected.set(null);
                        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
                        this.totalRecords.update((n) => Math.max(0, n - 1));
                        this.backfillIfEmpty();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }

    private backfillIfEmpty() {
        if (this.reviews().length === 0 && this.totalRecords() > 0) {
            this.dt?.reset();
        }
    }

    initials(name: string | null | undefined): string {
        if (!name) return '?';

        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('');
    }

    stars(rating: number): string {
        return '★'.repeat(Math.max(0, Math.min(5, rating))).padEnd(5, '☆');
    }

    statusLabel(status: ReviewStatus): string {
        return REVIEW_STATUS_OPTIONS.find((o) => o.value === status)?.label.replace(/s$/, '') ?? status;
    }

    statusSeverity(status: ReviewStatus) {
        return REVIEW_STATUS_OPTIONS.find((o) => o.value === status)?.severity ?? 'secondary';
    }

    statusIcon(status: ReviewStatus): string {
        switch (status) {
            case 'approved':
                return 'pi pi-check';
            case 'rejected':
                return 'pi pi-times';
            default:
                return 'pi pi-clock';
        }
    }
}
