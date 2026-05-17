import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LocaleService, AppLang } from '../../../core/i18n/locale.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';

export interface NavLink {
  labelKey: string;
  icon: string;
  routerLink: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Button, AuthDialogComponent, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly profileService = inject(ProfileService);
  readonly theme = inject(ThemeService);
  readonly locale = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  mobileOpen = false;

  readonly menuItems: NavLink[] = [
    { labelKey: 'nav.home', icon: 'pi pi-home', routerLink: '/', exact: true },
    { labelKey: 'nav.checker', icon: 'pi pi-check-circle', routerLink: '/checker' },
    { labelKey: 'nav.budget', icon: 'pi pi-wrench', routerLink: '/budget' },
    { labelKey: 'nav.ai', icon: 'pi pi-sparkles', routerLink: '/ai' },
    { labelKey: 'nav.saved', icon: 'pi pi-save', routerLink: '/saved' },
    { labelKey: 'nav.compare', icon: 'pi pi-arrows-h', routerLink: '/compare' },
    { labelKey: 'nav.store', icon: 'pi pi-shop', routerLink: '/store' },
  ];

  readonly langOptions = computed(() => {
    this.locale.lang();
    return [
      { label: this.translate.instant('lang.ar'), value: 'ar' as AppLang },
      { label: this.translate.instant('lang.en'), value: 'en' as AppLang },
    ];
  });

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  async signOutFromMobile(): Promise<void> {
    this.mobileOpen = false;
    await this.signOut();
  }

  loginFromMobile(): void {
    this.mobileOpen = false;
    this.auth.requestLogin();
  }

  toggleThemeMobile(): void {
    this.theme.toggle();
    this.mobileOpen = false;
  }

  setLang(lang: AppLang): void {
    void this.locale.setLang(lang);
  }

  userLabel(): string {
    const profile = this.profileService.profile();
    if (profile?.display_name?.trim()) {
      return profile.display_name.trim();
    }
    return this.auth.user()?.email ?? '';
  }
}
