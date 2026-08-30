# 📦 Inventario — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-15
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`product-import-export.md`](./product-import-export.md) · [`inventory-stock-threshold-admin-integration.md`](./inventory-stock-threshold-admin-integration.md) · [`inventory-management-admin-integration.md`](./inventory-management-admin-integration.md)
> Stock real con **movimientos auditables**, **reservas** (carritos/pedidos
> pendientes), **alertas de stock bajo** y **backorder**.

---

## 1. Qué cambió

**Nuevas columnas en `variants`:**

| Columna | Tipo | Descripción |
|---|---|---|
| `reserved_qty` | int (default 0) | Unidades reservadas en carritos/pedidos pendientes |

> El umbral de stock bajo es **global** y vive en la tabla `settings`
> (clave `low_stock_threshold`). Ver [`inventory-stock-threshold-admin-integration.md`](./inventory-stock-threshold-admin-integration.md).

**Nuevo en `products`:**
| Columna | Tipo | Descripción |
|---|---|---|
| `allow_backorder` | boolean | Si `true`, se puede comprar sin stock (pre-orden) |

**Nueva tabla `stock_movements`:** historial auditado de cada variante.

> **Disponible = `stock - reserved_qty`** (lo que se puede vender hoy).

---

## 2. Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/variants/{variant}/stock-movements` | Historial de movimientos de la variante (paginado) |
| POST | `/api/v1/admin/variants/{variant}/stock-adjust` | Ajuste manual de stock (entrada/salida) |
| GET | `/api/v1/admin/inventory` | Listado completo de inventario (búsqueda, filtros, orden) |
| GET | `/api/v1/admin/inventory/summary` | Resumen estadístico del inventario |
| GET | `/api/v1/admin/inventory/movements` | Movimientos de todas las variantes (paginado) |
| POST | `/api/v1/admin/inventory/adjust-batch` | Ajuste de stock en lote |
| GET | `/api/v1/admin/inventory/low-stock-threshold` | Obtiene el umbral global de stock bajo |
| PUT | `/api/v1/admin/inventory/low-stock-threshold` | Actualiza el umbral global de stock bajo |
| GET | `/api/v1/admin/inventory/low-stock` | Variantes con stock bajo (paginado) |

---

## 3. Ajuste de stock

```json
POST /api/v1/admin/variants/{variant}/stock-adjust
{
  "quantity": 10,       // positivo = entrada, negativo = salida
  "reason": "Reposición de proveedor"
}
```

**Respuesta (`VariantStockResource`):**

```json
{
  "data": {
    "id": "uuid-variant",
    "sku": "WTC-MAT-100",
    "product_id": "uuid-product",
    "product_name": "Té Matcha",
    "stock": 25,
    "reserved_qty": 3,
    "available": 22,
    "is_low": false
  }
}
```

---

## 4. Historial de movimientos

```json
GET /api/v1/admin/variants/{variant}/stock-movements
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "variant_id": "uuid",
        "type": "adjustment",   // in | out | reserved | released | adjustment
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

> Los movimientos de tipo `in` se generan automáticamente al **crear/importar**
> una variante con stock.

---

## 5. Stock bajo

```json
GET /api/v1/admin/inventory/low-stock
```

Devuelve variantes donde `available <= low_stock_threshold` (o `stock <= 0`), con
el umbral **global** de la tabla `settings`. Cada ítem usa `VariantStockResource`
(mismo formato que la sección 3). El campo `is_low` indica si está bajo el umbral.

---

## 6. Reglas de negocio (backoffice)

- El **ajuste** registra siempre un movimiento (`adjustment`) con `reason`.
- **Reservas y liberaciones** (cuando exista el checkout) usarán `reserved_qty`;
  no se permite sobre-reservar salvo que el producto tenga `allow_backorder = true`.
- Al confirmar una compra, el stock disponible baja y la reserva se libera (`commit`).

---

## 7. Checklist de Integración en el Admin

- [ ] En el detalle de la variante, mostrar: `stock`, `reserved_qty` y `available`.
- [ ] Mostrar `is_low` con estilo de alerta cuando `available <= low_stock_threshold` (umbral global).
- [ ] Botón "Ajustar stock" → modal con `quantity` (entrada/salida) y `reason`.
- [ ] Vista de ajustes para el umbral global de stock bajo (`GET/PUT .../low-stock-threshold`) — ver `inventory-stock-threshold-admin-integration.md`.
- [ ] Historial de movimientos de la variante (tabla paginada).
- [ ] Vista "Stock bajo" (listado con filtros).
- [ ] Al editar el producto, toggle "Permitir pre-orden" (`allow_backorder`).

---

## 8. Archivos afectados

- `database/migrations/2026_08_03_000005_create_variants_table.php` (columnas)
- `database/migrations/2026_08_03_000003_create_products_table.php` (`allow_backorder`)
- `database/migrations/2026_08_15_000004_create_stock_movements_table.php`
- `database/migrations/2026_08_15_000009_create_settings_table.php` (umbral global)
- `app/Models/Variant.php` · `app/Models/StockMovement.php` · `app/Models/Setting.php`
- `app/Modules/Inventory/**` (Service, Controller, Requests, Resources)
- `app/Modules/Product/Services/ProductService.php` (movimiento `in` al crear/importar)

---

## 9. Tests cubiertos

- `available_es_stock_menos_reservado`
- `ajustar_stock_registra_movimiento`
- `reservar_actualiza_reservado_y_no_permite_sobrerreservar`
- `commit_descuenta_stock_y_reserva`
- `un_admin_puede_ajustar_stock_por_api`
- `el_historial_y_low_stock_se_exponen_por_api`
