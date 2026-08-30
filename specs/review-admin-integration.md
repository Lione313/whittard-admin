# ⭐ Reseñas y Rating — Guía de Integración para el Admin

**Versión:** 1.0.0
**Fecha:** 2026-08-15
**Audiencia:** Frontend / Admin
**Base URL Admin:** `/api/v1/admin` · **Base URL Storefront:** `/api/v1`
**Relacionado:** [`product-module.md`](./product-module.md) · [`seo-admin-integration.md`](./seo-admin-integration.md)

> Reseñas de productos con **moderación** (pending → approved/rejected) y rating
> que alimenta el **JSON-LD** (`aggregateRating`) de SEO.

---

## 1. Qué cambió

**Nueva tabla `reviews`:**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | |
| `product_id` | uuid FK | Producto |
| `customer_id` | uuid FK | Cliente que escribe |
| `rating` | int (1-5) | Calificación |
| `title` | string nullable | Título |
| `body` | text | Comentario |
| `images` | json nullable | URLs de imágenes |
| `is_verified` | boolean | Comprador verificado (requiere módulo de pedidos) |
| `status` | enum | `pending` (default) · `approved` · `rejected` |

> Las reseñas **aprobadas** alimentan `aggregateRating` en el `structured_data`
> (JSON-LD) del producto.

---

## 2. Endpoints Storefront

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/products/{product}/reviews` | público | Reseñas aprobadas + rating del producto |
| POST | `/api/v1/products/{product}/reviews` | customer | Crear reseña (queda `pending`) |

### Crear reseña

```json
POST /api/v1/products/{product}/reviews
{
  "rating": 5,
  "title": "Excelente",
  "body": "Muy buen té.",
  "images": ["https://cdn.com/foto.jpg"]
}
```

**Validaciones (422):** `rating` obligatorio entre 1 y 5; `body` obligatorio.

### Respuesta del listado (con rating)

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "rating": 5,
        "title": "Excelente",
        "body": "Muy buen té.",
        "images": null,
        "is_verified": false,
        "status": "approved",
        "customer": { "name": "Juan Pérez" },
        "created_at": "2026-08-15 10:00:00"
      }
    ],
    "rating": { "avg": 4.5, "count": 2 },
    "pagination": { "current_page": 1, "per_page": 10, "total": 1, "last_page": 1 }
  }
}
```

> Solo se muestran las **aprobadas**. `rating` es el promedio de aprobadas.

---

## 3. Endpoints Admin (moderación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/reviews` | Listar (filtros `status`, `rating`, `product_id`) |
| PUT | `/api/v1/admin/reviews/{review}/moderate` | Aprobar / rechazar |
| DELETE | `/api/v1/admin/reviews/{review}` | Eliminar |

```json
PUT /api/v1/admin/reviews/{review}/moderate
{ "status": "approved" }   // o "rejected"
```

---

## 4. SEO — `aggregateRating`

Al aprobarse reseñas, el JSON-LD del producto incluye:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": 4.5,
  "reviewCount": 2
}
```

> Se regenera al guardar el SEO del producto (el observer lo actualiza).

---

## 5. Checklist de Integración en el Admin

- [ ] Listado de reseñas con filtro por `status` (pendientes/ aprobadas / rechazadas).
- [ ] Acciones por reseña: **Aprobar**, **Rechazar**, **Eliminar**.
- [ ] Mostrar rating (estrellas), texto, imágenes y cliente.
- [ ] En el detalle del producto (tienda), mostrar listado de reseñas aprobadas + rating promedio.
- [ ] En la tienda, formulario de reseña para clientes logueados (rating + título + comentario).

---

## 6. Archivos afectados

- `database/migrations/2026_08_15_000005_create_reviews_table.php`
- `app/Models/Review.php` · `app/Models/Product.php` (relaciones + `aggregateRating`)
- `app/Modules/Review/**` (Service, Controllers, Requests, Resources)
- `routes/backoffice.php` · `routes/storefront.php`

---

## 7. Tests cubiertos

- `un_customer_puede_crear_una_resena`
- `la_calificacion_debe_estar_entre_1_y_5`
- `el_admin_modera_y_solo_se_publican_las_aprobadas`
- `la_resena_aprobada_alimenta_el_aggregate_rating_del_jsonld`
