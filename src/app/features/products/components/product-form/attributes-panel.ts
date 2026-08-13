import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Attribute } from '@/app/features/products/models/attribute.model';

@Component({
    selector: 'app-product-attributes-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, CheckboxModule],
    template: `
        <div class="flex flex-col gap-2">
            @if (attributes().length) {
                <div class="card !p-0 overflow-hidden">
                    <div class="flex flex-col">
                        @for (a of attributes(); track a.id; let last = $last) {
                            <div class="flex items-start gap-3 px-4 py-3" [ngClass]="last ? '' : 'border-b border-surface-100 dark:border-surface-800'">
                                <p-checkbox [binary]="true" [ngModel]="isSelected(a.id)" (ngModelChange)="toggleAttribute.emit({ id: a.id, selected: $event })" [inputId]="'attr-' + a.id" class="mt-1" />
                                <label for="attr-{{ a.id }}" class="flex-1 cursor-pointer select-none">
                                    <span class="block font-medium text-surface-900 dark:text-surface-0">{{ a.label }}</span>
                                    @if (isSelected(a.id)) {
                                        @if (a.options.length) {
                                            <span class="flex flex-wrap gap-1.5 mt-2">
                                                @for (opt of a.options; track opt) {
                                                    <span
                                                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border border-surface-200 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200"
                                                    >
                                                        @if (opt.image_url) {
                                                            <img [src]="opt.image_url" alt="" class="w-4 h-4 rounded-full object-cover" />
                                                        }
                                                        {{ opt.value }}
                                                    </span>
                                                }
                                            </span>
                                        } @else {
                                            <span class="block mt-1 text-sm text-muted-color">Sin valores en el catálogo.</span>
                                        }
                                    } @else {
                                        <span class="block mt-0.5 text-sm text-muted-color">{{ a.options.length }} {{ a.options.length === 1 ? 'valor' : 'valores' }}</span>
                                    }
                                </label>
                            </div>
                        }
                    </div>
                </div>
            } @else {
                <div class="card !p-8 flex flex-col items-center justify-center gap-2 text-center text-muted-color">
                    <i class="pi pi-tags text-3xl"></i>
                    <span>Aún no hay atributos en el catálogo.</span>
                </div>
            }
        </div>
    `
})
export class AttributesPanel {
    attributes = input.required<Attribute[]>();
    attributeIds = input.required<string[]>();

    toggleAttribute = output<{ id: string; selected: boolean }>();

    isSelected(id: string): boolean {
        return this.attributeIds().includes(id);
    }
}
