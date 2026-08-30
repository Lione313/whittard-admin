export type ProductType = 'simple' | 'variable';

export interface MediaDraft {
    type: 'image' | 'video';
    url: string | null;
    file: File | null;
    is_primary: boolean;
    order: number;
    previewUrl?: string | null;
}

export interface VariantDraft {
    uid: string;
    id?: string;
    sku: string;
    price: number | null;
    sale_price: number | null;
    sale_price_starts_at: string | null;
    sale_price_ends_at: string | null;
    has_sale: boolean;
    sale_starts_at_date: Date | null;
    sale_ends_at_date: Date | null;
    stock: number | null;
    reserved_qty?: number;
    available?: number;
    is_low?: boolean;
    is_primary: boolean;
    is_active: boolean;
    attributes: Record<string, string>;
    media: MediaDraft[];
}

export interface ProductFormValue {
    name: string;
    slug: string;
    code: string;
    brand: string;
    country_of_origin: string;
    parent_category_id: string | null;
    category_id: string | null;
    short_description: string;
    long_description: string;
    ingredients_description: string;
    specifications_description: string;
    tax_class_id: string | null;
}

export function emptyFormValue(): ProductFormValue {
    return {
        name: '',
        slug: '',
        code: '',
        brand: '',
        country_of_origin: '',
        parent_category_id: null,
        category_id: null,
        short_description: '',
        long_description: '',
        ingredients_description: '',
        specifications_description: '',
        tax_class_id: null
    };
}
