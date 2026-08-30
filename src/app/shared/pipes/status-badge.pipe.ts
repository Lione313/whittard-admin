import { Pipe, PipeTransform } from '@angular/core';

export interface StatusConfig {
    label: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
    icon?: string;
}

@Pipe({
    name: 'statusBadge',
    standalone: true
})
export class StatusBadgePipe implements PipeTransform {
    transform(status: string | null | undefined): StatusConfig {
        if (!status) {
            return { label: 'Desconocido', severity: 'secondary' };
        }

        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
            case 'paid':
                return { label: 'Activo', severity: 'success', icon: 'pi pi-check' };
            case 'pending':
            case 'processing':
                return { label: 'Pendiente', severity: 'warn', icon: 'pi pi-clock' };
            case 'inactive':
            case 'cancelled':
            case 'failed':
                return { label: 'Inactivo', severity: 'danger', icon: 'pi pi-times' };
            case 'draft':
                return { label: 'Borrador', severity: 'info', icon: 'pi pi-file' };
            default:
                return { label: status, severity: 'secondary' };
        }
    }
}
