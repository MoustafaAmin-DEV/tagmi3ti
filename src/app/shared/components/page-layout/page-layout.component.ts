import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

export type PageLayoutMode = 'contained' | 'full';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './page-layout.component.html',
})
export class PageLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly layout = signal<PageLayoutMode>('contained');

  ngOnInit(): void {
    this.refreshLayout();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refreshLayout());
  }

  private refreshLayout(): void {
    let current: ActivatedRoute | null = this.route;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    this.layout.set(current?.snapshot.data['layout'] === 'full' ? 'full' : 'contained');
  }
}
