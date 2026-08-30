# 🏷️ SEO en Productos — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-14
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`product-import-export.md`](./product-import-export.md) · [`sale-period-admin-integration.md`](./sale-period-admin-integration.md)

> Los productos ahora tienen un **bloque de SEO** opcional y compartido con otras
> entidades (categorías, y en el futuro blog). Se envía como objeto anidado `seo`
> en el mismo payload de create/update, y también se soporta en el **import/export**
> de Excel. La API autocompleta valores por defecto si no se envían.

---

## 1. Qué cambió

Se creó una tabla polimórfica `seo` que cualquier entidad puede "poseer"
(un producto, una categoría, un post de blog). Para el módulo de productos:

- El modelo `Product` ahora tiene relación `seo` (1 a 1).
- `ProductResource` expone el bloque `seo` en el detalle.
- El create/update acepta `seo` anidado.
- El import/export de Excel incluye columnas de SEO.

### Campos del bloque `seo`

| Campo | Tipo | ¿Obligatorio? | Descripción |
|---|---|---|---|
| `meta_title` | string (≤255) | No | Título SEO (autocompletado desde `name` si se omite) |
| `meta_description` | text | No | Meta descripción |
| `keywords` | array<string> | No | Palabras clave |
| `canonical_url` | string (≤2048) | No | URL canónica |
| `robots` | string (≤100) | No | `index, follow` (default) o `noindex, nofollow` |
| `og_title` | string (≤255) | No | Título de Open Graph (autocompletado desde `name`) |
| `og_description` | text | No | Descripción de Open Graph |
| `og_image` | string (≤2048) | No | Imagen de Open Graph |
| `structured_data` | object | No | JSON-LD estructurado |
| `noindex` | boolean | No | Si `true`, `robots` por defecto = `noindex, nofollow` |

> **Defaults automáticos (observer):** si `meta_title` u `og_title` no se envían,
> la API los completa con el `name` del producto. Si `robots` no se envía, usa
> `index, follow` (o `noindex, nofollow` si `noindex: true`).

---

## 2. Payload (Create de producto)

```json
{
  "name": "Té Verde Matcha Ceremonial",
  "category_id": "uuid-subcat-1",
  "brand": "Whittard of Chelsea",
  "country_of_origin": "Japón",
  "variants": [
    { "sku": "WTC-MAT-LAT-100", "price": 28.5 }
  ],
  "seo": {
    "meta_title": "Té Verde Matcha | Whittard",
    "meta_description": "Matcha ceremonial cosechado a mano en Uji, Japón.",
    "keywords": ["matcha", "té verde", "ceremonial"],
    "canonical_url": "https://tienda.com/te-verde-matcha-ceremonial",
    "robots": "index, follow",
    "og_title": "Matcha Ceremonial",
    "og_description": "Descubre nuestro matcha de grado ceremonial.",
    "og_image": "https://cdn.tiendawhittard.com/og/matcha.png",
    "structured_data": {
      "@type": "Product",
      "aggregateRating": { "ratingValue": 4.8, "reviewCount": 132 }
    },
    "noindex": false
  }
}
```

**Sin `seo`** → el producto se crea sin registro SEO (null). En el detalle
aparecerá `"seo": null`.

> En `multipart/form-data`, envía las claves planas del bloque, ej. `seo[meta_title]`,
> `seo[keywords][]`, `seo[noindex]` (con `1`/`0` o `true`/`false`).

---

## 3. Payload (Update de producto)

Reglas de update: `sometimes` + `nullable`. **Campos que no se envían NO se
tocan** (el resto del SEO existente se conserva).

```json
{
  "seo": {
    "meta_title": "Título Nuevo | Whittard",
    "noindex": true
  }
}
```

**Para eliminar el SEO completo:** enviar `"seo": null`.

```json
{
  "seo": null
}
```

> Resultado: se borra el registro `seo` del producto y el detalle devuelve
> `"seo": null`.

---

## 4. Respuesta del Detalle (`ProductResource`)

