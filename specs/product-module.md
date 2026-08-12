# 📦 Módulo de Productos — Guía de Integración para el Admin (BackOffice)

**Versión:** 2.0.0
**Estado:** Implementado (Laravel 11) — Espejo fiel del código
**Base URL:** `/api/v1/admin`
**Formato:** JSON
**Rutas declaradas en:** `routes/backoffice.php`
**Middleware aplicado:** `auth:sanctum` + `App\Http\Middleware\IsAdmin`

> Este documento es la **fuente de verdad para construir el panel de administración**.
> Describe exactamente qué expone la API implementada en `app/Modules/Product` y `app/Modules/Auth`,
> con contratos, validaciones y formatos de error reales (verificados contra el código).

---

## 1. Convenciones Globales

### 1.1 Headers

| Header | Valor |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer {access_token}` (excepto `login`) |

### 1.2 Envelope de éxito

Todas las respuestas exitosas usan el trait `app/Traits/ApiResponse`:

```json
{
  "success": true,
  "message": "Mensaje en español.",
  "data": { }
}
```

| Método helper | HTTP |
|---|---|
| `success()` | 200 |
| `created()` | 201 |
| `noContent()` | 200 (con `data: null`) |

### 1.3 Envelope de error (⚠️ importante)

**La API NO tiene un envelope único de error.** Depende del origen:

| Situación | HTTP | Formato |
|---|---|---|
| Errores de validación (FormRequest, `ValidationException`) | 422 | `{ "message": "...", "errors": { "campo": ["..."] } }` |
| Credenciales incorrectas / cuenta inactiva | 422 | `{ "message": "...", "errors": { "email": ["..."] } }` |
| SKU duplicado / sale_price > price / categoría con hijos | 422 | `{ "message": "...", "errors": { "variants": ["..."] } }` |
| No autenticado (Sanctum) | 401 | `{ "message": "Unauthenticated." }` |
| No admin (middleware `IsAdmin`) | 403 | `{ "success": false, "message": "No tienes permisos para acceder a esta sección.", "errors": null }` |
| No admin (en login) | 403 | `{ "success": false, "message": "No tienes permisos de acceso al panel de administración." }` |
| Recurso no encontrado (ModelNotFound) | 404 | `{ "message": "..." }` |

> El admin debe parsear **ambos formatos** (el `success:false` y el `message/errors` de Laravel).

---

## 2. Autenticación del Admin

Los endpoints de productos requieren token + rol `admin`. Solo `POST login` es público.

### 2.1 Login — `POST /api/v1/admin/auth/login`

Body:
```json
{ "email": "admin@whittard.com", "password": "secret" }
```

Reglas: `email` required+email, `password` required.
> `LoginRequest` define un rate limit de **5 intentos**, pero el código **no registra los intentos** (`RateLimiter::hit` nunca se llama), por lo que en la práctica no bloquea. No depender de ello.

Respuesta **200**:
```json
{
  "success": true,
  "message": "Bienvenido al panel de administración.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Admin",
      "email": "admin@whittard.com",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-08-03T01:00:00+00:00"
    },
    "access_token": "1|xxxxxxxxxxxxxxxxxxxx",
    "refresh_token": "2|xxxxxxxxxxxxxxxxxxxx",
    "token_type": "Bearer"
  }
}
```

> Solo el rol **exactamente `admin`** puede ingresar. Un cliente autenticado recibe **403** y sus tokens se revocan.

### 2.2 Logout — `POST /api/v1/admin/auth/logout` (protegido)

Respuesta **200**:
```json
{ "success": true, "message": "Sesión cerrada exitosamente.", "data": null }
```
El admin debe descartar el token en el cliente.

### 2.3 Me — `GET /api/v1/admin/auth/me` (protegido)

Respuesta **200**: `data` = mismo objeto `user` de arriba (UserResource).

---

## 3. Productos — Contrato Completo

### 3.1 Listar (paginado) — `GET /api/v1/admin/products`

Query params (librería `spatie/laravel-query-builder`):

| Param | Comportamiento |
|---|---|
| `filter[status]` | Igualdad exacta: `draft` \| `published` \| `archived` |
| `filter[category_id]` | Igualdad exacta (UUID) |
| `filter[search]` | LIKE sobre `name`, `slug`, `brand` |
| `sort` | `name`, `brand`, `created_at`, `updated_at` (prefijo `-` para desc). Default `-created_at` |
| `per_page` | Integer, default `15` |

Respuesta **200**:
```json
{
  "success": true,
  "message": "Listado de productos obtenido correctamente.",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Té Verde Matcha Ceremonial",
        "slug": "te-verde-matcha-ceremonial",
        "brand": "Whittard of Chelsea",
        "status": "published",
        "category": { "id": "uuid", "name": "Matcha", "slug": "matcha" },
        "variants_count": 2,
        "price_from": 28.5,
        "price_to": 45.0,
        "updated_at": "2026-08-03T01:00:00+00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 1,
      "last_page": 1
    }
  }
}
```

Notas para el listado:
- `price_from`/`price_to` = min/max de `sale_price ?? price` entre variantes.
- `category` es `null` si el producto no tiene categoría cargada.
- Paginación completa: enviar `per_page` + `page` (Laravel lee `page` automáticamente).
- Un producto sin variantes cargadas devuelve `price_from: null` y `price_to: null`.

### 3.2 Crear — `POST /api/v1/admin/products`

**Reglas de negocio críticas:**
- **Obligatorio ≥ 1 variante.**
- `sale_price` no puede superar `price`.
- SKU únicos dentro del producto y **globalmente** (no pueden existir en otro producto).
- `slug` opcional → se autogenera desde `name` si se omite.
- `status` válido: `draft | published | archived` (default `draft`).

**Body (contrato exacto de campos):**

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | required, ≤255 |
| `slug` | string? | unique, ≤255, autogen si omite |
| `category_id` | string(UUID) | required, debe existir |
| `brand` | string | required, ≤255 |
| `country_of_origin` | string | required, ≤255 |
| `short_description` | string? | |
| `long_description` | string? | Rich Text / HTML |
| `ingredients_description` | string? | Rich Text / HTML |
| `specifications_description` | string? | Rich Text / HTML |
| `status` | string? | `draft` \| `published` \| `archived` |
| `attribution_ids` | array<string(UUID)>? | cada una debe existir |
| `attribute_options` | array? | ver abajo |
| `variants` | array | **required, min 1** |

**`attribute_options[]`:** `type` (required, key técnica), `label` (required), `options` (required, min 1) de `{ value (required), swatch_image_url? }`.

**`variants[]`:**

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string(UUID)? | Solo en Update (upsert) |
| `sku` | string | required, ≤255, único global |
| `price` | number | required, ≥0 |
| `sale_price` | number? | ≥0, ≤ `price` |
| `stock` | integer? | ≥0, default 0 |
| `order` | integer? | ≥0, default índice |
| `attributes` | object? | combinación dinámica |
| `media` | array? | ver abajo |

**`media[]`:** `type` (**minúsculas** `image`\|`video`, required), `url` (required, ≤2048), `is_primary` (bool?, default false), `order` (int?, default 0).

**Ejemplo completo:**
```json
{
  "name": "Té Verde Matcha Ceremonial",
  "category_id": "uuid-subcat-1",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "short_description": "Té verde en polvo de grado ceremonial.",
  "long_description": "<p>Cosechado a mano en Uji, Japón.</p>",
  "ingredients_description": "<ul><li>100% hoja de té verde.</li></ul>",
  "specifications_description": "<table><tr><td>Conservación</td><td>Fresco y seco</td></tr></table>",
  "status": "published",
  "attribution_ids": ["uuid-attr-1", "uuid-attr-2"],
  "attribute_options": [
    {
      "type": "presentation",
      "label": "Presentación",
      "options": [
        { "value": "Lata Metálica", "swatch_image_url": "https://cdn.com/swatches/lata.png" },
        { "value": "Bolsa Recargable", "swatch_image_url": null }
      ]
    }
  ],
  "variants": [
    {
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "sale_price": null,
      "stock": 15,
      "order": 1,
      "attributes": { "presentation": "Lata Metálica", "weight": "100g" },
      "media": [
        { "type": "image", "url": "https://cdn.com/products/matcha-lata.jpg", "is_primary": true, "order": 1 }
      ]
    }
  ]
}
```

Respuesta **201**: `ProductResource` (ver §6).

Errores típicos (422, formato Laravel `{ message, errors }`):
- `variants.min` → "Debe incluir al menos una variante."
- `variants.0.sale_price` → "El precio de oferta no puede ser mayor al precio regular."
- `variants` → "El SKU 'X' ya está siendo usado por otro producto." / "Los SKU de las variantes deben ser únicos dentro del producto."

### 3.3 Detalle por ID — `GET /api/v1/admin/products/{id}`

Respuesta **200**: `ProductResource` (carga `category.parent`, `attributions`, `attributeOptions`, `variants.media`).
404 si no existe.

### 3.4 Detalle por Slug — `GET /api/v1/admin/products/by-slug/{slug}`

Respuesta **200**: `ProductResource`. 404 si el slug no existe.

### 3.5 Actualizar — `PUT|PATCH /api/v1/admin/products/{id}`

**Update es PARCIAL** (`sometimes`): solo envía lo que se modifica. **Mismo esquema de campos** que Create, con estas reglas de reemplazo:

| Si envías… | Comportamiento del servicio |
|---|---|
| `variants` | Upsert por `variants[].id` (si `id` coincide con una existente la actualiza; si no, crea). **Las variantes existentes NO incluidas en el payload se ELIMINAN.** |
| `variants[].media` | Se borra y recrea todo el media de esa variante. |
| `attribute_options` | Se borran y recrean todas (reemplazo total). |
| `attribution_ids` | `sync` → reemplaza la relación completa. |
| `slug` (no vacío) | Se regenera con sufijo si hay colisión. |
| descripciones | Se pueden setear explícitamente a `null`. |

> ⚠️ Para editar desde el admin: cargar el detalle (`GET .../products/{id}`), modificar los arrays y reenviarlos completos con los `id` de variantes/medios existentes intactos.

Respuesta **200**: `ProductResource`.

### 3.6 Eliminar — `DELETE /api/v1/admin/products/{id}`

Borrado **lógico** (soft delete; el recurso desaparece del listado).

Respuesta **200**:
```json
{ "success": true, "message": "Producto eliminado exitosamente.", "data": null }
```

---

## 4. Categorías — Contrato Completo

### 4.1 Listar — `GET /api/v1/admin/categories`

Sin paginación. Devuelve **todas** ordenadas por `name`, con `children_count` y `products_count`.

Respuesta **200**: `data` = array de `CategoryResource`:
```json
{
  "id": "uuid",
  "name": "Matcha",
  "slug": "matcha",
  "parent": { "id": "uuid", "name": "Té Verde", "slug": "te-verde" },
  "children_count": 0,
  "products_count": 3
}
```
`parent` es `null` para categorías raíz.

### 4.2 Crear — `POST /api/v1/admin/categories`

Body: `parent_id` (UUID?, debe existir — define Subcategoría), `name` (required, ≤255), `slug` (?, unique, autogen si omite).

Respuesta **201**: `CategoryResource` con contadores.

### 4.3 Detalle — `GET /api/v1/admin/categories/{id}`

Respuesta **200**: `CategoryResource` con contadores.

### 4.4 Actualizar — `PUT|PATCH /api/v1/admin/categories/{id}`

Parcial: `parent_id`, `name`, `slug` (cualquiera opcional). `parent_id` se puede setear a `null` explícitamente.

### 4.5 Eliminar — `DELETE /api/v1/admin/categories/{id}`

Respuesta **200**: `{ success, message: "Categoría eliminada exitosamente.", data: null }`.

**Reglas de bloqueo (422):**
- Tiene subcategorías → `errors.parent_id` = "No se puede eliminar una categoría que tiene subcategorías."
- Tiene productos → `errors.category_id` = "No se puede eliminar una categoría con productos asociados."

---

## 5. Sellos (Attributions) — Contrato Completo

### 5.1 Listar — `GET /api/v1/admin/attributions`

Sin paginación, ordenadas por `name`, con `products_count`.

```json
{
  "id": "uuid",
  "name": "100% Orgánico",
  "image_url": "https://cdn.com/badges/organic.png",
  "products_count": 5
}
```

### 5.2 Crear — `POST /api/v1/admin/attributions`

Body: `name` (required, ≤255), `image_url` (required, ≤2048, **URL válida**).

### 5.3 Detalle — `GET /api/v1/admin/attributions/{id}`

### 5.4 Actualizar — `PUT|PATCH /api/v1/admin/attributions/{id}`

Parcial: `name` y/o `image_url`.

### 5.5 Eliminar — `DELETE /api/v1/admin/attributions/{id}`

Borrado **físico** (el pivote `product_attribution` se limpia vía cascade). Cuidado: **no valida** si el sello está en uso.

---

## 6. `ProductResource` (Detalle — forma exacta)

```json
{
  "id": "uuid",
  "name": "Té Verde Matcha Ceremonial",
  "slug": "te-verde-matcha-ceremonial",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "descriptions": {
    "short": "…",
    "long": "<p>…</p>",
    "ingredients": "<ul>…</ul>",
    "specifications": "<table>…</table>"
  },
  "status": "published",
  "attributions": [
    { "id": "uuid", "name": "100% Orgánico", "image_url": "https://cdn.com/badges/organic.png" }
  ],
  "category": {
    "id": "uuid-subcat-1",
    "name": "Matcha",
    "slug": "matcha",
    "parent": { "id": "uuid", "name": "Té Verde", "slug": "te-verde" }
  },
  "attribute_options": [
    {
      "type": "presentation",
      "label": "Presentación",
      "options": [
        { "value": "Lata Metálica", "swatch_image_url": "https://cdn.com/swatches/lata.png" },
        { "value": "Bolsa Recargable", "swatch_image_url": null }
      ]
    }
  ],
  "variants": [
    {
      "id": "uuid-var-1",
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "sale_price": null,
      "stock": 15,
      "order": 1,
      "attributes": { "presentation": "Lata Metálica", "weight": "100g" },
      "media": [
        {
          "id": "uuid-media-1",
          "type": "IMAGE",
          "url": "https://cdn.com/products/matcha-lata.jpg",
          "is_primary": true,
          "order": 1
        }
      ]
    }
  ],
  "created_at": "2026-08-03T01:00:00+00:00",
  "updated_at": "2026-08-03T01:00:00+00:00"
}
```

**Mapeo exacto (revisar al construir formularios):**

| En la API (response) | En el payload de entrada |
|---|---|
| `descriptions.short` | `short_description` |
| `descriptions.long` | `long_description` |
| `descriptions.ingredients` | `ingredients_description` |
| `descriptions.specifications` | `specifications_description` |
| `attribute_options[].options[]` (sin id) | igual |
| `variants[].attributes` (objeto) | igual (objeto) |
| `media[].type` **"IMAGE"/"VIDEO"** (mayúscula) | `media[].type` **"image"/"video"** (minúscula) |
| `media[].id` presente | conservar el `id` para upsert |

Detalles de serialización:
- `price`/`sale_price` → **float** (ej. `28.5`, no string).
- `variants[].attributes` → siempre **objeto** `{}` (nunca `null`).
- `media[].type` → siempre **mayúsculas** en respuesta, minúsculas al enviar.
- Fechas → ISO 8601 string (`toDateTimeString`).

---

## 7. Reglas de Negocio Implementadas (resumen para UI)

| Regla | Dónde se valida | Cómo manejarlo en el admin |
|---|---|---|
| ≥1 variante por producto | Request | Bloquear guardado sin variantes |
| SKU único global | Service | Mostrar 422 de `variants` |
| `sale_price` ≤ `price` | Request (`after`) | Validar en el form antes de enviar |
| Slug autogenerado | Service | `slug` opcional; refresh desde detail |
| Soft delete de producto | Service | Quitar de la lista; no mostrar "restaurar" (no hay endpoint) |
| No eliminar categoría con hijos/productos | Service | Bloquear/deshabilitar delete con confirmación |
| Update reemplaza media/options/variants no enviados | Service | **Siempre enviar arrays completos** en edición |
| `attribution_ids` con `sync` | Service | Enviar lista completa de IDs seleccionados |
| Logout/rotación de token | Auth | Manejar 401 globalmente → redirigir a login |

---

## 8. Pendientes / Notas

- **No hay** endpoints públicos de productos (`GET /api/v1/products/{slug}`) en StoreFront; el contrato de `product-api.md` para ese canal sigue sin implementar.
- No existe endpoint para "restaurar" productos eliminados ni para cambiar estado en lote.
- El admin debe asumir que **cualquier 422 puede venir en formato Laravel** (`{ message, errors }`), no en el envelope `success`.
