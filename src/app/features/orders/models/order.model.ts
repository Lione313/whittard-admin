import { Pagination } from '@/app/core/models/api.model';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
    id: string;
    product_id: string | null;
    variant_id: string | null;
    name: string;
    sku: string | null;
    image: string | null;
    unit_price: number;
    promo_price: number | null;
    quantity: number;
    line_total: number;
    attributes: Record<string, string>;
}

export interface OrderCustomer {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
}

export interface OrderVoucher {
    operation_code: string | null;
    uploaded_at: string | null;
    url: string;
    mime_type: string | null;
}

export interface Order {
    id: string;
    number: string;
    status: OrderStatus;
    payment_method: string;
    payment_status: string;
    delivery_method: string;
    currency: string;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    coupon_code: string | null;
    notes: string | null;
    customer: OrderCustomer | null;
    shipping_address: Record<string, unknown> | null;
    pickup_store: { name?: string } | null;
    items: OrderItem[];
    voucher: OrderVoucher | null;
    created_at: string | null;
    paid_at: string | null;
}

export interface OrderList {
    items: Order[];
    pagination: Pagination;
}

export interface OrderFilters {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
}

export const ORDER_STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Pagado', value: 'paid' },
    { label: 'Procesando', value: 'processing' },
    { label: 'Enviado', value: 'shipped' },
    { label: 'Entregado', value: 'delivered' },
    { label: 'Cancelado', value: 'cancelled' }
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' }> = {
    pending: { label: 'Pendiente', severity: 'warn' },
    paid: { label: 'Pagado', severity: 'success' },
    processing: { label: 'Procesando', severity: 'info' },
    shipped: { label: 'Enviado', severity: 'info' },
    delivered: { label: 'Entregado', severity: 'success' },
    cancelled: { label: 'Cancelado', severity: 'danger' }
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    card: 'Tarjeta',
    transfer: 'Transferencia'
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
    delivery: 'Delivery',
    pickup: 'Recojo en tienda'
};
