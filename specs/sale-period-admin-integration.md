# 🏷️ Periodo de Oferta en Variantes — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-06
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`product-module.md`](./product-module.md) · [`media-admin-integration.md`](./media-admin-integration.md)

> Guía para implementar en el formulario de variantes los campos de **precio de oferta
> con vigencia**: `sale_price`, `sale_price_starts_at` y `sale_price_ends_at`.

---

## 1. Qué cambió

Antes el `sale_price` era un simple número opcional. Ahora **toda oferta debe tener vigencia**:

| Campo | Tipo | ¿Obligatorio? | Descripción |
|---|---|---|---|
| `sale_price` | number | **Sí, si hay promoción** | Precio rebajado |
| `sale_price_starts_at` | datetime | **Sí, si hay `sale_price`** | Inicio de la promoción |
| `sale_price_ends_at` | datetime | **Sí, si hay `sale_price`** | Fin de la promoción |

> Una variante **sin oferta** debe enviar `sale_price: null` y **sin** fechas
> (las fechas se guardan como `null`).

---

## 2. Reglas que valida la API (422)

| Situación | Campo de error | Mensaje |
|---|---|---|
| `sale_price` presente sin `sale_price_starts_at` | `variants.{i}.sale_price_starts_at` | "Debe indicar la fecha de inicio del precio de oferta." |
| `sale_price` presente sin `sale_price_ends_at` | `variants.{i}.sale_price_ends_at` | "Debe indicar la fecha de fin del precio de oferta." |
| Fechas presentes sin `sale_price` | `variants.{i}.sale_price` | "Debe indicar un precio de oferta para poder asignar las fechas de la promoción." |
| `sale_price_ends_at` < `sale_price_starts_at` | `variants.{i}.sale_price_ends_at` | "La fecha de fin no puede ser anterior a la fecha de inicio." |
| `sale_price` > `price` | `variants.{i}.sale_price` | "El precio de oferta no puede ser mayor al precio regular." |

---

## 3. Payload (Create / Update de producto)

```json
{
  "variants": [
    {
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "sale_price": null,
      "sale_price_starts_at": null,
      "sale_price_ends_at": null,
      "stock": 15
    },
    {
      "sku": "WTC-MAT-BOL-250",
      "price": 45.0,
      "sale_price": 40.0,
      "sale_price_starts_at": "2026-09-01 00:00:00",
      "sale_price_ends_at": "2026-09-30 23:59:59",
      "stock": 8
    }
  ]
}
```

**Con `multipart/form-data`:**
```js
form.append(`variants[${vi}][sale_price]`, v.sale_price ?? '');
if (v.sale_price) {
  form.append(`variants[${vi}][sale_price_starts_at]`, v.sale_price_starts_at);
  form.append(`variants[${vi}][sale_price_ends_at]`, v.sale_price_ends_at);
}
```

---

## 4. Respuesta del Detalle (`ProductResource`)

```json
{
  "variants": [
    {
      "id": "uuid-var-1",
      "sku": "WTC-MAT-LAT-100",
      "price": 28.5,
      "sale_price": 24.9,
      "sale_price_starts_at": "2026-09-01 00:00:00",
      "sale_price_ends_at": "2026-09-30 23:59:59",
      "stock": 15,
      "attributes": {},
      "media": []
    }
  ]
}
```

- Las fechas siempre vienen en formato `Y-m-d H:i:s` (o `null` si no hay oferta).
- Para **editar**: cargar el detalle y reenviar las fechas tal cual; si se quita la oferta,
  enviar `sale_price: null` y **sin** fechas (se limpian).

---

## 5. Checklist de Integración en el Admin

- [ ] En el formulario de variantes, agregar un toggle/checkbox "Tiene oferta".
- [ ] Al activar: mostrar `sale_price` + **dos date-time pickers** (inicio y fin).
- [ ] Desactivar/limpiar la oferta → enviar `sale_price: null` y eliminar las fechas.
- [ ] Validar en el cliente:
  - `sale_price` ≤ `price`.
  - ambas fechas presentes si hay `sale_price`.
  - `ends_at` > `starts_at`.
- [ ] Al editar, precargar las fechas desde el detalle y reenviarlas.
- [ ] Mostrar el periodo en el listado/UI si se desea (p. ej. "Oferta hasta 30/09").
