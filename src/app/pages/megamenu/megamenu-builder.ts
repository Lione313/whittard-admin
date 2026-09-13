import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { TreeModule } from 'primeng/tree';
import { ToolbarModule } from 'primeng/toolbar';

import { NavigationService } from '@/app/features/megamenu/services/navigation.service';
import { CatalogCategoryNode, NavigationItem, NavigationRoot, NavigationSection } from '@/app/features/megamenu/models/navigation.model';
import { applyMenuServerErrors, firstSaveProblem, isLandingUrl, normalizeMenu, serializeMenu, stripValidationErrors } from '@/app/features/megamenu/utils/menu.mapper';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';
import { ApiError } from '@/app/core/models/api-error.model';

interface CatalogPickerData {
    category: CatalogCategoryNode;
}

@Component({
    selector: 'app-megamenu-builder',
    standalone: true,
    imports: [FormsModule, ButtonModule, ToastModule, DialogModule, InputTextModule, ToggleSwitchModule, SelectModule, TagModule, MessageModule, TreeModule, ToolbarModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="Agregar raíz" icon="pi pi-plus" [disabled]="loading()" (onClick)="openAddRootDialog()" />
            </ng-template>
            <ng-template #end>
                <div class="flex items-center gap-2">
                    @if (hasChanges()) {
                        <span class="text-sm text-muted-color hidden md:block">Cambios sin guardar</span>
                    }
                    <p-button label="Guardar menú" icon="pi pi-check" [disabled]="!canSave()" [loading]="saving()" (onClick)="save()" />
                </div>
            </ng-template>
        </p-toolbar>

        @if (loading()) {
            <div class="card p-16 flex flex-col items-center justify-center gap-3 text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
                <span>Cargando menú...</span>
            </div>
        } @else {
            @if (saveProblem(); as problem) {
                <p-message severity="warn" [text]="problem" styleClass="w-full mb-4 block" />
            }

            @if (roots().length === 0) {
                <div class="card p-12 flex flex-col items-center justify-center gap-3 text-center">
                    <i class="pi pi-sitemap text-3xl text-muted-color"></i>
                    <p class="m-0 font-medium text-surface-900 dark:text-surface-0">Aún no hay raíces en el menú</p>
                    <span class="text-sm text-muted-color max-w-md">Agrega categorías del catálogo como raíces de la barra de navegación. El orden en esta pantalla es el orden final del menú.</span>
                    <p-button label="Agregar primera raíz" icon="pi pi-plus" class="mt-2" (onClick)="openAddRootDialog()" />
                </div>
            } @else {
                <div class="flex flex-col gap-4">
                    @for (root of roots(); track root.category_id; let i = $index) {
                        <div class="card p-4! border border-surface-200! dark:border-surface-800!">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p-button
                                    [icon]="isRootExpanded(root.category_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                                    severity="secondary"
                                    [text]="true"
                                    [rounded]="true"
                                    [title]="isRootExpanded(root.category_id) ? 'Contraer' : 'Expandir'"
                                    (onClick)="toggleRootExpanded(root.category_id)"
                                />
                                <i class="pi pi-sitemap text-primary"></i>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ root.name || root.slug }}</span>
                                @if (landingUrl(root.url)) {
                                    <p-tag value="landing" severity="info" styleClass="font-mono text-xs" />
                                }
                                <span class="text-xs text-muted-color font-mono w-full md:w-auto md:ml-1">{{ root.url || (root.slug ? '/catalogo/' + root.slug : '') }}</span>
                                @if ((root.hidden_child_ids?.length ?? 0) > 0) {
                                    <p-tag [value]="root.hidden_child_ids!.length + ' subcategoría(s) oculta(s)'" severity="warn" styleClass="text-xs" />
                                }

                                <div class="flex-1"></div>

                                <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="i === 0" title="Subir" (onClick)="moveRoot(i, -1)" />
                                <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="i === roots().length - 1" title="Bajar" (onClick)="moveRoot(i, 1)" />
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" title="Quitar raíz" (onClick)="removeRoot(root)" />
                            </div>

                            @if (root.validationError; as error) {
                                <p-message severity="error" [text]="error" styleClass="w-full mt-3 block" />
                            }

                            @if (isRootExpanded(root.category_id)) {
                                <div class="mt-4 flex flex-col gap-4">
                                    <div class="flex flex-wrap items-center gap-6">
                                        <div class="flex items-center gap-3">
                                            <p-toggleswitch [ngModel]="root.is_active" (ngModelChange)="setRootActive(root, $event)" inputId="root-active-{{ root.category_id }}" />
                                            <label for="root-active-{{ root.category_id }}" class="font-medium cursor-pointer">Raíz activa</label>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <p-toggleswitch [ngModel]="root.auto_children" (ngModelChange)="setRootAutoChildren(root, $event)" inputId="root-auto-{{ root.category_id }}" />
                                            <label for="root-auto-{{ root.category_id }}" class="font-medium cursor-pointer">Auto mostrar subcategorías</label>
                                        </div>
                                    </div>
                                    <small class="text-muted-color -mt-2 block">
                                        Con "Auto mostrar subcategorías" activado, el storefront siempre muestra una columna de subcategorías; las secciones que agregues aparecen como columnas adicionales.
                                    </small>

                                    @if (root.auto_children) {
                                        <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3 flex flex-col gap-3">
                                            <div class="flex flex-col gap-1">
                                                <label for="auto-title-{{ root.category_id }}" class="text-sm font-semibold text-surface-900 dark:text-surface-0">Título de la columna de subcategorías</label>
                                                <input
                                                    pInputText
                                                    [ngModel]="root.auto_children_title ?? ''"
                                                    (ngModelChange)="setRootAutoChildrenTitle(root, $event)"
                                                    id="auto-title-{{ root.category_id }}"
                                                    placeholder="Categorías"
                                                    class="w-full max-w-xs"
                                                />
                                                <small class="text-muted-color">Si lo dejas vacío, se usa "Categorías".</small>
                                            </div>

                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <span class="block text-sm font-semibold text-surface-900 dark:text-surface-0">Subcategorías visibles</span>
                                                    <small class="text-muted-color block">Apaga las subcategorías que no quieras mostrar en el menú.</small>
                                                </div>
                                                @if ((root.hidden_child_ids?.length ?? 0) > 0) {
                                                    <p-button label="Mostrar todas" icon="pi pi-eye" severity="secondary" [text]="true" size="small" (onClick)="showAllChildren(root)" />
                                                }
                                            </div>

                                            @if (childCategories(root.category_id).length === 0) {
                                                <small class="text-muted-color">Esta categoría no tiene subcategorías.</small>
                                            } @else {
                                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    @for (child of childCategories(root.category_id); track child.id) {
                                                        <div class="flex items-center justify-between gap-3 rounded-md border border-surface-100 dark:border-surface-800 px-3 py-1.5 bg-surface-50 dark:bg-surface-900/30">
                                                            <span class="text-sm font-medium truncate">{{ child.name }}</span>
                                                            <div class="flex items-center gap-2 shrink-0">
                                                                <p-toggleswitch [ngModel]="isChildVisible(root, child.id)" (ngModelChange)="setChildVisible(root, child.id, $event)" inputId="child-{{ child.id }}-{{ root.category_id }}" />
                                                                <label for="child-{{ child.id }}-{{ root.category_id }}" class="sr-only">{{ child.name }}</label>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }

                                    <div class="flex flex-col gap-3">
                                        @for (section of root.sections; track section; let j = $index) {
                                            <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-3 flex flex-col gap-3 bg-surface-50 dark:bg-surface-900/40">
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <i class="pi pi-th-large text-sm text-muted-color"></i>
                                                    <input pInputText [ngModel]="section.title ?? ''" (ngModelChange)="setSectionTitle(section, $event)" placeholder="Título de la sección (ej: Tipos de té)" class="flex-1 min-w-40" />
                                                    <p-toggleswitch [ngModel]="section.is_active" (ngModelChange)="setSectionActive(section, $event)" inputId="section-active-{{ j }}-{{ root.category_id }}" />
                                                    <label for="section-active-{{ j }}-{{ root.category_id }}" class="text-sm font-medium cursor-pointer">Activa</label>
                                                    <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="j === 0" title="Subir sección" (onClick)="moveSection(root, j, -1)" />
                                                    <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="j === root.sections.length - 1" title="Bajar sección" (onClick)="moveSection(root, j, 1)" />
                                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" title="Eliminar sección" (onClick)="removeSection(root, j)" />
                                                </div>

                                                @if (section.validationError; as error) {
                                                    <p-message severity="error" [text]="error" styleClass="w-full block" />
                                                }

                                                <div class="flex flex-col gap-1.5">
                                                    @for (item of section.items; track item; let k = $index) {
                                                        <div class="flex items-center gap-2 flex-wrap rounded-md border border-dashed border-surface-300 dark:border-surface-700 px-3 py-2 bg-surface-0 dark:bg-surface-900">
                                                            <input pInputText [ngModel]="item.label ?? ''" (ngModelChange)="setItemLabel(item, $event)" placeholder="Etiqueta" class="w-40" />
                                                            <input pInputText [ngModel]="item.url ?? ''" (ngModelChange)="setItemUrl(item, $event)" placeholder="/promociones" class="w-48 font-mono" />

                                                            @if (item.valid === false) {
                                                                <p-tag value="inválido" severity="danger" styleClass="text-xs" />
                                                            }

                                                            <div class="flex-1"></div>

                                                            <p-toggleswitch [ngModel]="item.is_active" (ngModelChange)="setItemActive(item, $event)" inputId="item-active-{{ k }}-{{ j }}-{{ root.category_id }}" />
                                                            <label for="item-active-{{ k }}-{{ j }}-{{ root.category_id }}" class="sr-only">Activo</label>
                                                            <p-button icon="pi pi-arrow-up" severity="secondary" [text]="true" [rounded]="true" [disabled]="k === 0" title="Subir" (onClick)="moveItem(root, j, k, -1)" />
                                                            <p-button icon="pi pi-arrow-down" severity="secondary" [text]="true" [rounded]="true" [disabled]="k === section.items.length - 1" title="Bajar" (onClick)="moveItem(root, j, k, 1)" />
                                                            <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true" title="Quitar item" (onClick)="removeItem(root, j, k)" />

                                                            @if (item.validationError; as error) {
                                                                <div class="w-full text-xs text-red-500 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>{{ error }}</div>
                                                            }
                                                        </div>
                                                    } @empty {
                                                        <span class="text-sm text-muted-color py-1">Sin items. Agrega enlaces propios.</span>
                                                    }
                                                </div>

                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <span class="text-xs text-muted-color">Agregar item:</span>
                                                    <p-button label="URL propia" icon="pi pi-link" severity="secondary" [text]="true" size="small" (onClick)="addCustomItem(i, j)" />
                                                </div>
                                            </div>
                                        }
                                    </div>

                                    <p-button label="Agregar sección" icon="pi pi-plus" severity="secondary" [text]="true" (onClick)="addSection(i)" />
                                </div>
                            }
                        </div>
                    }
                </div>
            }
        }

        <p-dialog header="Agregar raíz del menú" [visible]="dialogAddRoot()" (visibleChange)="dialogAddRoot.set($event)" [modal]="true" [style]="{ width: '560px' }">
            <ng-template #content>
                <p class="mt-0 text-sm text-muted-color">Elige una categoría raíz del catálogo. Solo se permiten raíces (sin categoría padre) y no pueden repetirse.</p>
                @if (catalogLoading()) {
                    <div class="flex items-center gap-2 text-muted-color py-4"><i class="pi pi-spin pi-spinner"></i><span>Cargando catálogo...</span></div>
                } @else if (catalogError()) {
                    <div class="flex flex-col items-center gap-3 text-center py-6">
                        <span class="text-sm text-red-500 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>No se pudo cargar el catálogo.</span>
                        <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" [text]="true" (onClick)="loadCatalog()" />
                    </div>
                } @else if (catalogEmpty()) {
                    <div class="flex flex-col items-center gap-3 text-center py-6 text-muted-color">
                        <i class="pi pi-sitemap text-2xl"></i>
                        <span class="text-sm max-w-sm">No hay categorías en el catálogo. Crea primero una categoría en Productos → Categorías para poder agregarla como raíz del menú.</span>
                    </div>
                } @else {
                    <p-tree [value]="catalogNodes()" selectionMode="single" [selection]="treeSelection()" (selectionChange)="treeSelection.set($event)" (onNodeSelect)="onRootPicked($event)" class="max-h-96 overflow-auto" />
                }
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class MegamenuBuilder implements OnInit {
    private navigationService = inject(NavigationService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    roots = signal<NavigationRoot[]>([]);
    loading = signal(false);
    saving = signal(false);

    readonly landingUrl = isLandingUrl;

    revision = signal(0);
    private loadedRevision = 0;

    expandedRoots = signal<Set<string>>(new Set());

    dialogAddRoot = signal(false);

    catalogCategories = signal<CatalogCategoryNode[]>([]);
    catalogNodes = signal<TreeNode[]>([]);
    catalogLoading = signal(false);
    catalogError = signal(false);
    treeSelection = signal<TreeNode | TreeNode[] | null | undefined>(null);

    catalogEmpty = computed(() => !this.catalogLoading() && !this.catalogError() && this.catalogCategories().length === 0);

    hasChanges = computed(() => this.revision() !== this.loadedRevision);

    saveProblem = computed(() => {
        void this.revision();

        return this.roots().length ? firstSaveProblem(this.roots()) : null;
    });

    canSave = computed(() => this.hasChanges() && !this.saving() && !this.loading() && !this.saveProblem());

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);

        this.navigationService.getMenu().subscribe({
            next: (res) => {
                this.roots.set(stripValidationErrors(normalizeMenu(res.data?.roots)));
                this.loadedRevision = this.revision();
                this.loading.set(false);
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });

        this.loadCatalog();
    }

    save() {
        if (this.saveProblem()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: this.saveProblem() ?? undefined, life: 4000 });

            return;
        }

        this.saving.set(true);

        this.navigationService.saveMenu(serializeMenu(this.roots())).subscribe({
            next: (res) => {
                this.saving.set(false);
                this.roots.set(stripValidationErrors(normalizeMenu(res.data?.roots ?? this.roots())));
                this.loadedRevision = this.revision();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
            },
            error: (err) => {
                this.saving.set(false);

                if (err instanceof ApiError && err.errors) {
                    this.roots.set(applyMenuServerErrors(this.roots(), err.errors));
                    this.messageService.add({ severity: 'error', summary: 'Error de validación', detail: 'Corrige los nodos marcados y vuelve a guardar.', life: 6000 });

                    return;
                }

                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    // --- Estado local / helpers de template ---

    isRootExpanded(categoryId: string): boolean {
        return this.expandedRoots().has(categoryId);
    }

    toggleRootExpanded(categoryId: string) {
        this.expandedRoots.update((current) => {
            const next = new Set(current);

            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }

            return next;
        });
    }

    // --- Raíces ---

    moveRoot(index: number, dir: -1 | 1) {
        const next = reorder(this.roots(), index, dir);

        if (next) {
            this.roots.set(next);
            this.bump();
        }
    }

    removeRoot(root: NavigationRoot) {
        this.confirmationService.confirm({
            message: `¿Quitar la raíz "${root.name || root.slug}" y sus secciones del menú?`,
            header: 'Quitar raíz',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.roots.set(this.roots().filter((r) => r.category_id !== root.category_id));
                this.expandedRoots.update((current) => {
                    const next = new Set(current);

                    next.delete(root.category_id);

                    return next;
                });
                this.bump();
            }
        });
    }

    setRootActive(root: NavigationRoot, active: boolean) {
        root.is_active = active;
        this.bump();
    }

    setRootAutoChildren(root: NavigationRoot, auto: boolean) {
        root.auto_children = auto;
        this.bump();
    }

    setRootAutoChildrenTitle(root: NavigationRoot, title: string) {
        root.auto_children_title = title ?? '';
        this.bump();
    }

    // --- Subcategorías visibles (modo auto) ---

    childCategories(categoryId: string): CatalogCategoryNode[] {
        const node = findCategoryNode(this.catalogCategories(), categoryId);

        return node?.children ?? [];
    }

    isChildVisible(root: NavigationRoot, childId: string): boolean {
        return !(root.hidden_child_ids ?? []).includes(childId);
    }

    setChildVisible(root: NavigationRoot, childId: string, visible: boolean) {
        const hidden = new Set(root.hidden_child_ids ?? []);

        if (visible) {
            hidden.delete(childId);
        } else {
            hidden.add(childId);
        }

        root.hidden_child_ids = [...hidden];
        this.bump();
    }

    showAllChildren(root: NavigationRoot) {
        root.hidden_child_ids = [];
        this.bump();
    }

    addSection(rootIndex: number) {
        const root = this.roots()[rootIndex];

        if (!root) return;

        root.sections = [...root.sections, emptySection()];
        this.roots.update((current) => [...current]);
        this.bump();
    }

    // --- Secciones ---

    setSectionTitle(section: NavigationSection, title: string) {
        section.title = title ?? '';
        this.bump();
    }

    setSectionActive(section: NavigationSection, active: boolean) {
        section.is_active = active;
        this.bump();
    }

    moveSection(root: NavigationRoot, index: number, dir: -1 | 1) {
        const next = reorder(root.sections, index, dir);

        if (next) {
            root.sections = next;
            this.roots.update((current) => [...current]);
            this.bump();
        }
    }

    removeSection(root: NavigationRoot, index: number) {
        root.sections = root.sections.filter((_, idx) => idx !== index);
        this.roots.update((current) => [...current]);
        this.bump();
    }

    // --- Items ---

    addCustomItem(rootIndex: number, sectionIndex: number) {
        this.appendItem(rootIndex, sectionIndex, { type: 'custom_url', label: '', url: '', is_active: true, valid: true });
    }

    setItemLabel(item: NavigationItem, label: string) {
        item.label = label ?? '';
        this.bump();
    }

    setItemUrl(item: NavigationItem, url: string) {
        item.url = url ?? '';
        this.bump();
    }

    setItemActive(item: NavigationItem, active: boolean) {
        item.is_active = active;
        this.bump();
    }

    moveItem(root: NavigationRoot, sectionIndex: number, itemIndex: number, dir: -1 | 1) {
        const section = root.sections[sectionIndex];

        if (!section) return;

        const next = reorder(section.items, itemIndex, dir);

        if (next) {
            section.items = next;
            root.sections = [...root.sections];
            this.roots.update((current) => [...current]);
            this.bump();
        }
    }

    removeItem(root: NavigationRoot, sectionIndex: number, itemIndex: number) {
        const section = root.sections[sectionIndex];

        if (!section) return;

        section.items = section.items.filter((_, idx) => idx !== itemIndex);
        root.sections = [...root.sections];
        this.roots.update((current) => [...current]);
        this.bump();
    }

    private appendItem(rootIndex: number, sectionIndex: number, item: NavigationItem) {
        const root = this.roots()[rootIndex];

        if (!root) return;

        const section = root.sections[sectionIndex];

        if (!section) return;

        section.items = [...section.items, item];
        root.sections = [...root.sections];
        this.roots.update((current) => [...current]);
        this.bump();
    }

    // --- Pickers ---

    loadCatalog() {
        this.catalogLoading.set(true);
        this.catalogError.set(false);

        this.navigationService.getCatalog().subscribe({
            next: (res) => {
                this.catalogCategories.set(Array.isArray(res.data?.categories) ? res.data.categories : []);
                this.catalogNodes.set(this.buildRootNodes(this.catalogCategories()));
                this.catalogLoading.set(false);
            },
            error: () => {
                this.catalogCategories.set([]);
                this.catalogNodes.set([]);
                this.catalogLoading.set(false);
                this.catalogError.set(true);
            }
        });
    }

    openAddRootDialog() {
        this.catalogNodes.set(this.buildRootNodes(this.catalogCategories()));
        this.treeSelection.set(null);
        this.dialogAddRoot.set(true);
    }

    onRootPicked(event: { node: TreeNode }) {
        const data = event.node?.data as CatalogPickerData | undefined;

        if (!data?.category) return;

        const exists = this.roots().some((root) => root.category_id === data.category.id);

        if (exists) {
            this.messageService.add({ severity: 'warn', summary: 'Ya agregada', detail: 'Esa categoría ya fue agregada como raíz del menú.', life: 4000 });

            return;
        }

        this.roots.update((current) => [
            ...current,
            {
                category_id: data.category.id,
                name: data.category.name,
                slug: data.category.slug,
                url: data.category.landing_slug ? `/landing/${data.category.landing_slug}` : null,
                auto_children: true,
                is_active: true,
                sections: []
            }
        ]);
        this.expandedRoots.update((current) => new Set(current).add(data.category.id));
        this.dialogAddRoot.set(false);
        this.bump();
    }

    private buildRootNodes(nodes: CatalogCategoryNode[]): TreeNode[] {
        return nodes.map((category) => ({
            key: category.id,
            label: category.name,
            data: { category } as CatalogPickerData,
            selectable: true,
            leaf: true,
            children: []
        }));
    }

    private bump() {
        this.revision.update((value) => value + 1);
    }
}

function emptySection(): NavigationSection {
    return { title: '', is_active: true, items: [] };
}

function findCategoryNode(nodes: CatalogCategoryNode[], categoryId: string): CatalogCategoryNode | null {
    for (const node of nodes) {
        if (node.id === categoryId) return node;

        const found = findCategoryNode(node.children, categoryId);

        if (found) return found;
    }

    return null;
}

function reorder<T>(items: T[], index: number, dir: -1 | 1): T[] | null {
    const target = index + dir;

    if (target < 0 || target >= items.length) return null;

    const copy = [...items];
    const [moved] = copy.splice(index, 1);

    copy.splice(target, 0, moved);

    return copy;
}
