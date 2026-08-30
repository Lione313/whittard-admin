# 📏 Umbral de Stock Bajo (Global) — Guía de Integración para el Admin

**Versión:** 1.1.0
**Fecha:** 2026-08-15
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`inventory-admin-integration.md`](./inventory-admin-integration.md)

> El umbral de stock bajo es ahora **global** (una sola configuración para todo el
> catálogo), no por variante. Se elimina `stock_threshold` de `variants` y se
> reemplaza por un valor global persistido en la tabla `settings`.

---

## 1. Qué cambió

| Cambio | Detalle |
|---|---|
| **Umbral global** | Un único valor `low_stock_threshold` en la tabla `settings` |
| **`stock_threshold` en `variants`** | **Eliminado** (ya no se crea en `2026_08_03_000005_create_variants_table`) |
| **Formulario de producto** | Ya **no** recibe `stock_threshold` por variante |
| **`VariantStockResource`** | Deja de exponer `stock_threshold`; `is_low` se calcula contra el umbral global |

> **Definición de stock bajo:** `available <= low_stock_threshold` donde
> `available = stock - reserved_qty`. Si el umbral global no está configurado
> (`null`), solo se marcan como bajas las variantes con `stock <= 0`.

---

## 2. Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/inventory/low-stock-threshold` | Obtiene el umbral global actual (puede ser `null`) |
| PUT | `/api/v1/admin/inventory/low-stock-threshold` | Actualiza el umbral global |

**GET:**

```json
{
  "success": true,
  "message": "Umbral de stock bajo.",
  "data": { "low_stock_threshold": 10 }
}
```

**PUT — body:**

```json
{
  "low_stock_threshold": 10
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Umbral de stock bajo actualizado correctamente.",
  "data": { "low_stock_threshold": 10 }
}
```

**Errores:**

- `422` si `low_stock_threshold` falta, no es entero o es negativo (`min:0`).
- Para que la alerta solo aplique cuando el stock llegue a 0, configurar el umbral
  en `0`.

---

## 3. Efecto en el listado de stock bajo

`GET /api/v1/admin/inventory/low-stock` devuelve las variantes con
`available <= low_stock_threshold` (o `stock <= 0`). Cada ítem usa
`VariantStockResource`:

```json
{
  "data": {
    "items": [
      {
        "id": "uuid-variant",
        "sku": "WTC-MAT-100",
        "product_id": "uuid-product",
        "product_name": "Té Matcha",
        "stock": 8,
        "reserved_qty": 0,
        "available": 8,
        "is_low": true
      }
    ],
    "pagination": { "current_page": 1, "per_page": 15, "total": 1, "last_page": 1 }
  }
}
```

---

## 4. Checklist de Integración en el Admin

- [ ] Vista de **Ajustes / Configuración** (preferentemente dentro de Inventario):
      input numérico "Umbral de stock bajo" que al guardar llame a
      `PUT /inventory/low-stock-threshold`.
- [ ] Al cargar la vista de ajustes, obtener el valor actual con
      `GET /inventory/low-stock-threshold` (manejar `null` como "sin configuración").
- [ ] En el listado "Stock bajo" y en el detalle de variante, mostrar `is_low` con
      estilo de alerta; el umbral aplicado es el global (no se edita por variante).
- [ ] El formulario de producto ya **no** debe enviar `stock_threshold` por variante
      (eliminar el input si existía).

---

## 5. Archivos afectados

- `database/migrations/2026_08_15_000009_create_settings_table.php` (nuevo)
- `database/migrations/2026_08_03_000005_create_variants_table.php` (se quita `stock_threshold`)
- `app/Models/Setting.php` (nuevo)
- `app/Modules/Inventory/Requests/UpdateLowStockThresholdRequest.php` (nuevo)
- `app/Modules/Inventory/Resources/VariantStockResourceCollection.php` (nuevo)
- `app/Modules/Inventory/Services/InventoryService.php` (`lowStockThreshold`, `setLowStockThreshold`)
- `app/Modules/Inventory/Controllers/BackOffice/InventoryController.php`
- `app/Modules/Inventory/Resources/VariantStockResource.php`
- `routes/backoffice.php`
- `app/Models/Variant.php` (se quita `stock_threshold`)

---

## 6. Tests cubiertos

- `un_admin_puede_consultar_y_actualizar_el_umbral_global_por_api`
- `el_umbral_global_no_puede_ser_negativo`
- `el_historial_y_low_stock_se_exponen_por_api` (con `is_low` contra umbral global)
