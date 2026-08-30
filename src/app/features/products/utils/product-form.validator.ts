import { ProductFormValue, VariantDraft } from '../models/product-form.model';

export function generalIssues(form: ProductFormValue): number {
    let n = 0;

    if (!form.name.trim()) n++;
    if (!form.category_id) n++;

    return n;
}

export function variantIssues(variants: VariantDraft[]): number {
    let n = 0;

    if (variants.length === 0) n++;
    if (variants.filter((v) => v.is_primary).length > 1) n++;

    for (const v of variants) {
        if (!v.sku?.trim()) n++;
        if (v.price === null || v.price === undefined || v.price <= 0) n++;
        if (v.sale_price !== null && v.sale_price !== undefined && v.price !== null && v.price !== undefined && v.sale_price > v.price) n++;

        if (v.has_sale) {
            if (v.sale_price === null || v.sale_price === undefined || v.sale_price <= 0) n++;
            if (!v.sale_price_starts_at || !v.sale_price_ends_at) n++;
            if (v.sale_starts_at_date && v.sale_ends_at_date && v.sale_ends_at_date <= v.sale_starts_at_date) n++;
        }
    }

    return n;
}

export function validateVariantDraft(draft: VariantDraft): string | null {
    if (!draft.sku?.trim()) return 'El SKU de la variante es obligatorio.';
    if (draft.price === null || draft.price === undefined || draft.price <= 0) return 'El precio de la variante debe ser mayor a cero.';

    if (draft.has_sale) {
        if (draft.sale_price === null || draft.sale_price === undefined || draft.sale_price <= 0) return 'Debe indicar un precio de oferta mayor a cero.';
        if (draft.sale_price > draft.price) return 'El precio de oferta no puede ser mayor al precio regular.';
        if (!draft.sale_starts_at_date) return 'Debe indicar la fecha de inicio del precio de oferta.';
        if (!draft.sale_ends_at_date) return 'Debe indicar la fecha de fin del precio de oferta.';
        if (draft.sale_ends_at_date <= draft.sale_starts_at_date) return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }

    return null;
}
