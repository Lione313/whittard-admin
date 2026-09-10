# MEGA MENÚ + LANDINGS — Guía de Integración Admin (Angular)

**Versión:** 1.0
**Fecha:** 2026-09-06
**Audiencia:** Frontend Admin (Angular)
**Base URL:** `/api/v1/admin`
**Formato:** JSON (sin multipart por ahora)
**Autenticación:** token (login de admin) + rol `admin`
**Envelope:** `{ success, message, data }` · errores de validación: `{ message, errors }` (HTTP 422)
**Backend ya implementado** (ver `specs/megamenu.md` y `specs/landings.md`)

> Guía para construir, dentro del admin, un **módulo nuevo "Mega Menú"** con dos
> secciones: **Menú de navegación** y **Landings**. Es **independiente** del módulo
> de Productos → Categorías (ahí se crean categorías/subcategorías; aquí solo se
> consultan con pickers).

---

## 1. Lo que hace el admin

### 1.1 Mega Menú (sección "Menú")
- Arma la barra de navegación comercial: elige **categorías raíz del catálogo**
  (solo categorías padre), las ordena, las activa/desactiva.
- Por raíz define **secciones** (columnas/títulos) e **items**.
- Tipo de item: `custom_url` (label + url libre). Las subcategorías se muestran con
  el toggle **"Auto mostrar subcategorías"** de cada raíz, no como items.
- Guardado **completo de una vez** (reemplazo): el orden en pantalla = orden final.

### 1.2 Landings (sección "Landings")
- CRUD de landings. Una landing es una **página** que **siempre se asocia a una
  categoría principal (raíz)** del catálogo (por **slug** o id). Las subcategorías no
  tienen landing. Cada categoría principal puede tener **0..1** landing.
- Publicar/despublicar (solo las publicadas salen en el storefront y se pueden
  enlazar en el menú).

---

## 2. Endpoints

Todos bajo `/api/v1/admin` con el token de admin (rol `admin`).

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/admin/navigation/megamenu` | Config completa del menú (incluye inactivos e items inválidos) |
| POST | `/admin/navigation/save` | Guarda la configuración completa (reemplazo) |
| GET | `/admin/navigation/catalog` | Picker de categorías (árbol + `products_count` + `landing_slug`) |
| GET | `/admin/navigation/landings` | Landings publicadas (usado por el editor de landings para "destacadas") |
| GET | `/admin/landings` | Lista landings (filtros `status`, `category_id`) |
| POST | `/admin/landings` | Crea landing asociada a una **categoría principal** (`category_id` o `category_slug`) |
| GET | `/admin/landings/{landing}` | Detalle de landing (incluye `seo`) |
| PUT | `/admin/landings/{landing}` | Edita landing (parcial) |
| DELETE | `/admin/landings/{landing}` | Elimina landing |

> `landing` en la URL es el **UUID** (id) de la landing.

---

## 3. Envelope y errores

Éxito:

```json
{ "success": true, "message": "Configuración del menú guardada correctamente.", "data": { ... } }
```

Validación (422, Laravel estándar):

```json
{ "message": "The given data was invalid.",
  "errors": {
    "roots.0.sections.0.items.0.landing_id": ["La landing es obligatoria y debe estar publicada."]
  } }
