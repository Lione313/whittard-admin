# ⭐ Variante Principal y Activación — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-11
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Estado:** Implementado (Laravel 11)
**Relacionado:** [`product-module.md`](./product-module.md) · [`sale-period-admin-integration.md`](./sale-period-admin-integration.md) · [`media-admin-integration.md`](./media-admin-integration.md)

> Guía para implementar en el formulario de variantes los campos **`is_primary`** (variante
> principal del producto) y **`is_active`** (activar/desactivar la variante en la tienda).

---

## 1. Qué cambió

Cada variante ahora tiene **dos flags booleanos** nuevos:

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `is_primary` | boolean | `false` | Marca la **variante principal** del producto. **Solo una** puede serlo por producto. |
| `is_active` | boolean | `true` | Activa/desactiva la **visibilidad de la variante en la tienda**. |

> El **estado del producto** (`draft | published | archived`) es **independiente** y sigue
> gestionándose en el nivel de producto. La variante solo se **activa o desactiva**.

---

## 2. Reglas de negocio

| Regla | Comportamiento |
|---|---|
| Solo una variante principal | Si marcas `is_primary: true` en **más de una** variante → **422** en `variants`. |
| Ninguna marcada como principal | La **primera** variante del payload pasa a ser la principal automáticamente. |
| Variante principal vs activa | Son independientes: la principal puede estar desactivada (y viceversa). |
| Default `is_active` | Si no se envía el campo, la variante se guarda **activa** (`true`). |

---

## 3. Payload (Create / Update de producto)

**`POST /api/v1/admin/products`** y **`PUT|PATCH /api/v1/admin/products/{id}`**:

```json
{
  "variants": [
    {
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "stock": 15,
      "is_primary": true,
      "is_active": true
    },
    {
      "sku": "WTC-MAT-BOL-250",
      "price": 45.0,
      "stock": 8,
      "is_primary": false,
      "is_active": false
    }
  ]
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `variants[].is_primary` | boolean? | Marca la variante principal — **solo una** por producto |
| `variants[].is_active` | boolean? | default `true` — activa/desactiva en la tienda |

**Con `multipart/form-data`:**
```js
form.append(`variants[${vi}][is_primary]`, v.is_primary ? '1' : '0');
form.append(`variants[${vi}][is_active]`, v.is_active === false ? '0' : '1');
```

> ⚠️ En `multipart` los booleanos se envían como `'1'` / `'0'` (o `'true'` / `'false'`).

---

## 4. Respuesta del Detalle (`ProductResource`)

```json
{
  "variants": [
    {
      "id": "uuid-var-1",
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "stock": 15,
      "order": 1,
      "is_primary": true,
      "is_active": true,
      "attributes": {},
      "media": []
    }
  ]
}
```

- `is_primary` y `is_active` siempre vienen como **booleanos** (`true`/`false`).
- Para **editar**: cargar el detalle, modificar los flags y reenviar los arrays completos
  con los `id` de variantes intactos (igual que el resto del formulario de variantes).

---

## 5. Errores Nuevos (422) que debe manejar el admin

| Situación | Campo de error | Mensaje |
|---|---|---|
| Más de una variante con `is_primary: true` | `variants` | "Solo una variante puede marcarse como principal." |

---

## 6. Uso en la Tienda (StoreFront)

- `is_active: false` → la variante **no se muestra / no se puede comprar** en la tienda.
- `is_primary: true` → la variante **por defecto** que el Frontend preselecciona al abrir el producto
  (o la que se usa para generar la imagen/portada y el precio inicial).

---

## 7. Checklist de Integración en el Admin

- [ ] En cada variante del formulario, agregar un **checkbox "Variante principal"** (`is_primary`).
- [ ] Agregar un **toggle/switch "Activa en tienda"** (`is_active`), activado por default.
- [ ] Validar en el cliente que **solo una** variante esté marcada como principal antes de enviar.
- [ ] En `multipart`, enviar los flags como `'1'`/`'0'`.
- [ ] Al editar, precargar `is_primary` y `is_active` desde el detalle.
- [ ] Mostrar la variante principal marcada con un badge/estrella en la lista de variantes.
- [ ] Mostrar las variantes inactivas con un estado visual "Desactivada" y considerar el toggle de
    activación desde la lista.
