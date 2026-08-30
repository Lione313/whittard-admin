import { Pagination } from './api.model';
import { Attribute } from './attribute.model';
import { SeoData } from '@/app/shared/models/seo.model';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface CategorySummary {
    id: string;
    name: string;
    slug: string;
    parent?: CategorySummary | null;
}

export interface AttributionSummary {
    id: string;
    name: string;
    image_url: string | null;
}

export interface FlavorSummary {
    id: string;
    name: string;
}

export interface VariantMedia {
    id?: string;
    type: 'image' | 'video';
    url: string;
    is_primary: boolean;
    order: number;
}

export interface Variant {
    id?: string;
    sku: string;
    price: number;
    sale_price: number | null;
    sale_price_starts_at: string | null;
    sale_price_ends_at: string | null;
    stock: number;
    reserved_qty?: number;
    available?: number;
    is_low?: boolean;
    order: number;
    is_primary: boolean;
    is_active: boolean;
    attributes: Record<string, string>;
    media: VariantMedia[];
}

export interface ProductDescriptions {
    short: string | null;
    long: string | null;
    ingredients: string | null;
    specifications: string | null;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    code: string;
    brand: string;
    country_of_origin: string;
    descriptions: ProductDescriptions;
    status: ProductStatus;
    tax_class_id?: string | null;
    attributions: AttributionSummary[];
    category: CategorySummary | null;
    attributes: Attribute[];
    flavors: FlavorSummary[];
    variants: Variant[];
    seo: SeoData | null;
    combinable_products?: ProductListItem[];
    similar_products?: ProductListItem[];
    created_at: string;
    updated_at: string;
}

export interface ProductListItem {
    id: string;
    name: string;
    slug: string;
    code: string;
    brand: string;
    status: ProductStatus;
    category: CategorySummary | null;
    flavors: FlavorSummary[];
    variants_count: number;
    price_from: number | null;
    price_to: number | null;
    created_at: string;
    updated_at: string;
}

export interface ProductFilters {
    page?: number;
    per_page?: number;
    sort?: string;
    status?: ProductStatus | null;
    category_id?: string | null;
    flavor_ids?: string[] | null;
    search?: string | null;
}

export interface ProductPayload {
    name: string;
    slug?: string;
    code?: string;
    category_id?: string | null;
    brand: string;
    country_of_origin: string;
    short_description?: string | null;
    long_description?: string | null;
    ingredients_description?: string | null;
    specifications_description?: string | null;
    status: ProductStatus;
    tax_class_id?: string | null;
    attribution_ids?: string[];
    flavor_ids?: string[];
    attribute_ids?: string[];
    variants?: Variant[];
    seo?: SeoData | null;
}

export interface ProductListResponse {
    items: ProductListItem[];
    pagination: Pagination;
}

export interface ProductImportPreview {
    action: 'created' | 'updated' | 'skipped';
    code: string;
    name: string;
    variants: number;
}

export interface ProductImportResult {
    imported: number;
    updated: number;
    skipped: number;
    errors: Record<string, Record<string, string[]>>;
    preview?: Record<string, ProductImportPreview>;
}
