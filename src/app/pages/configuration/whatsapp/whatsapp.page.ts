import { Component } from '@angular/core';
import { WhatsappConfigForm } from '../../../features/configuration/whatsapp/components/whatsapp-config-form';

@Component({
    selector: 'app-whatsapp-page',
    standalone: true,
    imports: [WhatsappConfigForm],
    template: `<app-whatsapp-config-form></app-whatsapp-config-form>`
})
export class WhatsappPage {}