import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { PendingChangesService } from './pending-changes.service';

export const discardChangesGuard: CanDeactivateFn<unknown> = (): boolean | Promise<boolean> => {
    const pending = inject(PendingChangesService);
    if (!pending.hasChanges()) return true;

    const confirmation = inject(ConfirmationService);
    return new Promise<boolean>((resolve) => {
        confirmation.confirm({
            header: 'Descartar cambios',
            message: 'Tienes cambios sin guardar. Si sales de esta página, perderás todo lo que no hayas guardado.',
            acceptLabel: 'Descartar',
            rejectLabel: 'Volver al formulario',
            acceptIcon: 'pi pi-trash',
            rejectIcon: 'pi pi-arrow-left',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                pending.clear();
                resolve(true);
            },
            reject: () => resolve(false)
        });
    });
};
