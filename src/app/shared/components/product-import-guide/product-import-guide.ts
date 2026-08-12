import { Component, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@Component({
    selector: 'app-product-import-guide',
    standalone: true,
    imports: [DialogModule, ButtonModule, ScrollPanelModule],
    template: `
        <p-dialog [visible]="visible()" (visibleChange)="visible.set($event)" header="Guía de importación de productos" [modal]="true" [style]="{ width: '720px' }" [styleClass]="'max-w-full'">
            <p-scrollpanel [style]="{ height: '60vh' }">
                <div class="flex flex-col gap-5 pr-4">
                    <section>
                        <h4 class="m-0 text-sm font-semibold uppercase tracking-wide text-muted-color">Estructura del archivo</h4>
                        <p class="m-0 mt-1 text-sm text-muted-color">Una fila = una variante. Si un producto tiene varias variantes, sus datos se repiten en cada fila. Archivo .xlsx, máx. 100 MB.</p>
                        <div class="overflow-x-auto mt-3">
                            <table class="w-full text-sm border-collapse">
                                <thead>
                                    <tr class="text-left border-b border-surface-200 dark:border-surface-700">
                                        <th class="py-2 pr-3 font-semibold">Columna</th>
                                        <th class="py-2 pr-3 font-semibold">Requerida</th>
                                        <th class="py-2 font-semibold">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
                                    @for (col of columns; track col.name) {
                                        <tr>
                                            <td class="py-2 pr-3 font-mono text-xs whitespace-nowrap">{{ col.name }}</td>
                                            <td class="py-2 pr-3">
                                                @if (col.required) {
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-medium">obligatoria</span>
                                                } @else {
                                                    <span class="text-xs text-muted-color">opcional</span>
                                                }
                                            </td>
                                            <td class="py-2 text-muted-color">{{ col.description }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h4 class="m-0 text-sm font-semibold uppercase tracking-wide text-muted-color">Reglas importantes</h4>
                        <ul class="m-0 mt-2 pl-5 text-sm flex flex-col gap-1.5 text-surface-700 dark:text-surface-200 list-disc">
                            @for (rule of rules; track rule) {
                                <li>{{ rule }}</li>
                            }
                        </ul>
                    </section>

                    <section>
                        <h4 class="m-0 text-sm font-semibold uppercase tracking-wide text-muted-color">Ejemplo</h4>
                        <p class="m-0 mt-1 text-sm text-muted-color">Producto configurable con 2 variantes (atributos: presentacion, peso):</p>
                        <pre class="mt-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 overflow-x-auto text-xs leading-5">
<code>codigo | sku | nombre | marca | pais_origen | categoria | subcategoria | estado | es_principal | es_activo | presentacion | peso | sellos | precio
MAT-1  | LAT | Té     | X     | Japón       | Tés       | Matcha       | draft  | 1            | 1         | Lata          | 100g | Vegano | 28.5
MAT-1  | BOL | Té     | X     | Japón       | Tés       | Matcha       | draft  | 0            | 1         | Bolsa         | 250g | Vegano | 45.0</code></pre>
                        <p class="m-0 mt-2 text-sm text-muted-color">Producto simple (1 sola variante, sin atributos):</p>
                        <pre class="mt-1 p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 overflow-x-auto text-xs leading-5">
<code>codigo | sku  | nombre     | marca | pais_origen | categoria | subcategoria | precio
SIM-1  | SKU1 | Té clásico | X     | Reino Unido | Tés       | Clásicos     | 15.0</code></pre>
                    </section>
                </div>
            </p-scrollpanel>
            <ng-template #footer>
                <div class="flex justify-end">
                    <p-button label="Entendido" icon="pi pi-check" (onClick)="visible.set(false)" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class ProductImportGuide {
    visible = model(false);

    columns = [
        { name: 'codigo', required: false, description: 'Identificador del producto. Se autogenera si va vacío (en producto nuevo).' },
        { name: 'sku', required: true, description: 'Identificador de la variante. Único global y dentro del producto.' },
        { name: 'nombre', required: true, description: 'Nombre del producto.' },
        { name: 'marca', required: true, description: 'Marca.' },
        { name: 'pais_origen', required: true, description: 'País de origen.' },
        { name: 'categoria', required: true, description: 'Categoría por nombre. Se crea si no existe.' },
        { name: 'subcategoria', required: true, description: 'Subcategoría por nombre. Se crea si no existe.' },
        { name: 'estado', required: false, description: 'draft | published | archived (por defecto draft).' },
        { name: 'es_principal', required: false, description: '1 o 0. Si ninguna se marca, la primera variante es la principal.' },
        { name: 'es_activo', required: false, description: '1 o 0 (por defecto 1).' },
        { name: 'atributos…', required: false, description: 'Una columna por atributo (header = label normalizado, ej. presentacion). Si el producto usa atributos, cada variante debe llenar todos.' },
        { name: 'sellos', required: false, description: 'Sellos por nombre, separados por coma. Se crean si no existen.' },
        { name: 'precio', required: true, description: 'Precio de la variante (≥ 0).' },
        { name: 'precio_oferta', required: false, description: 'Precio de oferta (≥ 0 y ≤ precio). Si viene, exige oferta_inicia y oferta_fin.' },
        { name: 'oferta_inicia / oferta_fin', required: false, description: 'Vigencia de la oferta (juntas con precio_oferta).' },
        { name: 'stock', required: false, description: 'Stock (por defecto 0).' },
        { name: 'descripcion_corta / _larga / _ingredientes / _especificaciones', required: false, description: 'Descripciones del producto.' }
    ];

    rules = [
        'Emparejamiento: si codigo coincide con un producto existente se actualiza; si no hay codigo pero el sku coincide con una variante, se actualiza el producto dueño; sin coincidencia se crea.',
        'En actualización solo se aplican las columnas con valor; las vacías conservan lo existente.',
        'Producto simple (sin atributos): exactamente 1 variante. Configurable (con atributos): 2+ variantes y cada una debe definir valor para todos los atributos.',
        'Oferta: precio_oferta ≤ precio; si viene precio_oferta deben venir oferta_inicia y oferta_fin (fin posterior a inicio).',
        'Categorías, subcategorías, sellos y atributos se crean por nombre si no existen (dentro de la transacción del grupo).',
        'En actualización, las variantes del producto que no vengan en el archivo se eliminan.',
        'En creación son obligatorias: nombre, marca, pais_origen, categoria, subcategoria y por variante sku y precio.'
    ];
}
