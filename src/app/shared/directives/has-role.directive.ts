import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
    selector: '[appHasRole]',
    standalone: true
})
export class HasRoleDirective {
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);
    private authService = inject(AuthService);

    appHasRole = input.required<string | string[]>();

    constructor() {
        effect(() => {
            const rawRoles = this.appHasRole();
            const requiredRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
            
            const userRole = this.authService.user()?.role;

            this.viewContainer.clear();

            if (userRole && requiredRoles.includes(userRole)) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        });
    }
}