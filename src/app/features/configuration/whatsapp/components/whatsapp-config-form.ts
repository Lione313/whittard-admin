import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { WhatsappConfigService } from '../services/whatsapp-config.service';
import { environment } from '../../../../../environments/environment';
import { ApiError } from '@/app/core/models/api-error.model';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

const COUNTRY_DIAL_CODES: { [prefix: string]: { code: string; name: string } } = {
    '+51': { code: 'pe', name: 'Perú' },
    '+52': { code: 'mx', name: 'México' },
    '+54': { code: 'ar', name: 'Argentina' },
    '+56': { code: 'cl', name: 'Chile' },
    '+57': { code: 'co', name: 'Colombia' },
    '+58': { code: 've', name: 'Venezuela' },
    '+593': { code: 'ec', name: 'Ecuador' },
    '+591': { code: 'bo', name: 'Bolivia' },
    '+1': { code: 'us', name: 'EE.UU.' },
    '+34': { code: 'es', name: 'España' }
};

@Component({
    selector: 'app-whatsapp-config-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, ToggleSwitchModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card p-6 max-w-4xl mx-auto">
            <!-- HEADER SOBRIO -->
            <div class="flex items-center justify-between gap-4 mb-6 border-b border-surface-200 dark:border-surface-700 pb-4">
                <div>
                    <h1 class="text-2xl font-bold flex items-center gap-2">
                        <i class="pi pi-whatsapp text-green-500 text-2xl"></i>
                        Configuración de WhatsApp
                    </h1>
                    <p class="text-gray-500 text-sm">Gestiona la cuenta única de atención por WhatsApp para el botón flotante.</p>
                </div>
            </div>

            <!-- FORMULARIO -->
            <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="flex flex-col gap-6">
                <!-- TELÉFONO CON PREFIJO Y BANDERA INTEGRADAS -->
                <div class="flex flex-col gap-1">
                    <label for="phone_number" class="font-semibold text-sm">Número de WhatsApp</label>

                    <div class="flex items-center rounded-md border border-surface-300 dark:border-surface-600 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                        <!-- PREFIJO CON BANDERA -->
                        <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-3 py-2 border-r border-surface-300 dark:border-surface-600 select-none">
                            @if (detectedCountry(); as country) {
                                <img [src]="'https://flagcdn.com/w20/' + country.code + '.png'" [alt]="country.name" class="w-5 h-3.5 object-cover rounded-xs" />
                            }
                            <span class="text-sm font-semibold font-mono text-surface-700 dark:text-surface-200">
                                {{ currentPrefix() }}
                            </span>
                        </div>

                        <!-- INPUT SOLO DEL NÚMERO (BLOQUEO DE LETRAS EN TIEMPO REAL) -->
                        <input pInputText id="phone_number" [value]="nationalNumber()" (keydown)="onlyNumbersKeydown($event)" (input)="onPhoneInput($event)" placeholder="987654321" class="w-full border-none shadow-none focus:ring-0 px-3 py-2" />
                    </div>

                    <small class="text-surface-500">Puedes incluir el código de país directamente (ej. +51987654321) o solo el número.</small>
                </div>

                <!-- Mensaje Flotante Hover (hover_text) -->
                <div class="flex flex-col gap-1">
                    <label for="hover_text" class="font-semibold text-sm">Texto del Botón</label>
                    <input pInputText id="hover_text" formControlName="hover_text" placeholder="Ej: ¿Necesitas ayuda? Escríbenos" />
                    <small class="text-surface-500">Texto emergente al pasar el cursor sobre el ícono.</small>
                </div>

                <!-- Mensaje Predefinido de Bienvenida (welcome_message) -->
                <div class="flex flex-col gap-1">
                    <label for="welcome_message" class="font-semibold text-sm">Mensaje Predeterminado</label>
                    <textarea pTextarea id="welcome_message" formControlName="welcome_message" rows="3" placeholder="Ej: Hola, quisiera realizar una consulta sobre un producto."></textarea>
                    <small class="text-surface-500">Mensaje con el que se abrirá automáticamente el chat del usuario.</small>
                </div>

                <!-- Imagen del Icono (image_url / image_path) -->
                <div class="flex flex-col gap-2">
                    <label class="font-semibold text-sm">Imagen del Botón</label>

                    <div class="flex items-center gap-4">
                        @if (imagePreview()) {
                            <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-300 dark:border-surface-700 flex items-center justify-center bg-surface-100 dark:bg-surface-800">
                                <img [src]="imagePreview()" alt="Preview WhatsApp" class="w-full h-full object-cover" />
                            </div>
                        }

                        <div class="flex flex-col gap-1">
                            <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" class="hidden" />
                            <p-button label="Seleccionar Imagen" icon="pi pi-upload" severity="secondary" [outlined]="true" (onClick)="fileInput.click()" />
                            <small class="text-surface-500">Formatos permitidos: JPEG, PNG, JPG, WEBP, SVG (Máx. 2MB)</small>
                        </div>
                    </div>
                </div>

                <!-- Estado (is_active) -->
                <div class="flex flex-col gap-1 mt-2">
                    <label class="font-semibold text-sm mb-1">Estado en Tienda</label>
                    <div class="flex items-center gap-2">
                        <p-toggleswitch formControlName="is_active" />
                        <span class="text-sm font-medium">
                            {{ configForm.get('is_active')?.value ? 'Activo / Visible' : 'Inactivo / Oculto' }}
                        </span>
                    </div>
                </div>

                <!-- Guardar -->
                <div class="flex justify-end gap-2 mt-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <p-button label="Guardar Cambios" type="submit" icon="pi pi-check" severity="success" [loading]="saving()" [disabled]="configForm.invalid" />
                </div>
            </form>
        </div>
    `
})
export class WhatsappConfigForm implements OnInit {
    private fb = inject(FormBuilder);
    private whatsappService = inject(WhatsappConfigService);
    private messageService = inject(MessageService);

    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    selectedFile: File | null = null;
    imagePreview = signal<string | null>(null);

    phoneNumberSignal = signal<string>('+51');

    // Extrae el prefijo (+51, +52, etc.) o deja +51 por defecto
    currentPrefix = computed(() => {
        const full = this.phoneNumberSignal().trim();
        if (!full.startsWith('+')) return '+51';

        for (let i = 4; i >= 2; i--) {
            const prefix = full.substring(0, i);
            if (COUNTRY_DIAL_CODES[prefix]) {
                return prefix;
            }
        }
        return '+51';
    });

    // Detecta el país según el prefijo extraído
    detectedCountry = computed(() => {
        return COUNTRY_DIAL_CODES[this.currentPrefix()] || null;
    });

    // Muestra solo la parte nacional en el input
    nationalNumber = computed(() => {
        const full = this.phoneNumberSignal().trim();
        const prefix = this.currentPrefix();
        if (full.startsWith(prefix)) {
            return full.slice(prefix.length);
        }
        return full.replace(/^\+\d+/, '');
    });

    configForm: FormGroup = this.fb.group({
        phone_number: ['', Validators.required],
        hover_text: [''],
        welcome_message: [''],
        is_active: [true]
    });

    ngOnInit(): void {
        this.loadConfig();

        this.configForm.get('phone_number')?.valueChanges.subscribe((val) => {
            this.phoneNumberSignal.set(val || '');
        });
    }

    // Previene presionar letras u otros caracteres no numéricos
    onlyNumbersKeydown(event: KeyboardEvent): void {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
        if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
            return;
        }
        // Permite el '+' solo si está al inicio
        if (event.key === '+' && (event.target as HTMLInputElement).selectionStart === 0) {
            return;
        }
        // Si no es un dígito entre 0 y 9, cancela el evento
        if (!/^[0-9]$/.test(event.key)) {
            event.preventDefault();
        }
    }

    onPhoneInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let rawVal = input.value.trim();

        // Filtra cualquier carácter que no sea número o el '+' al inicio
        if (rawVal.startsWith('+')) {
            rawVal = '+' + rawVal.substring(1).replace(/[^0-9]/g, '');
        } else {
            rawVal = rawVal.replace(/[^0-9]/g, '');
        }

        input.value = rawVal;

        if (rawVal.startsWith('+')) {
            this.configForm.get('phone_number')?.setValue(rawVal, { emitEvent: true });
        } else {
            const fullNumber = rawVal ? `${this.currentPrefix()}${rawVal}` : '';
            this.configForm.get('phone_number')?.setValue(fullNumber, { emitEvent: true });
        }
    }

    private getFullImageUrl(url: string | null): string | null {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    loadConfig(): void {
        this.loading.set(true);
        this.whatsappService.get().subscribe({
            next: (res) => {
                const data = res.data;
                this.configForm.patchValue({
                    phone_number: data.phone_number,
                    hover_text: data.hover_text,
                    welcome_message: data.welcome_message,
                    is_active: data.is_active ?? true
                });

                if (data.phone_number) {
                    this.phoneNumberSignal.set(data.phone_number);
                }

                if (data.image_url) {
                    this.imagePreview.set(this.getFullImageUrl(data.image_url));
                }
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración de WhatsApp' });
                this.loading.set(false);
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview.set(reader.result as string);
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    saveConfig(): void {
        if (this.configForm.invalid) return;

        this.saving.set(true);
        const formValues = this.configForm.value;

        this.whatsappService
            .update({
                phone_number: formValues.phone_number,
                hover_text: formValues.hover_text,
                welcome_message: formValues.welcome_message,
                is_active: formValues.is_active,
                image: this.selectedFile
            })
            .subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Configuración de WhatsApp guardada correctamente'
                    });
                    this.saving.set(false);
                    this.selectedFile = null;
                    if (res.data?.image_url) {
                        this.imagePreview.set(this.getFullImageUrl(res.data.image_url));
                    }
                },
                error: (err: ApiError) => {
                    this.saving.set(false);

                    if (err.errors && Object.keys(err.errors).length > 0) {
                        // Especificar el tipo (msg: string) o usar un cast para evitar 'unknown'
                        (Object.values(err.errors).flat() as string[]).forEach((msg) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error de validación',
                                detail: msg
                            });
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.message || 'Error al actualizar la configuración'
                        });
                    }
                }
            });
    }
}
