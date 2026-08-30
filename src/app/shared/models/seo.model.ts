export interface SeoData {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    canonical_url: string;
    robots: string;
    og_title: string;
    og_description: string;
    og_image: string;
    structured_data: Record<string, unknown> | null;
    noindex: boolean;
}

export const DEFAULT_ROBOTS = 'index, follow';
export const NOINDEX_ROBOTS = 'noindex, nofollow';

export const ROBOTS_OPTIONS = [
    { label: 'index, follow', value: DEFAULT_ROBOTS },
    { label: 'noindex, nofollow', value: NOINDEX_ROBOTS }
];

export function emptySeoData(): SeoData {
    return {
        meta_title: '',
        meta_description: '',
        keywords: [],
        canonical_url: '',
        robots: DEFAULT_ROBOTS,
        og_title: '',
        og_description: '',
        og_image: '',
        structured_data: null,
        noindex: false
    };
}

export function normalizeSeoData(value: SeoData | null | undefined): SeoData | null {
    if (!value) return null;

    return {
        meta_title: value.meta_title ?? '',
        meta_description: value.meta_description ?? '',
        keywords: Array.isArray(value.keywords) ? value.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
        canonical_url: value.canonical_url ?? '',
        robots: value.robots ?? DEFAULT_ROBOTS,
        og_title: value.og_title ?? '',
        og_description: value.og_description ?? '',
        og_image: value.og_image ?? '',
        structured_data: value.structured_data && typeof value.structured_data === 'object' ? value.structured_data : null,
        noindex: Boolean(value.noindex)
    };
}

export function isSeoEmpty(seo: SeoData): boolean {
    return !seo.meta_title.trim() && !seo.meta_description.trim() && seo.keywords.length === 0 && !seo.canonical_url.trim() && !seo.og_title.trim() && !seo.og_description.trim() && !seo.og_image.trim() && !seo.structured_data && !seo.noindex;
}
