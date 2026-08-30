import { Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [ConfirmDialogModule],
    template: ` <p-confirmDialog [style]="{ width: '450px' }" rejectButtonStyleClass="p-button-text p-button-secondary" acceptButtonStyleClass="p-button-danger"> </p-confirmDialog> `
})
export class ConfirmDialogComponent {}
