# 🔗 Productos Combinables y Similares — Integración en Crear/Editar Producto (Admin)

**Versión:** 1.0.0
**Fecha:** 2026-09-07
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Reemplaza a:** [`product-relations-admin-integration.md`](./product-relations-admin-integration.md) (v2, endpoints `/relations` ya eliminados)
**Relacionado:** [`product-api.md`](./product-api.md)

> El objetivo de este spec es que el **formulario de crear/editar producto** del admin
> guarde correctamente los **productos combinables** y **productos similares** **sin
> llamadas extra ni endpoints viejos**, dejando la pantalla funcionando como hasta ahora.

---

## 1. Resumen del cambio (qué pasó en el backend)

Antes existían dos endpoints dedicados para las relaciones:

- ~~`GET /api/v1/admin/products/{product}/relations`~~ → **eliminado**
- ~~`PUT /api/v1/admin/products/{product}/relations`~~ → **eliminado**

Ahora las relaciones se guardan **junto con el producto**, dentro del payload de:

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/v1/admin/products` | Crear producto |
| PUT | `/api/v1/admin/products/{product}` | Editar producto |
| GET | `/api/v1/admin/products/{product}` | Detalle (devuelve las relaciones precargadas) |

Si tu frontend aún llama a los endpoints de `/relations`, recibirá **404** y hay que quitarlos.

**Reglas de negocio (tabla `product_relations`):**

- Dos tipos: `combinable` y `similar`.
- Cada lista se **reemplaza por completo** cuando se envía.
- `[]` vacía la lista.
- Si el campo **no se envía**, esa lista **no se toca**.
- No se permite relacionar un producto consigo mismo (422).
- El detalle de producto (GET) incluye `combinable_products` y `similar_products` ya cargados.

---

## 2. Nuevos campos del payload

En **crear** (`POST`) y **editar** (`PUT`) de `/products`, agrega estos dos campos **snake_case**:

| Campo | Tipo | Descripción |
|---|---|---|
| `combinable_product_ids` | `string[]` (uuids) | Productos combinables seleccionados |
| `similar_product_ids` | `string[]` (uuids) | Productos similares seleccionados |

Ambos son **opcionales** en crear y en editar.

### 2.1 Crear

```http
POST /api/v1/admin/products
```

```json
{
  "name": "Té Blanco",
  "category_id": "uuid-categoria",
  "brand": "Whittard of Chelsea",
  "status": "published",
  "combinable_product_ids": ["uuid-prod-2", "uuid-prod-3"],
  "similar_product_ids": ["uuid-prod-4"],
  "variants": [
    {
      "sku": "WTC-BLANCO-100",
      "price": 20.0,
      "stock": 10
    }
  ]
}
```

**Respuesta:** `201 Created` con `data.combinable_products` y `data.similar_products`.

### 2.2 Editar

```http
PUT /api/v1/admin/products/{product}
```

```json
{
  "name": "Té Blanco Premium",
  "combinable_product_ids": ["uuid-prod-5"],
  "similar_product_ids": [],
  "variants": [
    {
      "id": "uuid-variante-existente",
      "sku": "WTC-BLANCO-100",
      "price": 24.0,
      "stock": 12
    }
  ]
}
```

**Respuesta:** `200 OK`.

### 2.3 Semántica de la edición (importante para no romper nada)

| Situación | Payload | Resultado |
|---|---|---|
| Guardar el formulario completo con selección | ambas listas con lo elegido | Se reemplazan las dos |
| Quitar todos los combinables de la sección | `"combinable_product_ids": []` | Combinables vacíos |
| Editar otra cosa (ej. solo SEO) sin tocar relaciones | omitir ambos campos | Relaciones **intactas** |
| Mandar solo una lista | solo `combinable_product_ids` | Similares **intactos** |

> ✅ **Recomendación:** en el guardado del formulario completo de producto, envía
> **siempre las dos listas** (con `[]` si la sección quedó vacía). Así el estado en
> pantalla siempre coincide con lo guardado.

---

## 3. Cómo precargar las relaciones al editar

No hace falta ningún endpoint extra. Al abrir el formulario de edición (con el detalle
que ya obtienes), lee los ids desde la respuesta:

```http
GET /api/v1/admin/products/{product}
```

```json
{
  "data": {
    "id": "uuid-prod-1",
    "name": "Té Verde",
    "...": "...",
    "combinable_products": [
      {
        "id": "uuid-prod-2",
        "name": "Té Negro",
        "slug": "te-negro",
        "code": "TE-NEGRO",
        "brand": "Whittard",
        "status": "published",
        "category": { "id": "uuid-cat", "name": "Té Negro", "slug": "te-negro" },
        "variants_count": 2,
        "price_from": 20.0,
        "price_to": 25.0
      }
    ],
    "similar_products": []
  }
}
```

Para precargar los selectores:

```ts
const product = res.data.data;
const combinableIds = product.combinable_products.map((p) => p.id);
const similarIds    = product.similar_products.map((p) => p.id);
```

---

## 4. Tipos (TypeScript)

```ts
export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  code: string;
  brand: string;
  status: string;
  category: { id: string; name: string; slug: string } | null;
  variants_count: number | null;
  price_from: number | null;
  price_to: number | null;
}

