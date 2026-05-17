import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl, partInquiryMessage } from './whatsapp.util';

describe('whatsapp.util', () => {
  it('normalizes Egyptian mobile to 20 prefix', () => {
    const url = buildWhatsAppUrl('01012345678', 'مرحباً');
    expect(url).toContain('wa.me/201012345678');
  });

  it('builds inquiry message with store name', () => {
    expect(partInquiryMessage('RTX 4060', 'متجر النخبة')).toContain('متجر النخبة');
    expect(partInquiryMessage('RTX 4060', 'متجر النخبة')).toContain('RTX 4060');
  });
});
