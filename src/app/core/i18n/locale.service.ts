import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { applyRxwebValidationMessages } from './rxweb-validation.config';

export type AppLang = 'ar' | 'en';

const STORAGE_KEY = 'tagmi3ti-lang';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<AppLang>('ar');
  readonly isRtl = signal(true);

  async init(): Promise<void> {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLang | null;
    const initial: AppLang = saved === 'en' ? 'en' : 'ar';
    this.translate.addLangs(['ar', 'en']);
    this.translate.setFallbackLang('ar');
    await firstValueFrom(this.translate.use(initial));
    this.applyDocument(initial);
    applyRxwebValidationMessages(this.translate);

    this.translate.onLangChange.subscribe((e) => {
      const next = e.lang as AppLang;
      this.applyDocument(next);
      applyRxwebValidationMessages(this.translate);
    });
  }

  async setLang(lang: AppLang): Promise<void> {
    if (this.lang() === lang) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, lang);
    await firstValueFrom(this.translate.use(lang));
  }

  toggleLang(): void {
    void this.setLang(this.lang() === 'ar' ? 'en' : 'ar');
  }

  private applyDocument(lang: AppLang): void {
    this.lang.set(lang);
    this.isRtl.set(lang === 'ar');
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.document.title =
      lang === 'ar' ? 'تجميعتي — Tagmi3ti' : 'Tagmi3ti — PC Builder Egypt';
  }
}
