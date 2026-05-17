import { Component, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [Button, TranslateModule],
  templateUrl: './pwa-install.component.html',
  styleUrl: './pwa-install.component.scss',
})
export class PwaInstallComponent implements OnInit {
  readonly visible = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  ngOnInit(): void {
    if (localStorage.getItem('tagmi3ti-pwa-dismissed') === '1') {
      return;
    }
    if (this.isStandalone()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.visible.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }
    await this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.visible.set(false);
  }

  dismiss(): void {
    localStorage.setItem('tagmi3ti-pwa-dismissed', '1');
    this.visible.set(false);
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }
}
