# 🔗 Productos Relacionados (Combinables + Similares) — Guía de Integración para el Admin

**Versión:** 2.0.0
**Fecha:** 2026-08-16
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md)

> Gestión de **dos tipos de relación** por producto:
> - **Combinables** (`combinable`): productos que el admin elige como combinables con el producto (cross-sell, combos, aditamentos).
> - **Similares** (`similar`): productos alternativos / sustitutos.

---

## 1. Qué cambió

**Tabla `product_relations`** (pivote con tipo):

| Columna | Tipo | Descripción |
|---|---|---|
| `product_id` | uuid FK | Producto origen |
| `related_product_id` | uuid FK | Producto relacionado |
| `type` | enum | `combinable` \| `similar` |
| `timestamps` | | |

**Reglas:**
- No se permite auto-relación (`product_id != related_product_id`).
- Sin duplicados (PK compuesta `product_id + related_product_id + type`).
- Un mismo producto puede estar como combinable y a la vez como similar (filas distintas).
- El PUT **reemplaza cada lista por separado** (si no mandás una lista, esa lista no se toca).

---

## 2. Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/products/{product}/relations` | Relaciones (combinables + similares) del producto |
| PUT | `/api/v1/admin/products/{product}/relations` | Reemplaza las listas de combinables y/o similares |

### Actualizar relaciones (sync)

```json
PUT /api/v1/admin/products/{product}/relations
{
  "combinable_product_ids": ["uuid-prod-2", "uuid-prod-3"],
  "similar_product_ids": ["uuid-prod-4"]
}
```

> Ambas listas son opcionales. La lista ausente no se modifica; la enviada se
> reemplaza por completo (si mandás `[]`, se vacía).

**Validaciones (422):** cada id debe existir; no se permite el propio producto.

---

## 3. Respuesta del Detalle (`ProductResource`)

El detalle expone `combinable_products` y `similar_products` (formato `ProductListResource`):

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
        "price_from": 20.0,
        "price_to": 25.0
      }
    ],
    "similar_products": []
  }
}
```

---

## 4. Checklist de Integración en el Admin

- [ ] En el detalle del producto, sección "Productos combinables" y "Productos similares".
- [ ] Dos selectores múltiples independientes (uno por tipo) + botón guardar.
- [ ] Precargar los IDs actuales desde `GET /products/{id}/relations`.
- [ ] Mostrar los combinables y similares en la página pública del producto (tienda).

---

## 5. Archivos afectados

- `database/migrations/2026_08_15_000006_create_product_relations_table.php`
- `app/Models/Product.php` (relaciones `combinableProducts`, `similarProducts`)
- `app/Modules/Product/Services/ProductService.php` (`relations`, `syncRelations`)
- `app/Modules/Product/Controllers/BackOffice/ProductController.php`
- `app/Modules/Product/Requests/UpdateRelationsRequest.php`
- `app/Modules/Product/Resources/ProductResource.php`

---

## 6. Tests cubiertos

- `un_admin_puede_sincronizar_productos_combinables_y_similares`
- `el_sync_reemplaza_cada_lista_por_separado`
- `no_se_permite_auto_relacionarse`
- `un_admin_puede_consultar_las_relaciones`
