# Arquitectura del Proyecto — Whittard Admin

El proyecto usa **Clean Architecture adaptada a Frontend**. La idea es simple: cada carpeta tiene una responsabilidad clara y no puede importar de cualquier lado. Esto evita que el código se vuelva un desastre con el tiempo.

---

## Estructura de carpetas (`src/app/`)

```
src/app/
├── core/
├── features/
├── layout/
├── pages/
└── shared/
```

---

### `core/`

**Lógica global que la app necesita para arrancar.**

Aquí va todo lo que es transversal a toda la aplicación: autenticación, interceptores, guards y el servicio base de API. Solo existe una instancia de cada cosa en esta carpeta (son singletons).

```
core/
├── services/
│   ├── auth.service.ts
│   ├── storage.service.ts
│   └── api.service.ts
├── interceptors/
│   └── auth.interceptor.ts
└── guards/
    └── auth.guard.ts
```

Regla: `core/` no importa nada de `features/`, `pages/` ni `shared/`. Es completamente independiente.

---

### `features/`

**Lógica de negocio organizada por entidad.**

Cada entidad del sistema (pedidos, productos, usuarios) tiene su propia subcarpeta con sus servicios, modelos y componentes específicos que no tienen sentido fuera de ese dominio.

```
features/
├── orders/
│   ├── services/
│   │   └── order.service.ts
│   └── models/
│       └── order.model.ts
├── products/
│   ├── services/
│   │   └── product.service.ts
│   └── models/
│       └── product.model.ts
└── users/
    └── services/
        └── user.service.ts
```

Regla: `features/` puede importar de `shared/` y `core/`, pero nunca de `pages/`.

---

### `layout/`

**El esqueleto visual de la app.**

Contiene los componentes que forman la estructura base de la interfaz: sidebar, topbar, footer y configuración de temas. Lo provee la plantilla Sakai y generalmente no se toca.

```
layout/
├── app.layout.ts
├── app.sidebar.ts
├── app.topbar.ts
└── app.menu.ts
```

Regla: `layout/` puede importar de `shared/` y `core/`.

---

### `pages/`

**Las pantallas de la aplicación.**

Cada archivo acá corresponde a una página que el usuario ve. Estas páginas no deben contener lógica de negocio compleja: su trabajo es recibir datos de los servicios en `features/` y mostrárselos al usuario.

```
pages/
├── auth/
│   └── login.ts
├── dashboard/
│   └── dashboard.ts
└── orders/
    ├── order-list.ts
    └── order-detail.ts
```

Regla: `pages/` puede importar de `features/`, `shared/` y `core/`. Es la capa más "alta" y puede ver todo.

---

### `shared/`

**Componentes y utilidades genéricas reutilizables.**

Aquí van cosas que se usan en más de un lugar y que no tienen lógica de negocio propia. Son componentes "tontos": reciben datos y los muestran, nada más.

```
shared/
├── components/
│   ├── data-table/
│   │   └── data-table.ts
│   └── stat-card/
│       └── stat-card.ts
├── pipes/
│   └── currency-format.pipe.ts
└── directives/
    └── has-role.directive.ts
```

Regla: `shared/` solo puede importar de Angular, PrimeNG y archivos dentro del propio `shared/`. Nunca de `features/` ni `pages/`.

---

## Flujo de dependencias

```
pages/
  ↓ importa de
features/   shared/
  ↓             ↓
         core/
```

Si invertís una flecha, estás haciendo algo mal.

---

## Nomenclatura de archivos

Para componentes visuales (lo que el usuario ve), omitimos el sufijo `.component`:

| Correcto | Incorrecto |
| :--- | :--- |
| `login.ts` | `login.component.ts` |
| `order-list.ts` | `order-list.component.ts` |
| `dashboard.ts` | `dashboard.component.ts` |

Para todo lo demás, el sufijo se mantiene para que quede claro qué es cada archivo:

| Tipo | Ejemplo |
| :--- | :--- |
| Servicio | `order.service.ts` |
| Guard | `auth.guard.ts` |
| Interceptor | `auth.interceptor.ts` |
| Directiva | `has-role.directive.ts` |
| Pipe | `currency-format.pipe.ts` |
| Modelo | `order.model.ts` |

---

## ¿Dónde pongo mi código? — Guía rápida

| Situación | Dónde va |
| :--- | :--- |
| Componente de tarjeta de KPI que se usa en 5 páginas | `shared/components/stat-card/stat-card.ts` |
| Servicio para `/api/v1/orders` | `features/orders/services/order.service.ts` |
| Pantalla de lista de pedidos | `pages/orders/order-list.ts` |
| Guardar/leer el token en localStorage | `core/services/storage.service.ts` |
| Modelo TypeScript de un pedido | `features/orders/models/order.model.ts` |
| Pipe para formatear moneda | `shared/pipes/currency-format.pipe.ts` |