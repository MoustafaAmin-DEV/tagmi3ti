import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

export function showControlError(
  control: AbstractControl | null | undefined,
  submitted: boolean,
): boolean {
  if (!control) {
    return false;
  }
  return control.invalid && (control.touched || control.dirty || submitted);
}

export function controlErrorMessage(
  control: AbstractControl | null | undefined,
  translate: TranslateService,
): string {
  if (!control?.errors) {
    return '';
  }
  const errors = control.errors;
  const key = Object.keys(errors)[0];
  const payload = errors[key];

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const msg = String((payload as { message: string }).message);
    if (msg && !msg.startsWith('validation.')) {
      return msg;
    }
  }

  switch (key) {
    case 'required':
      return translate.instant('validation.required');
    case 'email':
      return translate.instant('validation.email');
    case 'disposableEmail':
      return translate.instant('validation.disposableEmail');
    case 'maxLength': {
      const max =
        (payload as { requiredLength?: number })?.requiredLength ??
        (payload as { maxLength?: number })?.maxLength;
      return translate.instant('validation.maxLength', { count: max ?? 80 });
    }
    case 'minLength': {
      const min =
        (payload as { requiredLength?: number })?.requiredLength ??
        (payload as { minLength?: number })?.minLength ??
        (payload as { value?: number })?.value;
      return translate.instant('validation.minLength', { count: min ?? 2 });
    }
    case 'greaterThanEqualTo':
    case 'minNumber':
      return translate.instant('validation.minNumber');
    case 'numeric':
      return translate.instant('validation.numeric');
    case 'pattern':
    case 'phoneInvalid':
      return translate.instant('validation.phone');
    case 'phoneRequired':
      return translate.instant('validation.phoneRequired');
    case 'urlInvalid':
      return translate.instant('validation.url');
    case 'numericRange': {
      const range = payload as { min?: number; max?: number };
      return translate.instant('validation.numericRange', {
        min: range?.min ?? '',
        max: range?.max ?? '',
      });
    }
    default:
      return translate.instant('validation.required');
  }
}

/** تحقق اختياري من رقم الهاتف عند الإدخال */
export function phoneDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}
