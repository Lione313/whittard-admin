import { Pagination } from '@/app/core/models/api.model';

export type AddressType = 'shipping' | 'billing' | 'both';

export type BillingDocumentType = 'dni' | 'ruc' | 'passport';

export interface Customer {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    birthdate: string | null;
    source: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at?: string;
    addresses_count: number;
    billing_profiles_count: number;
}

export interface CustomerAddress {
    id: string;
    label: string | null;
    type: AddressType;
    contact_name: string | null;
    contact_phone: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string;
    is_default: boolean;
    created_at: string;
    updated_at?: string;
}

export interface BillingProfile {
    id: string;
    document_type: BillingDocumentType;
    document_number: string;
    business_name: string | null;
    fiscal_address: string | null;
    address_id: string | null;
    is_default: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CustomerDetail extends Customer {
    addresses: CustomerAddress[];
    billing_profiles: BillingProfile[];
}

export interface CustomerList {
    items: Customer[];
    pagination: Pagination;
}

export interface CustomerFilters {
    page?: number;
    per_page?: number;
    search?: string;
}

export const ADDRESS_TYPE_OPTIONS: { label: string; value: AddressType }[] = [
    { label: 'Envío', value: 'shipping' },
    { label: 'Facturación', value: 'billing' },
    { label: 'Ambos', value: 'both' }
];

export const BILLING_DOCUMENT_OPTIONS: { label: string; value: BillingDocumentType }[] = [
    { label: 'DNI', value: 'dni' },
    { label: 'RUC', value: 'ruc' },
    { label: 'Pasaporte', value: 'passport' }
];
