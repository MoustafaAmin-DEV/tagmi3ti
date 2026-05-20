import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { SUPPORT_EMAIL } from '../../core/constants/app-contact';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [Card, RouterLink, PageHeaderComponent, TranslateModule],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  readonly supportEmail = SUPPORT_EMAIL;
}
