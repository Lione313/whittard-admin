import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';

export interface CardItem {
    image: string | null;
    title: string;
    description: string;
}

export interface CardsContent extends Record<string, unknown> {
    is_visible: boolean;
    title: string;
    cards: CardItem[];
}

@Component({
    selector: 'app-cards-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Tarjetas de contenido (equipo, valores, etc.).</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título de la sección</label>
                <input pInputText type="text" [(ngModel)]="content.title" placeholder="Ej: Nuestro Equipo" class="w-full" />
            </div>

            <div class="flex flex-col gap-3">
                @for (card of content.cards; track $index; let i = $index) {
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">Tarjeta {{ i + 1 }}</span>
                            <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" title="Eliminar" (onClick)="removeCard(i)" />
                        </div>
                        <div class="grid gap-3 md:grid-cols-2">
                            <div class="md:col-span-2">
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Imagen (URL)</label>
                                <input pInputText type="text" [(ngModel)]="card.image" placeholder="https://..." class="w-full" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título</label>
                                <input pInputText type="text" [(ngModel)]="card.title" placeholder="Nombre" class="w-full" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Descripción</label>
                                <input pInputText type="text" [(ngModel)]="card.description" placeholder="Cargo o descripción" class="w-full" />
                            </div>
                        </div>
                    </div>
                }
            </div>

            <p-button label="Agregar tarjeta" icon="pi pi-plus" [outlined]="true" (onClick)="addCard()" />
        </div>
    `
})
export class CardsEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    content: CardsContent = { is_visible: true, title: '', cards: [] };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as CardsContent | undefined;

        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                title: raw.title ?? '',
                cards: Array.isArray(raw.cards)
                    ? raw.cards.map((card) => ({
                          image: card?.image ?? null,
                          title: card?.title ?? '',
                          description: card?.description ?? ''
                      }))
                    : []
            };
        }
    }

    addCard(): void {
        this.content.cards = [...this.content.cards, { image: null, title: '', description: '' }];
    }

    removeCard(index: number): void {
        this.content.cards = this.content.cards.filter((_, i) => i !== index);
    }

    onSave(): void {
        this.save.emit({
            is_visible: this.content.is_visible,
            title: this.content.title,
            cards: this.content.cards
        });
    }
}
