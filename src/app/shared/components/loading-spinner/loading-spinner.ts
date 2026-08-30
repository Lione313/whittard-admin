import { Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [ProgressSpinnerModule],
    template: `
        @if (show()) {
            <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <p-progressSpinner strokeWidth="4" animationDuration=".8s" />
                @if (message()) {
                    <p class="mt-4 text-white font-medium text-lg">{{ message() }}</p>
                }
            </div>
        }
    `
})
export class LoadingSpinnerComponent {
    show = input<boolean>(false);
    message = input<string>('Cargando...');
}
