import { PART_TYPES, PART_TYPE_LABELS } from '../constants/part-types';
import { SavedBuildRow } from '../models/build.model';
import { getStorePrice } from './part-price.util';

export interface ShoppingListItem {
  type: string;
  label: string;
  name: string;
  price: number | null;
  storeName: string | null;
  storePhone: string | null;
}

export function buildShoppingList(build: SavedBuildRow): ShoppingListItem[] {
  return PART_TYPES.flatMap((type) => {
    const part = build.parts[type];
    if (!part) {
      return [];
    }
    return [
      {
        type,
        label: PART_TYPE_LABELS[type],
        name: part.name,
        price: getStorePrice(part),
        storeName: part.store_name ?? null,
        storePhone: part.store_phone ?? null,
      },
    ];
  });
}

export function formatShoppingListText(
  buildName: string,
  items: ShoppingListItem[],
  checked: Set<string>,
): string {
  const lines = [`قائمة مشتريات — ${buildName}`, '—'.repeat(24)];
  let total = 0;
  for (const item of items) {
    if (!checked.has(item.type)) {
      continue;
    }
    const priceStr = item.price != null ? ` — ${item.price.toLocaleString('ar-EG')} ج.م` : '';
    const store = item.storeName ? ` [${item.storeName}]` : '';
    lines.push(`☐ ${item.label}: ${item.name}${store}${priceStr}`);
    if (item.price != null) {
      total += item.price;
    }
  }
  if (total > 0) {
    lines.push('—'.repeat(24));
    lines.push(`الإجمالي: ${total.toLocaleString('ar-EG')} ج.م`);
  }
  return lines.join('\n');
}
