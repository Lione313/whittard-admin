import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PendingChangesService {
    private dirty = signal(false);

    readonly hasChanges = this.dirty.asReadonly();

    markDirty() {
        this.dirty.set(true);
    }

    clear() {
        this.dirty.set(false);
    }
}
