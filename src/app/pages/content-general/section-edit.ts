import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionEditorContainer } from '../../features/content-general/components/section-editor-container';

@Component({
  selector: 'app-section-edit-page',
  standalone: true,
  imports: [CommonModule, SectionEditorContainer],
  template: `<app-section-editor-container></app-section-editor-container>`
})
export class SectionEdit {}