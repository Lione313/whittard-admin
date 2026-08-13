import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ProductFormValue } from '@/app/features/products/models/product-form.model';

@Component({
    selector: 'app-product-basic-info',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule],
    template: `
        <div class="card !m-0">
            <div class="border-b border-surface-100 dark:border-surface-800 pb-3 mb-4">
                <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Información Básica</span>
            </div>
            <div class="grid  gap-4">
                <div>
                    <label class="block font-medium mb-2">Nombre *</label>
                    <input pInputText [ngModel]="form().name" (ngModelChange)="onFieldChange('name', $event)" class="w-full" placeholder="Ej: Té Verde Matcha Ceremonial" />
                    @if (validated() && !form().name.trim()) {
                        <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>El nombre es obligatorio.</small>
                    }
                </div>
                <div>
                    <label class="block font-medium mb-2">Slug</label>
                    <input pInputText [ngModel]="form().slug" (ngModelChange)="onFieldChange('slug', $event)" class="w-full" placeholder="Se genera automáticamente si se omite" />
                </div>
                <div>
                    <label class="block font-medium mb-2">Código</label>
                    <input pInputText [ngModel]="form().code" (ngModelChange)="onFieldChange('code', $event)" class="w-full" placeholder="Se genera automáticamente si se omite" />
                    <small class="text-muted-color mt-1 block">Código único del producto (ej. WTC-2026-MAT-01). Si lo dejas vacío, se genera desde el nombre.</small>
                </div>
                <div>
                    <label class="block font-medium mb-2">Marca *</label>
                    <input pInputText [ngModel]="form().brand" (ngModelChange)="onFieldChange('brand', $event)" class="w-full" placeholder="Ej: Whittard of Chelsea" />
                </div>
                <div>
                    <label class="block font-medium mb-2">País de Origen</label>
                    <input pInputText [ngModel]="form().country_of_origin" (ngModelChange)="onFieldChange('country_of_origin', $event)" class="w-full" placeholder="Ej: Japón" />
                </div>
            </div>
        </div>
    `
})
export class BasicInfoPanel {
    form = input.required<ProductFormValue>();
    validated = input.required<boolean>();

    fieldChange = output<Partial<ProductFormValue>>();

    onFieldChange(key: keyof ProductFormValue, value: string) {
        this.fieldChange.emit({ [key]: value } as Partial<ProductFormValue>);
    }
}
