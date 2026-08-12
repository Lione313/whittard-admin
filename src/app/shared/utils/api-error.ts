import { ApiError } from '@/app/core/models/api-error.model';

export function formatApiError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.errors && Object.keys(error.errors).length > 0) {
            return Object.values(error.errors).flat().slice(0, 3).join(' · ');
        }
        return error.message;
    }

    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
