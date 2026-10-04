import { Pagination } from '@/app/core/models/api.model';
import { SeoData } from '@/app/shared/models/seo.model';

export type RecipeStatus = 'draft' | 'published';

export interface RecipeImage {
    url: string;
    alt?: string | null;
}

export interface RecipeProductRef {
    id: string;
    name: string;
    slug: string;
}

export interface RecipeListItem {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail: string | null;
    image: string | null;
    status: RecipeStatus;
    sort_order: number;
    updated_at: string | null;
}

export interface Recipe extends RecipeListItem {
    images: RecipeImage[];
    time: string | null;
    difficulty: string | null;
    servings: string | null;
    ingredients: string[];
    method: string | null;
    products: RecipeProductRef[];
    related_recipes: RecipeListItem[];
    seo: SeoData | null;
    created_at: string | null;
}

export interface RecipeList {
    items: RecipeListItem[];
    pagination: Pagination;
}

export interface RecipeFilters {
    page?: number;
    per_page?: number;
    search?: string;
}

export interface RecipePayload {
    title: string;
    slug?: string;
    thumbnail?: string;
    description?: string;
    images: RecipeImage[];
    time?: string;
    difficulty?: string;
    servings?: string;
    ingredients: string[];
    method?: string;
    status: RecipeStatus;
    sort_order?: number;
    product_ids?: string[];
    related_recipe_ids?: string[];
    seo?: SeoData | null;
}

export const RECIPE_STATUS_OPTIONS: { label: string; value: RecipeStatus }[] = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Publicada', value: 'published' }
];
