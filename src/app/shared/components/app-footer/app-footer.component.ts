import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SUPPORT_EMAIL } from '../../../core/constants/app-contact';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.scss',
})
export class AppFooterComponent {
  readonly year = new Date().getFullYear();
  readonly supportEmail = SUPPORT_EMAIL;
}
