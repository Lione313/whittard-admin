# 🔄 Refactor de Atributos — Cambios para la Integración del Admin

**Versión:** 2.0.0
**Fecha:** 2026-08-06
**Estado:** Implementado (Laravel 11)
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Requerimiento:** [`refactor-attributes.md`](./refactor-attributes.md)
**Relacionado:** [`product-module.md`](./product-module.md) · [`media-admin-integration.md`](./media-admin-integration.md)

> Documento de **cambios de contrato** para que el equipo del admin migre sus formularios.
> Muestra el antes/después, el nuevo modelo de datos y las reglas de validación reales.

---

## 1. Por qué cambió

Los atributos de producto se guardaban como un arreglo rígido en un campo `JSON`
(`attribute_options.options: [{ "value": "Rojo" }]`), lo que impedía:

- Asociar **imágenes** (swatches/muestras) a cada opción de forma tipada.
- Definir **colores HEX** (`#RRGGBB`) para botones de color.
- Controlar el **orden de despliegue** de las opciones.

Solución en dos frentes:

1. **Normalización** en dos entidades ligadas por `1:N` (atributo → opciones).
2. **Catálogo maestro global**: los atributos se crean una vez (como los sellos) y el
   producto **solo los escoge** por `attribute_ids`. Ya no se definen dentro del producto.

---

## 2. Modelo de Datos (nuevo)

### 2.1 `attributes` — catálogo maestro (global)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `type` | string | key técnica: `color`, `flavor`, `package_type`, `size`… **única global** |
| `label` | string | etiqueta visible: "Selecciona el Sabor", "Elige tu Talla"… |
| `timestamps` | | |

### 2.2 `attribute_options`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `attribute_id` | uuid FK | → `attributes.id`, `ON DELETE CASCADE` |
| `value` | string | ej. "Frutos Rojos", "Doypack 1kg", "Algodón" |
| `image_url` | string, nullable | URL de la imagen miniatura/swatch |
| `color_hex` | string(7), nullable | código de color `#RRGGBB` |
| `order` | unsignedInteger | default `0`, orden de despliegue |
| `timestamps` | | |

### 2.3 Pivote `product_attribute`

Relación N:M producto ↔ atributo (como `product_attribution`): `product_id` + `attribute_id`
(compuesta PK, cascade). El producto selecciona qué grupos de selección aplica.

Modelos Eloquent: `App\Models\Attribute` (`options`, `products`), `App\Models\AttributeOption`
(`attribute`), `Product::attributes()` (`belongsToMany` vía pivote).

---

## 3. Cambios de Contrato (resumen)

| Antes (legacy) | Ahora |
|---|---|
| `attribute_options` (array de grupos, inline) | **`attribute_ids`** (array de UUIDs del catálogo) |
| `attribute_options[].type` / `.label` | se gestiona en el catálogo `POST /attributes` |
| `attribute_options[].options[].swatch_image_url` | catálogo: `options[].image_url` |
| — | catálogo: `options[].color_hex` (nuevo) |
| — | catálogo: `options[].order` (nuevo) |
| — | catálogo: `options[].file` (nuevo, subida directa) |

> ⚠️ **Breaking changes de contrato:**
> 1. El producto ya **no recibe** `attribute_options` ni `attributes` (grupos). Solo envía `attribute_ids[]`.
> 2. La respuesta del producto (`ProductResource`) **sigue** exponiendo `attributes` (grupos del
>    catálogo con sus `options`), pero son **solo lectura**.
> 3. Las opciones se editan en el catálogo maestro (`POST/PUT /api/v1/admin/attributes`).

---

## 4. Nuevo Contrato — Catálogo `attributes`

**`POST /api/v1/admin/attributes`** (create) y **`PUT|PATCH /api/v1/admin/attributes/{id}`** (update).

```json
{
  "type": "presentation",
  "label": "Presentación",
  "options": [
    { "value": "Lata Metálica", "image_url": "https://cdn.com/swatches/lata.png", "order": 1 },
    { "value": "Bolsa Recargable", "color_hex": "#F0E68C", "order": 2 },
    { "value": "Caja de Regalo", "order": 3 }
  ]
}
```

| Campo | Reglas |
|---|---|
| `type` | **required**, string ≤255, **única global** |
| `label` | **required**, string ≤255 |
| `options` | array? (min 1 si se envía) |
| `options[].value` | **required**, string ≤255 |
| `options[].image_url` | nullable, ≤2048, **URL válida** |
| `options[].file` | nullable, imagen (jpg/jpeg/png/webp/gif/svg), máx **20MB** — la API lo sube y rellena `image_url` |
| `options[].color_hex` | nullable, **formato `#RRGGBB`** |
| `options[].order` | nullable, integer ≥0 (default 0) |

### 4.1 Regla de representación visual (XOR)

Cada opción admite **una sola** fuente visual:

- **Imagen:** `image_url` **o** `file`.
- **Color:** `color_hex`.
- **Ninguna:** válido (ej. opciones de peso "100g" sin swatch).

Combinar imagen + color → **422** en `options.{i}`.

```json
{
  "message": "Cada opción debe tener una sola representación visual: imagen o color HEX, no ambas.",
  "errors": { "options.0": ["Cada opción debe tener una sola representación visual: imagen o color HEX, no ambas."] }
}
```

