import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { EditorModule } from 'primeng/editor';
import { PageSection, ContactMainContent } from '../../../models/content.model';
import { ImageUploadComponent } from '@/app/shared/components/FileUpload/app-image-upload';

@Component({
    selector: 'app-contact-main-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, EditorModule, ImageUploadComponent],
    template: `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Configuración estricta de las 2 tarjetas principales (WhatsApp y Correo).</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-600">Visible:</span>
                        <p-toggleSwitch [(ngModel)]="content.is_visible" />
                    </div>
                    <p-button label="Guardar Cambios" icon="pi pi-check" [loading]="loading" (onClick)="onSave()" />
                </div>
            </div>

            <!-- Título de la página -->
            <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                <h3 class="font-semibold text-lg">Título Principal</h3>
                <div>
                    <label class="block text-sm font-medium mb-1">Título de la Página</label>
                    <input pInputText type="text" [(ngModel)]="content.page_title" class="w-full" />
                </div>
            </div>

            <!-- Las 2 Únicas Tarjetas (WhatsApp y Email) -->
            <div class="space-y-6">
                @for (card of content.cards; track $index) {
                    <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-5 space-y-4">
                        <div class="flex items-center justify-between border-b pb-3 border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-base text-primary flex items-center gap-2">
                                @if (card.type === 'whatsapp') {
                                    <i class="pi pi-whatsapp text-green-500 text-xl"></i>
                                    <span>Tarjeta 1: WhatsApp</span>
                                } @else {
                                    <i class="pi pi-envelope text-blue-500 text-xl"></i>
                                    <span>Tarjeta 2: Correo Electrónico</span>
                                }
                            </span>
                            <span class="text-xs px-2.5 py-1 bg-surface-100 dark:bg-surface-800 rounded-md font-mono uppercase text-surface-500">Fija (Máx 2)</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Título de la Card</label>
                                <input pInputText type="text" [(ngModel)]="card.title" class="w-full" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Texto del Botón</label>
                                <input pInputText type="text" [(ngModel)]="card.button_text" class="w-full" />
                            </div>
                        </div>

                        <!-- CAMPOS ESPECÍFICOS SEGÚN EL TIPO DE TARJETA -->
                        @if (card.type === 'whatsapp') {
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-50 dark:bg-surface-800/50 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Número de Teléfono (WhatsApp)</label>
                                    <input pInputText type="text" [(ngModel)]="card.phone" placeholder="+51999999999" class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Mensaje Pre-escrito</label>
                                    <input pInputText type="text" [(ngModel)]="card.whatsapp_msg" class="w-full" />
                                </div>
                            </div>
                        }

                        @if (card.type === 'email') {
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-50 dark:bg-surface-800/50 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Correo Electrónico Destino</label>
                                    <input pInputText type="text" [(ngModel)]="card.email" placeholder="branding@onzafoods.com" class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Asunto (Subject)</label>
                                    <input pInputText type="text" [(ngModel)]="card.subject" class="w-full" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Mensaje del Mail (Body)</label>
                                    <input pInputText type="text" [(ngModel)]="card.email_msg" class="w-full" />
                                </div>
                            </div>
                        }

                        <div>
                            <label class="block text-sm font-medium mb-1">Descripción / Texto</label>
                            <p-editor [(ngModel)]="card.description" [style]="{ height: '120px' }" />
                        </div>

                        <div>
                            <app-image-upload label="Icono de la Tarjeta (Imagen o SVG)" [initialUrl]="card.icon_image" accept="image/png, image/jpeg, image/webp, image/svg+xml" (onFileSelected)="onCardImageSelected($event, card)" />
                        </div>
                    </div>
                }
            </div>
        </div>
    `
})
export class ContactMainEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<ContactMainContent>();

    content: ContactMainContent = { is_visible: true, page_title: '', cards: [] };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content;
        if (raw) {
            this.content = JSON.parse(JSON.stringify(raw));
            if (this.content.is_visible === undefined) this.content.is_visible = true;
        }
    }

    onCardImageSelected(file: File | null, card: any): void {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                card.icon_image = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            card.icon_image = '';
        }
    }

    onSave(): void {
        this.save.emit(this.content);
    }
}
