import { Type } from '@angular/core';
import { HeroSliderEditor } from './editors/home/hero-slider-editor';
import { BannerSplitEditor } from './editors/home/banner-split-editor';
import { LegalContentEditor } from './editors/legals/legal-content-editor';
import { ComplaintsContentEditor } from './editors/legals/complaints-content-editor';
import { FaqContentEditor } from './editors/legals/faq-content-editor';
import { FooterInfoEditor } from './editors/global/footer-info-editor';
import { LogoEditor } from './editors/global/logo-editor';
import { NewsletterEditor } from './editors/global/newsletter-editor';
import { SocialLinksEditor } from './editors/global/social-links-editor';
import { ContactMainEditor } from './editors/contact/contact-main-editor';
import { ContactProfileEditor } from './editors/contact/contact-profile-editor';

export const EDITOR_REGISTRY: Record<string, Type<unknown>> = {
    // Secciones de Home / Legales
    slider:             HeroSliderEditor,
    banner_split:       BannerSplitEditor,
    legal_content:      LegalContentEditor,
    complaints_content: ComplaintsContentEditor,
    faq_content:        FaqContentEditor,

    // Secciones de Contacto (por identifier)
    contact_main:       ContactMainEditor,
    contact_profile:    ContactProfileEditor,

    // Secciones Globales
    logo_header:        LogoEditor,
    logo_footer:        LogoEditor,
    footer_info:        FooterInfoEditor,
    social_links:       SocialLinksEditor,
    newsletter:         NewsletterEditor,
};