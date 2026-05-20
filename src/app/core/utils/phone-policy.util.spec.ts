import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import {
  formatEgyptPhoneForStorage,
  isValidEgyptMobile,
  optionalEgyptPhoneValidator,
} from './phone-policy.util';

describe('phone-policy.util', () => {
  it('accepts local Egyptian mobile', () => {
    expect(isValidEgyptMobile('01012345678')).toBe(true);
    expect(isValidEgyptMobile('01123456789')).toBe(true);
  });

  it('accepts international and short forms', () => {
    expect(isValidEgyptMobile('+20 10 1234 5678')).toBe(true);
    expect(isValidEgyptMobile('1012345678')).toBe(true);
  });

  it('rejects landline and invalid prefixes', () => {
    expect(isValidEgyptMobile('0223456789')).toBe(false);
    expect(isValidEgyptMobile('01912345678')).toBe(false);
    expect(isValidEgyptMobile('010123')).toBe(false);
  });

  it('normalizes to 01xxxxxxxx', () => {
    expect(formatEgyptPhoneForStorage('+20 10 1234 5678')).toBe('01012345678');
    expect(formatEgyptPhoneForStorage('1012345678')).toBe('01012345678');
  });

  it('optional validator allows empty', () => {
    expect(optionalEgyptPhoneValidator()(new FormControl(''))).toBeNull();
  });

  it('optional validator rejects invalid', () => {
    expect(optionalEgyptPhoneValidator()(new FormControl('123'))).toEqual({
      phoneInvalid: true,
    });
  });
});
