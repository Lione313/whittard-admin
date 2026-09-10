/**
 * Esquemas de las 5 secciones de la landing (spec `landing-final.md`).
 * El editor trabaja sobre este estado tipado; el formulario envía los archivos
 * (thumbnail, banner, imagen editorial) por multipart y el resto como campos
 * dedicados de la landing (banner, category_ids, recommended_product_ids,
 * featured_landing_ids y final_section).
 *
 * Los campos `*_file` son transitorios (File seleccionado por el admin); nunca
 * viajan como JSON, solo se envían como archivos dentro del FormData.
 */

export type LandingBannerSlideType = 'image' | 'video';

export interface LandingBannerSlide {
    type: LandingBannerSlideType;
    is_active: boolean;
    orden: number;
    link_url?: string | null;
    desktop_image_url?: string | null;
    mobile_image_url?: string | null;
    video_url?: string | null;
    desktop_image_file?: File | null;
    mobile_image_file?: File | null;
    video_file?: File | null;
}

export interface LandingFinalSection {
    title?: string | null;
    image_url?: string | null;
    content_html?: string | null;
    image_file?: File | null;
}

/** Producto recomendado ya resuelto para mostrar etiqueta en el editor. */
export interface LandingProductSelection {
    id: string;
    name: string;
    code: string;
}

/** Estado completo de las secciones que edita `LandingSectionsEditor`. */
export interface LandingSectionsState {
    banner: LandingBannerSlide[];
    category_ids: string[];
    products: LandingProductSelection[];
    featured_landing_ids: string[];
    final_section: LandingFinalSection | null;
}

export function emptyBannerSlide(): LandingBannerSlide {
    return { type: 'image', is_active: true, orden: 1 };
}

export function emptyFinalSection(): LandingFinalSection {
    return {};
}

export function emptySectionsState(): LandingSectionsState {
    return {
        banner: [],
        category_ids: [],
        products: [],
        featured_landing_ids: [],
        final_section: null
    };
}

/** Aceptación de archivos para imágenes del banner / miniatura / editorial. */
export const LANDING_IMAGE_ACCEPTANCE: { extensions: string[]; maxBytes: number } = {
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'],
    maxBytes: 10 * 1024 * 1024
};

/** Aceptación de archivos para videos del banner. */
export const LANDING_VIDEO_ACCEPTANCE: { extensions: string[]; maxBytes: number } = {
    extensions: ['mp4', 'webm', 'mov'],
    maxBytes: 200 * 1024 * 1024
};
