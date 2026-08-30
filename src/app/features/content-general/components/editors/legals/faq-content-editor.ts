import { Component, input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageSection, FaqContent, FaqItem } from '../../../models/content.model';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-faq-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule],
  template: `
    <div class="bg-white border rounded-xl shadow-sm overflow-hidden max-w-4xl">
      <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div class="flex items-center gap-3">
          <div class="bg-purple-50 text-purple-600 p-2 rounded-lg">
            <i class="pi pi-question-circle text-xl"></i>
          </div>
          <div>
            <h2 class="font-bold text-gray-800">Preguntas Frecuentes</h2>
            <p class="text-xs text-gray-500">Gestiona la lista de preguntas y respuestas de tus usuarios.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 font-medium">Visibilidad:</span>
          <p-toggleSwitch [(ngModel)]="contentData.is_visible"></p-toggleSwitch>
        </div>
      </div>

      <div class="p-6 flex flex-col gap-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título Principal</label>
            <input pInputText type="text" [(ngModel)]="contentData.title" class="w-full" placeholder="Ej. Preguntas Frecuentes" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subtítulo</label>
            <input pInputText type="text" [(ngModel)]="contentData.subtitle" class="w-full" placeholder="Ej. Resuelve tus dudas" />
          </div>
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-gray-800">Items de FAQ ({{ items.length }})</h3>
            <p-button label="Agregar Pregunta" icon="pi pi-plus" size="small" severity="secondary" (onClick)="addItem()"></p-button>
          </div>

          <div class="flex flex-col gap-4">
            @for (item of items; track $index; let i = $index) {
              <div class="border rounded-lg p-4 bg-gray-50 relative flex flex-col gap-3">
                <div class="flex justify-between items-center border-b pb-2">
                  <span class="text-xs font-bold text-gray-400">#{{ i + 1 }}</span>
                  <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small" (onClick)="removeItem(i)"></p-button>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Pregunta</label>
                  <input pInputText type="text" [(ngModel)]="item.question" class="w-full" placeholder="Ej. ¿Cómo realizo mi pedido?" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Respuesta</label>
                  <textarea pTextarea [(ngModel)]="item.answer" rows="3" class="w-full" placeholder="Escribe la respuesta detallada..."></textarea>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t">
          <p-button
            [label]="loading() ? 'Guardando cambios...' : 'Guardar Cambios'"
            [icon]="loading() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            [disabled]="loading()"
            severity="primary"
            (onClick)="submit()">
          </p-button>
        </div>
      </div>
    </div>
  `
})
export class FaqContentEditor implements OnChanges {
  section = input<PageSection | null>(null);
  loading = input<boolean>(false);
  @Output() save = new EventEmitter<FaqContent>();

  contentData: FaqContent = {
    is_visible: true,
    title: '',
    subtitle: '',
    items: []
  };

  get items(): FaqItem[] {
    return this.contentData.items || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && this.section()) {
      const sectionContentObj = (this.section() as any).content || (this.section() as any).content_data;
      const rawContent = sectionContentObj?.content;

      if (rawContent) {
        this.contentData = {
          is_visible: rawContent.is_visible ?? true,
          title:      rawContent.title      ?? '',
          subtitle:   rawContent.subtitle   ?? '',
          items:      Array.isArray(rawContent.items) ? [...rawContent.items] : []
        };
      }
    }
  }

  addItem(): void {
    if (!this.contentData.items) this.contentData.items = [];
    this.contentData.items.push({ order: this.contentData.items.length + 1, question: '', answer: '' });
  }

  removeItem(index: number): void {
    this.contentData.items?.splice(index, 1);
  }

  submit(): void {
    this.save.emit(this.contentData);
  }
}