import { Component } from '@angular/core';
import { PhysicalStoreSectionList } from '@/app/features/configuration/physical-stores/components/physical-stores-list';

@Component({
    selector: 'app-physical-stores-page',
    standalone: true,
    imports: [PhysicalStoreSectionList],
    template: `<app-physical-store-section-list />`,
})
export class PhysicalStoresPage {}