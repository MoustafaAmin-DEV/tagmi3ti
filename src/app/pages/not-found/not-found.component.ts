import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, Button, PageHeaderComponent, TranslateModule],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
