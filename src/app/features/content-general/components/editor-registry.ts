import { Type } from '@angular/core';
import { HeroSliderEditor } from './editors/home/hero-slider-editor';
import { BannerSplitEditor } from './editors/home/banner-split-editor';
import { BannerEditor } from './editors/home/banner-editor';
import { LegalContentEditor } from './editors/legals/legal-content-editor';
import { ComplaintsContentEditor } from './editors/legals/complaints-content-editor';
import { FaqContentEditor } from './editors/legals/faq-content-editor';
import { FooterInfoEditor } from './editors/global/footer-info-editor';
import { LogoEditor } from './editors/global/logo-editor';
import { NewsletterEditor } from './editors/global/newsletter-editor';
import { SocialLinksEditor } from './editors/global/social-links-editor';
import { ContactMainEditor } from './editors/contact/contact-main-editor';
import { ContactProfileEditor } from './editors/contact/contact-profile-editor';
import { CardsEditor } from './editors/about/cards-editor';
import { SectionTitleEditor } from './editors/common/section-title-editor';
import { PhysicalStoresEditor } from './editors/stores/physical-stores-editor';

export const EDITOR_REGISTRY: Record<string, Type<unknown>> = {
    // Secciones de Home / Legales
    slider: HeroSliderEditor,
    banner_split: BannerSplitEditor,
    banner: BannerEditor,
    promo: BannerEditor,
    section_title: SectionTitleEditor,
    legal_content: LegalContentEditor,
    complaints_content: ComplaintsContentEditor,
    faq_content: FaqContentEditor,

    // Secciones de Nosotros
    cards: CardsEditor,

    // Secciones de Tiendas Físicas
    physical_stores: PhysicalStoresEditor,

    // Secciones de Contacto (por identifier)
    contact_main: ContactMainEditor,
    contact_profile: ContactProfileEditor,

    // Secciones Globales
    logo_header: LogoEditor,
    logo_footer: LogoEditor,
    footer_info: FooterInfoEditor,
    social_links: SocialLinksEditor,
    newsletter: NewsletterEditor
};
