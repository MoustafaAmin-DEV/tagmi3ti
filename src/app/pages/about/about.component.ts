import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [Card, Button, RouterLink, PageHeaderComponent, TranslateModule],
  templateUrl: './about.component.html',
})
export class AboutComponent {}
