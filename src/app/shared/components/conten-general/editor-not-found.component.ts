import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-editor-not-found',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
            <div class="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                <i class="pi pi-exclamation-triangle text-3xl text-amber-500"></i>
            </div>
            
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                Editor no disponible
            </h2>
            
            <p class="text-surface-500 dark:text-surface-400 text-sm max-w-md mb-6">
                No existe un componente editor configurado para el tipo de sección 
                <code class="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded text-primary font-mono font-semibold">{{ sectionType || 'desconocido' }}</code>.
            </p>

            <p-button 
                label="Volver a la lista" 
                icon="pi pi-arrow-left" 
                severity="secondary" 
                [outlined]="true" 
                (onClick)="goBack()">
            </p-button>
        </div>
    `
})
export class EditorNotFoundComponent {
    @Input() sectionType: string = '';
    private location = inject(Location);

    goBack(): void {
        this.location.back();
    }
}