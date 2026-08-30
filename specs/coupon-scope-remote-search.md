# 🔎 Búsqueda remota para Alcances de Cupones — Guía de Integración

**Versión:** 1.2.0
**Fecha:** 2026-08-16
**Audiencia:** Backend (Laravel) + Frontend / Admin
**Base URL:** `/api/v1/admin`
**Relacionado:** [`coupon-admin-integration.md`](./coupon-admin-integration.md) · [`product-module.md`](./product-module.md)

> Los selectores de alcance de cupones (categorías, productos y clientes) deben
> funcionar con **búsqueda remota**: al abrir se muestran unos pocos resultados y
> el usuario **busca por texto** el ítem que ya sabe que quiere asignar.
>
> **No se pagina en el selector.** El usuario ya conoce qué ítem asignar; la
> búsqueda resuelve el catálogo grande sin necesidad de navegar páginas.

---

## 1. Estado actual (verificado contra el backend)

| Alcance | Endpoint | Búsqueda en backend | Parámetro | Estado |
|---|---|---|---|---|
| Productos | `GET /admin/products` | ✅ `name`, `slug`, `code`, `brand` | `filter[search]` | **Ya soportado** |
| Clientes | `GET /admin/customers` | ✅ `name`, `email` | `search` | **Ya soportado** |
| Categorías | `GET /admin/categories` | ❌ sin búsqueda | — | **Falta** |

> ⚠️ **Sintaxis distinta por endpoint:**
> - Productos → `filter[search]` (Spatie QueryBuilder).
> - Clientes → `search` (parámetro directo).
>
> No usar `?search=` para productos ni `filter[search]` para clientes.

**El frontend actual NO usa la búsqueda** (precarga 500 productos y todos los
clientes). El trabajo pendiente es **del lado del admin**, no del backend.

---

## 2. Comportamiento del selector (frontend)

1. **Al abrir** (sin texto): muestra los primeros **10** resultados (`per_page=10`),
   para que haya opciones visibles de inmediato.
2. **Al escribir** (debounce ≈ 400 ms): consulta el término de búsqueda y muestra
   los que coincidan. El usuario ya sabe el nombre/código que busca.
3. **Ítems ya asignados**: se muestran como seleccionados **siempre** (se
   precargan por ID al editar), aunque no aparezcan en la búsqueda.
4. **Sin paginación ni scroll infinito** en el selector.

---

## 3. Endpoints

### 3.1 Productos — `GET /admin/products` ✅ ya soportado

| Parámetro | Valor | Uso |
|---|---|---|
| `filter[search]` | texto | LIKE sobre `name`, `slug`, `code`, `brand` |
| `per_page` | 10 | Solo la búsqueda del selector |
| `sort` | `name` | Ordenar por nombre |

**Respuesta (ítems):** `id`, `name`, `code`, `brand`. El frontend necesita `id` + `name` (+ `code` como etiqueta).

### 3.2 Clientes — `GET /admin/customers` ✅ ya soportado

| Parámetro | Valor | Uso |
|---|---|---|
| `search` | texto | LIKE sobre `name`, `email` |
| `per_page` | 10 | Solo la búsqueda del selector |

**Respuesta (ítems):** `id`, `name`, `email`. El frontend necesita `id` + `name` (+ `email` como etiqueta).

### 3.3 Categorías — `GET /admin/categories` ❌ agregar búsqueda

| Parámetro | Valor | Uso |
|---|---|---|
| `filter[search]` | texto | LIKE sobre `name` (y opcional `slug`) |

> El catálogo de categorías es pequeño; el selector puede precargarlas o usar la
> búsqueda si se agrega. Pendiente de decisión (ver §5).

**Respuesta:** `id`, `name`, `parent` (con `parent.name`).

---

## 4. Checklist de Integración en el Admin (frontend) — lo pendiente

- [ ] `p-multiselect` de productos: **búsqueda remota** con debounce (`filter[search]` → `GET /products?filter[search]=X&per_page=10&sort=name`).
- [ ] `p-multiselect` de clientes: **búsqueda remota** con debounce (`search` → `GET /customers?search=X&per_page=10`).
- [ ] `p-multiselect` de categorías: precargar (o búsqueda remota si se agrega).
- [ ] Al abrir sin texto: mostrar primeros 10 resultados.
- [ ] Al editar: precargar los IDs ya asignados y fusionar con los resultados de búsqueda.
- [ ] Sin paginación ni scroll infinito en el selector.

---

## 5. Pendiente: búsqueda en categorías

El único alcance sin búsqueda en backend es **categorías**. Como el catálogo de
categorías es pequeño (decenas, no miles), **no es necesario paginar ni buscar**:
el frontend puede precargarlas todas (`GET /admin/categories`).

Decisión sugerida: **no agregar búsqueda a categorías** por ahora; el selector
precarga las ~decenas de categorías y filtra localmente (el `filter` nativo del
`p-multiselect`). Solo se justifica búsqueda en backend si las categorías
crecieran a cientos/miles.

---

## 6. Archivos afectados (solo frontend)

- `src/app/features/coupons/services/coupon.service.ts` (`listCustomers` → aceptar `search`, `per_page`)
- `src/app/pages/coupons/coupon-list.ts` (multiselects remotos)
- `src/app/features/products/services/product.service.ts` (ya soporta `filter[search]`)

---

## 7. Tests

- El selector de productos devuelve `id` y `name` con `filter[search]`.
- El selector de clientes devuelve `id` y `name` con `search`.
- Los ítems ya asignados se conservan al buscar.
