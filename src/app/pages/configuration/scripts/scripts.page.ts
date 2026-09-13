import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScriptsList } from '@/app/features/configuration/scripts/components/scripts-list';
import { PaginatedResult } from '@/app/core/models/api.model';
import { Script } from '@/app/features/configuration/scripts/models/script.model';

@Component({
    selector: 'app-scripts-page',
    standalone: true,
    imports: [ScriptsList],
    template: `
        <app-scripts-list [initialData]="initialData" />
    `,
})
export class ScriptsPage implements OnInit {
    private route = inject(ActivatedRoute);
    initialData!: PaginatedResult<Script>;

    ngOnInit(): void {
        this.initialData = this.route.snapshot.data['result'] as PaginatedResult<Script>;
    }
}