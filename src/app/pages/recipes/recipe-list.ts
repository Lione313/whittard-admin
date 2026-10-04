import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { RecipeService } from '@/app/features/recipes/services/recipe.service';
import { RecipeListItem } from '@/app/features/recipes/models/recipe.model';
import { ConfirmDialogComponent } from '@/app/shared/components/confirm-dialog/confirm-dialog';
import { formatApiError } from '@/app/shared/utils/api-error';

@Component({
    selector: 'app-recipe-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ToastModule, TagModule, InputTextModule, IconFieldModule, InputIconModule, ButtonModule, RippleModule, ConfirmDialogComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card p-0!">
            <p-table
                [value]="recipes()"
                [lazy]="true"
                [loading]="loading()"
                [rows]="rowsPerPage()"
                [totalRecords]="totalRecords()"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 15, 30, 50]"
                [tableStyle]="{ 'min-width': '60rem' }"
                [rowHover]="true"
                dataKey="id"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} recetas"
                [showCurrentPageReport]="true"
                (onLazyLoad)="load($event)"
            >
                <ng-template #caption>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h5 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-0">Recetas</h5>
                            <small class="text-muted-color block mt-0.5">Contenido de las recetas del detalle de receta.</small>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" [ngModel]="search()" (ngModelChange)="onSearchChange($event)" placeholder="Buscar receta..." class="w-full md:w-64" />
                            </p-iconfield>
                            <p-button label="Nueva receta" icon="pi pi-plus" (onClick)="create()" />
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="width: 5rem"></th>
                        <th style="min-width: 16rem">Título</th>
                        <th style="min-width: 12rem">Slug</th>
                        <th style="min-width: 8rem">Estado</th>
                        <th style="min-width: 9rem">Actualizada</th>
                        <th style="width: 8rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-recipe>
                    <tr>
                        <td>
                            <div class="h-12 w-12 overflow-hidden rounded-md bg-surface-100 dark:bg-surface-800">
                                @if (recipe.thumbnail || recipe.image) {
                                    <img [src]="recipe.thumbnail || recipe.image" [alt]="recipe.title" class="h-full w-full object-cover" />
                                }
                            </div>
                        </td>
                        <td class="font-medium text-surface-900 dark:text-surface-0">{{ recipe.title }}</td>
                        <td class="text-muted-color font-mono text-xs">{{ recipe.slug }}</td>
                        <td>
                            <p-tag [value]="recipe.status === 'published' ? 'Publicada' : 'Borrador'" [severity]="recipe.status === 'published' ? 'success' : 'warn'" />
                        </td>
                        <td class="text-muted-color">{{ recipe.updated_at | date: 'dd/MM/yyyy' }}</td>
                        <td>
                            <div class="flex items-center justify-end gap-1">
                                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" title="Editar" (onClick)="edit(recipe)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Eliminar" (onClick)="confirmDelete(recipe)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center p-10 text-muted-color">No hay recetas registradas.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
        <app-confirm-dialog />
        <p-toast />
    `
})
export class RecipeList implements OnInit, OnDestroy {
    private recipeService = inject(RecipeService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    recipes = signal<RecipeListItem[]>([]);
    loading = signal(false);
    totalRecords = signal(0);
    rowsPerPage = signal(15);
    search = signal('');

    private search$ = new Subject<string>();
    private currentPage = 1;

    ngOnInit(): void {
        this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((value) => {
            this.search.set(value);
            this.currentPage = 1;
            this.fetch();
        });

        this.fetch();
    }

    ngOnDestroy(): void {
        this.search$.complete();
    }

    load(event: TableLazyLoadEvent): void {
        this.currentPage = (event.first ?? 0) / (event.rows ?? this.rowsPerPage()) + 1;
        this.rowsPerPage.set(event.rows ?? 15);
        this.fetch();
    }

    onSearchChange(value: string): void {
        this.search$.next(value);
    }

    create(): void {
        this.router.navigate(['/recipes/new']);
    }

    edit(recipe: RecipeListItem): void {
        this.router.navigate(['/recipes', recipe.id, 'edit']);
    }

    confirmDelete(recipe: RecipeListItem): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la receta "${recipe.title}"?`,
            header: 'Eliminar receta',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.recipeService.remove(recipe.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Receta eliminada.', life: 3000 });
                        this.fetch();
                    },
                    error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 })
                });
            }
        });
    }

    private fetch(): void {
        this.loading.set(true);

        this.recipeService.list({ page: this.currentPage, per_page: this.rowsPerPage(), search: this.search() || undefined }).subscribe({
            next: (response) => {
                this.recipes.set(response.data.items);
                this.totalRecords.set(response.data.pagination.total);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }
}
