import { Component, computed, effect, input, output, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';

import { DEFAULT_ROBOTS, emptySeoData, isSeoEmpty, NOINDEX_ROBOTS, normalizeSeoData, ROBOTS_OPTIONS, SeoData } from '../../models/seo.model';

@Component({
    selector: 'app-seo-panel',
    standalone: true,
    imports: [FormsModule, InputTextModule, TextareaModule, SelectModule, ToggleSwitchModule, ButtonModule],
    template: `
        <div class="card !m-0">
            <div class="border-b border-surface-100 dark:border-surface-800 pb-3 mb-4 flex items-start justify-between gap-3">
                <div>
                    <span class="text-base font-semibold text-surface-900 dark:text-surface-0">SEO</span>
                    <small class="block text-muted-color mt-0.5">Optimización para buscadores y redes sociales.</small>
                </div>
                @if (canRemove() && canShowRemove()) {
                    <p-button label="Quitar SEO" icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeSeo()" />
                }
            </div>

            <div class="flex flex-col gap-4">
                <div>
                    <div class="flex items-center gap-3">
                        <p-toggleswitch [ngModel]="draft().noindex" (ngModelChange)="setNoindex($event)" inputId="seo-noindex" />
                        <label for="seo-noindex" class="font-medium cursor-pointer">No indexar esta página</label>
                    </div>
                    <small class="text-muted-color block mt-1">Al activarlo, los buscadores usarán <span class="font-mono text-xs">noindex, nofollow</span>.</small>
                </div>

                <div>
                    <label class="block font-medium mb-2">Título SEO</label>
                    <input pInputText [ngModel]="draft().meta_title" (ngModelChange)="patch({ meta_title: $event })" class="w-full" maxlength="255" placeholder="Ej: Té Verde Matcha | Whittard" />
                    <small class="text-muted-color mt-1 block">Máx. 255 caracteres. Si se omite, se usa el nombre del producto.</small>
                </div>

                <div>
                    <label class="block font-medium mb-2">Meta descripción</label>
                    <textarea pTextarea [ngModel]="draft().meta_description" (ngModelChange)="patch({ meta_description: $event })" rows="3" class="w-full" placeholder="Resumen que aparece en los resultados de búsqueda."></textarea>
                </div>

                <div>
                    <label class="block font-medium mb-2">Palabras clave</label>
                    @if (draft().keywords.length) {
                        <div class="flex flex-wrap gap-2 mb-2">
                            @for (keyword of draft().keywords; track keyword; let i = $index) {
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-600">
                                    {{ keyword }}
                                    <button type="button" class="text-muted-color hover:text-red-500 transition-colors cursor-pointer" (click)="removeKeyword(i)" aria-label="Quitar {{ keyword }}">
                                        <i class="pi pi-times text-xs"></i>
                                    </button>
                                </span>
                            }
                        </div>
                    }
                    <div class="flex gap-2">
                        <input pInputText [ngModel]="keywordInput()" (ngModelChange)="onKeywordInput($event)" (keydown.enter)="addKeyword()" class="w-full" placeholder="Ej: matcha" />
                        <p-button label="Agregar" icon="pi pi-plus" severity="secondary" [text]="true" (onClick)="addKeyword()" />
                    </div>
                    <small class="text-muted-color mt-1 block">Presiona Enter o haz clic en "Agregar" para incluir cada palabra clave.</small>
                </div>

                <div>
                    <label class="block font-medium mb-2">URL canónica</label>
                    <input pInputText [ngModel]="draft().canonical_url" (ngModelChange)="patch({ canonical_url: $event })" class="w-full" maxlength="2048" placeholder="https://tienda.com/te-verde-matcha-ceremonial" />
                </div>

                <div>
                    <label class="block font-medium mb-2">Robots</label>
                    <p-select [ngModel]="draft().robots" (ngModelChange)="patch({ robots: $event })" [options]="robotsOptions" optionLabel="label" optionValue="value" emptyMessage="Sin resultados" class="w-full" />
                </div>

                <div class="border-t border-surface-100 dark:border-surface-800 pt-4">
                    <span class="text-xs font-semibold uppercase tracking-wide text-muted-color">Open Graph</span>
                    <div class="flex flex-col gap-4 mt-3">
                        <div>
                            <label class="block font-medium mb-2">Título de Open Graph</label>
                            <input pInputText [ngModel]="draft().og_title" (ngModelChange)="patch({ og_title: $event })" class="w-full" maxlength="255" placeholder="Ej: Matcha Ceremonial" />
                        </div>
                        <div>
                            <label class="block font-medium mb-2">Descripción de Open Graph</label>
                            <textarea pTextarea [ngModel]="draft().og_description" (ngModelChange)="patch({ og_description: $event })" rows="2" class="w-full" placeholder="Descripción que se muestra al compartir el enlace."></textarea>
                        </div>
                        <div>
                            <label class="block font-medium mb-2">Imagen de Open Graph</label>
                            <input pInputText [ngModel]="draft().og_image" (ngModelChange)="patch({ og_image: $event })" class="w-full" maxlength="2048" placeholder="https://cdn.tiendawhittard.com/og/imagen.png" />
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block font-medium mb-2">Datos estructurados (JSON-LD)</label>
                    <textarea
                        pTextarea
                        [ngModel]="structuredJson()"
                        (ngModelChange)="onStructuredInput($event)"
                        (blur)="onStructuredBlur()"
                        rows="5"
                        class="w-full font-mono text-sm"
                        [class.border-red-400]="structuredError()"
                        placeholder='{ "@type": "Product" }'
                    ></textarea>
                    @if (structuredError(); as error) {
                        <small class="text-red-500 mt-1 flex items-center gap-1"><i class="pi pi-exclamation-circle"></i>{{ error }}</small>
                    } @else {
                        <small class="text-muted-color mt-1 block">Objeto JSON con los datos estructurados (schema.org). Se aplica al salir del campo.</small>
                    }
                </div>
            </div>
        </div>
    `
})
export class SeoPanel {
    value = input<SeoData | null>(null);
    canRemove = input<boolean>(true);

    valueChange = output<SeoData | null>();

    readonly robotsOptions = ROBOTS_OPTIONS;

    private _draft = signal<SeoData>(emptySeoData());
    private _keyword = signal('');
    private _structured = signal('');
    private _structuredErrorMsg = signal<string | null>(null);

    draft = this._draft.asReadonly();
    keywordInput = this._keyword.asReadonly();
    structuredJson = this._structured.asReadonly();
    structuredError = this._structuredErrorMsg.asReadonly();

    canShowRemove = computed(() => !isSeoEmpty(this.draft()));

    constructor() {
        effect(() => this.syncFromValue(this.value()));
    }

    patch(partial: Partial<SeoData>) {
        const next = { ...this.draft(), ...partial };

        this._draft.set(next);
        this.emit(next);
    }

    setNoindex(noindex: boolean) {
        this.patch({ noindex, robots: noindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS });
    }

    addKeyword() {
        const value = this._keyword().trim();

        if (!value) return;

        if (!this.draft().keywords.includes(value)) {
            this.patch({ keywords: [...this.draft().keywords, value] });
        }

        this._keyword.set('');
    }

    onKeywordInput(value: string) {
        this._keyword.set(value);
    }

    removeKeyword(index: number) {
        const next = [...this.draft().keywords];

        next.splice(index, 1);
        this.patch({ keywords: next });
    }

    onStructuredInput(text: string) {
        this._structured.set(text);
        const trimmed = text.trim();

        if (!trimmed) {
            this._structuredErrorMsg.set(null);

            return;
        }

        this._structuredErrorMsg.set(this.isValidJson(trimmed) ? null : 'El JSON no es válido.');
    }

    onStructuredBlur() {
        const text = this._structured().trim();

        if (!text) {
            this._structuredErrorMsg.set(null);
            this.patch({ structured_data: null });

            return;
        }

        const parsed = this.parseJson(text);

        if (parsed !== undefined) {
            this._structuredErrorMsg.set(null);
            this.patch({ structured_data: parsed });
        }
    }

    removeSeo() {
        this._draft.set(emptySeoData());
        this._structured.set('');
        this._structuredErrorMsg.set(null);
        this._keyword.set('');
        this.valueChange.emit(null);
    }

    private syncFromValue(value: SeoData | null) {
        const next = normalizeSeoData(value) ?? emptySeoData();

        this._draft.set(next);
        this._structured.set(next.structured_data ? JSON.stringify(next.structured_data, null, 2) : '');
        this._structuredErrorMsg.set(null);
    }

    private emit(seo: SeoData) {
        this.valueChange.emit(seo);
    }

    private isValidJson(text: string): boolean {
        try {
            JSON.parse(text);

            return true;
        } catch {
            return false;
        }
    }

    private parseJson(text: string): Record<string, unknown> | undefined {
        try {
            const parsed = JSON.parse(text);

            return parsed && typeof parsed === 'object' ? parsed : undefined;
        } catch {
            return undefined;
        }
    }
}
