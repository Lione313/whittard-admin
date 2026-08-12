# 📦 Import / Export de Productos — Guía de Integración

**Versión:** 7.0.0
**Fecha:** 2026-08-12
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`product-code-field.md`](./product-code-field.md)

> Permite descargar todos los productos a un Excel (.xlsx) y volver a subirlo para
> crear o actualizar productos en lote. **Una fila por variante**, con los datos del
> producto repetidos.
>
> **El archivo es legible por humanos: no se exponen UUIDs internos.** Los
> identificadores que gobiernan el emparejamiento son **`codigo`** (producto) y
> **`sku`** (variante), en las dos primeras columnas.

---

## 1. Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/admin/products/export` | Descarga `products.xlsx` con todos los productos |
| `POST` | `/api/v1/admin/products/import/validate` | **Valida el archivo en modo dry-run (no guarda nada)** y devuelve el resumen + preview |
| `POST` | `/api/v1/admin/products/import` | **Confirma** la importación y persiste los cambios |

**Formato:** Excel `.xlsx` (OpenXML). Máximo **100MB**.

> **Nota de infraestructura:** se usa `openspout/openspout` (no maatwebsite/excel)
> porque phpspreadsheet no es compatible con PHP 8.5.

---

## 2. Flujo de 2 pasos (validar → confirmar)

1. **Validar:** el frontend sube el archivo a `/import/validate`. El backend corre
   **toda** la lógica dentro de una transacción que se revierte: valida reglas,
   resuelve/crea categorías, sellos y atributos, y comprueba SKUs/códigos… **sin
   guardar nada**. Devuelve `imported`/`updated`/`skipped` (lo que *ocurriría*),
   `errors` por grupo y un `preview` por producto.
2. **Confirmar:** si el resultado es aceptable, se sube el mismo archivo a `/import`
   para persistir. Si hay grupos con errores, se importan los válidos y se omiten
   los inválidos (reportados en `errors`).

> La validación y la confirmación usan exactamente la misma lógica, así que lo que
> ves en el preview es lo que se aplicará al confirmar.

---

## 3. Columnas del archivo

**Columnas (encabezados en español, orden exacto) y obligatoriedad:**

| # | Columna | Requerida (create) | Descripción |
|---|---|---|---|
| 1 | `codigo` | ❌ opcional | **Identificador del producto**. Se autogenera si vacío en create. |
| 2 | `sku` | ✅ **obligatoria** | **Identificador de la variante**. Único global y dentro del producto. |
| 3 | `nombre` | ✅ **obligatoria** | Nombre del producto |
| 4 | `marca` | ✅ **obligatoria** | Marca |
| 5 | `pais_origen` | ✅ **obligatoria** | País de origen |
| 6 | `categoria` | ✅ **obligatoria** | Categoría por **nombre** (se crea si no existe) |
| 7 | `subcategoria` | ✅ **obligatoria** | Subcategoría por **nombre** (se crea si no existe) |
| 8 | `estado` | ❌ opcional | `draft` \| `published` \| `archived` (default `draft`) |
| 9 | `es_principal` | ❌ opcional | `1` o `0` (si ninguna se marca, la primera es principal) |
| 10 | `es_activo` | ❌ opcional | `1` o `0` (default `1`) |
| 11+ | **atributos** | ❌ opcional | Una columna por atributo del catálogo (header = label normalizado, ej. `presentacion`, `peso`, `sabor`). Si el producto usa atributos, **cada variante debe llenar todos** |
| … | `sellos` | ❌ opcional | Sellos por **nombre**, separados por coma (se crean si no existen) |
| … | `precio` | ✅ **obligatoria** | Precio de la variante (≥ 0) |
| … | `precio_oferta` | ❌ opcional | Precio de oferta (≥ 0, ≤ `precio`). Si viene, exige `oferta_inicia` y `oferta_fin` |
| … | `oferta_inicia` / `oferta_fin` | ❌ opcional | Vigencia de la oferta (XOR con `precio_oferta`) |
| … | `stock` | ❌ opcional | Stock (default `0`) |
| … | `descripcion_corta` / `descripcion_larga` / `descripcion_ingredientes` / `descripcion_especificaciones` | ❌ opcional | Descripciones |

> `slug` y el orden de las variantes **no se incluyen**: el `slug` se autogenera
> internamente y el orden se toma del orden de las filas del archivo.
>
> El export y el import usan **exactamente el mismo set de columnas** → el archivo
> exportado puede volver a importarse tal cual (round-trip).