```json
{
  "data": {
    "id": "uuid",
    "name": "Té Verde Matcha Ceremonial",
    "slug": "te-verde-matcha-ceremonial",
    "...": "...",
    "seo": {
      "meta_title": "Té Verde Matcha | Whittard",
      "meta_description": "Matcha ceremonial cosechado a mano en Uji, Japón.",
      "keywords": ["matcha", "té verde", "ceremonial"],
      "canonical_url": "https://tienda.com/te-verde-matcha-ceremonial",
      "robots": "index, follow",
      "og_title": "Matcha Ceremonial",
      "og_description": "Descubre nuestro matcha de grado ceremonial.",
      "og_image": "https://cdn.tiendawhittard.com/og/matcha.png",
      "structured_data": {
        "@type": "Product",
        "aggregateRating": { "ratingValue": 4.8, "reviewCount": 132 }
      },
      "noindex": false
    }
  }
}
```

- Si el producto no tiene SEO, `seo` es `null`.
- `keywords` y `structured_data` siempre son objetos/arreglos JSON (o `null`).

---

## 5. Import / Export (Excel)

El export de productos ahora incluye las siguientes columnas SEO (al final,
después de `descripcion_especificaciones`):

| Columna del archivo | Campo `seo` |
|---|---|
| `titulo_seo` | `meta_title` |
| `descripcion_seo` | `meta_description` |
| `keywords_seo` | `keywords` (separados por coma: `matcha, té verde`) |
| `robots_seo` | `robots` |
| `canonical_seo` | `canonical_url` |
| `og_titulo` | `og_title` |
| `og_descripcion` | `og_description` |
| `og_imagen` | `og_image` |
| `noindex` | `noindex` (`1` / `0`) |

**Reglas del import:**

- Las columnas SEO son **opcionales**: si vienen vacías no se toca el SEO.
- Al **crear** un producto con esas columnas, se guarda el bloque SEO.
- Al **actualizar** (por `code` o `sku`), solo se actualizan los campos SEO que
  vengan con valor; el resto se conserva.
- En **crear sin SEO** se aplican los defaults (title desde `name`, etc.).
- Si quieres **limpiar** el SEO de un producto vía import, usa el endpoint de
  update con `"seo": null`; el import no borra SEO (omite columnas vacías).

---

## 6. Checklist de Integración en el Admin

- [ ] En el formulario de producto, agregar una sección/panel "SEO".
- [ ] Campos: `meta_title`, `meta_description`, `keywords` (tags), `canonical_url`,
      `robots`, `og_title`, `og_description`, `og_image`, `noindex` (toggle).
- [ ] En create: enviar `seo` anidado solo si el admin llenó al menos un campo.
- [ ] En edit: precargar el bloque `seo` desde el detalle y reenviar **todos** los
      campos que quieras conservar (el update solo cambia lo enviado).
- [ ] Toggle "No indexar" → envía `noindex: true`; la API ajusta `robots`.
- [ ] Al editar, si el bloque `seo` es `null`, mostrar el formulario vacío.
- [ ] Botón "Quitar SEO" → enviar `"seo": null`.
- [ ] En el export, las columnas SEO vienen al final; al importar un archivo
      exportado se conserva el SEO.

---

## 7. Archivos afectados

- `database/migrations/2026_08_14_000001_create_seo_table.php` — tabla polimórfica `seo`
- `app/Models/Seo.php` — modelo `Seo` (`morphTo seoable`, casts JSON/boolean)
- `app/Traits/HasSeo.php` — relación `seo()` reutilizable por cualquier modelo
- `app/Observers/SeoObserver.php` — autocompletado de defaults
- `app/Models/Product.php` — trait `HasSeo`
- `app/Models/Category.php` — trait `HasSeo`
- `app/Modules/Product/Requests/StoreProductRequest.php` y `UpdateProductRequest.php` — reglas `seo.*`
- `app/Modules/Product/Services/ProductService.php` — persistencia (`syncSeo`), import (`buildSeoPayload`) y eager-load de `seo`
- `app/Modules/Product/Exports/ProductsExport.php` — columnas SEO en el export
- `app/Modules/Product/Resources/ProductResource.php` — exposición del bloque `seo`
- `tests/Feature/Product/ProductCrudTest.php` y `ProductImportExportTest.php` — tests

---

## 8. Tests cubiertos

- `al_crear_un_producto_se_guarda_el_seo_enviado`
- `al_crear_sin_seo_se_completan_los_valores_por_defecto`
- `al_actualizar_se_actualiza_el_seo_del_producto`
- `al_actualizar_con_seo_vacio_se_elimina_el_registro_seo`
- `el_export_incluye_las_columnas_y_valores_seo`
- `el_import_guarda_el_seo_desde_las_columnas_del_archivo`
- `el_import_actualiza_el_seo_de_un_producto_existente`
