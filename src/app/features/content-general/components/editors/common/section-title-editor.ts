import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';

export interface SectionTitleContent extends Record<string, unknown> {
    is_visible: boolean;
    title: string;
    subtitle: string;
}

@Component({
    selector: 'app-section-title-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, ToggleSwitchModule],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Título y subtítulo de la sección.</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 flex flex-col gap-4">
                <div>
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Título</label>
                    <input pInputText type="text" [(ngModel)]="content.title" placeholder="Ej: Recetas" class="w-full" />
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-surface-600 dark:text-surface-400">Subtítulo</label>
                    <textarea pTextarea [(ngModel)]="content.subtitle" placeholder="Texto secundario" [rows]="3" class="w-full resize-none"></textarea>
                </div>
            </div>
        </div>
    `
})
export class SectionTitleEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<FormData | Record<string, unknown>>();

    content: SectionTitleContent = { is_visible: true, title: '', subtitle: '' };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as SectionTitleContent | undefined;

        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                title: raw.title ?? '',
                subtitle: raw.subtitle ?? ''
            };
        }
    }

    onSave(): void {
        this.save.emit({
            is_visible: this.content.is_visible,
            title: this.content.title,
            subtitle: this.content.subtitle
        });
    }
}
