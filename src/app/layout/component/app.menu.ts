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
                        routerLink: ['/configuration/cuentas-bancarias']
                    },
                    {
                        label: 'WhatsApp',
                        icon: 'pi pi-fw pi-whatsapp',
                        routerLink: ['/configuration/whatsapp']
                    },
                    {
                        label: 'Tiendas Físicas',
                        icon: 'pi pi-fw pi-map-marker',
                        routerLink: ['/configuration/tiendas-fisicas']
                    },
                    {
                        label: 'Zona Delivery',
                        icon: 'pi pi-fw pi-truck',
                        routerLink: ['/configuration/zonas-delivery']
                    },
                    {
                        label: 'SEO Páginas',
                        icon: 'pi pi-fw pi-search',
                        routerLink: ['/configuration/seo-paginas']
                    },
                    {
                        label: 'Scripts',
                        icon: 'pi pi-fw pi-code',
                        routerLink: ['/configuration/scripts']
                    }
                ]
            },
            {
                label: 'UI Components',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                    { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                    { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                    { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                    { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                    { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                    { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                    { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                    { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
                    { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        path: '/auth',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/pages/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    }
                ]
            },
            {
                label: 'Hierarchy',
                path: '/hierarchy',
                items: [
                    {
                        label: 'Submenu 1',
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_1',
                        items: [
                            {
                                label: 'Submenu 1.1',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_1',
                                items: [
                                    { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 1.2',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_2',
                                items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2',
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_2',
                        items: [
                            {
                                label: 'Submenu 2.1',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_1',
                                items: [
                                    { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 2.2',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_2',
                                items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/documentation']
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }
}