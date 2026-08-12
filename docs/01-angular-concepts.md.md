# Angular 21 — Conceptos Clave del Proyecto

Esta guía explica los conceptos de Angular que usamos en el proyecto. No necesitas saber Angular para entenderla, pero sí ayuda tener noción básica de TypeScript y HTML.

---

## ¿Qué es Angular?

Angular es un framework de JavaScript/TypeScript para construir aplicaciones web. A diferencia de React (que es una librería), Angular viene con todo incluido: enrutamiento, manejo de formularios, comunicación con APIs, etc.

La versión que usamos es **Angular 21**, que trabaja con el modo **Standalone**, lo que significa que los componentes no dependen de módulos intermedios (`NgModule`) como en versiones anteriores. Cada componente se autogestiona.

---

## Librería de UI: PrimeNG + Sakai

Usamos **PrimeNG** como librería de componentes visuales. Nos da tablas, botones, modales, calendarios, dropdowns, etc. listos para usar.

La plantilla base del proyecto es **PrimeNG Sakai**, que ya trae el layout del admin armado (sidebar, topbar, menús). No la tocamos salvo que sea estrictamente necesario.

---

## Conceptos que usamos en el proyecto

### Componente

Es la unidad básica de Angular. Combina tres cosas: lógica (`.ts`), template (`.html`) y estilos (`.css`). Todo lo visual es un componente.

```
pages/
  orders/
    order-list.ts       ← lógica
    order-list.html     ← template
```

> En este proyecto omitimos el sufijo `.component` por convención de la plantilla. `order-list.ts` en lugar de `order-list.component.ts`.

---

### Servicio

Un servicio es una clase TypeScript que contiene lógica reutilizable, generalmente para comunicarse con la API o manejar estado global. No tienen template, solo código.

```typescript
// features/orders/services/order.service.ts
@Injectable({ providedIn: 'root' })
export class OrderService {
  getOrders() {
    return this.http.get('/api/v1/orders');
  }
}
```

Los componentes no hablan directo con la API, le piden al servicio que lo haga.

---

### Signals

Los **Signals** son la forma moderna que usa Angular para manejar estado reactivo. Cuando el valor de un Signal cambia, todos los lugares que lo usan se actualizan automáticamente.

```typescript
// Crear un signal
const count = signal(0);

// Leerlo
console.log(count()); // 0

// Actualizarlo
count.set(5);
```

Es similar a `useState` en React, pero integrado nativamente en Angular.

---

### Interceptor HTTP

Un interceptor es una clase que intercepta todas las peticiones HTTP que salen de la app (o las respuestas que entran) antes de que lleguen al componente. Se usa para:

- Adjuntar el token de autenticación a cada request automáticamente.
- Capturar errores 401 (no autorizado) y redirigir al login.
- Mostrar un loader global mientras hay peticiones activas.

```
Cliente → [Interceptor] → API
API → [Interceptor] → Cliente
```

---

### Guard

Un Guard es una clase que decide si el usuario puede o no acceder a una ruta. Se ejecuta antes de que Angular cargue el componente de esa ruta.

Ejemplo: si intentás entrar a `/dashboard` sin estar autenticado, el `AuthGuard` te redirige al login.

```
Usuario navega a /dashboard
  → AuthGuard revisa si hay token
    → Sí: carga el componente
    → No: redirige a /login
```

---

### Directiva

Una directiva es una instrucción que modifica el comportamiento o la apariencia de un elemento HTML. Angular trae algunas por defecto (`*ngIf`, `*ngFor`) y nosotros podemos crear las nuestras.

**Ejemplo propio del proyecto:**

```html
<!-- Solo muestra el botón si el usuario tiene el rol 'admin' -->
<button *hasRole="'admin'">Eliminar pedido</button>
```

La directiva `HasRoleDirective` revisa los roles del usuario autenticado y muestra u oculta el elemento en consecuencia.

---

### Pipe

Un pipe transforma un valor antes de mostrarlo en el template. No modifica el dato original, solo cambia cómo se ve.

```html
<!-- Sin pipe -->
<span>{{ product.price }}</span>
<!-- Muestra: 1500 -->

<!-- Con pipe -->
<span>{{ product.price | currency:'PEN' }}</span>
<!-- Muestra: S/ 1,500.00 -->
```

Usamos pipes para formatear monedas, fechas, textos, etc. sin repetir lógica en cada componente.

---

### Enrutamiento (Router)

Angular maneja la navegación entre páginas sin recargar el browser. Cada ruta apunta a un componente.

```typescript
const routes = [
  { path: 'login',     component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'orders',    component: OrderListComponent, canActivate: [AuthGuard] },
];
```

---

## Resumen rápido

| Concepto | Para qué sirve |
| :--- | :--- |
| Componente | Unidad visual con lógica + template |
| Servicio | Lógica reutilizable, llamadas a la API |
| Signal | Estado reactivo moderno de Angular |
| Interceptor HTTP | Modifica todas las requests/responses de forma global |
| Guard | Controla acceso a rutas según condiciones |
| Directiva | Modifica comportamiento de elementos HTML |
| Pipe | Transforma cómo se muestra un valor en el template |
| Router | Maneja la navegación entre páginas |