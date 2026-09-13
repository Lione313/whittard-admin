import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select'; // Updated from primeng/dropdown
import { PageSection } from '../../../models/content.model';

interface SocialItem {
    id: number;
    key: string;
    url: string;
    sort_order: number;
}

export interface SocialLinksContent extends Record<string, unknown> {
    is_visible: boolean;
    socials: SocialItem[];
}

@Component({
    selector: 'app-social-links-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToggleSwitchModule, SelectModule],
    template: `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-0 dark:bg-surface-900 p-5 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ section.name }}</h2>
                    <p class="text-sm text-surface-500">Gestiona los enlaces a redes sociales y su orden de aparición.</p>
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
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold text-surface-800 dark:text-surface-100">Redes configuradas</h3>
                    @if (availableSocials.length > 0) {
                        <p-button label="Agregar Red Social" icon="pi pi-plus" size="small" (onClick)="addSocial()" />
                    }
                </div>

                <div class="space-y-3">
                    @for (social of content.socials; track social.id; let i = $index) {
                        <div class="flex flex-col sm:flex-row items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-surface-400 w-6">#{{ i + 1 }}</span>

                            <p-select [options]="getAvailableOptionsForIndex(social.key)" [(ngModel)]="social.key" optionLabel="label" optionValue="value" placeholder="Selecciona red" class="w-full sm:w-1/3" />
                            <input pInputText [(ngModel)]="social.url" placeholder="https://..." class="w-full sm:w-1/2" />

                            <div class="flex items-center gap-1">
                                <p-button icon="pi pi-arrow-up" [disabled]="i === 0" size="small" text (onClick)="moveSocial(i, -1)" />
                                <p-button icon="pi pi-arrow-down" [disabled]="i === content.socials.length - 1" size="small" text (onClick)="moveSocial(i, 1)" />
                                <p-button icon="pi pi-trash" severity="danger" size="small" text (onClick)="removeSocial(i)" />
                            </div>
                        </div>
                    } @empty {
                        <div class="text-center py-8 text-surface-400">No hay redes sociales agregadas.</div>
                    }
                </div>
            </div>
        </div>
    `
})
export class SocialLinksEditor implements OnInit {
    @Input({ required: true }) section!: PageSection;
    @Input() loading = false;
    @Output() save = new EventEmitter<Record<string, unknown>>();

    allSocialOptions = [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'X / Twitter', value: 'twitter' },
        { label: 'WhatsApp', value: 'whatsapp' }
    ];

    content: SocialLinksContent = { is_visible: true, socials: [] };

    ngOnInit(): void {
        const raw = this.section?.content_data?.content as SocialLinksContent | undefined;
        if (raw) {
            this.content = {
                is_visible: raw.is_visible ?? true,
                socials: raw.socials ? [...raw.socials] : []
            };
        }
    }

    get availableSocials() {
        const selectedKeys = this.content.socials.map((s) => s.key);
        return this.allSocialOptions.filter((opt) => !selectedKeys.includes(opt.value));
    }

    getAvailableOptionsForIndex(currentKey: string) {
        const selectedKeys = this.content.socials.map((s) => s.key);
        return this.allSocialOptions.filter((opt) => opt.value === currentKey || !selectedKeys.includes(opt.value));
    }

    addSocial() {
        const available = this.availableSocials;
        if (available.length === 0) return;
        this.content.socials.push({
            id: Date.now(),
            key: available[0].value,
            url: '',
            sort_order: this.content.socials.length + 1
        });
    }

    removeSocial(index: number) {
        this.content.socials.splice(index, 1);
        this.content.socials.forEach((item, idx) => (item.sort_order = idx + 1));
    }

    moveSocial(index: number, direction: number) {
        const target = index + direction;
        if (target < 0 || target >= this.content.socials.length) return;
        const temp = this.content.socials[index];
        this.content.socials[index] = this.content.socials[target];
        this.content.socials[target] = temp;
        this.content.socials.forEach((item, idx) => (item.sort_order = idx + 1));
    }

    onSave(): void {
        this.save.emit({ ...this.content });
    }
}
