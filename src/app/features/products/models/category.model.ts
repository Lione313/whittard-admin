export interface Category {
    id: string;
    name: string;
    slug: string;
    parent: Category | null;
    children_count: number;
    products_count: number;
}

export interface CategoryPayload {
    parent_id?: string | null;
    name: string;
    slug?: string;
}
