import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { ScriptService } from '../services/script.service';
import { PaginatedResult } from '@/app/core/models/api.model';
import { Script } from '../models/script.model';

export const scriptsListResolver: ResolveFn<PaginatedResult<Script>> = () => {
    return inject(ScriptService)
        .getAll({ page: 1, per_page: 15 })
        .pipe(map(res => res.data));
};