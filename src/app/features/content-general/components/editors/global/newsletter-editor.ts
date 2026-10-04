import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection } from '../../../models/content.model';

export interface NewsletterContent extends Record<string, unknown> {
    is_visible: boolean;
    title: string;
    placeholder: string;
    button_text: string;
}

@Component({
    selector: 'app-newsletter-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Personaliza los textos del bloque de suscripción al boletín.</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-4 max-w-2xl">
                <div>
                    <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Título / Promesa</label>
                    <input pInputText type="text" [(ngModel)]="content.title" class="w-full" placeholder="Ej: ¡Suscríbete y obtén 15% OFF!" />
                </div>

                <div>
                    <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Placeholder del Input</label>
                    <input pInputText type="text" [(ngModel)]="content.placeholder" class="w-full" placeholder="Ej: Ingresa tu correo" />
                </div>

                <div>
                    <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Texto del Botón</label>
                    <input pInputText type="text" [(ngModel)]="content.button_text" class="w-full" placeholder="Ej: Enviar" />
                </div>
            </div>
        </div>
    `
})
export class NewsletterEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<Record<string, unknown>>();

    content: NewsletterContent = { is_visible: true, title: '', placeholder: '', button_text: '' };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as NewsletterContent | undefined;
        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                title: raw.title ?? '',
                placeholder: raw.placeholder ?? '',
                button_text: raw.button_text ?? ''
            };
        }
    }

    onSave(): void {
        this.save.emit({ ...this.content });
    }
}
