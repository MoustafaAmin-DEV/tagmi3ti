import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
  readonly eyebrow = input<string>('');
}
