export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    parent: Category | null;
    children_count: number;
    products_count: number;
}