```

Mensajes útiles:
- `"La categoría ya fue agregada como raíz del menú."` → `roots.{i}.category_id`
- `"La landing es obligatoria y debe estar publicada."` → `roots.{i}.sections.{j}.items.{k}.landing_id`
- `"Los items de URL personalizada requieren label y url."` → `roots.{i}.sections.{j}.items.{k}.url`
- Landing: `"Esta categoría ya tiene una landing configurada."` → `errors.category_id`
- Landing: `"Envía solo category_id o category_slug, no ambos."` → `errors.category_slug`
- Landing: `"La landing siempre debe asociarse a una categoría principal."` → `errors.category_id`
- Landing: `"La landing solo se puede asociar a una categoría principal."` (si se elige una subcategoría) → `errors.category_id`

> ⚠️ Los errores del menú usan **claves con puntos** (`roots.0.sections.0.items.0.…`).
> En Angular, al iterar un `FormGroup`, normaliza la clave (p. ej. split por `.`) para
> mapearla al control correspondiente.

---

## 4. Sección "Mega Menú" — flujo y contratos

### 4.1 Cargar (`GET /admin/navigation/megamenu`)

Respuesta `data`:

```jsonc
{
  "roots": [
    {
      "id": 1,
      "category_id": "01a055f5-2f7b-7343-b5f4-cbd0676c9854",
      "name": "Té",
      "slug": "te",
      "url": "/landing/te",             // /catalogo/te si NO tiene landing publicada
      "auto_children": true,
      "auto_children_title": "Explora por tipo", // null → "Categorías"
      "is_active": true,
      "sort_order": 0,
      "sections": [
        {
          "id": 10,
          "title": "Enlaces",
          "is_active": true,
          "sort_order": 0,
          "items": [
            { "id": 100, "type": "custom_url",
              "label": "Promociones", "url": "/promociones",
              "is_active": true, "sort_order": 0, "valid": true }
          ]
        }
      ]
    }
  ]
}
```

Notas para la UI:
- `sections` / `items` incluyen también los **inactivos** (pueden no estar visibles en el storefront). Muéstralos con toggle activo.
- Los items son solo **URL propia** (`label` + `url`). Las subcategorías se controlan con `auto_children` / `hidden_child_ids` por raíz.
- `valid: false` = item sin `url` válida. Resáltalo y deja que el usuario lo corrija o lo quite.

### 4.2 Guardar (`POST /admin/navigation/save`)

El **payload es el estado final** del menú. Orden del array = `sort_order` final.
Los `id` se envían solo para editar registros existentes (si vienen, se actualizan;
si faltan, se crean; los que ya no están en el payload se eliminan).

```jsonc
{
  "roots": [
    {
      "category_id": "01a055f5-2f7b-7343-b5f4-cbd0676c9854",   // id opcional en update
      "auto_children": true,
      "auto_children_title": "Explora por tipo", // opcional (null → "Categorías")
      "is_active": true,
      "sections": [
        {
          "id": 10,                        // opcional en update
          "title": "Tipos de té",
          "is_active": true,
          "items": [
            { "id": 100, "type": "custom_url", "label": "Promociones", "url": "/promociones" }
          ]
        }
      ]
    }
  ]
}
```

Reglas que valida el backend:
- `category_id` por raíz: requerido, debe existir y **no repetirse**.
- Item `custom_url` → `label` y `url` obligatorios (es el único tipo de item).
- Respuesta 200 = misma estructura de `GET /navigation/megamenu`.

**Construcción en Angular:** parte de la respuesta 4.1, editas los arrays, y al guardar
envías **todo** el árbol (no diffs). Reordenar = reordenar el array (drag & drop); el
backend usa el índice.

### 4.3 Picker de categorías (`GET /admin/navigation/catalog`)

```jsonc
{ "success": true, "data": { "categories": [
  { "id": "…", "name": "Té", "slug": "te", "products_count": 40,
    "landing_slug": null, "children": [
      { "id": "…", "name": "Té Negro", "slug": "te-negro", "products_count": 12,
        "landing_slug": "te-negro", "children": [] }
    ] }
] } }
```

- Solo lectura del catálogo (módulo Productos → Categorías). No crea ni edita categorías.
- `landing_slug` ≠ null → esa categoría **ya tiene landing** (el link del menú usará la landing).

### 4.4 Landings publicadas (`GET /admin/navigation/landings`)

```jsonc
{ "success": true, "data": { "landings": [
  { "id": "…uuid…", "title": "Recetas con té", "slug": "recetas", "url": "/landing/recetas" }
] } }
```

Solo landings **publicadas**. Este endpoint lo consume el editor de landings para el
carrusel de "landings destacadas".

### 4.5 UX sugerida

- Navbar a la izquierda: **Mega Menú** → subitems **"Menú"** y **"Landings"**.
- Pantalla Menú: lista de raíces (accordion/árbol). Botón "+ Agregar raíz" abre el
  picker `navigation/catalog` (solo categorías padre, sin repetir). Por raíz: toggle
  activo, toggle `auto_children`, campo `auto_children_title` (título de la columna de
  subcategorías; vacío → "Categorías"), y secciones con items de URL propia.
- `auto_children ON` → el storefront **siempre** muestra la columna de subcategorías
  (sección "Categorías"); las secciones configuradas se muestran como columnas
  adicionales, después de la de subcategorías.
- Botón **Guardar** (envía `save` con el árbol completo). Deshabilitar hasta que no
  haya cambios o mientras `valid:false` en items.
- Mensajes de error: mapear `errors.roots.{i}.…` al nodo correspondiente.

---

## 5. Sección "Landings" — flujo y contratos

### 5.1 Listar (`GET /admin/landings?status=published&category_id=…`)

`data` = array. Cada item (sin SEO en el listado):

```jsonc
{
  "id": "…uuid…",
  "title": "Té",
  "slug": "te",
  "url": "/landing/te",
  "category_id": "…uuid de la categoría principal…",
  "category": { "id": "…", "name": "Té", "slug": "te" },
  "status": "published",
  "content": { },
  "published_at": "2026-09-06T12:00:00+00:00",
  "created_at": "…", "updated_at": "…"
}
```

> `category_id` siempre viene con valor: la landing pertenece a una categoría principal.

### 5.2 Crear (`POST /admin/landings`) — 201

```jsonc
{
  "title": "Té",
  "category_slug": "te",           // o "category_id"; la categoría debe ser PRINCIPAL
  "slug": "te",                    // opcional (auto desde el slug de la categoría)
  "status": "draft",               // draft | published
  "content": { "hero": { "title": "Bienvenido", "is_visible": true } },
  "seo": { "meta_title": "…", "meta_description": "…", "keywords": [], "og_image": "…", "noindex": false }
}
```

- El editor de categoría usa un select/autocomplete alimentado de
  `GET /admin/navigation/catalog` mostrando **solo categorías principales** (nodos raíz;
  las subcategorías aparecen anidadas pero NO son seleccionables para landing).
- `content` es **JSON libre** (bloques `hero`, `banners`, `cards`…). Cada bloque puede
  llevar `is_visible` (los falsos no se muestran en el storefront). Edítalo como editor
  visual/JSON según tu CMS.
- `seo` es el mismo bloque que ya usan Productos/Categorías (validación compartida).

Errores 422 típicos:
- `category_id`: `"La landing siempre debe asociarse a una categoría principal."` (sin categoría)
- `category_id`: `"La landing solo se puede asociar a una categoría principal."` (se eligió subcategoría)
- `category_id`: `"Esta categoría ya tiene una landing configurada."`
- `category_slug`: `"Envía solo category_id o category_slug, no ambos."` / `"La categoría seleccionada no existe."`

### 5.3 Editar / publicar (`PUT /admin/landings/{landing}`)

Actualización **parcial** (solo envía lo que cambia). Para publicar/despublicar:

```jsonc
{ "status": "published" }
```

Al publicar, el backend setea `published_at`. Respuesta 200 = landing con `seo`.

### 5.4 Eliminar (`DELETE /admin/landings/{landing}`)

- 200 `noContent`. Si la landing estaba enlazada en el menú, su item se elimina
  automáticamente (FK cascade).
- Si se borra la **categoría principal** asociada, su landing también se elimina (FK
  cascade) y, con ella, sus enlaces del menú.
- Advertencia en UI antes de borrar: "Las landing borradas eliminan sus enlaces del menú."

### 5.5 UX sugerida

- Tabla de landings con filtro por estado y búsqueda; acciones editar/publicar/eliminar.
- Formulario: datos generales (title, slug, categoría opcional), contenido (bloques),
  SEO (misma pestaña que productos/categorías).
- Badge cuando la landing está asociada a categoría (slug) y aviso si esa categoría ya
  tiene otra landing (el backend rechaza con 422).

---

## 6. Checklist de aceptación del módulo admin

- [ ] Módulo nuevo "Mega Menú" visible en el menú del admin (junto a Productos/Categorías).
- [ ] "Menú": cargar/guardar config; agregar raíz desde el picker (solo categorías padre, sin duplicados); ordenar; activar/desactivar; agregar secciones e items de URL propia; badge `valid:false`.
- [ ] Los errores de validación del `save` se muestran en el nodo correcto.
- [ ] "Landings": listar/filtrar, crear asociada a una categoría principal (por slug o id, sin permitir subcategorías ni categorías repetidas), editar contenido y SEO, publicar/despublicar, eliminar.
- [ ] Después de guardar un menú con raíz nueva, el storefront (`GET /api/v1/navigation/megamenu`) lo refleja (verificable con el API si hay acceso).
- [ ] Ningún endpoint del catálogo/productos/content se toca desde el admin.
