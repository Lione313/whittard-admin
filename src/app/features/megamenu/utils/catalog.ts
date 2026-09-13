import { CatalogCategoryNode } from '../models/navigation.model';

export interface CatalogOption {
    id: string;
    name: string;
    slug: string;
    landing_slug: string | null;
    label: string;
    isRoot: boolean;
}

/** Aplana el árbol de categorías del picker (`/navigation/catalog`) en opciones de select/autocomplete. */
export function flattenCatalogOptions(nodes: CatalogCategoryNode[] | undefined, depth = 0, options: CatalogOption[] = []): CatalogOption[] {
    for (const node of nodes ?? []) {
        options.push({
            id: node.id,
            name: node.name,
            slug: node.slug,
            landing_slug: node.landing_slug,
            label: `${'— '.repeat(depth)}${node.name}`,
            isRoot: depth === 0
        });
        flattenCatalogOptions(node.children, depth + 1, options);
    }

    return options;
}

/** Solo categorías principales (raíz); las subcategorías quedan fuera porque no pueden tener landing. */
export function rootCategoryOptions(nodes: CatalogCategoryNode[] | undefined): CatalogOption[] {
    return flattenCatalogOptions(nodes).filter((option) => option.isRoot);
}
