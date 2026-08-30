import { Pagination } from '@/app/core/models/api.model';

export type StockMovementType = 'in' | 'out' | 'reserved' | 'released' | 'adjustment';

export interface VariantStock {
    id: string;
    sku: string;
    product_id: string;
    product_name: string;
    stock: number;
    reserved_qty: number;
    available: number;
    is_low: boolean;
}

export interface LowStockThreshold {
    low_stock_threshold: number | null;
}

export interface StockMovement {
    id: string;
    variant_id: string;
    type: StockMovementType;
    quantity: number;
    reason: string | null;
    created_by: string | null;
    created_at: string;
}

export interface StockMovementList {
    items: StockMovement[];
    pagination: Pagination;
}

export interface StockAdjustPayload {
    quantity: number;
    reason: string;
}

export interface InventorySummary {
    total_variants: number;
    total_products: number;
    total_units: number;
    total_reserved: number;
    total_available: number;
    low_stock_count: number;
    out_of_stock_count: number;
    inventory_value: number;
}

export interface InventoryItem {
    id: string;
    sku: string;
    product_id: string;
    product_name: string;
    stock: number;
    reserved_qty: number;
    available: number;
    is_low: boolean;
}

export interface InventoryList {
    items: InventoryItem[];
    pagination: Pagination;
}

export type InventoryFilter = 'low' | 'out_of_stock' | 'available';

export interface InventoryFilters {
    page?: number;
    per_page?: number;
    search?: string;
    filter?: InventoryFilter;
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface GlobalStockMovement {
    id: string;
    variant_id: string;
    variant: {
        id: string;
        sku: string;
        product_id: string;
        product_name: string;
    };
    type: StockMovementType;
    quantity: number;
    reason: string | null;
    created_by: string | null;
    created_at: string;
}

export interface GlobalStockMovementList {
    items: GlobalStockMovement[];
    pagination: Pagination;
}

export interface StockMovementFilters {
    page?: number;
    per_page?: number;
    variant_id?: string;
    type?: StockMovementType;
    sku?: string;
}

export interface AdjustBatchItem {
    variant_id: string;
    quantity: number;
}

export interface AdjustBatchPayload {
    items: AdjustBatchItem[];
    reason?: string;
}

export interface StockMovementsFilters {
    page?: number;
    per_page?: number;
}

export const STOCK_MOVEMENT_TYPE_OPTIONS: { label: string; value: StockMovementType }[] = [
    { label: 'Entrada', value: 'in' },
    { label: 'Salida', value: 'out' },
    { label: 'Reservado', value: 'reserved' },
    { label: 'Liberado', value: 'released' },
    { label: 'Ajuste', value: 'adjustment' }
];
