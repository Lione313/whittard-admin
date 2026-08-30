import { Component, input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageSection, LegalContent } from '../../../models/content.model';
import { EditorContainerComponent } from '@/app/shared/components/conten-general/editor-container.component';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-legal-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, EditorModule, ToggleSwitchModule, EditorContainerComponent],
  template: `
    <app-editor-container>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/70">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shrink-0">
            <i class="pi pi-file text-xl"></i>
          </div>
          <div>
            <h2 class="font-bold text-slate-800 text-base tracking-tight">Contenido Legal</h2>
            <p class="text-xs text-slate-500 mt-0.5">Edita y gestiona el cuerpo del documento legal.</p>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
          <span class="text-xs font-semibold text-slate-600">Estado:</span>
          <span
            class="text-[11px] font-bold px-2 py-0.5 rounded-full"
            [ngClass]="contentData.is_visible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'">
            {{ contentData.is_visible ? 'Público' : 'Oculto' }}
          </span>
          <p-toggleSwitch [(ngModel)]="contentData.is_visible"></p-toggleSwitch>
        </div>
      </div>

      <div class="p-6 sm:p-8 flex flex-col gap-6">
        <div class="grid grid-cols-1 gap-5">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Título Principal <span class="text-rose-500">*</span>
            </label>
            <input pInputText type="text" [(ngModel)]="contentData.title" class="w-full p-inputtext-sm" placeholder="Ej. Política de Privacidad" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subtítulo (Opcional)</label>
            <input pInputText type="text" [(ngModel)]="contentData.subtitle" class="w-full p-inputtext-sm" placeholder="Ej. Última actualización: Agosto 2026" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cuerpo del Contenido</label>
          <div class="rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 transition-colors">
            <p-editor [(ngModel)]="contentData.body" [style]="{ height: '340px' }" placeholder="Escribe aquí las cláusulas y contenido legal...">
              <ng-template pTemplate="header">
                <span class="ql-formats">
                  <select class="ql-header" title="Encabezado">
                    <option value="1">Título 1</option>
                    <option value="2">Título 2</option>
                    <option value="3">Subtítulo</option>
                    <option selected>Texto Normal</option>
                  </select>
                </span>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                  <button class="ql-strike"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-list" value="bullet"></button>
                  <button class="ql-list" value="ordered"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-link"></button>
                  <button class="ql-clean"></button>
                </span>
              </ng-template>
            </p-editor>
          </div>
        </div>

        <div class="flex items-center justify-end pt-5 border-t border-slate-100">
          <p-button
            [label]="loading() ? 'Guardando cambios...' : 'Guardar Cambios'"
            [icon]="loading() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            [disabled]="loading()"
            severity="primary"
            (onClick)="submit()">
          </p-button>
        </div>
      </div>
    </app-editor-container>
  `
})
export class LegalContentEditor implements OnChanges {
  section = input<PageSection | null>(null);
  loading = input<boolean>(false);
  @Output() save = new EventEmitter<LegalContent>();

  contentData: LegalContent = {
    is_visible: true,
    title: '',
    subtitle: '',
    body: ''
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section'] && this.section()) {
      const sectionContentObj = (this.section() as any).content || (this.section() as any).content_data;
      const rawContent = sectionContentObj?.content;

      if (rawContent) {
        this.contentData = {
          is_visible: rawContent.is_visible ?? true,
          title:      rawContent.title      ?? '',
          subtitle:   rawContent.subtitle   ?? '',
          body:       rawContent.body       ?? ''
        };
      }
    }
  }

  submit(): void {
    this.save.emit(this.contentData);
  }
}