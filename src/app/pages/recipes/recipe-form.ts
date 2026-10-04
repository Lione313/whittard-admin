import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';

import { MediaService } from '@/app/core/services/media.service';
import { ProductService } from '@/app/features/products/services/product.service';
import { RecipeService } from '@/app/features/recipes/services/recipe.service';
import { RecipeImage, RecipePayload, RecipeStatus, RECIPE_STATUS_OPTIONS } from '@/app/features/recipes/models/recipe.model';
import { SeoPanel } from '@/app/shared/components/seo-panel/seo-panel';
import { RichTextEditorComponent } from '@/app/shared/components/rich-text-editor/rich-text-editor';
import { normalizeSeoData, SeoData } from '@/app/shared/models/seo.model';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-recipe-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, MultiSelectModule, ToggleSwitchModule, SeoPanel, RichTextEditorComponent, ToastModule],
    providers: [MessageService],
    template: `
        <div class="flex items-center gap-3 mb-6">
            <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" severity="secondary" (onClick)="goBack()" />
            <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">
                {{ isEdit ? 'Editar receta' : 'Nueva receta' }}
            </h1>
        </div>

        @if (loading()) {
            <div class="card p-16 flex items-center justify-center text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else {
            <div class="grid gap-4 lg:grid-cols-3">
                <div class="lg:col-span-2 flex flex-col gap-4">
                    <div class="card flex flex-col gap-4">
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título *</label>
                            <input pInputText [ngModel]="title()" (ngModelChange)="title.set($event)" class="w-full" placeholder="Ej: Mango Summer Shortbread" />
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Slug (opcional)</label>
                                <input pInputText [ngModel]="slug()" (ngModelChange)="slug.set($event)" class="w-full font-mono" placeholder="mango-summer-shortbread" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Estado</label>
                                <p-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="status.set($event)" optionLabel="label" optionValue="value" styleClass="w-full" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Descripción</label>
                            <textarea pTextarea [ngModel]="description()" (ngModelChange)="description.set($event)" rows="3" class="w-full" placeholder="Texto introductorio de la receta"></textarea>
                        </div>
                    </div>

                    <div class="card flex flex-col gap-4">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Imágenes</span>

                        <div class="grid gap-3 sm:grid-cols-3">
                            @for (image of images(); track $index; let i = $index) {
                                <div class="relative overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700">
                                    <img [src]="image.url" [alt]="image.alt || title()" class="h-32 w-full object-cover" />
                                    <button type="button" class="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80" title="Quitar imagen" (click)="removeImage(i)">
                                        <i class="pi pi-times text-xs"></i>
                                    </button>
                                </div>
                            }
                            <button
                                type="button"
                                class="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-300 text-muted-color transition-colors hover:border-primary hover:text-primary dark:border-surface-700"
                                (click)="fileInput.click()"
                            >
                                <i class="pi pi-plus text-xl"></i>
                                <span class="text-xs">Agregar imagen</span>
                            </button>
                            <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />
                        </div>
                    </div>

                    <div class="card flex flex-col gap-4">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Ingredientes</span>

                        @for (ingredient of ingredients(); track $index; let i = $index) {
                            <div class="flex items-center gap-2">
                                <input pInputText [ngModel]="ingredient" (ngModelChange)="setIngredient(i, $event)" class="w-full" placeholder="Ej: 125g de mantequilla" />
                                <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true" (onClick)="removeIngredient(i)" />
                            </div>
                        }

                        <p-button label="Agregar ingrediente" icon="pi pi-plus" [text]="true" size="small" (onClick)="addIngredient()" />
                    </div>

                    <div class="card">
                        <label class="block text-xs font-semibold mb-2 text-surface-600 dark:text-surface-400">Método</label>
                        <app-rich-text-editor [ngModel]="method()" (ngModelChange)="method.set($event)" placeholder="Escribe los pasos. Puedes usar listas, encabezados y enlaces." minHeight="220px" />
                    </div>

                    <app-seo-panel [value]="seo()" (valueChange)="seo.set($event)" />
                </div>

                <div class="flex flex-col gap-4">
                    <div class="card flex flex-col gap-3">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Imagen de miniatura</span>
                        <div class="bg-surface-50 dark:bg-surface-800 relative h-40 w-full overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700">
                            @if (thumbnail()) {
                                <img [src]="thumbnail()" alt="Miniatura" class="h-full w-full object-cover" />
                            } @else {
                                <div class="flex h-full items-center justify-center text-muted-color">
                                    <i class="pi pi-image text-2xl"></i>
                                </div>
                            }
                        </div>
                        <div class="flex items-center gap-2">
                            <p-button label="Subir" icon="pi pi-upload" size="small" (onClick)="thumbnailInput.click()" />
                            @if (thumbnail()) {
                                <p-button label="Quitar" icon="pi pi-times" severity="danger" [text]="true" size="small" (onClick)="thumbnail.set('')" />
                            }
                            <input #thumbnailInput type="file" accept="image/*" class="hidden" (change)="onThumbnailSelected($event)" />
                        </div>
                    </div>

                    <div class="card flex flex-col gap-4">
                        <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Detalles</span>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Tiempo</label>
                            <input pInputText [ngModel]="time()" (ngModelChange)="time.set($event)" class="w-full" placeholder="Ej: 2 horas" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Dificultad</label>
                            <input pInputText [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)" class="w-full" placeholder="Ej: Fácil" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Porciones</label>
                            <input pInputText [ngModel]="servings()" (ngModelChange)="servings.set($event)" class="w-full" placeholder="Ej: 10" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Orden</label>
                            <input pInputText type="number" [ngModel]="sortOrder()" (ngModelChange)="sortOrder.set(+$event || 0)" class="w-full" />
                        </div>
                    </div>

                    <div class="card flex flex-col gap-4">
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Shop This Recipe — productos</label>
                            <p-multiselect
                                [options]="productOptions()"
                                [ngModel]="selectedProductIds()"
                                (ngModelChange)="selectedProductIds.set($event ?? [])"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar productos"
                                filter
                                [showClear]="true"
                                styleClass="w-full"
                            />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Descubre y Explora — recetas</label>
                            <p-multiselect
                                [options]="recipeOptions()"
                                [ngModel]="selectedRelatedIds()"
                                (ngModelChange)="selectedRelatedIds.set($event ?? [])"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar recetas"
                                filter
                                [showClear]="true"
                                styleClass="w-full"
                            />
                        </div>
                    </div>

                    <p-button label="Guardar receta" icon="pi pi-check" [loading]="saving()" (onClick)="save()" styleClass="w-full" />
                </div>
            </div>
        }

        <p-toast />
    `
})
export class RecipeForm implements OnInit {
    private recipeService = inject(RecipeService);
    private productService = inject(ProductService);
    private mediaService = inject(MediaService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    loading = signal(false);
    saving = signal(false);
    isEdit = false;
    private id: string | null = null;

    title = signal('');
    slug = signal('');
    thumbnail = signal('');
    description = signal('');
    time = signal('');
    difficulty = signal('');
    servings = signal('');
    method = signal('');
    status = signal<RecipeStatus>('draft');
    sortOrder = signal(0);
    seo = signal<SeoData | null>(null);
    images = signal<RecipeImage[]>([]);
    ingredients = signal<string[]>([]);
    selectedProductIds = signal<string[]>([]);
    selectedRelatedIds = signal<string[]>([]);
    productOptions = signal<{ label: string; value: string }[]>([]);
    recipeOptions = signal<{ label: string; value: string }[]>([]);

    readonly statusOptions = RECIPE_STATUS_OPTIONS;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        this.isEdit = !!id;
        this.id = id;

        this.loadOptions();

        if (id) {
            this.load(id);
        }
    }

