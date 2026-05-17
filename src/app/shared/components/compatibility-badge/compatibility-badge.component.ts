import { Component, computed, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Tag } from 'primeng/tag';
import { LocaleService } from '../../../core/i18n/locale.service';

@Component({
  selector: 'app-compatibility-badge',
  standalone: true,
  imports: [Tag],
  templateUrl: './compatibility-badge.component.html',
})
export class CompatibilityBadgeComponent {
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);

  readonly compatible = input(false);
  readonly hasSelection = input(false);
  readonly score = input<number | null>(null);

  readonly severity = computed(() => {
    this.locale.lang();
    const s = this.score();
    if (s != null) {
      if (s >= 80) {
        return 'success';
      }
      if (s >= 50) {
        return 'warn';
      }
      return 'danger';
    }
    return this.compatible() ? 'success' : 'danger';
  });

  readonly label = computed(() => {
    this.locale.lang();
    const s = this.score();
    if (s != null) {
      return this.translate.instant('compat.score', { score: s });
    }
    return this.compatible()
      ? this.translate.instant('compat.compatible')
      : this.translate.instant('compat.incompatible');
  });

  readonly icon = computed(() => {
    const s = this.score();
    if (s != null && s >= 80) {
      return 'pi pi-check';
    }
    if (s != null && s < 50) {
      return 'pi pi-times';
    }
    return this.compatible() ? 'pi pi-check' : 'pi pi-times';
  });
}
