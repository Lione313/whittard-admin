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
    </ul>`
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Administrador',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: ['/customers'] },
                    { label: 'Órdenes', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/orders'] },
                    { label: 'Contenido General', icon: 'pi pi-fw pi-file-edit', routerLink: ['/content-general'] },
                    { label: 'Recetas', icon: 'pi pi-fw pi-book', routerLink: ['/recipes'] }
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
            },
            {
                label: 'Configuración',
                icon: 'pi pi-fw pi-cog',
                items: [
                    {
                        label: 'Cuentas Bancarias',
                        icon: 'pi pi-fw pi-wallet',
                        routerLink: ['/settings/bank-accounts']
                    },
                    {
                        label: 'WhatsApp',
                        icon: 'pi pi-fw pi-whatsapp',
                        routerLink: ['/settings/whatsapp']
                    },
                    {
                        label: 'Tiendas Físicas',
                        icon: 'pi pi-fw pi-map-marker',
                        routerLink: ['/settings/physical-stores']
                    },
                    {
                        label: 'Zona Delivery',
                        icon: 'pi pi-fw pi-truck',
                        routerLink: ['/settings/shipping-zones']
                    },
                    {
                        label: 'SEO Páginas',
                        icon: 'pi pi-fw pi-search',
                        routerLink: ['/settings/seo-metadata']
                    },
                    {
                        label: 'Scripts',
                        icon: 'pi pi-fw pi-code',
                        routerLink: ['/settings/custom-scripts']
                    }
                ]
            }
        ];
    }
}