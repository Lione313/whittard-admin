import { LandingBannerSlide, LandingFinalSection } from './landing-content.model';
import { SeoData } from '@/app/shared/models/seo.model';

export type LandingStatus = 'draft' | 'published';

export interface LandingCategoryRef {
    id: string;
    name: string;
    slug: string;
}

export interface Landing {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    url: string;
    category_id: string | null;
    category: LandingCategoryRef | null;
    status: LandingStatus;
    banner: LandingBannerSlide[];
    category_ids: string[];
    recommended_product_ids: string[];
    featured_landing_ids: string[];
    final_section: LandingFinalSection | null;
    seo?: SeoData | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LandingFilters {
    status?: LandingStatus | null;
    category_id?: string | null;
}

export const LANDING_STATUS_OPTIONS: { label: string; value: LandingStatus }[] = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Publicado', value: 'published' }
];

export function landingStatusLabel(status: LandingStatus): string {
    return LANDING_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