```
codigo | sku | nombre | marca | pais_origen | categoria | subcategoria | estado | es_principal | es_activo | presentacion | peso | sabor | sellos | precio | precio_oferta | oferta_inicia | oferta_fin | stock | descripcion_corta
MAT-1  | LAT | Té     | X     | Japón       | Tés       | Matcha       | draft  | 1            | 1         | Lata          | 100g |       | Vegano | 28.5   |               |               |            | 10    |
MAT-1  | BOL | Té     | X     | Japón       | Tés       | Matcha       | draft  | 0            | 1         | Bolsa         | 250g |       | Vegano | 45.0   |               |               |            | 5     |
```

---

## 4. Guía de validación (reglas que aplica el backend)

### 4.1 Archivo

| Regla | Resultado |
|---|---|
| `file` requerido, `.xlsx`, máx 100MB | 422 en `file` (fuera de `errors` del import) |
| Sin filas válidas (`nombre` o `sku` en blanco en todas) | `imported: 0, updated: 0, skipped: 0, errors: []` |

### 4.2 Por grupo (producto)

| Regla | Detalle |
|---|---|
| **Identificador** | Se agrupa por `codigo`; si no hay `codigo`, se busca por `sku` de una variante. Sin match → producto nuevo. |
| **Obligatorios en create** | `nombre`, `marca`, `pais_origen`, **`categoria` y `subcategoria`**, y por variante `sku` y `precio`. Si faltan → el grupo se salta con error. |
| **Opcionales en create** | `codigo` (autogen), `estado` (default `draft`), `es_principal`, `es_activo`, `sellos`, atributos, `precio_oferta`+fechas, `stock`, descripciones. |
| **Update** | Todo opcional: solo se aplican columnas con valor; las vacías conservan lo existente. |
| **Unicidad** | `codigo` y `slug` únicos (en update se ignora el propio). SKU únicos dentro del producto y globalmente. |
| **Simple vs configurable** | Si el producto tiene atributos → 2+ variantes permitidas (y **cada variante debe definir valor para todos los atributos**). Si no tiene → **exactamente 1 variante**. |
| **Precio de oferta** | `precio_oferta` ≤ `precio`. Si viene `precio_oferta` exige `oferta_inicia` y `oferta_fin`; fechas sin oferta → error; `oferta_fin` posterior a `oferta_inicia`. |
| **Auto-creación** | `categoria`, `subcategoria`, `sellos` y atributos se crean por nombre si no existen. Todo ocurre en la transacción del grupo: si el grupo falla, **no queda nada creado**. |
| **Reemplazo en update** | Las variantes existentes del producto que no vengan en el archivo se **eliminan**. |

### 4.3 Errores típicos (formato `errors`)

| Situación | Clave de error | Mensaje |
|---|---|---|
| Sin `nombre` en producto nuevo | `name` | "El campo nombre del producto es obligatorio." |
| Sin `categoria` en producto nuevo | `category` | "La categoría es obligatoria." |
| Sin `subcategoria` en producto nuevo | `subcategory` | "La subcategoría es obligatoria." |
| Sin `sku` o `precio` en la variante | `variants.{i}.sku` / `variants.{i}.price` | requeridos |
| `codigo` duplicado | `code` | "El code ya está en uso por otro producto." |
| Producto simple con 2+ variantes | `variants` | "Un producto sin atributos debe tener una sola variante (producto simple)." |
| Variante sin valor de un atributo | `variants.{i}.attributes.{type}` | "Debe seleccionar un valor para el atributo '{label}'." |
| Oferta sin fechas | `variants.{i}.sale_price_starts_at` | "Debe indicar la fecha de inicio del precio de oferta." |
| `precio_oferta` > `precio` | `variants.{i}.sale_price` | "El precio de oferta no puede ser mayor al precio regular." |

## 5. Comportamiento del import

**Emparejamiento por `code` / `sku`:**

1. Si el `code` coincide con un producto existente → **se actualiza** ese producto.
2. Si no hay `code` pero el `sku` coincide con una variente existente → **se actualiza**
   el producto dueño de esa variante.
3. Si no hay match → **se crea** un producto nuevo (las filas con el mismo `code` + `name`
   se agrupan como variantes del mismo producto).

**Resolución por nombre (sin UUIDs) — auto-creación:**

- **Categoría / Subcategoría:** si no existen, **se crean** automáticamente (la
  subcategoría queda bajo la categoría). Si solo se envía `subcategory`, se trata
  como categoría raíz.
- **Sellos (`attributions`):** se resuelven por nombre; si un sello no existe en el
  catálogo, **se crea** (con `image_url` vacío, listo para subir la imagen luego).
- **Atributos:** cada columna de atributo con valor se resuelve por label; si el
  atributo no existe en el catálogo, **se crea** (type = header normalizado).
  Los atributos del producto se derivan de las columnas con valor. El producto se
  marca como configurable (2+ variantes permitidas) cuando hay atributos; simple
  (1 variante) cuando no.

