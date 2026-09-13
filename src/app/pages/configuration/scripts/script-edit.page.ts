import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScriptFormComponent } from '@/app/features/configuration/scripts/components/script-form';
import { Script } from '@/app/features/configuration/scripts/models/script.model';

@Component({
    selector: 'app-script-edit-page',
    standalone: true,
    imports: [ScriptFormComponent],
    template: `
        <app-script-form [script]="script()" />
    `,
})
export class ScriptEditPage implements OnInit {
    private route = inject(ActivatedRoute);
    script = signal<Script | null>(null);

    ngOnInit(): void {
        this.script.set(this.route.snapshot.data['script'] as Script);
    }
}