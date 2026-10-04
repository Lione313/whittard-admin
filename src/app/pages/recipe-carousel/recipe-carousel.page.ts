import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';

import { RecipeService } from '@/app/features/recipes/services/recipe.service';
import { RecipeCarouselService } from '@/app/features/recipe-carousel/services/recipe-carousel.service';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-recipe-carousel',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MultiSelectModule, ToggleSwitchModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
                <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">Carrusel de Recetas</h1>
                <small class="text-muted-color block mt-0.5">Recetas que se muestran en los carruseles de la web (Home y detalle de receta).</small>
            </div>
            <div class="flex items-center gap-3">
                <p-toggleswitch [ngModel]="isActive()" (ngModelChange)="isActive.set($event)" inputId="carousel-active" />
                <label for="carousel-active" class="text-sm font-medium cursor-pointer">Activo</label>
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
            </div>
        </div>

        @if (loading()) {
            <div class="card p-16 flex items-center justify-center text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else {
            <div class="card flex flex-col gap-4">
                <div>
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título del carrusel</label>
                    <input pInputText [ngModel]="title()" (ngModelChange)="title.set($event)" class="w-full" placeholder="Ej: ¿Has visto...?" />
                </div>
                <div>
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Agregar recetas</label>
                    <p-multiselect
                        [options]="recipeOptions()"
                        [ngModel]="selectedIds()"
                        (ngModelChange)="onSelect($event)"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Buscar y seleccionar recetas"
                        filter
                        [showClear]="true"
                        styleClass="w-full"
                    />
                </div>
            </div>

            <div class="card">
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Orden del carrusel</span>
                <small class="text-muted-color block mb-3 mt-1">El orden de esta lista es el orden que verá el cliente.</small>

                @if (selectedIds().length === 0) {
                    <div class="rounded-lg border border-dashed border-surface-300 p-8 text-center text-muted-color dark:border-surface-700">No hay recetas seleccionadas.</div>
                } @else {
                    @for (id of selectedIds(); track id; let i = $index) {
                        <div class="flex items-center gap-3 border-b border-surface-100 py-2 last:border-b-0 dark:border-surface-800">
                            <span class="text-muted-color w-6 text-sm font-semibold">{{ i + 1 }}</span>
                            <span class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ recipeLabel(id) }}</span>
                            <div class="flex-1"></div>
                            <p-button icon="pi pi-arrow-up" [rounded]="true" [text]="true" severity="secondary" [disabled]="i === 0" title="Subir" (onClick)="move(i, -1)" />
                            <p-button icon="pi pi-arrow-down" [rounded]="true" [text]="true" severity="secondary" [disabled]="i === selectedIds().length - 1" title="Bajar" (onClick)="move(i, 1)" />
                            <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" title="Quitar" (onClick)="remove(i)" />
                        </div>
                    }
                }
            </div>
        }

        <p-toast />
    `
})
export class RecipeCarouselPage implements OnInit {
    private carouselService = inject(RecipeCarouselService);
    private recipeService = inject(RecipeService);
    private messageService = inject(MessageService);

    loading = signal(false);
    saving = signal(false);
    title = signal('');
    isActive = signal(true);
    selectedIds = signal<string[]>([]);
    recipeOptions = signal<{ label: string; value: string }[]>([]);

    ngOnInit(): void {
        this.load();
    }

    onSelect(ids: string[] | null): void {
        this.selectedIds.set(ids ?? []);
    }

    recipeLabel(id: string): string {
        return this.recipeOptions().find((option) => option.value === id)?.label ?? id;
    }

    move(index: number, dir: -1 | 1): void {
        const ids = [...this.selectedIds()];
        const target = index + dir;

        if (target < 0 || target >= ids.length) return;

        [ids[index], ids[target]] = [ids[target], ids[index]];
        this.selectedIds.set(ids);
    }

    remove(index: number): void {
        this.selectedIds.update((ids) => ids.filter((_, i) => i !== index));
    }

    save(): void {
        this.saving.set(true);

        this.carouselService
            .update({
                title: this.title().trim() || undefined,
                is_active: this.isActive(),
                recipe_ids: this.selectedIds()
            })
            .subscribe({
                next: (response) => {
                    this.saving.set(false);
                    this.apply(
                        response.data.title,
                        response.data.is_active,
                        response.data.recipes.map((recipe) => recipe.id)
                    );
                    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Carrusel actualizado.', life: 3000 });
                },
                error: (error) => {
                    this.saving.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
                }
            });
    }

    private load(): void {
        this.loading.set(true);

        this.recipeService.list({ per_page: 100 }).subscribe({
            next: (response) => {
                this.recipeOptions.set(response.data.items.map((recipe) => ({ label: recipe.title, value: recipe.id })));
            }
        });

        this.carouselService.get().subscribe({
            next: (response) => {
                this.apply(
                    response.data.title,
                    response.data.is_active,
                    response.data.recipes.map((recipe) => recipe.id)
                );
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private apply(title: string | null, isActive: boolean, recipeIds: string[]): void {
        this.title.set(title ?? '');
        this.isActive.set(isActive);
        this.selectedIds.set(recipeIds);
    }
}
