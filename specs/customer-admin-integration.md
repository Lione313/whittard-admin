# 👥 Módulo de Clientes — Guía de Integración para el Admin

**Versión:** 1.1.0
**Fecha:** 2026-08-17
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`coupon-admin-integration.md`](./coupon-admin-integration.md) · [`customer-experience-integration.md`](./customer-experience-integration.md)

> El cliente de la web (storefront) es una entidad propia, separada del usuario
> de login (`users`). Un cliente **siempre** tiene su cuenta de usuario (`user_id`
> único, 1:1), además de sus **direcciones de entrega** y sus **perfiles de
> facturación** (boleta/factura: DNI/RUC).

---

## 1. Qué cambió

**Refactor de `customer_profiles` → `customers`.** La tabla `customers` se crea
directamente desde cero (migración única), con los mismos IDs. Las FKs de
`wishlists`, `reviews`, `stock_alerts` y `coupon_usages` apuntan a `customers`.
Los campos embebidos `address` / `city` / `country` viven ahora en
`customer_addresses`.

| Tabla | Descripción |
|---|---|
| `customers` | Entidad del cliente (antes `customer_profiles`) |
| `customer_addresses` | Direcciones de entrega (muchas por cliente) |
| `billing_profiles` | Datos fiscales para boleta/factura (muchos por cliente) |

---

## 2. Modelo de datos

### 2.1 `customers`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid (único, FK `users`, cascade) | Cuenta de login del cliente (obligatoria) |
| `first_name` | string nullable | |
| `last_name` | string nullable | |
| `phone` | string nullable | |
| `birthdate` | date nullable | `YYYY-MM-DD` |
| `source` | string nullable | Canal: `storefront`, `whatsapp`, `facebook`… |
| `is_active` | boolean (default true) | Habilitar/bloquear acceso y compras |
| `notes` | text nullable | Notas internas del admin |
| `deleted_at` | datetime nullable | Soft delete |
| `created_at` / `updated_at` | datetime | |

> El `email` vive en `users` (se expone en el API como `email`).

### 2.2 `customer_addresses`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | |
| `customer_id` | uuid (FK `customers`, cascade) | |
| `label` | string nullable | "Casa", "Trabajo"… |
| `type` | enum (default `shipping`) | `shipping`, `billing`, `both` |
| `contact_name` / `contact_phone` | string nullable | Destinatario |
| `address_line_1` | string (obligatorio) | Calle, número, dpto/oficina |
| `address_line_2` | string nullable | |
| `city` / `region` / `postal_code` | string nullable | |
| `country` | string (default `PE`) | |
| `is_default` | boolean (default false) | Una dirección default por cliente |
| `deleted_at` | datetime nullable | Soft delete |

### 2.3 `billing_profiles`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | |
| `customer_id` | uuid (FK `customers`, cascade) | |
| `document_type` | enum | `dni`, `ruc`, `passport` |
| `document_number` | string (obligatorio) | |
| `business_name` | string nullable | Razón social (obligatorio si `document_type = ruc`) |
| `fiscal_address` | string nullable | Snapshot de la dirección fiscal |
| `address_id` | uuid nullable (FK `customer_addresses`, nullOnDelete) | Dirección asociada |
| `is_default` | boolean (default false) | Perfil de facturación default |
| `deleted_at` | datetime nullable | Soft delete |

---

## 3. Endpoints disponibles

### 3.1 Listado de clientes (selector + tabla)

```
GET /api/v1/admin/customers?search=juan&per_page=15&page=2
```

- `search` (opcional): filtra por **nombre** (`users.name`) o **email**.
- `per_page` (opcional, default 15), `page` (opcional).
- Requiere token de admin (`Authorization: Bearer` + rol `admin`).

**Respuesta (200):**

```json
{
  "success": true,
  "message": "Listado de clientes.",
  "data": {
    "items": [
      {
        "id": "uuid-customer",
        "first_name": "María",
        "last_name": "Pérez",
        "email": "maria.perez@example.com",
        "phone": "+51 987 654 321",
        "birthdate": "1992-11-03",
        "source": "storefront",
        "is_active": true,
        "notes": null,
        "created_at": "2026-08-17 10:00:00",
        "updated_at": "2026-08-17 10:00:00",
        "addresses_count": 2,
        "billing_profiles_count": 1
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 1,
      "last_page": 1
    }
  }
}
```

> `addresses_count` y `billing_profiles_count` siempre vienen en el listado.
> El nombre completo del cliente se arma en el frontend: `first_name + ' ' + last_name`.

### 3.2 Detalle del cliente (perfil + direcciones + facturación)

```
GET /api/v1/admin/customers/{id}
```

**Respuesta (200):** incluye el perfil completo y los arreglos anidados
`addresses` y `billing_profiles`.

