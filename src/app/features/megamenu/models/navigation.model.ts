export type NavigationItemType = 'custom_url';

export interface NavigationItem {
    id?: number;
    type: NavigationItemType;
    label?: string | null;
    url?: string | null;
    is_active: boolean;
    sort_order?: number;
    valid?: boolean;
    /** Campo de solo cliente: mensaje de validación del backend (claves con puntos). */
    validationError?: string;
}

export interface NavigationSection {
    id?: number;
    title?: string | null;
    is_active: boolean;
    sort_order?: number;
    items: NavigationItem[];
    validationError?: string;
}

export interface NavigationRoot {
    id?: number;
    category_id: string;
    name?: string;
    slug?: string;
    url?: string | null;
    auto_children: boolean;
    auto_children_title?: string | null;
    is_active: boolean;
    hidden_child_ids?: string[];
    sort_order?: number;
    sections: NavigationSection[];
    validationError?: string;
}

export interface MegamenuData {
    roots: NavigationRoot[];
}

export interface CatalogCategoryNode {
    id: string;
    name: string;
    slug: string;
    products_count: number;
    landing_slug: string | null;
    children: CatalogCategoryNode[];
}

export interface CatalogData {
    categories: CatalogCategoryNode[];
}

export interface PublishedLanding {
    id: string;
    title: string;
    slug: string;
    url: string;
}

export interface PublishedLandingsData {
    landings: PublishedLanding[];
}

// --- Payloads (POST /admin/navigation/save) ---

export interface NavigationItemPayload {
    id?: number;
    type: NavigationItemType;
    label?: string;
    url?: string;
    is_active: boolean;
}

export interface NavigationSectionPayload {
    id?: number;
    title?: string;
    is_active: boolean;
    items: NavigationItemPayload[];
}

export interface NavigationRootPayload {
    id?: number;
    category_id: string;
    auto_children: boolean;
    auto_children_title?: string;
    is_active: boolean;
    hidden_child_ids?: string[];
    sections: NavigationSectionPayload[];
}

export interface SaveMegamenuPayload {
    roots: NavigationRootPayload[];
}
