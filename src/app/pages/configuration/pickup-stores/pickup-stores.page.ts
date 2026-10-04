import { Component } from '@angular/core';
import { PickupStoresList } from '@/app/features/configuration/pickup-stores/components/pickup-stores-list';

@Component({
    selector: 'app-pickup-stores-page',
    standalone: true,
    imports: [PickupStoresList],
    template: `<app-pickup-stores-list />`
})
export class PickupStoresPage {}