```json
{
  "success": true,
  "message": "Detalle del cliente.",
  "data": {
    "id": "uuid-customer",
    "first_name": "María",
    "last_name": "Pérez",
    "email": "maria.perez@example.com",
    "phone": "+51 987 654 321",
    "birthdate": "1992-11-03",
    "source": "storefront",
    "is_active": true,
    "notes": "Cliente premium",
    "created_at": "2026-08-17 10:00:00",
    "updated_at": "2026-08-17 10:00:00",
    "addresses_count": 2,
    "billing_profiles_count": 1,
    "addresses": [
      {
        "id": "uuid-address-1",
        "label": "Casa",
        "type": "both",
        "contact_name": "María Pérez",
        "contact_phone": "+51 987 654 321",
        "address_line_1": "Calle Los Sauces 456",
        "address_line_2": "Dpto 302",
        "city": "San Isidro",
        "region": "Lima",
        "postal_code": "15073",
        "country": "PE",
        "is_default": true,
        "created_at": "2026-08-17 10:00:00",
        "updated_at": "2026-08-17 10:00:00"
      },
      {
        "id": "uuid-address-2",
        "label": "Trabajo",
        "type": "shipping",
        "contact_name": "María Pérez",
        "contact_phone": "+51 987 654 321",
        "address_line_1": "Av. Javier Prado Este 530",
        "address_line_2": null,
        "city": "San Isidro",
        "region": null,
        "postal_code": null,
        "country": "PE",
        "is_default": false,
        "created_at": "2026-08-17 10:00:00",
        "updated_at": "2026-08-17 10:00:00"
      }
    ],
    "billing_profiles": [
      {
        "id": "uuid-billing-1",
        "document_type": "ruc",
        "document_number": "20123456789",
        "business_name": "Pérez e Hijos S.A.C.",
        "fiscal_address": "Av. Javier Prado Este 530, San Isidro, Lima",
        "address_id": "uuid-address-2",
        "is_default": true,
        "created_at": "2026-08-17 10:00:00",
        "updated_at": "2026-08-17 10:00:00"
      }
    ]
  }
}
```

**Respuesta (404):**

```json
{
  "success": false,
  "message": "Cliente no encontrado.",
  "errors": null
}
```

> En el listado (`3.1`) `addresses` / `billing_profiles` no vienen; solo los
> contadores. En el detalle (`3.2`) vienen los arreglos completos.

---

## 4. Casos de uso para el Admin

| Uso | Endpoint | Estado |
|---|---|---|
| Selector de clientes (alcance de cupones) | `GET /admin/customers?search=` | ✅ Disponible |
| Listado/tabla de clientes | `GET /admin/customers` | ✅ Disponible |
| Detalle del cliente (perfil + direcciones + facturación) | `GET /admin/customers/{id}` | ✅ Disponible |
| Activar / desactivar cliente | `PATCH /admin/customers/{id}` | 🚧 Planificado |
| CRUD de direcciones | `GET/POST/PUT/DELETE /admin/customers/{id}/addresses` | 🚧 Planificado |
| CRUD de perfiles de facturación | `GET/POST/PUT/DELETE /admin/customers/{id}/billing-profiles` | 🚧 Planificado |

> Los endpoints planificados mantendrán el mismo contrato de datos de las
> secciones 2 y 3.2. Se recomienda construir la UI con base en este modelo.

---

## 5. Validaciones (previstas para los endpoints planificados)

| Situación | Respuesta |
|---|---|
| `document_type` fuera de `dni/ruc/passport` | 422 en `document_type` |
| `business_name` faltante con `document_type = ruc` | 422 en `business_name` |
| `address_line_1` vacío | 422 en `address_line_1` |
| Más de una dirección `is_default` por cliente | Se resetea a la nueva default |
| Cliente `is_active = false` | No puede iniciar sesión ni comprar |

---

## 6. Checklist de Integración en el Admin

### Listado
- [ ] **Tabla de clientes**: paginada, con búsqueda por nombre/email.
- [ ] **Columnas**: cliente (`first_name + last_name`), email, teléfono, estado (`is_active`), direcciones (`addresses_count`), facturación (`billing_profiles_count`), fecha de registro (`created_at`).
- [ ] Click en la fila → navega al detalle (`3.2`).

### Detalle
- [ ] **Datos personales**: first_name, last_name, email, phone, birthdate, source.
- [ ] **Estado**: badge activo/inactivo (`is_active`) y notas internas (`notes`).
- [ ] **Pestaña Direcciones**: tarjetas/lista con todos los campos de `customer_addresses` (label, type, contact_name/phone, address_line_1/2, city, region, postal_code, country, is_default).
- [ ] **Pestaña Facturación**: tarjetas/lista con todos los campos de `billing_profiles` (document_type, document_number, business_name, fiscal_address, is_default). Mostrar "Razón social" solo cuando aplique.

### Selector de clientes (cupones)
- [ ] Buscar por nombre/email (paginado) y elegir un cliente.

---

## 7. Archivos afectados

- `database/migrations/2026_05_31_151421_create_customers_table.php`
- `database/migrations/2026_08_17_000002_create_customer_addresses_table.php`
- `database/migrations/2026_08_17_000003_create_billing_profiles_table.php`
- `app/Models/Customer.php` · `app/Models/CustomerAddress.php` · `app/Models/BillingProfile.php`
- `app/Modules/Customer/**` (Services, Controller, Resources: `CustomerResource`, `CustomerAddressResource`, `BillingProfileResource`)
- `routes/backoffice.php`

---

## 8. Tests cubiertos

- `un_admin_puede_listar_clientes_para_el_selector_de_cupones`
- `un_admin_puede_ver_el_detalle_completo_de_un_cliente`
- (los tests de wishlist, stock alerts, reviews y cupones usan el modelo `Customer`)
