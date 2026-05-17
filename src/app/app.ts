import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AppFooterComponent } from './shared/components/app-footer/app-footer.component';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AppFooterComponent, PwaInstallComponent, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(ThemeService);
  }
}
