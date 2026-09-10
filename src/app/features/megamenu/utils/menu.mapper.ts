import { NavigationItem, NavigationItemPayload, NavigationRoot, NavigationRootPayload, SaveMegamenuPayload } from '../models/navigation.model';

export function serializeMenu(roots: NavigationRoot[]): SaveMegamenuPayload {
    return {
        roots: roots.map((root) => serializeRoot(root))
    };
}

function serializeRoot(root: NavigationRoot): NavigationRootPayload {
    return {
        id: root.id,
        category_id: root.category_id,
        auto_children: root.auto_children,
        auto_children_title: root.auto_children_title?.trim() ? root.auto_children_title.trim() : undefined,
        is_active: root.is_active,
        hidden_child_ids: root.hidden_child_ids ?? [],
        sections: root.sections.map((section) => ({
            id: section.id,
            title: section.title?.trim() ? section.title.trim() : undefined,
            is_active: section.is_active,
            items: section.items.map((item) => serializeItem(item))
        }))
    };
}

function serializeItem(item: NavigationItem): NavigationItemPayload {
    return {
        id: item.id,
        type: item.type,
        label: item.label?.trim() ?? '',
        url: item.url?.trim() ?? '',
        is_active: item.is_active
    };
}

/** Normaliza el árbol del backend garantizando arrays de secciones/items. */
export function normalizeMenu(roots: NavigationRoot[] | undefined | null): NavigationRoot[] {
    return (roots ?? []).map((root) => ({
        ...root,
        sections: (root.sections ?? []).map((section) => ({ ...section, items: section.items ?? [] }))
    }));
}

/** Copia el árbol y limpia los mensajes de error pegados en los nodos (solo cliente). */
export function stripValidationErrors(roots: NavigationRoot[]): NavigationRoot[] {
    return roots.map((root) => ({
        ...root,
        validationError: undefined,
        sections: root.sections.map((section) => ({
            ...section,
            validationError: undefined,
            items: section.items.map((item) => ({ ...item, validationError: undefined }))
        }))
    }));
}

/**
 * Mapea los errores 422 del backend (claves con puntos: `roots.0.sections.0.items.0.url`)
 * al nodo correspondiente del árbol. Devuelve un árbol nuevo con los mensajes.
 */
export function applyMenuServerErrors(roots: NavigationRoot[], errors: Record<string, string[]>): NavigationRoot[] {
    const messages = new Map<string, string[]>();

    for (const key of Object.keys(errors ?? {})) {
        const match = key.match(/^roots\.(\d+)(?:\.sections\.(\d+))?(?:\.items\.(\d+))?/);

        if (!match) continue;

        const [, rootIdx, sectionIdx, itemIdx] = match;
        const nodeKey = itemIdx !== undefined ? `root.${rootIdx}.section.${sectionIdx}.item.${itemIdx}` : sectionIdx !== undefined ? `root.${rootIdx}.section.${sectionIdx}` : `root.${rootIdx}`;
        const list = messages.get(nodeKey) ?? [];

        list.push(...(errors[key] ?? []));
        messages.set(nodeKey, list);
    }

    return stripValidationErrors(roots).map((root, i) => {
        const rootErrors = messages.get(`root.${i}`);

        return {
            ...root,
            validationError: rootErrors?.join(' · '),
            sections: root.sections.map((section, j) => {
                const sectionErrors = messages.get(`root.${i}.section.${j}`);

                return {
                    ...section,
                    validationError: sectionErrors?.join(' · '),
                    items: section.items.map((item, k) => {
                        const itemErrors = messages.get(`root.${i}.section.${j}.item.${k}`);

                        return { ...item, validationError: itemErrors?.join(' · ') };
                    })
                };
            })
        };
    });
}

/** Problema que impide guardar (referencias rotas / items incompletos). Devuelve `null` si está OK. */
export function firstSaveProblem(roots: NavigationRoot[]): string | null {
    for (const root of roots) {
        for (const section of root.sections) {
            for (const item of section.items) {
                if (item.valid === false) {
                    return 'Existen items inválidos (valid: false). Quítalos o corrígelos antes de guardar.';
                }

                if (!item.label?.trim()) {
                    return 'Los items de URL personalizada requieren label.';
                }

                if (!item.url?.trim()) {
                    return 'Los items de URL personalizada requieren url.';
                }
            }
        }
    }

    return null;
}

export function isLandingUrl(url?: string | null): boolean {
    return !!url && url.startsWith('/landing/');
}
