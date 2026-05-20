import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Domains commonly used for throwaway signups (not exhaustive). */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'grr.la',
  'sharklasers.com',
  'yopmail.com',
  'yopmail.fr',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'trashmail.com',
  'trashmail.me',
  'discard.email',
  'getnada.com',
  'maildrop.cc',
  'fakeinbox.com',
  'tempail.com',
  'dispostable.com',
  'mailnesia.com',
  'mintemail.com',
  'emailondeck.com',
  'throwaway.email',
  'example.com',
  'test.com',
  'localhost',
]);

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getEmailDomain(email: string): string | null {
  const normalized = normalizeAuthEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at < 1) {
    return null;
  }
  return normalized.slice(at + 1);
}

export function isDisposableEmailDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.has(d)) {
    return true;
  }
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (d.endsWith(`.${blocked}`)) {
      return true;
    }
  }
  return false;
}

/** Stricter than browser `type=email` — blocks disposable domains on register/login. */
export function realEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }
    if (!EMAIL_FORMAT.test(value)) {
      return { email: true };
    }
    const domain = getEmailDomain(value);
    if (domain && isDisposableEmailDomain(domain)) {
      return { disposableEmail: true };
    }
    return null;
  };
}

export function authPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) {
      return null;
    }
    if (value.length < 8) {
      return { minLength: { requiredLength: 8 } };
    }
    return null;
  };
}

export function authDisplayNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return { required: true };
    }
    if (value.length < 2) {
      return { minLength: { requiredLength: 2 } };
    }
    if (value.length > 80) {
      return { maxLength: { requiredLength: 80 } };
    }
    return null;
  };
}
