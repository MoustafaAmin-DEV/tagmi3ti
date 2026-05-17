import { STORE_LOGO_ACCEPT, STORE_LOGO_MAX_BYTES } from './store-input.util';

const ALLOWED = new Set(STORE_LOGO_ACCEPT.split(','));

export function validateStoreLogoFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return 'store.logoInvalidType';
  }
  if (file.size > STORE_LOGO_MAX_BYTES) {
    return 'store.logoTooLarge';
  }
  return null;
}

export function storeLogoExtension(file: File): string {
  const fromType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return fromType[file.type] ?? 'jpg';
}
