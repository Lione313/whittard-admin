# 🧾 Impuestos (Perú — IGV) — Guía de Integración para el Admin

**Versión:** 2.0.0
**Fecha:** 2026-08-16
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md)

> Gestión **simplificada para Perú**: cada **clase de impuesto** lleva su **tasa
> IGV** directamente (no hay tabla de tasas por país/región). El producto se
> asigna a una clase con `tax_class_id`.

---

## 1. Qué cambió (v2)

- Se eliminó la tabla **`tax_rates`** (multi-país) y sus endpoints.
- `tax_classes` ahora tiene el campo **`rate`** (decimal, %): la tasa aplicable
  en Perú para esa clase (ej. `18.00` = IGV).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | |
| `name` | string | Nombre (ej. "General (IGV)") |
| `code` | string único | Código (ej. `general`) |
| `rate` | decimal(5,2) | Tasa % (0 a 100) |

**Nuevo campo en `products`:**
| Columna | Tipo | Descripción |
|---|---|---|
| `tax_class_id` | uuid nullable FK | Clase de impuesto del producto |

---

## 2. Endpoints — Clases de impuesto

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/tax-classes` | Listar |
| POST | `/api/v1/admin/tax-classes` | Crear |
| GET | `/api/v1/admin/tax-classes/{id}` | Detalle |
| PUT | `/api/v1/admin/tax-classes/{id}` | Actualizar |
| DELETE | `/api/v1/admin/tax-classes/{id}` | Eliminar |

```json
POST /api/v1/admin/tax-classes
{
  "name": "General (IGV)",
  "code": "general",   // único, ≤50
  "rate": 18           // 0 a 100
}
```

**Validaciones (422):** `code` único; `rate` obligatorio entre 0 y 100.

> Ya no existe `/api/v1/admin/tax-rates`.

---

## 3. Respuestas

```json
{ "data": [ { "id": "uuid", "name": "General (IGV)", "code": "general", "rate": 18 } ] }
```

---

## 4. Producto

Al crear/actualizar un producto se puede enviar `tax_class_id` (nullable):

```json
PUT /api/v1/admin/products/{id}
{ "tax_class_id": "uuid-clase" }
```

---

## 5. Cómo se resuelve la tasa (checkout futuro)

`TaxService::rateFor(Product)` devuelve la clase del producto (su `rate` es el
IGV %). `TaxService::priceIncludingTax(Product, price)` devuelve
`price * (1 + rate/100)`. Si el producto no tiene clase, no aplica impuesto.

---

## 6. Checklist de Integración en el Admin

- [ ] CRUD de clases de impuesto (nombre + código único + tasa %).
- [ ] En el formulario de producto, selector de "Clase de impuesto" (`tax_class_id`).
- [ ] Precargar la clase al editar el producto.

---

## 7. Archivos afectados

- `database/migrations/2026_08_02_000001_create_tax_classes_table.php` (`rate`)
- `database/migrations/2026_08_02_000002_create_tax_rates_table.php` (**eliminada**)
- `database/migrations/2026_08_03_000003_create_products_table.php` (`tax_class_id`)
- `app/Models/TaxClass.php` (se eliminó `TaxRate`)
- `app/Modules/Tax/**` (Service, Controller, Requests, Resources)

---

## 8. Tests cubiertos

- `un_admin_gestiona_clases_de_impuesto_con_su_tasa_igv`
- `la_tasa_de_la_clase_es_la_tasa_del_producto_en_peru`
- `price_including_tax_aplica_la_tasa_de_la_clase`
- `producto_sin_clase_no_aplica_impuesto`
