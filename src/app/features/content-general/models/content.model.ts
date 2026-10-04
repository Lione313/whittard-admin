export interface LegalContent extends Record<string, unknown> {
    is_visible: boolean;
    title: string;
    subtitle?: string;
    body: string;
}

export interface ComplaintsContent extends Record<string, unknown> {
    is_visible?: boolean;
    title?: string;
    paragraph?: string;
    observations?: string;
}

export interface FaqItem extends Record<string, unknown> {
    order: number;
    question: string;
    answer: string;
}

export interface FaqContent extends Record<string, unknown> {
    is_visible?: boolean;
    title?: string;
    subtitle?: string;
    items?: FaqItem[];
}

export interface SlideItem {
    id: number;
    title: string;
    subtitle: string;
    type: 'image' | 'video';
    media_type: 'simple' | 'link';
    src_desktop: string | File | null;
    src_mobile: string | File | null;
    video_url?: string | null;
    sort_order: number;
    is_active: boolean;
    preview_desktop?: string | null;
    preview_mobile?: string | null;
}

export interface HeroSliderContent extends Record<string, unknown> {
    is_visible?: boolean;
    slides?: SlideItem[];
}

export interface PageSectionContentData {
    id?: number;
    content?: LegalContent | ComplaintsContent | FaqContent | Record<string, unknown>;
    draft_content?: Record<string, unknown> | null;
    has_draft?: boolean;
    version?: number;
    updated_by?: string | null;
    updated_at?: string | null;
}

export interface PageSection {
    id: number;
    name: string;
    identifier: string;
    type: string;
    locale?: string;
    sort_order?: number;
    is_active?: boolean;
    settings?: Record<string, unknown> | null;
    content_data?: PageSectionContentData;
    created_at?: string | null;
    updated_at?: string | null;
}

/** Fila de la tabla de secciones: la sección + la página a la que pertenece. */
export interface ContentSectionRow {
    id: number;
    pageSlug: string;
    pageTitle: string;
    section: PageSection;
}

export interface BannerSplitContent extends Record<string, unknown> {
    is_visible: boolean;
    layout: 'image_left' | 'image_right';
    image: string | null;
    title: string;
    subtitle: string;
    button_text: string;
    button_url: string;
}

export interface ContactCard {
    type: 'whatsapp' | 'email';
    title: string;
    description: string;
    icon_image: string;
    button_text: string;
    phone?: string;
    whatsapp_msg?: string;
    email?: string;
    subject?: string;
    email_msg?: string;
}

export interface ContactMainContent extends Record<string, unknown> {
    is_visible: boolean;
    page_title: string;
    cards: ContactCard[];
}

export interface ContactProfileContent extends Record<string, unknown> {
    is_visible: boolean;
    html_content: string;
}
export interface Page {
    id: number;
    title: string;
    slug: string;
    sections?: PageSection[];
}
