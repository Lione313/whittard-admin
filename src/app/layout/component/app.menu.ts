import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            @for (item of model; track item.label) {
                @if (!item.separator) {
                    <li app-menuitem [item]="item" [root]="true"></li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>
    `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit(): void {
        this.model = [
            {
                label: 'Panel',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Órdenes', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/orders'] },
                    { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: ['/customers'] }
                ]
            },
            {
                label: 'Catálogo',
                icon: 'pi pi-fw pi-shopping-bag',
                path: '/products',
                items: [
                    { label: 'Productos', icon: 'pi pi-fw pi-list', routerLink: ['/products/list'] },
                    { label: 'Categorías', icon: 'pi pi-fw pi-sitemap', routerLink: ['/products/categories'] },
                    { label: 'Atributos', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/products/attributes'] },
                    { label: 'Sabores', icon: 'pi pi-fw pi-sparkles', routerLink: ['/products/flavors'] },
                    { label: 'Sellos', icon: 'pi pi-fw pi-star', routerLink: ['/products/attributions'] },
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
                label: 'Contenido',
                icon: 'pi pi-fw pi-file-edit',
                items: [
                    { label: 'Páginas', icon: 'pi pi-fw pi-file-edit', routerLink: ['/content-general'] },
                    { label: 'Mega Menú', icon: 'pi pi-fw pi-bars', routerLink: ['/megamenu/menu'] },
                    { label: 'Landings', icon: 'pi pi-fw pi-globe', routerLink: ['/megamenu/landings'] },
                    { label: 'Recetas', icon: 'pi pi-fw pi-book', routerLink: ['/recipes'] },
                    { label: 'Carrusel de Recetas', icon: 'pi pi-fw pi-images', routerLink: ['/recipe-carousel'] }
                ]
            },
            {
                label: 'Inventario',
                icon: 'pi pi-fw pi-box',
                path: '/inventory',
                items: [
                    { label: 'Stock', icon: 'pi pi-fw pi-database', routerLink: ['/inventory'] },
                    { label: 'Movimientos', icon: 'pi pi-fw pi-history', routerLink: ['/inventory/movements'] }
                ]
            },
            {
                label: 'Configuración',
                icon: 'pi pi-fw pi-cog',
                items: [
                    { label: 'Cuentas Bancarias', icon: 'pi pi-fw pi-wallet', routerLink: ['/configuration/cuentas-bancarias'] },
                    { label: 'Zona de Delivery', icon: 'pi pi-fw pi-truck', routerLink: ['/configuration/zonas-delivery'] },
                    { label: 'Impuestos', icon: 'pi pi-fw pi-percentage', routerLink: ['/taxes'] },
                    { label: 'WhatsApp', icon: 'pi pi-fw pi-whatsapp', routerLink: ['/configuration/whatsapp'] },
                    { label: 'Chatbot', icon: 'pi pi-fw pi-comments', routerLink: ['/configuration/chatbot'] },
                    { label: 'Recojo en Tienda', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/configuration/recojo-en-tienda'] },
                    { label: 'SEO de Páginas', icon: 'pi pi-fw pi-search', routerLink: ['/configuration/seo-paginas'] },
                    { label: 'Scripts', icon: 'pi pi-fw pi-code', routerLink: ['/configuration/scripts'] }
                ]
            }
        ];
    }
}