### 4.2 Respuesta (`AttributeResource`)

```json
{
  "id": "uuid-attr-1",
  "type": "presentation",
  "label": "Presentación",
  "options": [
    { "id": "uuid-opt-1", "value": "Lata Metálica", "image_url": "https://cdn.com/swatches/lata.png", "color_hex": null, "order": 1 }
  ],
  "options_count": 1
}
```

---

## 5. Nuevo Contrato — Producto (`attribute_ids`)

**`POST /api/v1/admin/products`** y **`PUT|PATCH /api/v1/admin/products/{id}`**:

```json
{
  "attribute_ids": ["uuid-attr-presentation", "uuid-attr-flavor"]
}
```

- Cada UUID debe existir en `attributes` (422 `attribute_ids.*` si no).
- `sync` → reemplaza la relación completa (envía la lista completa en edición).
- La API resuelve automáticamente las `options` de cada atributo en la respuesta.

### 5.1 Respuesta del Detalle (`ProductResource`)

```json
{
  "attributes": [
    {
      "id": "uuid-attr-1",
      "type": "presentation",
      "label": "Presentación",
      "options": [
        { "id": "uuid-opt-1", "value": "Lata Metálica", "image_url": "https://cdn.com/swatches/lata.png", "color_hex": null, "order": 1 },
        { "id": "uuid-opt-2", "value": "Bolsa Recargable", "image_url": null, "color_hex": "#F0E68C", "order": 2 }
      ]
    }
  ]
}
```

- `image_url` y `color_hex` **siempre presentes** (`null` si no aplican).
- `options` ordenados por `order` ascendente.
- Los `id` son **solo lectura**: para editar las opciones se usa el catálogo.

---

## 6. Endpoints nuevos (catálogo maestro)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/admin/attributes` | Listar (con `options` y `options_count`) |
| `POST` | `/api/v1/admin/attributes` | Crear atributo + opciones |
| `GET` | `/api/v1/admin/attributes/{id}` | Detalle con opciones |
| `PUT`/`PATCH` | `/api/v1/admin/attributes/{id}` | Actualizar (si envías `options`, se borran y recrean) |
| `DELETE` | `/api/v1/admin/attributes/{id}` | Borrar (cascade al pivote) |

---

## 7. Subida de Imágenes (swatch por archivo)

`options[].file` en el catálogo sigue el patrón del módulo Media:

```js
attr.options.forEach((opt, oi) => {
  form.append(`options[${oi}][value]`, opt.value);
  if (opt.file) {
    form.append(`options[${oi}][file]`, opt.file);          // nuevo archivo
  } else if (opt.image_url) {
    form.append(`options[${oi}][image_url]`, opt.image_url); // imagen existente
  } else if (opt.color_hex) {
    form.append(`options[${oi}][color_hex]`, opt.color_hex); // swatch de color
  }
  form.append(`options[${oi}][order]`, opt.order ?? oi);
});
```

> Ver [`media-admin-integration.md`](./media-admin-integration.md) para los límites y errores
> de la subida (422 con `errors` por campo).

---

## 8. Migración de Base de Datos

| Antes | Ahora |
|---|---|
| `attribute_options` (product_id, type, label, **options JSON**) | `attributes` (global) + `attribute_options` (value, image_url, color_hex, order) + pivote `product_attribute` |

Nuevas migraciones:
- `2026_08_06_000001_create_attributes_table`
- `2026_08_06_000002_create_attribute_options_table`
- `2026_08_06_000003_create_product_attribute_table`

> ⚠️ Requiere **`php artisan migrate:fresh`** si ya tenías las migraciones anteriores aplicadas.
> No hay datos de producción en riesgo en este punto del desarrollo.

---

## 9. Checklist de Integración para el Admin

- [ ] Producto: reemplazar el envío de grupos inline por **`attribute_ids[]`** (UUIDs del catálogo).
- [ ] Nueva pantalla "Atributos": CRUD en `/api/v1/admin/attributes` con `type` (único), `label` y `options`.
- [ ] Reemplazar `swatch_image_url` → `image_url` (+ `color_hex` y `order` opcionales) en el catálogo.
- [ ] Validar `color_hex` con regex `^#[0-9A-Fa-f]{6}$` en el cliente.
- [ ] Bloquear opción con imagen **y** color a la vez (XOR) antes de enviar.
- [ ] Widget de swatch: imagen (preview) **o** color (picker HEX) **o** ninguno.
- [ ] Subida directa con `file` (FormData, máx 20MB, formatos imagen) en el catálogo.
- [ ] Al editar el producto, reenviar `attribute_ids` **completo** (sync).
- [ ] Renderizar los botones de selección respetando `order`.

---

## 10. Errores Nuevos (422) que debe manejar el admin

| Campo de error | Mensaje |
|---|---|
| `attribute_ids.*` | "El atributo seleccionado no existe." |
| `type` | "Ya existe un atributo con esa clave técnica." |
| `options.{i}` | "Cada opción debe tener una sola representación visual: imagen o color HEX, no ambas." |
| `options.{i}.color_hex` | "El color debe estar en formato hexadecimal (#RRGGBB)." |
