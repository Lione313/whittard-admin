import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment.development';

@Pipe({
    name: 'classUrl',
    standalone: true
})
export class ClassUrlPipe implements PipeTransform {
    transform(value: string | File | null | undefined): string {
        if (!value) return '';

        // Si es un objeto File, no se procesa
        if (value instanceof File) return '';

        // Si ya es una URL completa (http:// o https://) o un Data URL base64, se retorna tal cual
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
            return value;
        }

        // Si la ruta no empieza con '/', se le añade
        const path = value.startsWith('/') ? value : `/storage/${value}`;

        // Retorna concatenado con la URL base del backend/API o storage
        return `${environment.urlbase || ''}${path}`;
    }
}
