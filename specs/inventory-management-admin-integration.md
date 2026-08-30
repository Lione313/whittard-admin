# 📦 Gestión de Inventario — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-15
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`inventory-admin-integration.md`](./inventory-admin-integration.md) · [`inventory-stock-threshold-admin-integration.md`](./inventory-stock-threshold-admin-integration.md)

> Endpoints para la **vista de gestión de inventario**: listado completo con
> búsqueda/filtros, resumen estadístico, ajuste en lote y movimientos globales.

---

## 1. Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/inventory` | Listado completo de inventario (búsqueda, filtros, orden, paginación) |
| GET | `/inventory/summary` | Resumen estadístico del inventario |
| GET | `/inventory/movements` | Movimientos de todas las variantes (paginado y filtrable) |
| POST | `/inventory/adjust-batch` | Ajuste de stock de varias variantes en un solo request |

> Los endpoints de variante individual (`stock-adjust`, `stock-movements`) y el
> umbral global (`low-stock-threshold`) siguen disponibles; ver
> `inventory-admin-integration.md`.

---

## 2. Listado completo — `GET /inventory`

### Parámetros (query)

| Parámetro | Valores | Descripción |
|---|---|---|
| `search` | texto | Busca por SKU o nombre de producto (`LIKE`) |
| `filter` | `low` · `out_of_stock` · `available` | Filtro de disponibilidad |
| `sort` | `sku` (default) · `stock` · `reserved_qty` · `available` · `created_at` | Orden |
| `direction` | `asc` (default) · `desc` | Dirección del orden |
| `per_page` | entero (default 15) | Paginación |

### Respuesta

```json
{
  "success": true,
  "message": "Inventario.",
  "data": {
    "items": [
      {
        "id": "uuid-variant",
        "sku": "WTC-MAT-100",
        "product_id": "uuid-product",
        "product_name": "Té Matcha",
        "stock": 8,
        "reserved_qty": 2,
        "available": 6,
        "is_low": true
      }
    ],
    "pagination": { "current_page": 1, "per_page": 15, "total": 1, "last_page": 1 }
  }
}
```

**Definiciones:**
- `available = stock - reserved_qty`.
- `is_low = available <= low_stock_threshold` (umbral global; ver spec del umbral).

---

## 3. Resumen — `GET /inventory/summary`

```json
{
  "success": true,
  "message": "Resumen de inventario.",
  "data": {
    "total_variants": 240,
    "total_products": 85,
    "total_units": 1520,
    "total_reserved": 34,
    "total_available": 1486,
    "low_stock_count": 12,
    "out_of_stock_count": 3,
    "inventory_value": 45280.5
  }
}
```

| Campo | Descripción |
|---|---|
| `total_variants` | Total de variantes |
| `total_products` | Total de productos con al menos una variante |
| `total_units` | Suma de `stock` |
| `total_reserved` | Suma de `reserved_qty` |
| `total_available` | Suma de unidades disponibles (`stock - reserved_qty`, sin negativos) |
| `low_stock_count` | Variantes bajo el umbral global o con `stock <= 0` |
| `out_of_stock_count` | Variantes con `available <= 0` |
| `inventory_value` | Suma de `available * price` (precio regular) |

> Ideal para el dashboard / encabezado de la vista de inventario.

---

## 4. Ajuste en lote — `POST /inventory/adjust-batch`

```json
{
  "items": [
    { "variant_id": "uuid-variant-1", "quantity": 10 },
    { "variant_id": "uuid-variant-2", "quantity": -2 }
  ],
  "reason": "Reposición de proveedor"
}
```

- `quantity` positivo = entrada, negativo = salida. **No puede ser 0.**
- `reason` opcional (máx 255), se aplica a todos los movimientos.
- La operación es **transaccional**: si algo falla, no se aplica nada.

**Respuesta:** array de `VariantStockResource` (mismos campos que el listado).

**Errores:**
- `422` si `items` vacío, `quantity` es 0/NaN o alguna `variant_id` no existe.

---

## 5. Movimientos globales — `GET /inventory/movements`

### Parámetros (query)

| Parámetro | Descripción |
|---|---|
| `variant_id` | Filtra por variante |
| `type` | `in` · `out` · `reserved` · `released` · `adjustment` |
| `sku` | Busca por SKU de la variante (`LIKE`) |
| `per_page` | Paginación (default 15) |

### Respuesta

```json
{
  "success": true,
  "message": "Movimientos de inventario.",
  "data": {
    "items": [
      {
        "id": "uuid",
        "variant_id": "uuid-variant",
        "variant": {
          "id": "uuid-variant",
          "sku": "WTC-MAT-100",
          "product_id": "uuid-product",
          "product_name": "Té Matcha"
        },
        "type": "adjustment",
        "quantity": 10,
        "reason": "Reposición",
        "created_by": null,
        "created_at": "2026-08-15 10:00:00"
      }
    ],
    "pagination": { "current_page": 1, "per_page": 15, "total": 1, "last_page": 1 }
  }
}
```

---

## 6. Checklist de Integración en el Admin

- [ ] Vista **Inventario**: listado con búsqueda (`search`), filtros de estado
      (`low` / `out_of_stock` / `available`), orden por columnas y paginación.
- [ ] Encabezado con tarjetas de resumen desde `GET /inventory/summary`
      (stock bajo, agotados, valor del inventario).
- [ ] Acción "Ajustar stock" individual → `POST /variants/{variant}/stock-adjust`.
- [ ] Selección múltiple + "Ajustar en lote" → `POST /inventory/adjust-batch`.
- [ ] Vista **Movimientos**: tabla paginada con `variant.sku`, `product_name`,
      `type`, `quantity`, `reason` y fecha; filtros por tipo y búsqueda por SKU.
- [ ] Estilo de alerta cuando `is_low` es `true`.

---

## 7. Archivos afectados

- `app/Modules/Inventory/Services/InventoryService.php`
- `app/Modules/Inventory/Interfaces/IInventoryService.php`
- `app/Modules/Inventory/Requests/AdjustBatchStockRequest.php` (nuevo)
- `app/Modules/Inventory/Controllers/BackOffice/InventoryController.php`
- `app/Modules/Inventory/Resources/StockMovementResource.php`
- `routes/backoffice.php`

---

## 8. Tests cubiertos

- `un_admin_puede_listar_inventario_con_busqueda_y_filtros`
- `un_admin_puede_ver_el_resumen_de_inventario`
- `un_admin_puede_ajustar_stock_en_lote`
- `el_ajuste_en_lote_no_acepta_cantidad_cero_ni_variante_inexistente`
- `un_admin_puede_ver_los_movimientos_de_todas_las_variantes`
