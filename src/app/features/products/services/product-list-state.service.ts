import { Injectable, signal } from '@angular/core';
import { ProductListItem, ProductStatus } from '@/app/features/products/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductListStateService {
    readonly products = signal<ProductListItem[]>([]);
    readonly totalRecords = signal(0);
    readonly rows = signal(15);
    readonly search = signal('');
    readonly statusFilter = signal<ProductStatus | null>(null);
    readonly loaded = signal(false);
}
