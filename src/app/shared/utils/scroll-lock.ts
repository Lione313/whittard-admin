import { effect, Signal } from '@angular/core';

let lockCount = 0;
let savedOverflow = '';

/**
 * Bloquea el scroll del body mientras la señal `active` sea `true`.
 *
 * Usa un contador global para soportar overlays anidados (p. ej. un dialog
 * abierto sobre un drawer): cada overlay incrementa el contador y solo se
 * restaura el overflow del body cuando el último se cierra.
 */
export function useBodyScrollLock(active: Signal<boolean>): void {
    effect(() => {
        if (active()) {
            if (lockCount === 0) {
                savedOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
            }

            lockCount++;
        } else {
            if (lockCount > 0) {
                lockCount--;

                if (lockCount === 0) {
                    document.body.style.overflow = savedOverflow;
                }
            }
        }
    });
}
