# 🏷️ Cupones con Alcances — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-15
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`seo-admin-integration.md`](./seo-admin-integration.md) · [`coupon-scope-remote-search.md`](./coupon-scope-remote-search.md)

> Gestión de **cupones de descuento** con alcance (qué ítems/clientes afectan) y
> reglas (mínimos, límites, vigencia). El alcance se guarda en una tabla
> polimórfica (`couponables`): categorías, productos o clientes asignados.

---

## 1. Qué cambió

| Tabla | Descripción |
|---|---|
| `coupons` | Definición del cupón |
| `couponables` | Alcances polimórficos (category / product / customer_profile) |
| `coupon_usages` | Historial de usos |

**Campos del cupón:**

| Campo | Tipo | Descripción |
|---|---|---|
| `code` | string (≤50, único) | Código visible, ej. `BIENVENIDA10` |
| `name` | string | Nombre interno |
| `type` | enum | `fixed` (S/), `percentage` (%), `free_shipping` |
| `value` | number | Monto fijo o porcentaje |
| `applies_to` | enum | `cart`, `category`, `product`, `customer`, `shipping` |
| `min_subtotal` | number (default 0) | Monto mínimo del carrito (sin envío) |
| `max_discount` | number nullable | Tope del descuento |
| `usage_limit` | int nullable | Límite total de usos (`null` = ilimitado) |
| `per_customer_limit` | int (default 1) | Límite por cliente |
| `starts_at` / `ends_at` | datetime nullable | Vigencia |
| `is_active` | boolean | Activo/inactivo |
| `stackable` | boolean | ¿Se combina con otros cupones? |
| `priority` | int (default 0) | Orden si se combinan |
| `first_order_only` | boolean | Solo primera compra |

---

## 2. Alcances (`applies_to`)

| `applies_to` | Alcance | Cómo se asigna |
|---|---|---|
| `cart` | Todo el carrito | Sin pivote |
| `category` | Categorías (incluye subcategorías) | `categories: []` |
| `product` | Productos específicos | `products: []` |
| `customer` | Clientes asignados | `customers: []` |
| `shipping` | Envío gratis | Sin pivote |

---

## 3. Payload (Create / Update de cupón)

```json
{
  "code": "BIENVENIDA10",
  "name": "Bienvenida",
  "type": "percentage",
  "value": 10,
  "applies_to": "category",
  "min_subtotal": 50,
  "max_discount": 30,
  "usage_limit": 100,
  "per_customer_limit": 1,
  "starts_at": "2026-09-01 00:00:00",
  "ends_at": "2026-09-30 23:59:59",
  "is_active": true,
  "stackable": false,
  "priority": 0,
  "first_order_only": false,
  "categories": ["uuid-cat-1", "uuid-cat-2"],
  "products": ["uuid-prod-1"],
  "customers": ["uuid-customer-1"]
}
```

> En update, los campos son `sometimes` (solo se cambia lo enviado). Para **quitar
> un alcance** se usa `categories: []` (sync reemplaza la lista completa).

---

## 4. Adjuntar / quitar alcances (endpoints dedicados)

```json
POST /api/v1/admin/coupons/{id}/attach-scope
{ "scope": "category", "ids": ["uuid-cat-1"] }

POST /api/v1/admin/coupons/{id}/detach-scope
{ "scope": "category", "ids": ["uuid-cat-1"] }
```

`scope` puede ser `category`, `product` o `customer`.

---

## 5. Respuesta del Detalle (`CouponResource`)

```json
{
  "data": {
    "id": "uuid",
    "code": "BIENVENIDA10",
    "name": "Bienvenida",
    "type": "percentage",
    "value": 10,
    "applies_to": "category",
    "min_subtotal": 50,
    "max_discount": 30,
    "usage_limit": 100,
    "per_customer_limit": 1,
    "starts_at": "2026-09-01 00:00:00",
    "ends_at": "2026-09-30 23:59:59",
    "is_active": true,
    "stackable": false,
    "priority": 0,
    "first_order_only": false,
    "scopes": {
      "categories": ["uuid-cat-1", "uuid-cat-2"],
      "products": ["uuid-prod-1"],
      "customers": ["uuid-customer-1"]
    }
  }
}
```

---

## 6. Validaciones que devuelve 422

| Situación | Campo |
|---|---|
| `code` ya usado | `code` |
| `type` fuera de `fixed/percentage/free_shipping` | `type` |
| `applies_to` fuera de `cart/category/product/customer/shipping` | `applies_to` |
| `ends_at` anterior a `starts_at` | `ends_at` |
| Algún id de alcance no existe | `categories.*` / `products.*` / `customers.*` |
| `attach-scope` sin `scope` válido o sin `ids` | `scope` / `ids` |

---

## 7. Verificación del cupón (Storefront)

El checkout/carrito usa el motor de cálculo del backend (`POST /api/v1/cart/apply-coupon`), que valida: vigencia, `min_subtotal`, límites de uso, alcance y `max_discount`.

> ⚠️ Nunca confíes en el cálculo del frontend: el descuento real se calcula en el servidor.

---

## 8. Checklist de Integración en el Admin

- [ ] Listado de cupones con filtros por `code`, `type`, `applies_to`, `is_active`.
- [ ] Formulario de cupón con todos los campos de la sección 3.
- [ ] Selector de alcance según `applies_to`:
  - `category` → multi-select de categorías.
  - `product` → multi-select de productos.
  - `customer` → multi-select de clientes.
  - Los selectores usan **búsqueda remota paginada** (ver `coupon-scope-remote-search.md`).
- [ ] Mostrar `scopes` en el detalle al editar (precargar los IDs).
- [ ] Edición: reenviar la lista completa de IDs para ese alcance (sync).
- [ ] Panel de usos: `GET /coupons/{id}/usages`.
- [ ] Estado visual: `is_active` (activo/inactivo), vigencia.

---

## 9. Archivos afectados

- `database/migrations/2026_08_15_000001_create_coupons_table.php`
- `database/migrations/2026_08_15_000002_create_couponables_table.php`
- `database/migrations/2026_08_15_000003_create_coupon_usages_table.php`
- `app/Models/Coupon.php` · `app/Models/CouponUsage.php`
- `app/Modules/Coupon/**` (Service, Controllers, Requests, Resources)
- `routes/backoffice.php` · `routes/storefront.php`

---

## 10. Tests cubiertos

- `un_admin_puede_crear_un_cupon_con_alcances`
- `el_codigo_de_cupon_debe_ser_unico`
- `un_admin_puede_actualizar_y_eliminar_un_cupon`
- `un_admin_puede_adjuntar_y_quitar_alcances`
- `calcula_descuento_porcentual_sobre_el_carrito`
- `rechaza_cuando_no_alcanza_el_minimo`
- `aplica_por_categoria_incluyendo_subcategorias`
- `aplica_solo_a_productos_del_alcance`
- `aplica_solo_al_cliente_asignado`
- `respeta_el_limite_de_usos`
- `el_cupon_vencido_es_rechazado`