> ⚠️ La creación de sellos/atributos/categorías ocurre **dentro de la transacción
> de cada grupo**: si el grupo falla la validación, no queda nada creado.
>
> El detalle completo de reglas (obligatorios, opcionales, unicidad, producto
> simple/configurable, oferta, etc.) está en la **Guía de validación (§4)**.

**Respuesta 200 (confirmar import):**

```json
{
  "success": true,
  "message": "Importación de productos finalizada.",
  "data": {
    "imported": 2,
    "updated": 1,
    "skipped": 1,
    "errors": {
      "create:MAT-2:Té Nuevo": {
        "name": ["El campo nombre del producto es obligatorio."]
      }
    },
    "preview": {
      "create:MAT-1:Té Matcha": { "action": "created", "code": "MAT-1", "name": "Té Matcha", "variants": 2 },
      "update:EXIST-1": { "action": "updated", "code": "EXIST-1", "name": "Producto Existente", "variants": 1 }
    }
  }
}
```

- `imported`: productos creados.
- `updated`: productos actualizados.
- `skipped`: grupos descartados por error.
- `errors`: mapa clave-de-grupo (`create:code:name` / `update:code`) → errores.
- `preview`: detalle por grupo (`action`: `created` \| `updated` \| `skipped`, `code`, `name`, `variants`). En `/import/validate` indica lo que *ocurriría*; en `/import` lo aplicado.

---

## 6. Ejemplos

**Export (fetch):**
```js
const res = await fetch('/api/v1/admin/products/export', {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await res.blob();
// descargar products.xlsx
```

**Import (multipart):**
```js
const form = new FormData();
form.append('file', archivoXlsx);
const res = await fetch('/api/v1/admin/products/import', {
  method: 'POST',
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  body: form,
});
const { data } = await res.json();
```

**Ejemplo de fila (configurable, 2 variantes del mismo producto):**
```
codigo | sku       | nombre   | marca | pais_origen | categoria | subcategoria | estado    | es_principal | es_activo | presentacion | peso | sellos | precio | es_principal
MAT-1  | SKU-LATA  | Té Matcha| X     | Japón       | Tés       | Matcha       | published | 1            | 1         | Lata         | 100g | Vegano | 28.5   |
MAT-1  | SKU-BOLSA | Té Matcha| X     | Japón       | Tés       | Matcha       | published | 0            | 1         | Bolsa        | 250g | Vegano | 45.0   |
```

---

## 7. Errores típicos (422)

| Situación | Campo | Mensaje |
|---|---|---|
| Sin `file` o no es `.xlsx` | `file` | "El archivo es obligatorio." / "El archivo debe ser un Excel (.xlsx)." |
| Fila sin `name` o `category` en producto nuevo | (en `errors`) | nombre/categoría requeridos |
| Variante sin `sku` o `price` | (en `errors`) | SKU/precio requeridos |
| `code` duplicado | (en `errors`) | "El code ya está en uso por otro producto." |
| Producto simple con 2 variantes | (en `errors`) | "Un producto sin atributos debe tener una sola variante (producto simple)." |

---

## 8. Archivos afectados

- `app/Modules/Product/Exports/ProductsExport.php` (columnas dinámicas de atributos)
- `app/Modules/Product/Imports/ProductsImport.php`
- `app/Modules/Product/Exceptions/ProductImportException.php`
- `app/Modules/Product/Validation/ProductPayloadValidator.php` (reglas compartidas con el request)
- `app/Modules/Product/Requests/StoreProductRequest.php` (refactor `after()` → validador compartido)
- `app/Modules/Product/Requests/ImportProductsRequest.php`
- `app/Modules/Product/Interfaces/IProductService.php`
- `app/Modules/Product/Services/ProductService.php` (`export()`, `import()`, `validateImport()` dry-run, match por code/sku, creación de categorías, resolución de sellos/atributos por nombre)
- `app/Modules/Product/Controllers/BackOffice/ProductController.php`
- `routes/backoffice.php`
- `composer.json` (+ `openspout/openspout`)

---

## 9. Tests cubiertos

- `un_admin_puede_exportar_productos_a_xlsx_con_code_y_sku`
- `el_export_se_puede_reimportar_sin_perder_datos`
- `un_admin_puede_importar_productos_nuevos_y_actualizar_por_code`
- `el_import_empareja_por_sku_cuando_no_hay_code`
- `el_import_rechaza_filas_invalidas_sin_abortar_el_resto`
- `el_import_crea_sellos_categorias_y_atributos_que_no_existen`
- `la_validacion_del_import_no_guarda_cambios`
- `la_validacion_rechaza_filas_invalidas_y_lo_reporta`
- `al_crear_categoria_y_subcategoria_son_obligatorias`
- `el_archivo_del_import_es_obligatorio_y_debe_ser_xlsx`
