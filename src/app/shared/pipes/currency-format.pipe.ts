import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat',
    standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: number | string | null | undefined, currencyCode: string = 'PEN', symbol: string = 'S/'): string {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return `${symbol} 0.00`;
        }

        const amount = Number(value);
        const formatted = amount.toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return `${symbol} ${formatted}`;
    }
}