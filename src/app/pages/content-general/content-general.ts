import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentGeneralGrid } from '../../features/content-general/components/content-general-grid';

@Component({
  selector: 'app-content-general-page',
  standalone: true,
  imports: [CommonModule, ContentGeneralGrid],
  template: `<app-content-general-grid></app-content-general-grid>`
})
export class ContentGeneral {}