import { Component, computed, inject, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { controlErrorMessage, showControlError } from '../../../core/i18n/form-control.util';

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (visible()) {
      <small class="form-field-error" role="alert">{{ message() }}</small>
    }
  `,
})
export class FieldErrorComponent {
  private readonly translate = inject(TranslateService);

  readonly control = input<AbstractControl | null>(null);
  readonly submitted = input(false);

  readonly visible = computed(() => showControlError(this.control(), this.submitted()));
  readonly message = computed(() => controlErrorMessage(this.control(), this.translate));
}
