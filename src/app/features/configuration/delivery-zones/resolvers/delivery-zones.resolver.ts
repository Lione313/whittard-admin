import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DeliveryZoneService } from '../services/delivery-zone.service';

export const deliveryZonesResolver: ResolveFn<any> = () => {
    return inject(DeliveryZoneService).getDepartments();
};