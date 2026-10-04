import { SeoData } from '@/app/shared/models/seo.model';

export interface PageSeo {
    id: string;
    key: string;
    name: string;
    path: string;
    seo: SeoData | null;
    updated_at: string | null;
}

export interface PageSeoPayload {
    seo: SeoData | null;
}