// Dentro del detalle del producto (GET /products/{id})
export interface ProductDetailData {
  id: string;
  name: string;
  // ... resto de campos
  combinable_products: RelatedProduct[];
  similar_products: RelatedProduct[];
}

// Payload de crear/editar (POST/PUT /products)
export interface SaveProductPayload {
  name: string;
  category_id: string;
  brand: string;
  status?: string;
  variants: Array<{
    id?: string;
    sku: string;
    price: number;
    sale_price?: number | null;
    sale_price_starts_at?: string | null;
    sale_price_ends_at?: string | null;
    stock?: number;
    is_primary?: boolean;
    is_active?: boolean;
    attributes?: Record<string, string>;
    media?: Array<{ type: string; url?: string; file?: File; is_primary?: boolean; order?: number }>;
  }>;
  // 👇 nuevos campos de relaciones
  combinable_product_ids?: string[];
  similar_product_ids?: string[];
}
```

---

## 5. Manejo de errores (422)

Si algún id no existe o el producto se relaciona consigo mismo, **no se guarda nada**
(el backend valida en transacción):

```json
{
  "success": false,
  "message": "Alguno de los productos combinables no existe.",
  "errors": {
    "combinable_product_ids": ["Alguno de los productos combinables no existe."]
  }
}
```

```json
{
  "success": false,
  "message": "Un producto no puede relacionarse consigo mismo.",
  "errors": {
    "combinable_product_ids": ["Un producto no puede relacionarse consigo mismo."]
  }
}
```

> No dejes que el selector agregue el producto que se está editando: el backend lo
> rechaza con 422 (evita un guardado fallido de todo el formulario).

---

## 6. Checklist para el frontend (no romper nada)

- [ ] **Eliminar** todas las llamadas a `GET/PUT /api/v1/admin/products/{product}/relations`.
- [ ] **Eliminar** la precarga que usaba `GET .../relations`; precargar ahora desde el detalle `GET /products/{product}` (`combinable_products[].id`, `similar_products[].id`).
- [ ] En **crear**: agregar `combinable_product_ids` y `similar_product_ids` al payload de `POST /products`.
- [ ] En **editar**: agregar ambos campos al payload de `PUT /products/{product}`, siempre como arreglo (usar `[]` si no hay selección).
- [ ] **Eliminar** el guardado "por separado" que se disparaba después del PUT (ya no existe).
- [ ] Tras guardar, usar la respuesta (`201`/`200`) para refrescar la UI; no es necesario otro GET.
- [ ] Validar en pantalla que el selector no permita autoseleccionar el producto actual.
- [ ] Mostrar los ids que ya venían en el detalle como seleccionados al abrir edición.

---

## 7. Lo que NO cambia

- **Storefront / tienda**: el detalle público sigue exponiendo `combinable_products` y
  `similar_products` (formato `ProductCardResource`). No requiere cambios.
- La respuesta del admin y del storefront conservan sus formatos (`ProductResource` /
  `ProductDetailResource`).

---

## 8. Tests del backend que respaldan este contrato

- `al_crear_un_producto_se_guardan_los_combinables_y_similares`
- `al_actualizar_se_guardan_y_reemplazan_las_listas_por_separado`
- `al_actualizar_se_pueden_limpiar_las_listas`
- `no_se_permite_auto_relacionarse`
- `las_relaciones_se_muestran_en_el_detalle_del_producto`
