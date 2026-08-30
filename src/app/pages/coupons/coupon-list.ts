import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { CouponService } from '@/app/features/coupons/services/coupon.service';
import { COUPON_APPLIES_TO_OPTIONS, COUPON_TYPE_OPTIONS, Coupon, CouponAppliesTo, CouponFilters, CouponPayload, CouponType, CustomerSummary } from '@/app/features/coupons/models/coupon.model';
import { Category } from '@/app/features/products/models/category.model';
import { ProductListItem } from '@/app/features/products/models/product.model';
import { CategoryService } from '@/app/features/products/services/category.service';
import { ProductService } from '@/app/features/products/services/product.service';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiDate, parseApiDate } from '@/app/shared/utils/date';
import { formatApiError } from '@/app/shared/utils/api-error';

interface CouponForm {
    id: string | null;
    code: string;
    name: string;
    type: CouponType;
    value: number | null;
    applies_to: CouponAppliesTo;
    min_subtotal: number | null;
    max_discount: number | null;
    usage_limit: number | null;
    per_customer_limit: number | null;
    starts_at: Date | null;
    ends_at: Date | null;
    is_active: boolean;
    stackable: boolean;
    priority: number | null;
    first_order_only: boolean;
    categories: string[];
    products: string[];
    customers: string[];
}

function emptyForm(): CouponForm {
    return {
        id: null,
        code: '',
        name: '',
        type: 'percentage',
        value: null,
        applies_to: 'cart',
        min_subtotal: 0,
        max_discount: null,
        usage_limit: null,
        per_customer_limit: 1,
        starts_at: null,
        ends_at: null,
        is_active: true,
        stackable: false,
        priority: 0,
        first_order_only: false,
        categories: [],
        products: [],
        customers: []
    };
}

