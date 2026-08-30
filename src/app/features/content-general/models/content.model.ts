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

export interface PageSectionContentData {
  content?: LegalContent | ComplaintsContent | FaqContent | Record<string, unknown>;
}

export interface PageSection {
  id: number;
  name: string;
  identifier: string;
  type: string;
  content_data?: PageSectionContentData;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  sections?: PageSection[];
}