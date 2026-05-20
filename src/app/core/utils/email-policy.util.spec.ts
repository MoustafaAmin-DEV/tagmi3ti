import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { getEmailDomain, isDisposableEmailDomain, realEmailValidator } from './email-policy.util';

describe('email-policy.util', () => {
  it('detects disposable domains', () => {
    expect(isDisposableEmailDomain('mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('sub.mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('gmail.com')).toBe(false);
  });

  it('parses email domain', () => {
    expect(getEmailDomain('User@Gmail.COM')).toBe('gmail.com');
  });

  it('rejects disposable email in validator', () => {
    const control = new FormControl('test@yopmail.com');
    expect(realEmailValidator()(control)).toEqual({ disposableEmail: true });
  });

  it('accepts normal email in validator', () => {
    const control = new FormControl('user@gmail.com');
    expect(realEmailValidator()(control)).toBeNull();
  });
});
