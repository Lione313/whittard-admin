# Cómo Funciona la Aplicación — Whittard Admin

Esta guía explica el flujo general de la app: qué pasa desde que el usuario abre el browser hasta que ve una lista de pedidos. No es necesario conocer Angular a fondo para entenderla.

---

## Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| Frontend (este repo) | Angular 21 — Standalone |
| UI Components | PrimeNG + Plantilla Sakai |
| Backend / API | Laravel 13 |
| Autenticación | Laravel Sanctum (tokens Bearer) |
| Base de datos | PostgreSQL + Redis |

---

## 1. El `ApiService` — La pieza central

Casi todo pasa por `core/services/api.service.ts`. Este servicio es un wrapper sobre el `HttpClient` de Angular. En lugar de que cada servicio arme sus propias requests con URLs hardcodeadas, todos le piden al `ApiService` que lo haga.

```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl; // https://api.whittard.com/api/v1

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  post<T>(endpoint: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }
}
```

Ventaja: si cambia la URL base o querés agregar headers globales, lo cambiás en un solo lugar.

---

## 2. El `AuthInterceptor` — Todas las requests pasan por acá

Cada vez que la app hace una request HTTP, el interceptor la "intercepta" y le adjunta el token Bearer automáticamente.

```
App hace GET /orders
  → AuthInterceptor agarra la request
  → Le agrega el header: Authorization: Bearer <token>
  → Recién ahí se envía al servidor
```

Si la API responde con un **401 (no autorizado)** — porque el token expiró — el interceptor lo detecta, intenta refrescar el token y, si no puede, redirige al login.

El desarrollador que hace el `OrderService` no tiene que pensar en nada de esto. Solo llama a `apiService.get('orders')` y el interceptor se encarga del resto.

---

## 3. El `AuthGuard` — Protección de rutas

Antes de que Angular renderice cualquier página protegida, el guard pregunta: ¿hay un usuario autenticado?

```
Usuario navega a /dashboard
  → AuthGuard revisa si hay token en memoria/storage
    → Hay token válido: renderiza el componente
    → No hay token: redirige a /login
```

Las rutas en el router se declaran con `canActivate: [authGuard]` para activar esta protección.

---

## 4. El `AuthService` — Manejo de sesión

`core/services/auth.service.ts` es el responsable de toda la lógica de autenticación:

- `login(email, password)` — llama a la API, guarda el token.
- `logout()` — borra el token y redirige al login.
- `refreshToken()` — renueva el token cuando está por expirar.
- `currentUser()` — retorna el usuario autenticado como Signal.

El token se guarda en `StorageService`, que abstrae el `localStorage` para que si algún día cambiamos el método de almacenamiento, solo lo cambiamos en un lugar.

---

## 5. Flujo completo de una pantalla — Ejemplo: Lista de Pedidos

```
Usuario autenticado navega a /orders
       ↓
Router verifica AuthGuard → ok
       ↓
Carga order-list.ts (pages/orders)
       ↓
order-list.ts llama a OrderService.getOrders()
       ↓
OrderService llama a ApiService.get('orders')
       ↓
ApiService dispara el HTTP request
       ↓
AuthInterceptor agrega el token Bearer
       ↓
Laravel API responde con la lista de pedidos
       ↓
AuthInterceptor deja pasar la respuesta
       ↓
OrderService recibe los datos y los retorna
       ↓
order-list.ts guarda los datos en un Signal
       ↓
order-list.html se actualiza automáticamente con la lista
```

---

## 6. Estado reactivo con Signals

Los datos en los componentes se manejan con Signals. La ventaja es que cuando el valor cambia, el template se actualiza solo sin necesidad de código extra.

```typescript
// pages/orders/order-list.ts
export class OrderListComponent {
  orders = signal<Order[]>([]);
  isLoading = signal(false);

  constructor(private orderService: OrderService) {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    this.orderService.getOrders().subscribe(data => {
      this.orders.set(data);
      this.isLoading.set(false);
    });
  }
}
```

```html
<!-- order-list.html -->
@if (isLoading()) {
  <p-progressSpinner />
} @else {
  <app-data-table [data]="orders()" />
}
```

---

## 7. Roles y permisos

El backend usa **Spatie Permission** para manejar roles. El frontend los recibe en el objeto del usuario autenticado y los expone a través del `AuthService`.

La directiva `HasRoleDirective` se encarga de mostrar u ocultar elementos según el rol:

```html
<!-- Solo visible si el usuario tiene rol 'admin' -->
<button *hasRole="'admin'" (click)="deleteOrder(order.id)">
  Eliminar
</button>
```

Esto es solo protección visual. La protección real siempre está en el backend.

---

## 8. Variables de entorno

La URL de la API y otras configuraciones se manejan en los archivos de environment:

```
src/environments/
├── environment.ts           ← desarrollo (localhost)
└── environment.production.ts ← producción
```

Angular inyecta automáticamente el archivo correcto según cómo se buildea la app (`ng serve` vs `ng build --configuration production`).

---

## Resumen del flujo general

```
Browser
  └── Angular Router
        ├── AuthGuard (¿está autenticado?)
        └── Componente de Página (pages/)
              └── Servicio de Feature (features/)
                    └── ApiService (core/)
                          └── AuthInterceptor (core/)
                                └── Laravel API
```

Cada capa tiene una responsabilidad. El componente muestra, el servicio de feature coordina, el ApiService comunica y el interceptor gestiona la seguridad.