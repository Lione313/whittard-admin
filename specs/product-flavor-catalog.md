# 🍵 Catálogo de Sabores (`flavors`) — Guía de integración (Admin Frontend)

**Versión:** 2.0.0
**Fecha:** 2026-08-25
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-api.md`](./product-api.md) · [`product-module.md`](./product-module.md) · [`product-import-export.md`](./product-import-export.md) · [`media-admin-integration.md`](./media-admin-integration.md) · [`attributes-refactor.md`](./attributes-refactor.md)

> **Resumen del cambio:** el **Sabor es ahora un catálogo maestro propio (`flavors`)**
> con relación **N:M** a los productos (igual que los sellos `attributions`). Ya no es
> un texto libre en el producto, ni un atributo configurador de variantes.
>
> Esto permite **filtrar productos por sabor** y gestionar el catálogo de sabores de forma
> centralizada. En el **import**: si el sabor ya existe en el catálogo **se reutiliza**; si
> no existe **se crea** automáticamente.

---

## 1. Qué cambió (antes → ahora)

| Aspecto | Antes (2 versiones) | Ahora |
|---|---|---|
| Ubicación del dato | Texto libre `flavor` en `products` (string) | Tabla `flavors` + pivote `product_flavor` (**N:M**) |
| API (envío) | `flavor` (string) | `flavor_ids` (array de UUIDs) |
| API (respuesta) | `flavor` (string) | `flavors` (array de objetos) |
| Variantes | — | El sabor **no** vive en `variants[].attributes` |
| Filtrado | No existía | `GET /products?filter[flavor_ids]=<uuid>` |
| Import/Export | Columna `sabor` = texto libre | Columna `sabor` = nombres separados por coma (crea/reutiliza en catálogo) |
| Gestión del catálogo | No existía | CRUD `GET/POST/PUT/DELETE /flavors` |

**Esquema nuevo:**

```sql
flavors          -- catálogo maestro
  id        uuid PK
  name      string, UNIQUE

product_flavor   -- pivote N:M
  product_id uuid FK → products (cascade)
  flavor_id  uuid FK → flavors (cascade)
  PK (product_id, flavor_id)
```

---

## 2. CRUD del catálogo de sabores

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/admin/flavors` | Lista de sabores (con `products_count`) |
| `POST` | `/api/v1/admin/flavors` | Crea un sabor |
| `GET` | `/api/v1/admin/flavors/{flavor}` | Detalle |
| `PUT/PATCH` | `/api/v1/admin/flavors/{flavor}` | Actualiza |
| `DELETE` | `/api/v1/admin/flavors/{flavor}` | Elimina |

**Payload create/update:**

```json
{ "name": "Vainilla" }
```

- `name`: **required**, string ≤255, **único** (422 `name.unique` si ya existe).

**Respuesta (`FlavorResource`):**

```json
{
  "id": "uuid-flavor-1",
  "name": "Vainilla",
  "products_count": 12
}
```

---

## 3. Producto — contrato de la API

### 3.1 Create / Update producto

Se envía `flavor_ids` (array de UUIDs de `flavors`) a nivel de producto, **opcional**.
El backend hace `sync`: en create asigna; en update **reemplaza** la lista completa
(para quitar todos se envía `flavor_ids: []`).

**Create (`POST /api/v1/admin/products`):**

```json
{
  "name": "Té Verde Matcha Ceremonial",
  "category_id": "uuid-subcat-1",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "flavor_ids": ["uuid-flavor-umami"],
  "attribution_ids": ["uuid-attr-1"],
  "attribute_ids": ["uuid-attr-presentation"],
  "variants": [
    {
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "stock": 15,
      "attributes": { "presentation": "Lata Metálica" }
    }
  ]
}
```

> ⚠️ **`flavor_ids` NO va dentro de `variants[].attributes`.** Las variantes solo
> declaran atributos reales de selección (presentación, peso, etc.).

**Update (`PUT/PATCH /api/v1/admin/products/{id}`):** es un campo `sometimes`; para
**quitar todos los sabores** se envía `"flavor_ids": []`.

```json
{ "flavor_ids": ["uuid-flavor-1", "uuid-flavor-2"] }
```

### 3.2 Respuesta (detalle / listas)

`ProductResource` expone `flavors` (array de `FlavorResource`) a nivel de producto:

```json
{
  "data": {
    "id": "uuid-prod-123",
    "name": "Té Verde Matcha Ceremonial",
    "country_of_origin": "Japón",
    "flavors": [
      { "id": "uuid-flavor-umami", "name": "Umami" }
    ],
    "attributions": [ ],
    "attributes": [ ],
    "variants": [
      { "sku": "WTC-MAT-LAT-100", "attributes": { "presentation": "Lata Metálica" } }
    ]
  }
}
```

