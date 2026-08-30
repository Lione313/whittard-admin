import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                    { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: ['/customers'] },
                    { label: 'Órdenes', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/orders'] }
                ]
            },
            {
                label: 'Catálogo',
                icon: 'pi pi-fw pi-shopping-bag',
                path: '/products',
                items: [
                    { label: 'Productos', icon: 'pi pi-fw pi-list', routerLink: ['/products/list'] },
                    // { label: 'Nuevo Producto', icon: 'pi pi-fw pi-plus', routerLink: ['/products/new'] },
                    { label: 'Categorías', icon: 'pi pi-fw pi-sitemap', routerLink: ['/products/categories'] },
                    { label: 'Atributos', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/products/attributes'] },
                    { label: 'Sellos', icon: 'pi pi-fw pi-star', routerLink: ['/products/attributions'] },
                    { label: 'Sabores', icon: 'pi pi-fw pi-sparkles', routerLink: ['/products/flavors'] },
                    { label: 'Reseñas', icon: 'pi pi-fw pi-comments', routerLink: ['/reviews/list'] }
                ]
            },
            {
                label: 'Promociones',
                icon: 'pi pi-fw pi-tags',
                path: '/coupons',
                items: [{ label: 'Cupones', icon: 'pi pi-fw pi-ticket', routerLink: ['/coupons/list'] }]
            },
            {
                label: 'Inventario',
                icon: 'pi pi-fw pi-box',
                path: '/inventory',
                items: [
                    { label: 'Gestionar stock', icon: 'pi pi-fw pi-database', routerLink: ['/inventory'] },
                    { label: 'Movimientos', icon: 'pi pi-fw pi-history', routerLink: ['/inventory/movements'] }
                ]
            },
            {
                label: 'Impuestos',
                icon: 'pi pi-fw pi-percentage',
                path: '/taxes',
                items: [{ label: 'Impuestos', icon: 'pi pi-fw pi-receipt', routerLink: ['/taxes'] }]
            }
        ];
    }
}
