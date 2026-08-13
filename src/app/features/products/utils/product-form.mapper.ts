import { Product, ProductStatus, Variant } from '../models/product.model';
import { MediaDraft, ProductFormValue, VariantDraft } from '../models/product-form.model';

export function normalizeMediaType(type: string): 'image' | 'video' {
    return type?.toLowerCase() === 'video' ? 'video' : 'image';
}

export function parseApiDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

export function formatApiDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export function toNullableHtml(html: string): string | null {
    const source = html ?? '';
    if (!source.trim()) return null;

    const doc = new DOMParser().parseFromString(source, 'text/html');
    const hasContent = (doc.body.textContent ?? '').trim() !== '';

    return hasContent ? source.trim() : null;
}

export function toFormValue(product: Product): ProductFormValue {
    return {
        name: product.name ?? '',
        slug: product.slug ?? '',
        code: product.code ?? '',
        brand: product.brand ?? '',
        country_of_origin: product.country_of_origin ?? '',
        parent_category_id: product.category?.parent?.id ?? null,
        category_id: product.category?.id ?? null,
        short_description: product.descriptions?.short ?? '',
        long_description: product.descriptions?.long ?? '',
        ingredients_description: product.descriptions?.ingredients ?? '',
        specifications_description: product.descriptions?.specifications ?? ''
    };
}

export function toVariantDraft(variant: Variant, nextUid: () => string): VariantDraft {
    const has_sale = variant.sale_price != null && variant.sale_price !== undefined;
    return {
        uid: nextUid(),
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        sale_price: variant.sale_price,
        sale_price_starts_at: variant.sale_price_starts_at ?? null,
        sale_price_ends_at: variant.sale_price_ends_at ?? null,
        has_sale,
        sale_starts_at_date: has_sale ? parseApiDate(variant.sale_price_starts_at) : null,
        sale_ends_at_date: has_sale ? parseApiDate(variant.sale_price_ends_at) : null,
        stock: variant.stock,
        is_primary: variant.is_primary ?? false,
        is_active: variant.is_active ?? true,
        attributes: { ...(variant.attributes ?? {}) },
        media: (variant.media ?? []).map((m): MediaDraft => ({ type: normalizeMediaType(m.type), url: m.url, file: null, is_primary: m.is_primary, order: m.order }))
    };
}

export interface ProductFormPayloadInput {
    form: ProductFormValue;
    status: ProductStatus;
    attributionIds: string[];
    attributeIds: string[];
    variants: VariantDraft[];
    selectedAttributeTypes: Set<string>;
    isEdit: boolean;
}

export function buildProductFormData(input: ProductFormPayloadInput): FormData {
    const { form, status, attributionIds, attributeIds, variants, selectedAttributeTypes, isEdit } = input;
    const data = new FormData();

    data.append('name', form.name);
    if (form.slug?.trim()) data.append('slug', form.slug.trim());
    if (form.code?.trim()) data.append('code', form.code.trim());
    if (form.category_id) data.append('category_id', form.category_id);
    data.append('brand', form.brand);
    data.append('country_of_origin', form.country_of_origin);
    data.append('short_description', toNullableHtml(form.short_description) ?? '');
    data.append('long_description', toNullableHtml(form.long_description) ?? '');
    data.append('ingredients_description', toNullableHtml(form.ingredients_description) ?? '');
    data.append('specifications_description', toNullableHtml(form.specifications_description) ?? '');
    data.append('status', status);

    appendIdFields(data, 'attribution_ids', attributionIds);
    appendIdFields(data, 'attribute_ids', attributeIds);

    variants.forEach((v, vi) => {
        if (isEdit && v.id) data.append(`variants[${vi}][id]`, v.id);
        data.append(`variants[${vi}][sku]`, v.sku);
        data.append(`variants[${vi}][price]`, String(v.price ?? 0));
        data.append(`variants[${vi}][sale_price]`, v.sale_price !== null && v.sale_price !== undefined ? String(v.sale_price) : '');
        if (v.has_sale && v.sale_price !== null && v.sale_price !== undefined) {
            data.append(`variants[${vi}][sale_price_starts_at]`, v.sale_price_starts_at ?? '');
            data.append(`variants[${vi}][sale_price_ends_at]`, v.sale_price_ends_at ?? '');
        }
        data.append(`variants[${vi}][stock]`, String(v.stock ?? 0));
        data.append(`variants[${vi}][is_primary]`, v.is_primary ? '1' : '0');
        data.append(`variants[${vi}][is_active]`, v.is_active === false ? '0' : '1');
        data.append(`variants[${vi}][order]`, String(vi + 1));
        Object.entries(v.attributes).forEach(([key, value]) => {
            if (selectedAttributeTypes.has(key)) data.append(`variants[${vi}][attributes][${key}]`, value);
        });
        v.media.forEach((m, mi) => {
            if (!m.file && !m.url) return;
            data.append(`variants[${vi}][media][${mi}][type]`, m.type);
            data.append(`variants[${vi}][media][${mi}][is_primary]`, m.is_primary ? '1' : '0');
            data.append(`variants[${vi}][media][${mi}][order]`, String(m.order ?? mi));
            if (m.file) {
                data.append(`variants[${vi}][media][${mi}][file]`, m.file);
            } else if (m.url) {
                data.append(`variants[${vi}][media][${mi}][url]`, m.url);
            }
        });
    });

    return data;
}

function appendIdFields(data: FormData, base: string, ids: string[]) {
    if (ids.length > 0) {
        for (const id of ids) data.append(`${base}[]`, id);
    } else {
        data.append(`${base}[]`, '');
    }
}
