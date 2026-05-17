import { StoreInput } from '../models/store.model';

export function cleanStoreInput(input: StoreInput): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: input.name.trim(),
  };

  const optionalText: (keyof StoreInput)[] = [
    'phone',
    'city',
    'area',
    'address',
    'description',
    'facebook_url',
    'email',
    'maps_url',
    'hours_sat_thu',
    'hours_fri',
    'hours_notes',
  ];
  for (const key of optionalText) {
    const val = input[key];
    if (typeof val === 'string' && val.trim()) {
      row[key] = val.trim();
    }
  }

  if (input.logo_url === null) {
    row['logo_url'] = null;
  } else if (typeof input.logo_url === 'string' && input.logo_url.trim()) {
    row['logo_url'] = input.logo_url.trim();
  }

  const lat = input.latitude;
  if (lat != null && !Number.isNaN(Number(lat))) {
    row['latitude'] = Number(lat);
  }
  const lng = input.longitude;
  if (lng != null && !Number.isNaN(Number(lng))) {
    row['longitude'] = Number(lng);
  }

  return row;
}

export const EMPTY_STORE_FORM = {
  name: '',
  phone: '',
  city: '',
  area: '',
  address: '',
  description: '',
  facebook_url: '',
  email: '',
  maps_url: '',
  latitude: null as number | null,
  longitude: null as number | null,
  hours_sat_thu: '',
  hours_fri: '',
  hours_notes: '',
} as const;

export const STORE_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const STORE_LOGO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
