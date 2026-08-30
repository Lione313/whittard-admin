export type CouponType = 'fixed' | 'percentage' | 'free_shipping';

export type CouponAppliesTo = 'cart' | 'category' | 'product' | 'customer' | 'shipping';

export interface CouponScopes {
    categories: string[];
    products: string[];
    customers: string[];
}

export interface Coupon {
    id: string;
    code: string;
    name: string;
    type: CouponType;
    value: number;
    applies_to: CouponAppliesTo;
    min_subtotal: number;
    max_discount: number | null;
    usage_limit: number | null;
    per_customer_limit: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    stackable: boolean;
    priority: number;
    first_order_only: boolean;
    scopes: CouponScopes;
    created_at?: string;
    updated_at?: string;
}

export interface CouponPayload {
    code: string;
    name: string;
    type: CouponType;
    value: number;
    applies_to: CouponAppliesTo;
    min_subtotal?: number;
    max_discount?: number | null;
    usage_limit?: number | null;
    per_customer_limit?: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
    stackable?: boolean;
    priority?: number;
    first_order_only?: boolean;
    categories?: string[];
    products?: string[];
    customers?: string[];
}

export interface CouponUsage {
    id: string;
    customer_name?: string | null;
    customer_email?: string | null;
    discount_amount: number;
    order_total: number;
    used_at: string;
}

export interface CustomerSummary {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
}

export interface CouponFilters {
    code?: string;
    type?: CouponType;
    applies_to?: CouponAppliesTo;
    is_active?: boolean;
}

export const COUPON_TYPE_OPTIONS: { label: string; value: CouponType }[] = [
    { label: 'Monto fijo (S/)', value: 'fixed' },
    { label: 'Porcentaje (%)', value: 'percentage' },
    { label: 'Envío gratis', value: 'free_shipping' }
];

export const COUPON_APPLIES_TO_OPTIONS: { label: string; value: CouponAppliesTo }[] = [
    { label: 'Todo el carrito', value: 'cart' },
    { label: 'Categorías', value: 'category' },
    { label: 'Productos', value: 'product' },
    { label: 'Clientes', value: 'customer' },
    { label: 'Envío', value: 'shipping' }
];