    goBack(): void {
        this.router.navigate(['/recipes']);
    }

    addIngredient(): void {
        this.ingredients.update((items) => [...items, '']);
    }

    setIngredient(index: number, value: string): void {
        this.ingredients.update((items) => items.map((item, i) => (i === index ? value : item)));
    }

    removeIngredient(index: number): void {
        this.ingredients.update((items) => items.filter((_, i) => i !== index));
    }

    removeImage(index: number): void {
        this.images.update((items) => items.filter((_, i) => i !== index));
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        this.mediaService.upload([file]).subscribe({
            next: (response) => {
                const url = response.data.items[0]?.url;

                if (url) {
                    this.images.update((items) => [...items, { url, alt: this.title() }]);
                }

                input.value = '';
            },
            error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 })
        });
    }

    onThumbnailSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        this.mediaService.upload([file]).subscribe({
            next: (response) => {
                const url = response.data.items[0]?.url;

                if (url) {
                    this.thumbnail.set(url);
                }

                input.value = '';
            },
            error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 })
        });
    }

    save(): void {
        if (!this.title().trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El título es obligatorio.', life: 4000 });

            return;
        }

        const payload: RecipePayload = {
            title: this.title().trim(),
            slug: this.slug().trim() || undefined,
            thumbnail: this.thumbnail() || undefined,
            description: this.description().trim() || undefined,
            images: this.images(),
            time: this.time().trim() || undefined,
            difficulty: this.difficulty().trim() || undefined,
            servings: this.servings().trim() || undefined,
            ingredients: this.ingredients()
                .map((item) => item.trim())
                .filter((item) => item !== ''),
            method: this.method().trim() || undefined,
            status: this.status(),
            sort_order: this.sortOrder(),
            product_ids: this.selectedProductIds(),
            related_recipe_ids: this.selectedRelatedIds(),
            seo: this.seo()
        };

        this.saving.set(true);

        const request = this.id ? this.recipeService.update(this.id, payload) : this.recipeService.create(payload);

        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardada', detail: 'Receta guardada correctamente.', life: 3000 });
                this.router.navigate(['/recipes']);
            },
            error: (error) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private load(id: string): void {
        this.loading.set(true);

        this.recipeService.get(id).subscribe({
            next: (response) => {
                const recipe = response.data;

                this.title.set(recipe.title);
                this.slug.set(recipe.slug);
                this.thumbnail.set(recipe.thumbnail ?? '');
                this.description.set(recipe.description ?? '');
                this.time.set(recipe.time ?? '');
                this.difficulty.set(recipe.difficulty ?? '');
                this.servings.set(recipe.servings ?? '');
                this.method.set(recipe.method ?? '');
                this.status.set(recipe.status);
                this.sortOrder.set(recipe.sort_order);
                this.images.set(recipe.images ?? []);
                this.ingredients.set(recipe.ingredients ?? []);
                this.selectedProductIds.set((recipe.products ?? []).map((p) => p.id));
                this.selectedRelatedIds.set((recipe.related_recipes ?? []).map((r) => r.id));
                this.seo.set(normalizeSeoData(recipe.seo));
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private loadOptions(): void {
        this.productService.list({ per_page: 100 }).subscribe({
            next: (response) => {
                this.productOptions.set(
                    response.data.items.map((product) => ({
                        label: product.code ? `${product.code} · ${product.name}` : product.name,
                        value: product.id
                    }))
                );
            }
        });

        this.recipeService.list({ per_page: 100 }).subscribe({
            next: (response) => {
                this.recipeOptions.set(response.data.items.filter((recipe) => recipe.id !== this.id).map((recipe) => ({ label: recipe.title, value: recipe.id })));
            }
        });
    }
}
