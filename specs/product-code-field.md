# 🏷️ Campo `code` en Producto — Guía de Integración

**Versión:** 1.0.0
**Fecha:** 2026-08-12
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`media-admin-integration.md`](./media-admin-integration.md)

> Actualización del módulo Producto para agregar un **código único** por producto
> (`code`). El código es **opcional de enviar** en la creación (se autogenera) y
> **editable** en la actualización, siempre manteniendo la unicidad entre productos.

---

## 1. Qué cambió

Se agrega el campo `code` a la tabla `products`:

| Campo | Tipo | ¿Obligatorio? | Descripción |
|---|---|---|---|
| `code` | string (≤255) | **No** (se autogenera si se omite) | Código único del producto, editable en update |

**Comportamiento:**

- **Create:** si NO envías `code`, la API lo **autogenera** a partir del `name`
  (sluggificado en MAYÚSCULAS), añadiendo un sufijo numérico si ya existe
  (ej. `TE-VERDE-MATCHA`, `TE-VERDE-MATCHA-2`). Si lo envías, se usa tal cual y se
  valida que sea único.
- **Update:** si envías `code`, se actualiza validando **unicidad ignorando el propio
  producto** (puedes mantenerlo o cambiarlo). Si no lo envías, se conserva el actual.
- **Búsqueda:** el scope `search` ahora también busca por `code`.

> **Cambio de infraestructura:** la columna se agregó en la migración
> `create_products_table` (2026-08-03_000003). Como se está en desarrollo, no hay
> migración nueva: se aplica con `php artisan migrate:fresh --seed`.

---

## 2. Reglas que valida la API (422)

| Situación | Campo de error | Mensaje |
|---|---|---|
| `code` ya usado por otro producto (create o update) | `code` | Mensaje por defecto de `Rule::unique` ("The code has already been taken.") |

> Nota: `Rule::unique` genera el mensaje por defecto de Laravel. Si quieres un mensaje
> en español, se puede agregar `'code.unique' => 'El código ya está en uso por otro producto.'`
> en `messages()`.

---

## 3. Payload (Create de producto)

```json
{
  "name": "Té Verde Matcha Ceremonial",
  "category_id": "uuid-subcat-1",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "code": "WTC-2026-MAT-01",
  "variants": [
    {
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5
    }
  ]
}
```

**Omitiendo `code`** → se autogenera:

```json
{
  "name": "Té Verde Matcha Ceremonial",
  "category_id": "uuid-subcat-1",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "variants": [
    { "sku": "WTC-MAT-LAT-100", "price": 28.5 }
  ]
}
```

> Respuesta esperada: `"code": "TE-VERDE-MATCHA-CEREMONIAL"`.

---

## 4. Payload (Update de producto)

```json
{
  "code": "WTC-EDITADO"
}
```

**Reglas de update:** `sometimes` + `nullable` + `string` + `max:255` +
`Rule::unique('products', 'code')->ignore(route('product'))`.

---

## 5. Respuesta del Resource

`ProductResource` y `ProductListResource` exponen `code`:

```json
{
  "data": {
    "id": "uuid",
    "name": "Té Verde Matcha Ceremonial",
    "slug": "te-verde-matcha-ceremonial",
    "code": "TE-VERDE-MATCHA-CEREMONIAL",
    "brand": "Whittard of Chelsea",
    "...": "..."
  }
}
```

---

## 6. Archivos afectados

- `database/migrations/2026_08_03_000003_create_products_table.php` — columna `code`
- `app/Models/Product.php` — `$fillable` + `scopeSearch`
- `app/Modules/Product/Requests/StoreProductRequest.php` — regla create
- `app/Modules/Product/Requests/UpdateProductRequest.php` — regla update
- `app/Modules/Product/Services/ProductService.php` — autogeneración (`uniqueCode`) en create y edición en update
- `app/Modules/Product/Resources/ProductResource.php` y `ProductListResource.php` — exposición del campo
- `database/factories/ProductFactory.php` — código por defecto
- `tests/Feature/Product/ProductCrudTest.php` — tests de autogeneración y unicidad

---

## 7. Tests cubiertos

- `el_code_se_genera_automaticamente_cuando_no_se_envia`
- `al_crear_se_puede_enviar_un_code_personalizado`
- `el_code_debe_ser_unico_al_crear`
- `al_actualizar_se_puede_cambiar_el_code_y_mantener_la_unicidad`
