import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { CustomerService } from '@/app/features/customers/services/customer.service';
import { ADDRESS_TYPE_OPTIONS, BILLING_DOCUMENT_OPTIONS, BillingProfile, CustomerAddress, CustomerDetail as CustomerDetailData } from '@/app/features/customers/models/customer.model';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [CommonModule, ToastModule, TagModule, TabsModule, ButtonModule, RippleModule],
    providers: [MessageService],
    template: `
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-3 min-w-0">
                <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" severity="secondary" title="Volver" (onClick)="goBack()" />
                @if (customer(); as customer) {
                    <div class="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-sm font-semibold text-surface-700 dark:text-surface-200 shrink-0">
                        {{ initials() }}
                    </div>
                }
                <div class="min-w-0">
                    <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0 truncate">{{ fullName() }}</h1>
                    @if (email()) {
                        <small class="text-muted-color block truncate">{{ email() }}</small>
                    }
                </div>
            </div>
            @if (customer(); as customer) {
                <p-tag [value]="customer.is_active ? 'Activo' : 'Inactivo'" [severity]="customer.is_active ? 'success' : 'danger'" />
            }
        </div>

        @if (loading()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <span>Cargando cliente...</span>
            </div>
        } @else if (error()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-exclamation-triangle text-2xl"></i>
                <span>{{ error() }}</span>
                <p-button label="Volver al listado" severity="secondary" (onClick)="goBack()" />
            </div>
        } @else if (customer(); as customer) {
            <p-tabs value="profile">
                <p-tablist>
                    <p-tab value="profile">Perfil</p-tab>
                    <p-tab value="addresses">Direcciones ({{ customer.addresses.length }})</p-tab>
                    <p-tab value="billing">Facturación ({{ customer.billing_profiles.length }})</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <p-tabpanel value="profile">
                        <div class="flex flex-col gap-6">
                            <section>
                                <div class="flex items-center gap-3 mb-4">
                                    <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Datos personales</span>
                                    <span class="h-px flex-1 bg-surface-200 dark:bg-surface-700"></span>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    @if (customer.first_name) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Nombre</span>
                                            <span class="font-medium">{{ customer.first_name }}</span>
                                        </div>
                                    }
                                    @if (customer.last_name) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Apellidos</span>
                                            <span class="font-medium">{{ customer.last_name }}</span>
                                        </div>
                                    }
                                    @if (customer.email) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Email</span>
                                            <span>{{ customer.email }}</span>
                                        </div>
                                    }
                                    @if (customer.phone) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Teléfono</span>
                                            <span>{{ customer.phone }}</span>
                                        </div>
                                    }
                                    @if (customer.birthdate) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Cumpleaños</span>
                                            <span>{{ customer.birthdate | date: 'dd/MM/yyyy' }}</span>
                                        </div>
                                    }
                                    @if (customer.source) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Canal</span>
                                            <span>{{ sourceLabel(customer.source) }}</span>
                                        </div>
                                    }
                                </div>
                            </section>

                            <section>
                                <div class="flex items-center gap-3 mb-4">
                                    <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Cuenta</span>
                                    <span class="h-px flex-1 bg-surface-200 dark:bg-surface-700"></span>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Estado</span>
                                        <p-tag [value]="customer.is_active ? 'Activo' : 'Inactivo'" [severity]="customer.is_active ? 'success' : 'danger'" styleClass="w-fit" />
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Registro</span>
                                        <span>{{ customer.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                                    </div>
                                    @if (customer.updated_at) {
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Última actualización</span>
                                            <span>{{ customer.updated_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                                        </div>
                                    }
                                </div>
                            </section>

                            @if (customer.notes) {
                                <section>
                                    <div class="flex items-center gap-3 mb-4">
                                        <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Notas internas</span>
                                        <span class="h-px flex-1 bg-surface-200 dark:bg-surface-700"></span>
                                    </div>
                                    <div class="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <p class="m-0 text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap">{{ customer.notes }}</p>
                                    </div>
                                </section>
                            }
                        </div>
                    </p-tabpanel>

                    <p-tabpanel value="addresses">
                        @if (customer.addresses.length) {
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                @for (address of customer.addresses; track address.id) {
                                    <div class="flex flex-col gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <div class="flex items-center gap-2 min-w-0">
                                                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-400/10 text-blue-500 flex items-center justify-center shrink-0">
                                                    <i class="pi pi-map-marker text-sm"></i>
                                                </div>
                                                <span class="font-medium text-surface-900 dark:text-surface-0 truncate">{{ address.label ?? 'Dirección' }}</span>
                                                @if (address.is_default) {
                                                    <p-tag value="Principal" severity="info" />
                                                }
                                            </div>
                                            <p-tag [value]="addressTypeLabel(address.type)" severity="secondary" />
                                        </div>
                                        <div class="flex flex-col gap-1 text-sm">
                                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ address.address_line_1 }}</span>
                                            @if (address.address_line_2) {
                                                <span class="text-muted-color">{{ address.address_line_2 }}</span>
                                            }
                                            @if (locationLabel(address)) {
                                                <span class="text-muted-color">{{ locationLabel(address) }}</span>
                                            }
                                        </div>
                                        @if (address.contact_name || address.contact_phone) {
                                            <div class="flex flex-col gap-1 text-sm border-t border-surface-200 dark:border-surface-700 pt-3">
                                                @if (address.contact_name) {
                                                    <span class="text-muted-color">Contacto: {{ address.contact_name }}</span>
                                                }
                                                @if (address.contact_phone) {
                                                    <span class="text-muted-color">Teléfono: {{ address.contact_phone }}</span>
                                                }
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        } @else {
                            <div class="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center rounded-lg border border-dashed border-surface-300 dark:border-surface-600">
                                <div class="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                    <i class="pi pi-map-marker text-xl text-muted-color"></i>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <span class="font-medium text-surface-700 dark:text-surface-200">Sin direcciones registradas</span>
                                    <span class="text-sm text-muted-color">El cliente aún no ha registrado direcciones de entrega.</span>
                                </div>
                            </div>
                        }
                    </p-tabpanel>

                    <p-tabpanel value="billing">
                        @if (customer.billing_profiles.length) {
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                @for (profile of customer.billing_profiles; track profile.id) {
                                    <div class="flex flex-col gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <div class="flex items-center gap-2 min-w-0">
                                                <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-400/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                    <i class="pi pi-receipt text-sm"></i>
                                                </div>
                                                <span class="font-medium text-surface-900 dark:text-surface-0 truncate">{{ documentTypeLabel(profile.document_type) }}</span>
                                                @if (profile.is_default) {
                                                    <p-tag value="Principal" severity="info" />
                                                }
                                            </div>
                                            <span class="font-mono font-semibold text-surface-900 dark:text-surface-0">{{ profile.document_number }}</span>
                                        </div>
                                        @if (profile.document_type === 'ruc') {
                                            <div class="flex flex-col gap-1 text-sm">
                                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Razón social</span>
                                                <span class="text-surface-700 dark:text-surface-200">{{ profile.business_name ?? '—' }}</span>
                                            </div>
                                        }
                                        @if (profile.fiscal_address) {
                                            <div class="flex flex-col gap-1 text-sm">
                                                <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Dirección fiscal</span>
                                                <span class="text-surface-700 dark:text-surface-200">{{ profile.fiscal_address }}</span>
                                            </div>
                                        }
                                        <div class="flex flex-col gap-1.5 text-sm border-t border-surface-200 dark:border-surface-700 pt-3">
                                            @if (profileAddress(profile); as address) {
                                                <span class="inline-flex items-center gap-2 text-muted-color"><i class="pi pi-map-marker text-xs"></i>{{ address.label ?? 'Dirección asociada' }}</span>
                                            }
                                            <span class="inline-flex items-center gap-2 text-muted-color"><i class="pi pi-calendar text-xs"></i>Registrado el {{ profile.created_at | date: 'dd/MM/yyyy' }}</span>
                                        </div>
                                    </div>
                                }
                            </div>
                        } @else {
                            <div class="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center rounded-lg border border-dashed border-surface-300 dark:border-surface-600">
                                <div class="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                    <i class="pi pi-receipt text-xl text-muted-color"></i>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <span class="font-medium text-surface-700 dark:text-surface-200">Sin perfiles de facturación</span>
                                    <span class="text-sm text-muted-color">El cliente aún no ha registrado datos de boleta o factura.</span>
                                </div>
                            </div>
                        }
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        }

        <p-toast />
    `
})
export class CustomerDetail implements OnInit, OnDestroy {
    private customerService = inject(CustomerService);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    customer = signal<CustomerDetailData | null>(null);
    loading = signal(false);
    error = signal<string | null>(null);

    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');