- `data.flavors`: `array<{ id, name }>` (puede ser `[]`).
- `data.variants[].attributes`: ya **no** contiene `flavor`.

---

## 4. Filtrado de productos por sabor

En el listado de productos del admin:

```
GET /api/v1/admin/products?filter[flavor_ids]=<uuid>
GET /api/v1/admin/products?filter[flavor_ids][]=<uuid1>&filter[flavor_ids][]=<uuid2>
```

Devuelve los productos que tengan **al menos uno** de los sabores indicados
(relación N:M, `whereHas`).

> El filtro convive con los demás: `filter[status]`, `filter[category_id]`, `filter[search]`.

---

## 5. Cambios para el formulario del Admin

### 5.1 Formulario de producto — selector de sabores

Reemplazar el input de texto por un **selector múltiple** que use el catálogo `flavors`:

```js
// GET /api/v1/admin/flavors  →  { data: [{ id, name }] }
<select
  multiple
  value={producto.flavor_ids ?? []}
  onChange={(e) => setProducto({
    ...producto,
    flavor_ids: Array.from(e.target.selectedOptions, (o) => o.value),
  })}
>
  {flavors.map((f) => (
    <option key={f.id} value={f.id}>{f.name}</option>
  ))}
</select>
```

Al guardar, enviar el array completo (`flavor_ids`). En edición, precargar con
`data.flavors.map(f => f.id)`.

### 5.2 Gestión del catálogo (nuevo módulo)

Pantalla opcional "Sabores" (CRUD de `/flavors`): crear, renombrar y eliminar sabores.
Muestra `products_count` por sabor para saber cuántos productos lo usan.

> ⚠️ Eliminar un sabor con productos asociados **borra la asociación** (pivote cascade);
> no elimina productos.

### 5.3 Envío (FormData)

Si el formulario usa `multipart/form-data`:

```js
producto.flavor_ids?.forEach((id) => form.append('flavor_ids[]', id));
```

---

## 6. Import / Export (Excel)

### 6.1 Export

La columna **`sabor`** (después de `pais_origen`) exporta los sabores del producto
separados por coma (si tiene varios):

```
codigo | sku | nombre | marca | pais_origen | sabor          | categoria | ...
MAT-1  | LAT | Té     | X     | Japón       | Umami, Clásico | Tés       | ...
```

### 6.2 Import

Para cargar/actualizar sabores por lote, usar la columna `sabor` con nombres
separados por coma:

```
codigo | sku | nombre | marca | pais_origen | sabor               | categoria | subcategoria | ... | precio | stock
MAT-1  | LAT | Té     | X     | Japón       | Vainilla, Clásico   | Tés       | Matcha       | ... | 28.5   | 10
```

**Comportamiento (igual que sellos):**
- Si un sabor **ya existe** en `flavors` → se **reutiliza** (no se duplica).
- Si **no existe** → se **crea** en el catálogo automáticamente.
- Columna vacía → no toca los sabores (en update conserva los existentes).
- No crea atributos en el catálogo `attributes`.

> Detalle completo en [`product-import-export.md`](./product-import-export.md).

---

## 7. Validación (qué responde el backend)

| Regla | Comportamiento |
|---|---|
| `flavor_ids` opcional | No es obligatorio en create ni update |
| `flavor_ids.*` | Debe existir en `flavors` (422 `flavor_ids.*` si no) |
| `flavor_ids: []` en update | Quita todos los sabores |
| `flavor_ids` en create | Asigna la relación completa |
| Atributo legacy `type=flavor` en `attributes` | Se **ignora**: ya no se exige por variante ni cuenta como configurable |

---

## 8. Checklist para el front

- [ ] Agregar selector múltiple "Sabores" (`flavor_ids`) en el formulario de producto.
- [ ] Precargar `flavor_ids` desde `data.flavors.map(f => f.id)` en edición.
- [ ] (Opcional) Crear pantalla CRUD `/flavors` para gestionar el catálogo.
- [ ] Al enviar, incluir `flavor_ids` (JSON o FormData `flavor_ids[]`).
- [ ] Mostrar `flavors` (nombres) en el detalle del producto.
- [ ] Usar el filtro `filter[flavor_ids]` en el listado de productos.
- [ ] En import/export: columna `sabor` con nombres separados por coma.
- [ ] No asumir que el sabor genera SKUs ni combinaciones de variantes.
