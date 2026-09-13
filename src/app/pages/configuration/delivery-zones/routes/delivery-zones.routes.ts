import { Routes } from '@angular/router';
import { deliveryZonesResolver } from '@/app/features/configuration/delivery-zones/resolvers/delivery-zones.resolver';

export default [
    {
        path: '',
        loadComponent: () =>
            import('../delivery-zones.page').then((m) => m.DeliveryZonesPage),
        resolve: { departments: deliveryZonesResolver }
    }
] as Routes;