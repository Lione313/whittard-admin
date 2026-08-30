import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editor-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full flex justify-center py-4 px-2 sm:px-4">
      <div class="w-full max-w-4xl bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class EditorContainerComponent {}