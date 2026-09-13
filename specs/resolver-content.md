# Spec — Resolvers en Angular (Whittard Admin)

## ¿Qué es un resolver?

Un resolver pre-carga data **antes** de que el componente renderice. Angular espera que el observable/promesa resuelva antes de activar la ruta.

**Sin resolver:**
```
click → navega → componente renderiza vacío → request → data llega → tabla se llena
```

**Con resolver:**
```
click → request (aún en URL anterior) → data lista → navega → componente renderiza con data
```

---

## Cuándo aplicar resolver

| Caso | ¿Resolver? | Motivo |
|---|---|---|
| Listado paginado (primera página) | ✅ Sí | Pre-carga la página 1 antes de renderizar |
| Formulario de edición | ✅ Sí | Pre-carga la entidad por ID |
| Formulario de creación | ❌ No | No hay data que pre-cargar |
| Dialog modal (no ruta) | ❌ No | No se navega, no aplica resolver |
| Listado lazy con cambio de página | ⚠️ Solo página 1 | El resolver carga la primera página; las demás se cargan internamente |

---

## Estructura de carpetas

```
features/
  configuration/
    bank-accounts/
      components/
        bank-accounts-list.ts
        bank-account-dialog.ts
      models/
        bank-account.model.ts
      resolvers/                          ← carpeta de resolvers
        bank-accounts-list.resolver.ts    ← resolver de listado
        bank-account.resolver.ts          ← resolver de edición (si aplica)
      services/
        bank-account.service.ts

pages/
  configuration/
    bank-accounts/
      routes/                             ← carpeta de rutas
        bank-accounts.routes.ts           ← rutas del feature
      bank-accounts.page.ts
```

---

## Naming convention

| Archivo | Nombre del resolver |
|---|---|
| `bank-accounts-list.resolver.ts` | `bankAccountsListResolver` |
| `bank-account.resolver.ts` | `bankAccountResolver` |
| `physical-stores-list.resolver.ts` | `physicalStoresListResolver` |

---

## Resolver de listado

```typescript
// features/configuration/bank-accounts/resolvers/bank-accounts-list.resolver.ts

import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { BankAccountService } from '../services/bank-account.service';
import { PaginatedResult } from '@/app/core/models/api.model';
import { BankAccount } from '../models/bank-account.model';

export const bankAccountsListResolver: ResolveFn<PaginatedResult<BankAccount>> = () => {
    return inject(BankAccountService)
        .getAll({ page: 1, per_page: 15 })
        .pipe(map(res => res.data));
};
```

### Reglas
- `ResolveFn<T>` donde `T` es el tipo que retorna (sin wrapper `ApiResponse`)
- Usar `.pipe(map(res => res.data))` para desempaquetar
- Sin `catchError` en listados — si falla, Angular cancela la navegación
- Para edición sí agregar `catchError` con redirect

---

## Resolver de edición (con redirect en error)

```typescript
// features/configuration/bank-accounts/resolvers/bank-account.resolver.ts

import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, map, EMPTY } from 'rxjs';
import { BankAccountService } from '../services/bank-account.service';
import { BankAccount } from '../models/bank-account.model';

export const bankAccountResolver: ResolveFn<BankAccount> = (route) => {
    const router = inject(Router);
    const id = Number(route.paramMap.get('id'));

    return inject(BankAccountService).getById(id).pipe(
        map(res => res.data),
        catchError(() => {
            router.navigateByUrl('/configuration/bank-accounts');
            return EMPTY;
        })
    );
};
```

---

## Rutas con resolver

```typescript
// pages/configuration/bank-accounts/routes/bank-accounts.routes.ts

import { Routes } from '@angular/router';
import { bankAccountsListResolver } from '@/app/features/configuration/bank-accounts/resolvers/bank-accounts-list.resolver';

export default [
    {
        path: '',
        loadComponent: () =>
            import('../bank-accounts.page').then((m) => m.BankAccountsPage),
        resolve: { result: bankAccountsListResolver },   // ← key 'result'
    },
    { path: '**', redirectTo: '/notfound' },
] as Routes;
```

### Reglas de rutas
- Archivo en `pages/.../routes/feature.routes.ts`
- La key del resolve (`result`, `store`, `bankAccount`) es la que se lee en el componente
- `loadComponent` siempre con import dinámico
- El `resolve` va en la ruta, no en el componente

---

## Consumir el resolver en el componente

```typescript
// En el componente — ngOnInit lee del snapshot, NO hace el request

ngOnInit(): void {
    const result = this.route.snapshot.data['result'] as PaginatedResult<BankAccount>;
    this.accounts.set(result.items);
    this.pagination.set(result.pagination);
}
```

### Para edición
```typescript
ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
        this.storeId.set(+id);
        const store = this.route.snapshot.data['store'] as PhysicalStore;
        this.name = store.name;
        this.address = store.address ?? '';
        // etc...
    }
}
```

### Reglas
- `this.route.snapshot.data['key']` — key debe coincidir con el resolve de la ruta
- El componente **no llama al service** en `ngOnInit` para la carga inicial
- El `load()` interno sigue existiendo para re-cargar (cambio de página, after save/delete)

---

## Resumen de keys por feature

| Feature | Key resolver | Tipo |
|---|---|---|
| Bank Accounts list | `result` | `PaginatedResult<BankAccount>` |
| Physical Stores list | `result` | `PhysicalStore[]` |
| Bank Account edit | `bankAccount` | `BankAccount` |
| Physical Store edit | `store` | `PhysicalStore` |