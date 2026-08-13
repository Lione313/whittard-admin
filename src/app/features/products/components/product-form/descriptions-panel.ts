import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { RichTextEditorComponent } from '@/app/shared/components/rich-text-editor/rich-text-editor';
import { ProductFormValue } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-product-descriptions',
    standalone: true,
    imports: [CommonModule, FormsModule, TextareaModule, RichTextEditorComponent],
    template: `
        <div class="card !m-0">
            <div class="border-b border-surface-100 dark:border-surface-800 pb-3 mb-4">
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Descripciones</span>
            </div>
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block font-medium mb-2">Descripción Corta</label>
                    <div class="relative">
                        <textarea
                            pTextarea
                            [ngModel]="form().short_description"
                            (ngModelChange)="onFieldChange('short_description', $event)"
                            rows="3"
                            class="w-full"
                            [maxlength]="160"
                            placeholder="Resumen breve que se muestra en listados y búsquedas."
                        ></textarea>
                        <span class="absolute bottom-2 right-3 text-xs text-muted-color pointer-events-none" [class.text-red-500]="form().short_description.length >= 160" [class.font-medium]="form().short_description.length >= 160"
                            >{{ form().short_description.length }}/160</span
                        >
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-2">Descripción Larga</label>
                    <app-rich-text-editor [ngModel]="form().long_description" (ngModelChange)="onFieldChange('long_description', $event)" [minHeight]="'180px'" [placeholder]="'Descripción larga...'" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Ingredientes</label>
                    <app-rich-text-editor [ngModel]="form().ingredients_description" (ngModelChange)="onFieldChange('ingredients_description', $event)" [minHeight]="'180px'" [placeholder]="'Ingredientes...'" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Especificaciones</label>
                    <app-rich-text-editor [ngModel]="form().specifications_description" (ngModelChange)="onFieldChange('specifications_description', $event)" [minHeight]="'180px'" [placeholder]="'Especificaciones...'" />
                </div>
            </div>
        </div>
    `
})
export class DescriptionsPanel {
    form = input.required<ProductFormValue>();

    fieldChange = output<Partial<ProductFormValue>>();

    onFieldChange(key: keyof ProductFormValue, value: string) {
        this.fieldChange.emit({ [key]: value } as Partial<ProductFormValue>);
    }
}
