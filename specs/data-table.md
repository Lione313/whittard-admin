# DataTable — Spec de uso
> Componente: `app/shared/components/data-table/data-table.ts`
> Selector: `<app-data-table>`

---

## Inputs obligatorios

| Input | Tipo | Descripción |
|---|---|---|
| `[columns]` | `DataTableColumn[]` | Definición de columnas |
| `[data]` | `T[]` | Array de datos a mostrar |

---

## Inputs opcionales — datos

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `[loading]` | `boolean` | `false` | Muestra skeletons en las celdas |
| `caption` | `string` | `''` | Título del caption de la tabla |
| `[searchFields]` | `string[]` | `[]` | Campos para búsqueda global. Si está vacío, no aparece el buscador |
| `[dataKey]` | `string` | `'id'` | Campo que identifica cada fila (para checkboxes) |
| `[tableStyle]` | `Record<string,string>` | `{'min-width':'75rem'}` | Estilos del `<p-table>` |

---

## Inputs opcionales — paginación

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `[paginator]` | `boolean` | `true` | Muestra paginador |
| `[rows]` | `number` | `10` | Filas por página |
| `[rowsPerPageOptions]` | `number[]` | `[10,20,30]` | Opciones del selector de filas |
| `[showPageReport]` | `boolean` | `true` | Muestra "Mostrando X a Y de Z" |
| `pageReportTemplate` | `string` | — | Texto del reporte de página |
| `[lazy]` | `boolean` | `false` | Activa paginación server-side |
| `[totalRecords]` | `number` | `0` | Total de registros (para lazy) |

---

## Inputs opcionales — toolbar

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `[showToolbar]` | `boolean` | `true` | Muestra u oculta el toolbar completo |
| `createLabel` | `string \| null` | `null` | Label del botón "Nuevo". Si es null, no aparece |
| `createMode` | `'modal' \| 'route'` | `'modal'` | `modal` emite `onCreate`; `route` navega a `createRoute` |
| `createRoute` | `string \| null` | `null` | Ruta destino cuando `createMode='route'` |

---

## Inputs opcionales — acciones por fila

La **columna de acciones** solo aparece si `editMode !== null` o `showDelete === true`.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `editMode` | `'modal' \| 'route' \| null` | `null` | `null` = sin botón editar; `modal` = emite `onEdit`; `route` = navega |
| `editRouteFn` | `(row: T) => string \| any[]` | `null` | Función que recibe la row y retorna la ruta. Usada cuando `editMode='route'` |
| `[showDelete]` | `boolean` | `false` | Muestra botón eliminar por fila. Emite `onDelete` |

---

## Inputs opcionales — selección bulk

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `[selectable]` | `boolean` | `false` | Muestra checkboxes por fila |
| `[showDeleteSelected]` | `boolean` | `false` | Muestra botón "Eliminar" en toolbar para bulk delete |

---

## Inputs opcionales — celda custom

| Input | Tipo | Descripción |
|---|---|---|
| `[customCellTemplate]` | `TemplateRef \| null` | Template para columnas con `type: 'custom'` |

---

## Outputs

| Output | Payload | Cuándo se emite |
|---|---|---|
| `(onCreate)` | `void` | Click en "Nuevo" con `createMode='modal'` |
| `(onEdit)` | `T` | Click en editar con `editMode='modal'` |
| `(onDelete)` | `T` | Click en eliminar por fila |
| `(onDeleteSelected)` | `T[]` | Click en "Eliminar" del toolbar (bulk) |
| `(onLazyLoad)` | `TableLazyLoadEvent` | Cambio de página en modo lazy |

---

## DataTableColumn

```typescript
interface DataTableColumn {
    field: string;           // nombre del campo. Soporta dot-notation: 'user.name'
    header: string;          // texto del encabezado
    sortable?: boolean;      // muestra ícono de orden
    width?: string;          // min-width de la columna, ej: '12rem'
    type?: 'text' | 'tag' | 'date' | 'currency' | 'custom';
    // type: 'tag'
    tagLabel?: (value) => string;
    tagSeverity?: (value) => 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast';
    // type: 'date'
    dateFormat?: string;     // formato Angular date pipe. Default: 'dd/MM/yyyy'
    // type: 'currency'
    currencyCode?: string;   // Default: 'PEN'
}
```

---

## Casos de uso

### 1. Tabla simple — solo lectura, sin toolbar
```html
<app-data-table
    [data]="items()"
    [columns]="columns"
    [loading]="loading()"
    [showToolbar]="false"
/>
```

### 2. Con búsqueda y editar con modal
```html
<app-data-table
    [data]="items()"
    [columns]="columns"
    [loading]="loading()"
    caption="Mi sección"
    createLabel="Nuevo"
    editMode="modal"
    [showDelete]="true"
    [searchFields]="['name', 'email']"
    (onCreate)="openDialog()"
    (onEdit)="openDialog($event)"
    (onDelete)="delete($event)"
/>
```

### 3. Crear y editar con rutas
```html
<app-data-table
    [data]="items()"
    [columns]="columns"
    createLabel="Nuevo"
    createMode="route"
    createRoute="/admin/section/create"
    editMode="route"
    [editRouteFn]="editRoute"
    [showDelete]="true"
    (onDelete)="delete($event)"
/>
```
```typescript
editRoute = (row: MyModel) => `/admin/section/${row.id}/edit`;
// o con array:
editRoute = (row: MyModel) => ['admin', 'section', row.id, 'edit'];
```

### 4. Paginación server-side (lazy)
```html
<app-data-table
    [data]="items()"
    [columns]="columns"
    [lazy]="true"
    [totalRecords]="total()"
    [rows]="15"
    (onLazyLoad)="onPageChange($event)"
/>
```
```typescript
onPageChange(event: TableLazyLoadEvent) {
    const page = (event.first ?? 0) / (event.rows ?? 15) + 1;
    this.load(page);
}
```

### 5. Con bulk delete
```html
<app-data-table
    [data]="items()"
    [columns]="columns"
    [selectable]="true"
    [showDeleteSelected]="true"
    (onDeleteSelected)="deleteBatch($event)"
/>
```

### 6. Columna custom (tipo 'custom')
```typescript
columns: DataTableColumn[] = [
    { field: 'avatar', header: 'Foto', type: 'custom' },
];
```
```html
<app-data-table
    [columns]="columns"
    [data]="items()"
    [customCellTemplate]="cellTpl"
/>

<ng-template #cellTpl let-row let-col="col">
    @if (col.field === 'avatar') {
        <img [src]="row.avatar" class="w-8 h-8 rounded-full" />
    }
</ng-template>
```

---

## Columnas de ejemplo frecuentes

```typescript
// Estado activo/inactivo
{ field: 'is_active', header: 'Estado', type: 'tag',
  tagLabel: (v) => v ? 'Activo' : 'Inactivo',
  tagSeverity: (v) => v ? 'success' : 'danger' }

// Fecha
{ field: 'created_at', header: 'Fecha', type: 'date', dateFormat: 'dd/MM/yyyy HH:mm' }

// Moneda soles
{ field: 'total', header: 'Total', type: 'currency', currencyCode: 'PEN' }

// Campo anidado
{ field: 'customer.name', header: 'Cliente', sortable: true }
```