            if (id) this.loadCustomer(id);
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadCustomer(id: string) {
        this.loading.set(true);
        this.error.set(null);

        this.customerService
            .get(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.customer.set(res.data);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.loading.set(false);
                    this.error.set(formatApiError(err));
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
                }
            });
    }

    goBack() {
        history.back();
    }

    fullName(): string {
        const customer = this.customer();

        if (!customer) return 'Cliente';

        return [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Sin nombre';
    }

    initials(): string {
        const name = this.fullName();

        if (name === 'Sin nombre') return '?';

        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('');
    }

    email(): string {
        return this.customer()?.email ?? '';
    }

    sourceLabel(source: string | null): string {
        switch (source) {
            case 'storefront':
                return 'Tienda web';
            case 'whatsapp':
                return 'WhatsApp';
            case 'facebook':
                return 'Facebook';
            case 'instagram':
                return 'Instagram';
            case 'marketplace':
                return 'Marketplace';
            default:
                return source ? source.charAt(0).toUpperCase() + source.slice(1) : '—';
        }
    }

    addressTypeLabel(type: CustomerAddress['type']): string {
        return ADDRESS_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
    }

    locationLabel(address: CustomerAddress): string {
        return [address.city, address.region, address.postal_code, this.countryLabel(address.country)].filter(Boolean).join(', ') || '';
    }

    countryLabel(code: string | null): string {
        if (!code) return '';

        try {
            const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });

            return displayNames.of(code.toUpperCase()) ?? code;
        } catch {
            return code;
        }
    }

    documentTypeLabel(type: BillingProfile['document_type']): string {
        return BILLING_DOCUMENT_OPTIONS.find((o) => o.value === type)?.label ?? type;
    }

    profileAddress(profile: BillingProfile): CustomerAddress | null {
        if (!profile.address_id) return null;

        return this.customer()?.addresses.find((a) => a.id === profile.address_id) ?? null;
    }
}
