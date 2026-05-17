import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'tagmi3ti-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readStoredPreference());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  setDark(dark: boolean): void {
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('app-dark', dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }

  private readStoredPreference(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light') {
      return false;
    }
    if (stored === 'dark') {
      return true;
    }
    return true;
  }
}
