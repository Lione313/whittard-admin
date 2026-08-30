import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TreeTableModule } from 'primeng/treetable';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { CategoryService } from '@/app/features/products/services/category.service';
import { Category, CategoryPayload } from '@/app/features/products/models/category.model';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [FormsModule, ButtonModule, RippleModule, ToastModule, DialogModule, InputTextModule, SelectModule, TreeTableModule, ToolbarModule, MessageModule, IconFieldModule, InputIconModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nueva Categoría" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <div class="card p-0!">
            <p-treetable #dt [value]="treeNodes()" [rowHover]="true" [tableStyle]="{ 'min-width': '50rem' }" [globalFilterFields]="['name', 'slug']" dataKey="id">
                <ng-template pTemplate="caption">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-baseline gap-3">
                            <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Categorías</h5>
                            <span class="text-sm text-muted-color whitespace-nowrap">{{ rootCategories().length }} categorías · {{ subcategories().length }} subcategorías</span>
                        </div>
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" placeholder="Buscar por nombre o slug..." class="w-full md:w-64" (input)="dt.filterGlobal($any($event.target).value, 'contains')" />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template pTemplate="header">
                    <tr>
                        <th style="min-width: 18rem">Nombre</th>
                        <th style="min-width: 12rem">Slug</th>
                        <th style="width: 11rem" class="text-right">Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
                    <tr [ttRow]="rowNode">
                        <td>
                            <p-treeTableToggler [rowNode]="rowNode" />
                            <span class="font-medium">{{ rowData.name }}</span>
                            @if (rowData.children_count > 0) {
                                <span class="inline-flex items-center px-2 py-0.5 ml-2 text-xs rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-300">{{ rowData.children_count }} sub</span>
                            }
                        </td>
                        <td class="text-muted-color">{{ rowData.slug }}</td>
                        <td class="text-right">
                            <div class="flex items-center justify-end gap-1">
                                @if (!rowData.parent) {
                                    <p-button icon="pi pi-plus" severity="secondary" [text]="true" [rounded]="true" [title]="'Nueva subcategoría'" (onClick)="openNew(rowData.id)" />
                                }
                                <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" [title]="'Editar'" (onClick)="editCategory(rowData)" />
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" [title]="'Eliminar'" (onClick)="deleteCategory(rowData)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="3" class="text-center p-8 text-muted-color">No se encontraron categorías.</td>
                    </tr>
                </ng-template>
            </p-treetable>

            <div class="flex items-center gap-2 px-4 py-4 text-sm text-muted-color border-t border-surface-100 dark:border-surface-800">
                <i class="pi pi-info-circle"></i>
                <span>Haz clic en la flecha para expandir y ver las subcategorías.</span>
            </div>
        </div>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [style]="{ width: '560px' }" [header]="form.id ? 'Editar Categoría' : 'Nueva Categoría'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-medium mb-2">Nombre *</label>
                        <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="Ej: Té Verde" />
                        @if (submitted && !form.name.trim()) {
                            <small class="text-red-500">El nombre es obligatorio.</small>
                        }
                    </div>
                    <div>
                        <label class="block font-medium mb-2">Slug</label>
                        <input pInputText [(ngModel)]="form.slug" class="w-full" placeholder="Se genera automáticamente si se omite" />
                    </div>

                    @if (isEditingSubcategory()) {
                        <p-message severity="info" text="Esta es una subcategoría; se mantiene bajo su categoría raíz." />
                    } @else {
                        <div>
                            <label class="block font-medium mb-2">Categoría Padre</label>
                            <p-select
                                [ngModel]="parentId()"
                                (ngModelChange)="onParentSelect($event)"
                                [options]="parentOptions()"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Sin categoría padre (categoría raíz)"
                                showClear
                                filter
                                emptyMessage="Sin resultados"
                                appendTo="body"
                                class="w-full"
                            />
                            @if (selectedParentPath().length) {
                                <div class="flex items-center gap-1 flex-wrap mt-2 text-sm text-muted-color">
                                    <i class="pi pi-link text-xs"></i>
                                    @for (step of selectedParentPath(); track step; let last = $last) {
                                        <span class="flex items-center gap-1">
                                            <span class="text-primary font-medium">{{ step }}</span>
                                            @if (!last) {
                                                <i class="pi pi-chevron-right text-xs"></i>
                                            }
                                        </span>
                                    }
                                </div>
                            }
                            <small class="text-muted-color block mt-2">Selecciona una categoría raíz para crear una subcategoría. Sin seleccionar, se crea una categoría raíz.</small>
                        </div>
                    }
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="saveCategory()" />
            </ng-template>
        </p-dialog>

        <app-confirm-dialog />
        <p-toast />
    `
})
export class CategoryList implements OnInit {
    private categoryService = inject(CategoryService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    categories = signal<Category[]>([]);
    saving = signal(false);
    dialogVisible = signal(false);
    submitted = false;
    editingId = signal<string | null>(null);
    parentId = signal<string | null>(null);

    isEditingSubcategory = computed(() => {
        const id = this.editingId();

        return id ? !!this.categories().find((c) => c.id === id)?.parent : false;
    });

    form = {
        id: null as string | null,
        name: '',
        slug: '',
        parent_id: null as string | null
    };

    treeNodes = signal<TreeNode[]>([]);
    expandedAll = false;

    rootCategories = computed(() => this.categories().filter((c) => !c.parent));
    subcategories = computed(() => this.categories().filter((c) => c.parent));

    private buildTree(categories: Category[], expanded: boolean): TreeNode[] {
        const byParent = new Map<string | null, Category[]>();

        for (const category of categories) {
            const key = category.parent?.id ?? null;
            const list = byParent.get(key) ?? [];

            list.push(category);
            byParent.set(key, list);
        }

        const build = (parentId: string | null): TreeNode[] =>
            (byParent.get(parentId) ?? []).map((category) => {
                const children = build(category.id);

                return {
                    key: category.id,
                    data: category,
                    expanded,
                    leaf: children.length === 0,
                    children
                };
            });

        return build(null);
    }

    parentOptions = computed(() =>
        this.categories()
            .filter((c) => !c.parent && c.id !== this.editingId())
            .map((c) => ({ label: c.name, value: c.id }))
    );

    selectedParentPath = computed<string[]>(() => {
        const parentId = this.parentId();

        if (!parentId) return [];
        const byId = new Map<string, Category>();

        for (const c of this.categories()) byId.set(c.id, c);
        const path: string[] = [];
        let current = byId.get(parentId);

        while (current) {
            path.unshift(current.name);
            current = current.parent ? byId.get(current.parent.id) : undefined;
        }

        return path;
    });

    ngOnInit() {
        this.loadCategories();
    }

    loadCategories() {
        this.categoryService.list().subscribe({
            next: (res) => {
                this.categories.set(res.data);
                this.treeNodes.set(this.buildTree(res.data, this.expandedAll));
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 4000 })
        });
    }

    openNew(parentId: string | null = null) {
        this.form = { id: null, name: '', slug: '', parent_id: parentId };
        this.parentId.set(parentId);
        this.editingId.set(null);
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    editCategory(category: Category) {
        this.form = {
            id: category.id,
            name: category.name,
            slug: category.slug,
            parent_id: category.parent?.id ?? null
        };
        this.parentId.set(category.parent?.id ?? null);
        this.editingId.set(category.id);
        this.submitted = false;
        this.dialogVisible.set(true);
    }

    onParentSelect(value: string | null) {
        this.parentId.set(value ?? null);
        this.form.parent_id = value ?? null;
    }

    hideDialog() {
        this.dialogVisible.set(false);
        this.submitted = false;
    }

    saveCategory() {
        this.submitted = true;
        if (!this.form.name?.trim()) return;

        if (this.isEditingSubcategory()) {
            if (this.form.parent_id) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Una subcategoría no puede tener categoría padre. Solo se permiten dos niveles.', life: 5000 });

                return;
            }
        } else if (this.form.parent_id) {
            const parent = this.categories().find((c) => c.id === this.form.parent_id);

            if (parent?.parent) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Solo se permiten dos niveles: categorías y subcategorías. No se puede crear una sub-subcategoría.', life: 5000 });

                return;
            }
        }

        this.saving.set(true);
        const payload: CategoryPayload = {
            name: this.form.name.trim(),
            slug: this.form.slug?.trim() || undefined,
            parent_id: this.form.parent_id
        };

        const action = this.form.id ? this.categoryService.update(this.form.id, payload) : this.categoryService.create(payload);

        action.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.hideDialog();
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: res.message, life: 3000 });
                this.loadCategories();
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 });
            }
        });
    }

    deleteCategory(category: Category) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la categoría "${category.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.categoryService.remove(category.id).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: res.message, life: 3000 });
                        this.loadCategories();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(err), life: 5000 })
                });
            }
        });
    }
}
