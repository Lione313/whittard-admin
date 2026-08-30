import { Component, input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageSection, ComplaintsContent } from '../../../models/content.model';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-complaints-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule],
  template: `
    <div class="bg-white border rounded-xl shadow-sm overflow-hidden max-w-4xl">
      <div class="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div class="flex items-center gap-3">
          <div class="bg-amber-50 text-amber-600 p-2 rounded-lg">
            <i class="pi pi-book text-xl"></i>
          </div>
          <div>
            <h2 class="font-bold text-gray-800">Libro de Reclamaciones</h2>
            <p class="text-xs text-gray-500">Configura la información legal obligatoria del formulario de quejas.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 font-medium">Visibilidad:</span>
          <p-toggleSwitch [(ngModel)]="contentData.is_visible"></p-toggleSwitch>
        </div>
      </div>

      <div class="p-6 flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Título de la Sección</label>
          <input pInputText type="text" [(ngModel)]="contentData.title" class="w-full" placeholder="Ej. Libro de Reclamaciones" />
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Párrafo Informativo</label>
          <textarea pTextarea [(ngModel)]="contentData.paragraph" rows="4" class="w-full" placeholder="Texto descriptivo antes del formulario..."></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Observaciones Legales / Notas al Pie</label>
          <textarea pTextarea [(ngModel)]="contentData.observations" rows="4" class="w-full" placeholder="Observaciones en base a la normativa vigente..."></textarea>
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
export class ComplaintsContentEditor implements OnChanges {
  section = input<PageSection | null>(null);
  loading = input<boolean>(false);
  @Output() save = new EventEmitter<ComplaintsContent>();

  contentData: ComplaintsContent = {
    is_visible: true,
    title: '',
    paragraph: '',
    observations: ''
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && this.section()) {
      const sectionContentObj = (this.section() as any).content || (this.section() as any).content_data;
      const rawContent = sectionContentObj?.content;

      if (rawContent) {
        this.contentData = {
          is_visible:   rawContent.is_visible   ?? true,
          title:        rawContent.title        ?? '',
          paragraph:    rawContent.paragraph    ?? '',
          observations: rawContent.observations ?? ''
        };
      }
    }
  }

  submit(): void {
    this.save.emit(this.contentData);
  }
}