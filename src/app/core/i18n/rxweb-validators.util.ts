import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { optionalEgyptPhoneValidator } from '../utils/phone-policy.util';

/** هاتف موبايل مصري اختياري — يُتحقق فقط عند الإدخال */
export function optionalPhoneValidator(): ValidatorFn {
  return optionalEgyptPhoneValidator();
}

/** رقم اختياري ≥ 0 عند وجود قيمة */
export function optionalMinZeroValidator(): ValidatorFn {
  return RxwebValidators.greaterThanEqualTo({
    value: 0,
    conditionalExpression: (_: unknown, value: unknown) => value != null && value !== '',
  });
}

/** بريد اختياري — يُتحقق فقط عند الإدخال */
export function optionalEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : { email: true };
  };
}

/** خط عرض اختياري (−90 … 90) */
export function optionalLatitudeValidator(): ValidatorFn {
  return optionalNumericRangeValidator(-90, 90);
}

/** خط طول اختياري (−180 … 180) */
export function optionalLongitudeValidator(): ValidatorFn {
  return optionalNumericRangeValidator(-180, 180);
}

function optionalNumericRangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') {
      return null;
    }
    const n = Number(value);
    if (Number.isNaN(n) || n < min || n > max) {
      return { numericRange: { min, max } };
    }
    return null;
  };
}

/** رابط اختياري (فيسبوك / موقع) */
export function optionalUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();
    if (!raw) {
      return null;
    }
    try {
      const url = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      new URL(url);
      return null;
    } catch {
      return { urlInvalid: true };
    }
  };
}
