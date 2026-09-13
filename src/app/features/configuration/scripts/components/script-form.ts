import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ScriptService } from '../services/script.service';
import {
    Script,
    ScriptForm as ScriptFormData,
    ConsentType,
    ScriptLocation,
    CONSENT_TYPE_OPTIONS,
    SCRIPT_LOCATION_OPTIONS,
} from '../models/script.model';

@Component({
    selector: 'app-script-form',
    standalone: true,
    imports: [
        FormsModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        MultiSelectModule,
        ToggleSwitchModule,
        InputNumberModule,
        ButtonModule,
        ToastModule,
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="  space-y-6 text-gray-900 dark:text-zinc-100">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {{ script() ? 'Editar Script' : 'Nuevo Script' }}
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        Configura scripts personalizados para tracking o funcionalidades externas.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="cancel()" />
                    <p-button label="Guardar Script" icon="pi pi-save" [loading]="saving()" (onClick)="save()" />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Izquierda -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Nombre e Identificador -->
                    <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-gray-700 dark:text-zinc-300">Nombre</label>
                                <input pInputText [(ngModel)]="name" placeholder="Ej: Google Tag Manager" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-gray-700 dark:text-zinc-300">Identificador</label>
                                <input pInputText [(ngModel)]="identifier" placeholder="google-tag-manager" class="w-full" />
                            </div>
                        </div>
                    </div>

                    <!-- Head Code -->
                    @if (hasLocation('head')) {
                        <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                                    <i class="pi pi-code text-blue-500"></i> Código Head
                                </label>
                                <span class="text-xs text-gray-400 font-mono">&lt;script&gt; para el &lt;head&gt;</span>
                            </div>
                            <div class="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                <textarea
                                    pTextarea
                                    [(ngModel)]="headCode"
                                    rows="8"
                                    placeholder="<!-- Google Tag Manager -->&#10;<script>...</script>"
                                    class="w-full p-4 font-mono text-sm text-emerald-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y placeholder:text-slate-600"
                                ></textarea>
                            </div>
                        </div>
                    }

                    <!-- Body Start Code -->
                    @if (hasLocation('body_start')) {
                        <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                                    <i class="pi pi-code text-indigo-500"></i> Código Body inicio
                                </label>
                                <span class="text-xs text-gray-400 font-mono">&lt;noscript&gt; justo después de &lt;body&gt;</span>
                            </div>
                            <div class="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                <textarea
                                    pTextarea
                                    [(ngModel)]="bodyStartCode"
                                    rows="6"
                                    placeholder="<!-- Google Tag Manager (noscript) -->&#10;<noscript>...</noscript>"
                                    class="w-full p-4 font-mono text-sm text-emerald-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y placeholder:text-slate-600"
                                ></textarea>
                            </div>
                        </div>
                    }

                    <!-- Body End Code -->
                    @if (hasLocation('body_end')) {
                        <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                                    <i class="pi pi-code text-purple-500"></i> Código Body fin
                                </label>
                                <span class="text-xs text-gray-400 font-mono">antes de cerrar &lt;/body&gt;</span>
                            </div>
                            <div class="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                <textarea
                                    pTextarea
                                    [(ngModel)]="bodyEndCode"
                                    rows="6"
                                    placeholder="<!-- Chat Widget -->&#10;<script>...</script>"
                                    class="w-full p-4 font-mono text-sm text-emerald-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y placeholder:text-slate-600"
                                ></textarea>
                            </div>
                        </div>
                    }
                </div>

                <!-- Derecha -->
                <div class="space-y-6">
                    <!-- Toggle -->
                    <div class="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-gray-900 dark:text-zinc-100">Script Activo</p>
                            <p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                                {{ isActive ? 'El script se ejecutará en el sitio.' : 'Desactiva para pausar la ejecución.' }}
                            </p>
                        </div>
                        <p-toggleswitch [(ngModel)]="isActive" />
                    </div>

                    <!-- Selectores -->
                    <div class="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-5">
                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-semibold text-gray-700 dark:text-zinc-300">Tipo de consentimiento</label>
                            <p-select
                                [(ngModel)]="consentType"
                                [options]="consentOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar tipo"
                                class="w-full"
                            />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-semibold text-gray-700 dark:text-zinc-300">Ubicación en el sitio</label>
                            <p-multiselect
                                [(ngModel)]="locations"
                                [options]="locationOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar ubicaciones"
                                class="w-full"
                            />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-semibold text-gray-700 dark:text-zinc-300">Orden de ejecución</label>
                            <p-inputnumber
                                [(ngModel)]="order"
                                [min]="0"
                                [showButtons]="true"
                                buttonLayout="horizontal"
                                spinnerMode="horizontal"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <!-- Nota -->
                    <div class="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <span class="font-semibold">Nota:</span> Los cambios en los scripts pueden tardar unos minutos en reflejarse debido a la caché del sitio.
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class ScriptFormComponent implements OnInit {
    script = input<Script | null>(null);

    private scriptService = inject(ScriptService);
    private router        = inject(Router);
    private toast         = inject(MessageService);

    saving = signal(false);

    name          = '';
    identifier    = '';
    isActive      = false;
    consentType: ConsentType = 'necessary';
    locations: ScriptLocation[] = [];
    headCode      = '';
    bodyStartCode = '';
    bodyEndCode   = '';
    order         = 0;

    consentOptions  = CONSENT_TYPE_OPTIONS;
    locationOptions = SCRIPT_LOCATION_OPTIONS;

    hasLocation(loc: ScriptLocation): boolean {
        return this.locations.includes(loc);
    }

    ngOnInit(): void {
        const s = this.script();
        if (s) {
            this.name          = s.name;
            this.identifier    = s.identifier;
            this.isActive      = s.isActive;
            this.consentType   = s.consentType.value;
            this.locations     = s.locations;
            this.headCode      = s.headCode ?? '';
            this.bodyStartCode = s.bodyStartCode ?? '';
            this.bodyEndCode   = s.bodyEndCode ?? '';
            this.order         = s.order;
        }
    }

    save(): void {
        const payload: ScriptFormData = {
            name:            this.name,
            identifier:      this.identifier,
            is_active:       this.isActive,
            consent_type:    this.consentType,
            locations:       this.locations,
            head_code:       this.hasLocation('head')       ? this.headCode      || null : null,
            body_start_code: this.hasLocation('body_start') ? this.bodyStartCode || null : null,
            body_end_code:   this.hasLocation('body_end')   ? this.bodyEndCode   || null : null,
            order:           this.order,
        };

        this.saving.set(true);
        const s = this.script();
        const req$ = s
            ? this.scriptService.update(s.id, payload)
            : this.scriptService.create(payload);

        req$.subscribe({
            next: () => {
                this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Script guardado correctamente.' });
                setTimeout(() => this.router.navigateByUrl('/configuration/scripts'), 800);
            },
            error: () => {
                this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el script.' });
                this.saving.set(false);
            },
        });
    }

    cancel(): void {
        this.router.navigateByUrl('/configuration/scripts');
    }
}