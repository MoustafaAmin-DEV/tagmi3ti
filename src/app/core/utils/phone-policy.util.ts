import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { phoneDigits } from '../i18n/form-control.util';

/** محلي: 010 / 011 / 012 / 015 + 8 أرقام */
const LOCAL_MOBILE = /^01[0125]\d{8}$/;

/** دولي: 20 + 10/11/12/15 + 8 أرقام */
const INTL_MOBILE = /^20(10|11|12|15)\d{8}$/;

/** بدون صفر في البداية: 10/11/12/15 + 8 أرقام */
const SHORT_MOBILE = /^1[0125]\d{8}$/;

export function isValidEgyptMobile(value: unknown): boolean {
  const digits = phoneDigits(value);
  if (!digits) {
    return false;
  }
  return LOCAL_MOBILE.test(digits) || INTL_MOBILE.test(digits) || SHORT_MOBILE.test(digits);
}

/** يحفظ بصيغة محلية 01xxxxxxxxx للعرض وواتساب */
export function formatEgyptPhoneForStorage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const digits = phoneDigits(trimmed);
  if (!isValidEgyptMobile(digits)) {
    return null;
  }
  if (LOCAL_MOBILE.test(digits)) {
    return digits;
  }
  if (INTL_MOBILE.test(digits)) {
    return `0${digits.slice(2)}`;
  }
  if (SHORT_MOBILE.test(digits)) {
    return `0${digits}`;
  }
  return null;
}

export interface EgyptPhoneValidatorOptions {
  required?: boolean;
}

export function egyptPhoneValidator(options: EgyptPhoneValidatorOptions = {}): ValidatorFn {
  const { required = false } = options;
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return required ? { phoneRequired: true } : null;
    }
    return isValidEgyptMobile(raw) ? null : { phoneInvalid: true };
  };
}

export function optionalEgyptPhoneValidator(): ValidatorFn {
  return egyptPhoneValidator({ required: false });
}
