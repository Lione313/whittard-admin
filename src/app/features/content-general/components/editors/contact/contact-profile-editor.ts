import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PageSection, ContactProfileContent } from '../../../models/content.model';
import { RichTextEditorComponent } from '@/app/shared/components/rich-text-editor/rich-text-editor';

@Component({
    selector: 'app-contact-profile-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToggleSwitchModule, RichTextEditorComponent],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Gestión de texto enriquecido para el perfil de contacto.</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                <h3 class="font-semibold text-lg">Contenido Detallado</h3>
                <app-rich-text-editor [(ngModel)]="content.html_content" minHeight="250px" placeholder="Escribe la información de contacto..." />
            </div>
        </div>
    `
})
export class ContactProfileEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<ContactProfileContent>();

    content: ContactProfileContent = { is_visible: true, html_content: '' };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content;
        if (raw) {
            this.content = JSON.parse(JSON.stringify(raw));
            if (this.content.is_visible === undefined) this.content.is_visible = true;
        }
    }

    onSave(): void {
        this.save.emit(this.content);
    }
}