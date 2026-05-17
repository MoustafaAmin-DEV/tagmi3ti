import { ReactiveFormConfig } from '@rxweb/reactive-form-validators';
import { TranslateService } from '@ngx-translate/core';

/** رسائل RxWeb — تُحدَّث عند تغيير اللغة */
export function applyRxwebValidationMessages(translate: TranslateService): void {
  ReactiveFormConfig.set({
    validationMessage: {
      required: translate.instant('validation.required'),
      email: translate.instant('validation.email'),
      minLength: translate.instant('validation.minLength', { count: '{{0}}' }),
      greaterThanEqualTo: translate.instant('validation.minNumber'),
      numeric: translate.instant('validation.numeric'),
      pattern: translate.instant('validation.phone'),
      phoneInvalid: translate.instant('validation.phone'),
    },
  });
}
