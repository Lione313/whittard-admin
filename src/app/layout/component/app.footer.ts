import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer text-muted-color">© {{ year }} Whittard Admin</div>`
})
export class AppFooter {
    year = new Date().getFullYear();
}
