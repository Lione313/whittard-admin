import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { ProductService } from '@/app/features/products/services/product.service';
import { ProductListStateService } from '@/app/features/products/services/product-list-state.service';
import { ProductImportResult, ProductListItem, ProductStatus } from '@/app/features/products/models/product.model';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { ProductImportGuide } from '@/app/shared/components/product-import-guide/product-import-guide';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogComponent,
        ProductImportGuide
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo Producto" icon="pi pi-plus" (onClick)="createProduct()" />
                <p-button label="Importar" icon="pi pi-upload" severity="secondary" [loading]="validating()" class="ml-2" (onClick)="importFileInput.click()" />
                <p-button label="Guía" icon="pi pi-info-circle" severity="secondary" text class="ml-1" (onClick)="importGuideVisible.set(true)" />
                <input #importFileInput type="file" accept=".xlsx" class="hidden" (change)="onImportFileSelected($event)" />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar" icon="pi pi-download" severity="secondary" [loading]="exporting()" (onClick)="exportProducts()" />
            </ng-template>
        </p-toolbar>

        <div class="card p-0!">
            <p-table
                #dt
                [value]="products()"
                [lazy]="true"
                [loading]="loading()"
                [rows]="rows()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
                dataKey="id"
                [sortField]="sortField()"
                [sortOrder]="sortOrder()"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Productos</h5>
                        <div class="flex flex-col md:flex-row md:items-center gap-3">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar por nombre, slug o marca..." class="w-full md:w-64" />
                            </p-iconfield>
                            <p-select [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)" [options]="statusOptions" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full md:w-48" />
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th pSortableColumn="name" style="min-width: 14rem">
                            Nombre
                            <p-sortIcon field="name" />
                        </th>
                        <th style="min-width: 10rem">Categoría</th>
                        <th pSortableColumn="brand" style="min-width: 10rem">
                            Marca
                            <p-sortIcon field="brand" />
                        </th>
                        <th style="min-width: 8rem">Estado</th>
                        <th style="min-width: 6rem">Variantes</th>
                        <th style="min-width: 9rem">Precio</th>
                        <th pSortableColumn="created_at" style="min-width: 10rem">
                            Creado
                            <p-sortIcon field="created_at" />
                        </th>
                        <th pSortableColumn="updated_at" style="min-width: 10rem">
                            Actualizado
                            <p-sortIcon field="updated_at" />
                        </th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-product>
                    <tr>
                        <td class="font-medium">{{ product.name }}</td>
                        <td>
                            @if (product.category) {
                                @if (product.category.parent) {
                                    <span class="text-surface-500">{{ product.category.parent.name }} /</span>
                                }
                                {{ product.category.name }}
                            } @else {
                                <span class="text-surface-400">—</span>
                            }
                        </td>
                        <td>{{ product.brand }}</td>
                        <td>
                            <p-tag [value]="statusLabel(product.status)" [severity]="statusSeverity(product.status)" />
                        </td>
                        <td>{{ product.variants_count }}</td>
                        <td>
                            @if (product.price_from !== null && product.price_to !== null) {
                                @if (product.price_from === product.price_to) {
                                    {{ product.price_from | number: '1.0-2' }}
                                } @else {
                                    {{ product.price_from | number: '1.0-2' }} – {{ product.price_to | number: '1.0-2' }}
                                }
                            } @else {
                                <span class="text-surface-400">—</span>
                            }
                        </td>
                        <td>{{ product.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ product.updated_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" [raised]="true" severity="secondary" (onClick)="editProduct(product)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" [raised]="true" severity="danger" (onClick)="deleteProduct(product)" />
                        </td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td [attr.colspan]="9" class="text-center p-8">
                            <span class="inline-flex items-center gap-2 text-muted-color">
                                <i class="pi pi-spin pi-spinner"></i>
                                Cargando productos...
                            </span>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="9" class="text-center p-8 text-muted-color">No se encontraron productos.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [visible]="importReviewVisible()" (visibleChange)="importReviewVisible.set($event)" header="Revisar importación" [modal]="true" [style]="{ width: '640px' }" [closable]="false">
            <ng-template #content>
                @if (importResult(); as result) {
                    <div class="flex flex-col gap-4">
                        <div class="grid grid-cols-3 gap-3 text-center">
                            <div class="p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
                                <span class="block text-2xl font-semibold text-green-700 dark:text-green-300">{{ result.imported }}</span>
                                <span class="text-xs text-muted-color">Crear</span>
                            </div>
                            <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                                <span class="block text-2xl font-semibold text-blue-700 dark:text-blue-300">{{ result.updated }}</span>
                                <span class="text-xs text-muted-color">Actualizar</span>
                            </div>
                            <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900">
                                <span class="block text-2xl font-semibold text-amber-700 dark:text-amber-300">{{ result.skipped }}</span>
                                <span class="text-xs text-muted-color">Omitir</span>
                            </div>
                        </div>

                        @if (importPreviewEntries().length) {
                            <div>
                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Vista previa</span>
                                <div class="flex flex-col gap-1.5 mt-2 max-h-56 overflow-y-auto">
                                    @for (p of importPreviewEntries(); track p.key) {
                                        <div class="flex items-center justify-between gap-2 p-2 rounded-lg border border-surface-200 dark:border-surface-700">
                                            <span class="flex items-center gap-2 min-w-0">
                                                <i [class]="previewIcon(p.action)" [class.text-green-500]="p.action === 'created'" [class.text-blue-500]="p.action === 'updated'" [class.text-amber-500]="p.action === 'skipped'"></i>
                                                <span class="text-sm font-medium truncate">{{ p.name }}</span>
                                                @if (p.code) {
                                                    <span class="text-xs text-muted-color">({{ p.code }})</span>
                                                }
                                            </span>
                                            <span class="text-xs text-muted-color whitespace-nowrap">{{ p.variants }} variante{{ p.variants === 1 ? '' : 's' }}</span>
                                        </div>
                                    }
                                </div>
                            </div>
                        }

                        @if (importResultErrors().length) {
                            <div>
                                <span class="text-xs font-semibold uppercase tracking-wide text-red-500">Errores ({{ importResultErrors().length }})</span>
                                <div class="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto">
                                    @for (entry of importResultErrors(); track entry.key) {
                                        <div class="p-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
                                            <span class="text-xs font-medium text-red-700 dark:text-red-300">{{ entry.key }}</span>
                                            <ul class="m-0 mt-1 pl-4 list-disc text-xs text-red-600 dark:text-red-400">
                                                @for (msg of entry.messages; track msg) {
                                                    <li>{{ msg }}</li>
                                                }
                                            </ul>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                } @else {
                    <div class="flex flex-col items-center justify-center gap-2 py-8 text-muted-color">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                        <span>Validando archivo...</span>
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text [disabled]="validating()" (onClick)="closeImportReview()" />
                    <p-button label="Confirmar importación" icon="pi pi-check" [loading]="confirming()" [disabled]="!importResult()" (onClick)="confirmImport()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="importErrorsDialogVisible()" (visibleChange)="importErrorsDialogVisible.set($event)" header="Errores de importación" [modal]="true" [style]="{ width: '560px' }">
            <ng-template #content>
                <div class="flex flex-col gap-3">
                    @for (entry of importErrorsEntries(); track entry.key) {
                        <div class="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
                            <span class="font-medium text-red-700 dark:text-red-300 text-sm">{{ entry.key }}</span>
                            <ul class="m-0 mt-1 pl-4 list-disc text-sm text-red-600 dark:text-red-400">
                                @for (msg of entry.messages; track msg) {
                                    <li>{{ msg }}</li>
                                }
                            </ul>
                        </div>
                    }
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="productTypeDialogVisible()" (visibleChange)="productTypeDialogVisible.set($event)" [modal]="true" header="Nuevo Producto" [style]="{ width: '520px' }">
            <ng-template #content>
                <div class="flex flex-col gap-3">
                    <p class="m-0 text-sm text-muted-color mb-1">Elige el tipo de producto que quieres crear.</p>
                    <button
                        type="button"
                        (click)="startNewProduct('simple')"
                        class="w-full text-left flex items-start gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors cursor-pointer"
                    >
                        <i class="pi pi-tag text-2xl text-primary mt-1"></i>
                        <span class="flex flex-col gap-0.5">
                            <span class="font-semibold text-surface-900 dark:text-surface-0">Producto simple</span>
                            <span class="text-sm text-muted-color">Una sola variante, sin atributos ni variaciones.</span>
                        </span>
                    </button>
                    <button
                        type="button"
                        (click)="startNewProduct('variable')"
                        class="w-full text-left flex items-start gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors cursor-pointer"
                    >
                        <i class="pi pi-sliders-h text-2xl text-primary mt-1"></i>
                        <span class="flex flex-col gap-0.5">
                            <span class="font-semibold text-surface-900 dark:text-surface-0">Producto variable</span>
                            <span class="text-sm text-muted-color">Varias variantes combinando atributos.</span>
                        </span>
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <app-product-import-guide [visible]="importGuideVisible()" (visibleChange)="importGuideVisible.set($event)" />

        <app-confirm-dialog />
        <p-toast />
    `
})
export class ProductList implements OnInit, OnDestroy {
    static readonly MAX_IMPORT_SIZE = 100 * 1024 * 1024;

    private productService = inject(ProductService);
    private state = inject(ProductListStateService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    @ViewChild('dt') dt!: Table;

    products = this.state.products;
    totalRecords = this.state.totalRecords;
    rows = this.state.rows;
    search = this.state.search;
    statusFilter = this.state.statusFilter;
    loaded = this.state.loaded;

    loading = signal(false);
    productTypeDialogVisible = signal(false);
    importGuideVisible = signal(false);
    exporting = signal(false);
    validating = signal(false);
    confirming = signal(false);
    importReviewVisible = signal(false);
    importResult = signal<ProductImportResult | null>(null);
    pendingImportFile: File | null = null;
    importErrorsDialogVisible = signal(false);
    importErrors = signal<Record<string, Record<string, string[]>>>({});

    importPreviewEntries = computed(() => {
        const preview = this.importResult()?.preview;
        if (!preview) return [];
        return Object.entries(preview).map(([key, p]) => ({ key, ...p }));
    });

    importResultErrors = computed(() => {
        const errors = this.importResult()?.errors;
        if (!errors) return [];
        return Object.entries(errors).map(([key, fields]) => ({
            key,
            messages: Object.values(fields).flat()
        }));
    });

    importErrorsEntries = computed(() =>
        Object.entries(this.importErrors()).map(([key, fields]) => ({
            key,
            messages: Object.values(fields).flat()
        }))
    );

    previewIcon(action: string): string {
        switch (action) {
            case 'created':
                return 'pi pi-plus-circle';
            case 'updated':
                return 'pi pi-refresh';
            default:
                return 'pi pi-exclamation-circle';
        }
    }

    sortField = signal<string>('created_at');
    sortOrder = signal<1 | -1>(-1);

    statusOptions: { label: string; value: ProductStatus }[] = [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
        { label: 'Archivado', value: 'archived' }
    ];

    private search$ = new Subject<string>();

    ngOnInit() {
        this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.resetAndLoad());
    }

    ngOnDestroy() {
        this.search$.complete();
    }

    load(event: TableLazyLoadEvent) {
        if (!this.loaded()) {
            this.loading.set(true);
        }

        const page = event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
        const perPage = event.rows ?? this.rows();

        let sort: string | undefined;
        if (event.sortField && typeof event.sortField === 'string') {
            sort = (event.sortOrder === -1 ? '-' : '') + event.sortField;
        }

        this.productService
            .list({
                page,
                per_page: perPage,
                sort,
                status: this.statusFilter(),
                search: this.search() || null
            })
            .subscribe({
                next: (res) => {
                    this.products.set(res.data.items);
                    this.totalRecords.set(res.data.pagination.total);
                    this.rows.set(res.data.pagination.per_page);
                    this.loaded.set(true);
                    this.loading.set(false);
                },
                error: () => {
                    this.products.set([]);
                    this.totalRecords.set(0);
                    this.loading.set(false);
                }
            });
    }

    onSearchChange(value: string) {
        this.search.set(value ?? '');
        this.search$.next(this.search());
    }

    onStatusChange(value: ProductStatus | null) {
        this.statusFilter.set(value ?? null);
        this.resetAndLoad();
    }

    resetAndLoad() {
        this.dt?.reset();
    }

    createProduct() {
        this.productTypeDialogVisible.set(true);
    }

    startNewProduct(type: 'simple' | 'variable') {
        this.productTypeDialogVisible.set(false);
        this.router.navigate(['/products/new'], { queryParams: { type } });
    }

    exportProducts() {
        this.exporting.set(true);
        this.productService.exportProducts().subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'products.xlsx';
                a.click();
                URL.revokeObjectURL(url);
                this.exporting.set(false);
                this.messageService.add({ severity: 'success', summary: 'Exportado', detail: 'Archivo products.xlsx descargado.', life: 3000 });
            },
            error: (err) => {
                this.exporting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    onImportFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            this.messageService.add({ severity: 'error', summary: 'Archivo inválido', detail: 'El archivo debe ser un Excel (.xlsx).', life: 4000 });
            return;
        }
        if (file.size > ProductList.MAX_IMPORT_SIZE) {
            this.messageService.add({ severity: 'error', summary: 'Archivo demasiado grande', detail: 'El tamaño máximo permitido es 100 MB.', life: 4000 });
            return;
        }
        this.validateImport(file);
    }

    validateImport(file: File) {
        this.validating.set(true);
        this.importResult.set(null);
        this.pendingImportFile = file;
        this.productService.validateImport(file).subscribe({
            next: (res) => {
                this.validating.set(false);
                this.importResult.set(res.data);
                this.importReviewVisible.set(true);
            },
            error: (err) => {
                this.validating.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error de validación', detail: formatApiError(err), life: 6000 });
            }
        });
    }

    closeImportReview() {
        this.importReviewVisible.set(false);
        this.importResult.set(null);
        this.pendingImportFile = null;
    }

    confirmImport() {
        if (!this.pendingImportFile) return;
        this.confirming.set(true);
        this.productService.importProducts(this.pendingImportFile).subscribe({
            next: (res) => {
                this.confirming.set(false);
                this.closeImportReview();
                const result = res.data;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Importación finalizada',
                    detail: `${result.imported} creados · ${result.updated} actualizados · ${result.skipped} omitidos`,
                    life: 5000
                });
                if (result.errors && Object.keys(result.errors).length) {
                    this.importErrors.set(result.errors);
                    this.importErrorsDialogVisible.set(true);
                }
                this.resetAndLoad();
            },
            error: (err) => {
                this.confirming.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 6000 });
            }
        });
    }

    editProduct(product: ProductListItem) {
        this.router.navigate(['/products', product.id, 'edit']);
    }

    deleteProduct(product: ProductListItem) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el producto "${product.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.productService.remove(product.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.resetAndLoad();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 });
                    }
                });
            }
        });
    }

    statusLabel(status: ProductStatus): string {
        switch (status) {
            case 'published':
                return 'Publicado';
            case 'archived':
                return 'Archivado';
            default:
                return 'Borrador';
        }
    }

    statusSeverity(status: ProductStatus) {
        switch (status) {
            case 'published':
                return 'success';
            case 'archived':
                return 'warn';
            case 'draft':
                return 'secondary';
            default:
                return 'info';
        }
    }
}
