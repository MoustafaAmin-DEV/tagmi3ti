import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { showControlError } from '../../../core/i18n/form-control.util';
import { FieldErrorComponent } from '../field-error/field-error.component';

@Component({
  selector: 'app-store-form-fields',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    InputText,
    InputNumber,
    Textarea,
    Button,
    FieldErrorComponent,
  ],
  templateUrl: './store-form-fields.component.html',
  styleUrl: './store-form-fields.component.scss',
})
export class StoreFormFieldsComponent {
  readonly form = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly logoPreviewUrl = input<string | null>(null);

  readonly logoFileSelected = output<File>();
  readonly logoRemoveRequested = output<void>();

  invalid(name: string): boolean {
    return showControlError(this.form().get(name), this.submitted());
  }

  mapsHref(): string | null {
    const raw = String(this.form().get('maps_url')?.value ?? '').trim();
    if (!raw) {
      return null;
    }
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.logoFileSelected.emit(file);
    }
  }
}
