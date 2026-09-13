import { Component } from '@angular/core';
import { DeliveryZonesColumnsComponent } from '@/app/features/configuration/delivery-zones/components/delivery-zones-columns';

@Component({
    selector: 'app-delivery-zones-page',
    standalone: true,
    imports: [DeliveryZonesColumnsComponent],
    template: `<app-delivery-zones-columns></app-delivery-zones-columns>`
})
export class DeliveryZonesPage {}