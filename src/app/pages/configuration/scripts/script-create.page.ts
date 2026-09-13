import { Component } from '@angular/core';
import { ScriptFormComponent } from '@/app/features/configuration/scripts/components/script-form';

@Component({
    selector: 'app-script-create-page',
    standalone: true,
    imports: [ScriptFormComponent],
    template: `
        <app-script-form />
    `,
})
export class ScriptCreatePage {}