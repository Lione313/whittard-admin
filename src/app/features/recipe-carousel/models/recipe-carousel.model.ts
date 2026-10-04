import { RecipeListItem } from '@/app/features/recipes/models/recipe.model';

export interface RecipeCarousel {
    id: number;
    title: string | null;
    is_active: boolean;
    recipes: RecipeListItem[];
    updated_at: string | null;
}

export interface RecipeCarouselPayload {
    title?: string;
    is_active: boolean;
    recipe_ids: string[];
}
