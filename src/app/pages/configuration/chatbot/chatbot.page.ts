import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { ToastModule } from 'primeng/toast';

import { ChatbotConfigService } from '@/app/features/configuration/chatbot/services/chatbot-config.service';
import { CHATBOT_ACTION_OPTIONS, ChatbotFlow, ChatbotStep } from '@/app/features/configuration/chatbot/models/chatbot-config.model';
import { formatApiError } from '@/app/shared/utils/api-error';

interface DiagramNode {
    data: { step: ChatbotStep; isReference?: boolean };
    expanded?: boolean;
    children?: DiagramNode[];
}

@Component({
    selector: 'app-chatbot-config',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ToggleSwitchModule, InputTextModule, TextareaModule, SelectModule, SelectButtonModule, OrganizationChartModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
                <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">Chatbot</h1>
                <small class="text-muted-color block mt-0.5">Flujo de atención que se muestra en la web.</small>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <p-selectbutton [options]="viewOptions" [ngModel]="view()" (ngModelChange)="view.set($event)" optionLabel="label" optionValue="value" />
                @if (view() === 'editor') {
                    <div class="flex items-center gap-2">
                        <p-toggleswitch [ngModel]="isActive()" (ngModelChange)="isActive.set($event)" inputId="chatbot-active" />
                        <label for="chatbot-active" class="text-sm font-medium cursor-pointer">Activo</label>
                    </div>
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving()" (onClick)="save()" />
                }
            </div>
        </div>

        @if (loading()) {
            <div class="card p-16 flex items-center justify-center text-muted-color">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
        } @else if (view() === 'diagram') {
            <div class="card overflow-auto">
                @if (diagramNodes().length) {
                    <div class="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-color">
                        <span class="flex items-center gap-1.5"> <i class="pi pi-circle-fill text-[7px] text-primary"></i> Paso del flujo </span>
                        <span class="flex items-center gap-1.5"> <i class="pi pi-arrow-right text-[9px] text-primary"></i> Opción → siguiente paso </span>
                        <span class="flex items-center gap-1.5 opacity-70"> <i class="pi pi-circle-fill text-[7px] text-surface-400"></i> Referencia (vuelve a un paso ya mostrado) </span>
                    </div>

                    <p-organizationchart [value]="diagramNodes()" [preserveSpace]="true">
                        <ng-template pTemplate="default" let-node>
                            <div
                                class="text-left rounded-xl border px-3 py-2.5 min-w-48 max-w-72"
                                [class.border-primary]="!node.data.isReference"
                                [class.border-dashed]="node.data.isReference"
                                [class.border-surface-300]="node.data.isReference"
                                [class.opacity-70]="node.data.isReference"
                            >
                                <div class="flex items-center gap-1.5">
                                    <i class="pi pi-circle-fill text-[7px]" [class.text-primary]="!node.data.isReference" [class.text-surface-400]="node.data.isReference"></i>
                                    <span class="font-mono text-xs font-semibold text-surface-900 dark:text-surface-0">{{ node.data.step.id }}</span>
                                </div>

                                @if (node.data.isReference) {
                                    <div class="mt-1 text-[11px] text-muted-color">↩ vuelve a este paso</div>
                                } @else {
                                    <div class="mt-1 text-xs leading-snug text-surface-600 dark:text-surface-300">{{ node.data.step.question }}</div>

                                    @if (node.data.step.options?.length) {
                                        <ul class="mt-2 flex flex-col gap-0.5">
                                            @for (option of node.data.step.options; track option.id) {
                                                <li class="flex items-center gap-1 text-[11px]">
                                                    <span class="truncate max-w-40 text-surface-700 dark:text-surface-200">{{ option.label }}</span>
                                                    <i class="pi pi-arrow-right text-[8px] text-primary"></i>
                                                    <span class="font-mono text-[10px] text-muted-color">{{ option.nextStepId || '—' }}</span>
                                                </li>
                                            }
                                        </ul>
                                    }

                                    @if (node.data.step.action; as action) {
                                        <div class="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                            <i class="pi" [class.pi-whatsapp]="action.type === 'whatsapp'" [class.pi-link]="action.type === 'url'"></i>
                                            {{ action.label || action.type }}
                                        </div>
                                    }
                                }
                            </div>
                        </ng-template>
                    </p-organizationchart>
                } @else {
                    <div class="p-10 text-center text-muted-color">No hay pasos configurados. Cambia a <strong>Editor</strong> para crear el flujo.</div>
                }
            </div>
        } @else {
            @for (step of steps(); track step.id; let i = $index) {
                <div class="card mb-3">
                    <div class="flex flex-wrap items-center gap-2 mb-3">
                        <span class="font-semibold text-surface-900 dark:text-surface-0">Paso {{ i + 1 }}</span>
                        <input pInputText [(ngModel)]="step.id" placeholder="id (ej: welcome)" class="w-56 font-mono" />
                        <div class="flex-1"></div>
                        <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" title="Eliminar paso" (onClick)="removeStep(i)" />
                    </div>

                    <textarea pTextarea [(ngModel)]="step.question" rows="2" placeholder="Pregunta / mensaje del bot" class="w-full"></textarea>

                    <div class="mt-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-semibold text-surface-900 dark:text-surface-0">Opciones</span>
                            <p-button label="Agregar opción" icon="pi pi-plus" size="small" [text]="true" (onClick)="addOption(step)" />
                        </div>

                        @for (option of step.options ?? []; track option.id; let j = $index) {
                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                <input pInputText [(ngModel)]="option.label" placeholder="Etiqueta" class="flex-1 min-w-48" />
                                <p-select [options]="stepOptions()" [(ngModel)]="option.nextStepId" optionLabel="label" optionValue="value" placeholder="Siguiente paso" [showClear]="true" styleClass="w-56" />
                                <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true" (onClick)="removeOption(step, j)" />
                            </div>
                        }
                    </div>

                    <div class="mt-3">
                        <div class="flex items-center gap-2">
                            <p-toggleswitch [ngModel]="!!step.action" (ngModelChange)="toggleAction(step, $event)" [inputId]="'action-' + i" />
                            <label [for]="'action-' + i" class="text-sm font-semibold cursor-pointer">Acción (botón)</label>
                        </div>

                        @if (step.action) {
                            <div class="grid gap-2 md:grid-cols-3 mt-2">
                                <p-select [options]="actionOptions" [(ngModel)]="step.action.type" optionLabel="label" optionValue="value" />
                                <input pInputText [(ngModel)]="step.action.url" placeholder="https://... o /ruta" class="md:col-span-2" />
                                <input pInputText [(ngModel)]="step.action.label" placeholder="Texto del botón" class="md:col-span-3" />
                            </div>
                        }
                    </div>
                </div>
            }

            <p-button label="Agregar paso" icon="pi pi-plus" [outlined]="true" (onClick)="addStep()" />
        }

        <p-toast />
    `
})
export class ChatbotConfigPage implements OnInit {
    private chatbotService = inject(ChatbotConfigService);
    private messageService = inject(MessageService);

    steps = signal<ChatbotStep[]>([]);
    isActive = signal(true);
    loading = signal(false);
    saving = signal(false);
    view = signal<'diagram' | 'editor'>('diagram');

    readonly actionOptions = CHATBOT_ACTION_OPTIONS;
    readonly viewOptions = [
        { label: 'Diagrama', value: 'diagram' },
        { label: 'Editor', value: 'editor' }
    ];

    diagramNodes = computed(() => this.buildTree(this.steps()));

    ngOnInit(): void {
        this.load();
    }

    stepOptions(): { label: string; value: string }[] {
        return this.steps()
            .filter((step) => !!step.id)
            .map((step) => ({ label: step.id, value: step.id }));
    }

    addStep(): void {
        this.steps.update((steps) => [...steps, { id: `step-${Date.now()}`, question: '', options: [] }]);
    }

    removeStep(index: number): void {
        this.steps.update((steps) => steps.filter((_, i) => i !== index));
    }

    addOption(step: ChatbotStep): void {
        step.options = [...(step.options ?? []), { id: `opt-${Date.now()}`, label: '', nextStepId: null }];
        this.steps.update((steps) => [...steps]);
    }

    removeOption(step: ChatbotStep, index: number): void {
        step.options = (step.options ?? []).filter((_, i) => i !== index);
        this.steps.update((steps) => [...steps]);
    }

    toggleAction(step: ChatbotStep, enabled: boolean): void {
        step.action = enabled ? { type: 'url', url: '', label: '' } : null;
        this.steps.update((steps) => [...steps]);
    }

    save(): void {
        const flow: ChatbotFlow = {};
        const ids = new Set<string>();

        for (const step of this.steps()) {
            const id = step.id?.trim();

            if (!id) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Cada paso debe tener un id.', life: 4000 });

                return;
            }

            if (ids.has(id)) {
                this.messageService.add({ severity: 'warn', summary: 'Validación', detail: `El id "${id}" está duplicado.`, life: 4000 });

                return;
            }

            ids.add(id);
            flow[id] = {
                id,
                question: step.question ?? '',
                options: step.options ?? [],
                action: step.action ?? undefined
            };
        }

        this.saving.set(true);

        this.chatbotService.update({ flow, is_active: this.isActive() }).subscribe({
            next: (response) => {
                this.saving.set(false);
                this.applyConfig(response.data.flow, response.data.is_active);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Flujo del chatbot actualizado.', life: 3000 });
            },
            error: (error) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private load(): void {
        this.loading.set(true);

        this.chatbotService.get().subscribe({
            next: (response) => {
                this.applyConfig(response.data.flow, response.data.is_active);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: formatApiError(error), life: 5000 });
            }
        });
    }

    private applyConfig(flow: ChatbotFlow, isActive: boolean): void {
        this.steps.set(
            Object.values(flow ?? {}).map((step) => ({
                ...step,
                options: step.options ?? [],
                action: step.action ?? null
            }))
        );
        this.isActive.set(isActive);
    }

    /**
     * Construye el árbol del diagrama desde el inicio (pasos no referenciados).
     * Los pasos repetidos o que vuelven atrás se muestran como referencia para
     * no generar bucles infinitos.
     */
    private buildTree(steps: ChatbotStep[]): DiagramNode[] {
        const flow: Record<string, ChatbotStep> = {};

        for (const step of steps) {
            if (step.id) flow[step.id] = step;
        }

        const ids = Object.keys(flow);

        if (ids.length === 0) return [];

        const referenced = new Set<string>();

        for (const step of Object.values(flow)) {
            for (const option of step.options ?? []) {
                if (option.nextStepId) referenced.add(option.nextStepId);
            }
        }

        const rootIds = ids.filter((id) => !referenced.has(id));
        const roots = rootIds.length ? rootIds : [ids[0]];
        const visited = new Set<string>();

        return roots.map((id) => this.buildNode(flow, id, visited));
    }

    private buildNode(flow: Record<string, ChatbotStep>, id: string, visited: Set<string>): DiagramNode {
        const step = flow[id];

        if (!step || visited.has(id)) {
            return { data: { step: { id, question: '' }, isReference: true } };
        }

        visited.add(id);

        const targets = (step.options ?? [])
            .map((option) => option.nextStepId)
            .filter((target): target is string => !!target && !!flow[target])
            .filter((target, index, arr) => arr.indexOf(target) === index);

        return {
            data: { step },
            expanded: true,
            children: targets.map((target) => this.buildNode(flow, target, visited))
        };
    }
}
