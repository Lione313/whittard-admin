import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, map, EMPTY } from 'rxjs';
import { ScriptService } from '../services/script.service';
import { Script } from '../models/script.model';

export const scriptResolver: ResolveFn<Script> = (route) => {
    const router = inject(Router);
    const id = Number(route.paramMap.get('id'));

    return inject(ScriptService).getById(id).pipe(
        map(res => res.data),
        catchError(() => {
            router.navigateByUrl('/configuration/scripts');
            return EMPTY;
        })
    );
};