@Component({
    selector: 'app-coupon-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        DrawerModule,
        ConfirmDialogModule,
        TableModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        MultiSelectModule,
        InputNumberModule,
        DatePickerModule,
        ToggleSwitchModule,
        TagModule,
        MessageModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="Nuevo Cupón" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <div class="card p-4! mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <p-iconfield iconPosition="left">
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" [ngModel]="codeFilter()" (ngModelChange)="onCodeFilterChange($event)" placeholder="Buscar por código..." class="w-full md:w-64" />
                </p-iconfield>
                <p-select [ngModel]="typeFilter()" (ngModelChange)="onTypeFilterChange($event)" [options]="typeOptions" optionLabel="label" optionValue="value" placeholder="Tipo" emptyMessage="Sin resultados" showClear class="w-full md:w-48" />
                <p-select
                    [ngModel]="appliesToFilter()"
                    (ngModelChange)="onAppliesToFilterChange($event)"
                    [options]="appliesToOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Aplica a"
                    emptyMessage="Sin resultados"
                    showClear
                    class="w-full md:w-48"
                />
                <p-select
                    [ngModel]="activeFilter()"
                    (ngModelChange)="onActiveFilterChange($event)"
                    [options]="activeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Estado"
                    emptyMessage="Sin resultados"
                    showClear
                    class="w-full md:w-40"
                />
            </div>
        </div>

        <div class="card p-0!">
            <p-table
                [value]="coupons()"
                [loading]="loading()"
                [showLoader]="false"
                [rows]="15"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
                dataKey="id"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cupones"
            >
                <ng-template #caption>
                    <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Cupones</h5>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th style="min-width: 10rem">Código</th>
                        <th style="min-width: 12rem">Nombre</th>
                        <th style="min-width: 8rem">Tipo</th>
                        <th style="min-width: 6rem">Valor</th>
                        <th style="min-width: 10rem">Aplica a</th>
                        <th style="min-width: 10rem">Vigencia</th>
                        <th style="min-width: 6rem">Estado</th>
                        <th style="width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-coupon>
                    <tr>
                        <td class="font-mono font-medium">{{ coupon.code }}</td>
                        <td class="font-medium">{{ coupon.name }}</td>
                        <td>{{ typeLabel(coupon.type) }}</td>
                        <td>{{ valueLabel(coupon) }}</td>
                        <td>{{ appliesToLabel(coupon.applies_to) }}</td>
                        <td class="text-muted-color">{{ validityLabel(coupon) }}</td>
                        <td>
                            <p-tag [value]="coupon.is_active ? 'Activo' : 'Inactivo'" [severity]="coupon.is_active ? 'success' : 'secondary'" />
                        </td>
                        <td>
                            <div class="flex items-center justify-end gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar" (onClick)="editCoupon(coupon)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar" (onClick)="deleteCoupon(coupon)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #loadingbody>
                    <tr>
                        <td colspan="8">
                            <div class="flex items-center justify-center gap-2 text-muted-color" style="height: 320px">
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Cargando cupones...</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center p-8 text-muted-color">No se encontraron cupones.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-drawer [visible]="drawerVisible()" (visibleChange)="drawerVisible.set($event)" [header]="form.id ? 'Editar Cupón' : 'Nuevo Cupón'" position="right" [style]="{ width: '560px' }" [blockScroll]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    @if (formError()) {
                        <p-message severity="error" [text]="formError() ?? undefined" />
                    }

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Identificación</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block font-medium mb-2">Código *</label>
                                <input pInputText [(ngModel)]="form.code" class="w-full font-mono uppercase" placeholder="Ej: BIENVENIDA10" />
                                <small class="text-muted-color mt-1 block">Código visible para el cliente. Único.</small>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Nombre *</label>
                                <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Ej: Bienvenida" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Descuento</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block font-medium mb-2">Tipo *</label>
                                <p-select [(ngModel)]="form.type" [options]="typeOptions" optionLabel="label" optionValue="value" emptyMessage="Sin resultados" class="w-full" />
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Valor *</label>
                                <div class="relative">
                                    <p-inputnumber [(ngModel)]="form.value" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" class="w-full" [disabled]="form.type === 'free_shipping'" />
                                </div>
                                <small class="text-muted-color mt-1 block">{{ form.type === 'fixed' ? 'Monto en soles (S/)' : form.type === 'percentage' ? 'Porcentaje de descuento' : 'No aplica para envío gratis' }}</small>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Descuento máximo (opcional)</label>
                                <p-inputnumber [(ngModel)]="form.max_discount" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" class="w-full" />
                                <small class="text-muted-color mt-1 block">Tope del descuento. Vacío = sin tope.</small>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Alcance</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block font-medium mb-2">Aplica a *</label>
                                <p-select [(ngModel)]="form.applies_to" (ngModelChange)="onAppliesToChange($event)" [options]="appliesToOptions" optionLabel="label" optionValue="value" emptyMessage="Sin resultados" class="w-full" />
                            </div>

                            @if (form.applies_to === 'category') {
                                <div>
                                    <label class="block font-medium mb-2">Categorías</label>
                                    <p-multiselect
                                        [(ngModel)]="form.categories"
                                        [options]="categoryOptions()"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Seleccionar categorías"
                                        filter
                                        emptyMessage="Sin resultados"
                                        class="w-full"
                                        [showClear]="true"
                                        [maxSelectedLabels]="3"
                                        [selectedItemsLabel]="'{0} categorías seleccionadas'"
                                    />
                                    <small class="text-muted-color mt-1 block">Incluye sus subcategorías.</small>
                                </div>
                            } @else if (form.applies_to === 'product') {
                                <div>
                                    <label class="block font-medium mb-2">Productos</label>
                                    <p-multiselect
                                        [(ngModel)]="form.products"
                                        [options]="productOptions()"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Buscar y seleccionar productos"
                                        filter
                                        emptyMessage="Sin resultados"
                                        (onFilter)="productSearch$.next($event.filter ?? '')"
                                        class="w-full"
                                        [showClear]="true"
                                        [maxSelectedLabels]="3"
                                        [selectedItemsLabel]="'{0} productos seleccionados'"
                                    />
                                    <small class="text-muted-color mt-1 block">Busca por nombre, código o marca. El descuento aplica solo a estos productos.</small>
                                </div>
                            } @else if (form.applies_to === 'customer') {
                                <div>
                                    <label class="block font-medium mb-2">Clientes</label>
                                    <p-multiselect
                                        [(ngModel)]="form.customers"
                                        [options]="customerOptions()"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Buscar y seleccionar clientes"
                                        filter
                                        emptyMessage="Sin resultados"
                                        (onFilter)="customerSearch$.next($event.filter ?? '')"
                                        class="w-full"
                                        [showClear]="true"
                                        [maxSelectedLabels]="3"
                                        [selectedItemsLabel]="'{0} clientes seleccionados'"
                                    />
                                    <small class="text-muted-color mt-1 block">Busca por nombre o email. El descuento aplica solo a estos clientes.</small>
                                </div>
                            } @else {
                                <p-message severity="info" [text]="form.applies_to === 'cart' ? 'Se aplica a todo el carrito.' : 'Se aplica al envío.'" />
                            }
                        </div>
                    </section>

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Límites</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block font-medium mb-2">Mínimo de carrito (S/)</label>
                                <p-inputnumber [(ngModel)]="form.min_subtotal" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" class="w-full" />
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Límite total de usos</label>
                                <p-inputnumber [(ngModel)]="form.usage_limit" [min]="1" class="w-full" />
                                <small class="text-muted-color mt-1 block">Vacío = ilimitado.</small>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Límite por cliente</label>
                                <p-inputnumber [(ngModel)]="form.per_customer_limit" [min]="1" class="w-full" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Vigencia</span>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-medium mb-2">Inicio</label>
                                <p-datepicker [(ngModel)]="form.starts_at" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Fin</label>
                                <p-datepicker [(ngModel)]="form.ends_at" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full" />
                            </div>
                        </div>
                        <small class="text-muted-color mt-1 block">Vacío = sin límite de fechas.</small>
                    </section>

                    <section>
                        <div class="border-b border-surface-200 dark:border-surface-700 pb-2 mb-3">
                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Opciones</span>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="flex items-center gap-3">
                                <p-toggleswitch [(ngModel)]="form.is_active" inputId="coupon-active" />
                                <label for="coupon-active" class="font-medium cursor-pointer">Activo</label>
                            </div>
                            <div class="flex items-center gap-3">
                                <p-toggleswitch [(ngModel)]="form.stackable" inputId="coupon-stackable" />
                                <label for="coupon-stackable" class="font-medium cursor-pointer">Apilable (se combina con otros cupones)</label>
                            </div>
                            <div class="flex items-center gap-3">
                                <p-toggleswitch [(ngModel)]="form.first_order_only" inputId="coupon-first-order" />
                                <label for="coupon-first-order" class="font-medium cursor-pointer">Solo primera compra</label>
                            </div>
                            <div>
                                <label class="block font-medium mb-2">Prioridad</label>
                                <p-inputnumber [(ngModel)]="form.priority" [min]="0" class="w-full" />
                                <small class="text-muted-color mt-1 block">Orden de aplicación si se combinan cupones.</small>
                            </div>
                        </div>
                    </section>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDrawer()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveCoupon()" />
                </div>
            </ng-template>
        </p-drawer>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class CouponList implements OnInit, OnDestroy {
    private couponService = inject(CouponService);
    private categoryService = inject(CategoryService);
    private productService = inject(ProductService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    coupons = signal<Coupon[]>([]);
    loading = signal(false);
    saving = signal(false);
    drawerVisible = signal(false);
    formError = signal<string | null>(null);

    codeFilter = signal('');
    typeFilter = signal<CouponType | null>(null);
    appliesToFilter = signal<CouponAppliesTo | null>(null);
    activeFilter = signal<boolean | null>(null);

    categories = signal<Category[]>([]);
    products = signal<ProductListItem[]>([]);
    customers = signal<CustomerSummary[]>([]);

    form: CouponForm = emptyForm();

    readonly typeOptions = COUPON_TYPE_OPTIONS;
    readonly appliesToOptions = COUPON_APPLIES_TO_OPTIONS;
    readonly activeOptions = [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false }
    ];

    private search$ = new Subject<string>();
    readonly productSearch$ = new Subject<string>();
    readonly customerSearch$ = new Subject<string>();

    categoryOptions = computed(() =>
        this.categories()
            .filter((c) => !c.parent)
            .map((c) => ({ label: c.name, value: c.id }))
    );

    productOptions = computed(() =>
        this.products()
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => ({ label: p.code ? `${p.code} · ${p.name}` : p.name, value: p.id }))
    );

    customerOptions = computed(() =>
        this.customers()
            .slice()
            .sort((a, b) => this.customerFullName(a).localeCompare(this.customerFullName(b)))
            .map((c) => ({ label: this.customerFullName(c), value: c.id }))
    );

    ngOnInit() {
        this.loadCoupons();
        this.loadCategories();
        this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.loadCoupons());
        this.productSearch$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((term) => this.searchProducts(term));
        this.customerSearch$.pipe(debounceTime(400), distinctUntilChanged()).subscribe((term) => this.searchCustomers(term));
    }

    ngOnDestroy() {
        this.search$.complete();
        this.productSearch$.complete();
        this.customerSearch$.complete();
    }

    private loadCoupons() {
        this.loading.set(true);
        this.coupons.set([]);
        const filters: CouponFilters = {
            code: this.codeFilter() || undefined,
            type: this.typeFilter() ?? undefined,
            applies_to: this.appliesToFilter() ?? undefined,
            is_active: this.activeFilter() ?? undefined
        };

        this.couponService.list(filters).subscribe({
            next: (res) => {
                this.coupons.set(this.asArray(res.data));
                this.loading.set(false);
            },
            error: (err) => {
                this.coupons.set([]);
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    private asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
        if (Array.isArray(data)) return data;

        if (data && typeof data === 'object' && Array.isArray((data as { items?: T[] }).items)) {
            return (data as { items: T[] }).items;
        }

        return [];
    }

    private loadCategories() {
        this.categoryService.list().subscribe({
            next: (res) => this.categories.set(res.data),
            error: () => this.categories.set([])
        });
    }

    private searchProducts(term: string) {
        this.productService.list({ per_page: 10, sort: 'name', search: term || undefined }).subscribe({
            next: (res) => {
                this.products.set(this.mergeSelected(this.products(), res.data.items ?? [], this.form.products));
            },
            error: () => this.products.set(this.products())
        });
    }

    private searchCustomers(term: string) {
        this.couponService.listCustomers(term).subscribe({
            next: (res) => {
                this.customers.set(this.mergeSelected(this.customers(), this.asArray(res.data), this.form.customers));
            },
            error: (err) => {
                this.customers.set(this.customers());
                this.messageService.add({ severity: 'warn', summary: 'Clientes', detail: formatApiError(err), life: 4000 });
            }
        });
    }

    private mergeSelected<T extends { id: string }>(current: T[], incoming: T[], selectedIds: string[]): T[] {
        const byId = new Map<string, T>();

        for (const item of [...incoming, ...current]) byId.set(item.id, item);

        for (const id of selectedIds) {
            if (!byId.has(id)) {
                const selected = this.findSelected(id, incoming, current);

                if (selected) byId.set(id, selected);
            }
        }

        return [...byId.values()];
    }

    private findSelected<T extends { id: string }>(id: string, ...lists: T[][]): T | undefined {
        for (const list of lists) {
            const found = list.find((i) => i.id === id);

            if (found) return found;
        }

        return undefined;
    }

    private preloadProductSelection() {
        this.searchProducts('');
    }

    private preloadCustomerSelection() {
        this.searchCustomers('');
    }

    onCodeFilterChange(value: string) {
        this.codeFilter.set(value ?? '');
        this.search$.next(value ?? '');
    }

    onTypeFilterChange(value: CouponType | null) {
        this.typeFilter.set(value ?? null);
        this.loadCoupons();
    }

    onAppliesToFilterChange(value: CouponAppliesTo | null) {
        this.appliesToFilter.set(value ?? null);
        this.loadCoupons();
    }

    onActiveFilterChange(value: boolean | null) {
        this.activeFilter.set(value ?? null);
        this.loadCoupons();
    }

    openNew() {
        this.form = emptyForm();
        this.formError.set(null);
        this.drawerVisible.set(true);
    }

    editCoupon(coupon: Coupon) {
        this.form = {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            value: coupon.value,
            applies_to: coupon.applies_to,
            min_subtotal: coupon.min_subtotal ?? 0,
            max_discount: coupon.max_discount,
            usage_limit: coupon.usage_limit,
            per_customer_limit: coupon.per_customer_limit,
            starts_at: parseApiDate(coupon.starts_at),
            ends_at: parseApiDate(coupon.ends_at),
            is_active: coupon.is_active,
            stackable: coupon.stackable,
            priority: coupon.priority,
            first_order_only: coupon.first_order_only,
            categories: coupon.scopes?.categories ?? [],
            products: coupon.scopes?.products ?? [],
            customers: coupon.scopes?.customers ?? []
        };

        if (coupon.applies_to === 'customer') {
            this.preloadCustomerSelection();
        } else if (coupon.applies_to === 'product') {
            this.preloadProductSelection();
        }

        this.formError.set(null);
        this.drawerVisible.set(true);
    }

    onAppliesToChange(value: CouponAppliesTo) {
        this.form.applies_to = value;

        if (value === 'customer') {
            this.preloadCustomerSelection();
        } else if (value === 'product') {
            this.preloadProductSelection();
        }
    }

    closeDrawer() {
        this.drawerVisible.set(false);
        this.formError.set(null);
    }

    saveCoupon() {
        const error = this.validate();

        if (error) {
            this.formError.set(error);

            return;
        }

        this.formError.set(null);

        const payload: CouponPayload = {
            code: this.form.code.trim(),
            name: this.form.name.trim(),
            type: this.form.type,
            value: this.form.value ?? 0,
            applies_to: this.form.applies_to,
            min_subtotal: this.form.min_subtotal ?? 0,
            max_discount: this.form.max_discount,
            usage_limit: this.form.usage_limit,
            per_customer_limit: this.form.per_customer_limit ?? 1,
            starts_at: this.form.starts_at ? formatApiDate(this.form.starts_at) : null,
            ends_at: this.form.ends_at ? formatApiDate(this.form.ends_at) : null,
            is_active: this.form.is_active,
            stackable: this.form.stackable,
            priority: this.form.priority ?? 0,
            first_order_only: this.form.first_order_only
        };

        switch (this.form.applies_to) {
            case 'category':
                payload.categories = this.form.categories;
                break;
            case 'product':
                payload.products = this.form.products;
                break;
            case 'customer':
                payload.customers = this.form.customers;
                break;
        }

        this.saving.set(true);
        const action = this.form.id ? this.couponService.update(this.form.id, payload) : this.couponService.create(payload);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.drawerVisible.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadCoupons();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    private validate(): string | null {
        if (!this.form.code.trim()) return 'El código es obligatorio.';
        if (!this.form.name.trim()) return 'El nombre es obligatorio.';

        if (this.form.type !== 'free_shipping' && (this.form.value === null || this.form.value === undefined || this.form.value <= 0)) {
            return 'El valor debe ser mayor a cero.';
        }

        if (this.form.max_discount !== null && this.form.max_discount !== undefined && this.form.max_discount < 0) {
            return 'El descuento máximo no puede ser negativo.';
        }

        if (this.form.min_subtotal !== null && this.form.min_subtotal !== undefined && this.form.min_subtotal < 0) {
            return 'El mínimo de carrito no puede ser negativo.';
        }

        if (this.form.starts_at && this.form.ends_at && this.form.ends_at <= this.form.starts_at) {
            return 'La fecha de fin no puede ser anterior o igual a la de inicio.';
        }

        return null;
    }

    deleteCoupon(coupon: Coupon) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el cupón "${coupon.code}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.couponService.remove(coupon.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadCoupons();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }

    typeLabel(type: CouponType): string {
        switch (type) {
            case 'fixed':
                return 'Monto fijo';
            case 'percentage':
                return 'Porcentaje';
            case 'free_shipping':
                return 'Envío gratis';
        }
    }

    appliesToLabel(appliesTo: CouponAppliesTo): string {
        return COUPON_APPLIES_TO_OPTIONS.find((o) => o.value === appliesTo)?.label ?? appliesTo;
    }

    customerFullName(customer: CustomerSummary): string {
        return [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email || 'Sin nombre';
    }

    valueLabel(coupon: Coupon): string {
        switch (coupon.type) {
            case 'fixed':
                return `S/ ${coupon.value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'percentage':
                return `${coupon.value}%`;
            case 'free_shipping':
                return '—';
        }
    }

    validityLabel(coupon: Coupon): string {
        if (coupon.starts_at && coupon.ends_at) {
            return `${new Date(coupon.starts_at).toLocaleDateString('es-PE')} – ${new Date(coupon.ends_at).toLocaleDateString('es-PE')}`;
        }

        if (coupon.ends_at) {
            return `Hasta ${new Date(coupon.ends_at).toLocaleDateString('es-PE')}`;
        }

        return 'Sin límite';
    }
}
