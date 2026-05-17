import { describe, it, expect } from 'vitest';
import { buildShoppingList, formatShoppingListText } from './shopping-list.util';
import { SavedBuildRow } from '../models/build.model';

describe('shopping-list.util', () => {
  it('builds items only for selected part types', () => {
    const build: SavedBuildRow = {
      id: '1',
      user_id: 'u1',
      name: 'تجميعة اختبار',
      parts: {
        CPU: {
          id: 'c1',
          name: 'Ryzen 5',
          type: 'CPU',
          store_id: 'store-1',
          market_price_egp: 5000,
        },
      },
      total_price: 5000,
      is_compatible: true,
      use_case: null,
      notes: null,
      created_at: new Date().toISOString(),
    };

    const items = buildShoppingList(build);
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('المعالج');
  });

  it('formats text with checked items only', () => {
    const text = formatShoppingListText(
      'تجميعتي',
      [
        { type: 'CPU', label: 'المعالج', name: 'Ryzen', price: 1000, storeName: null, storePhone: null },
        { type: 'GPU', label: 'كارت', name: 'RTX', price: 2000, storeName: null, storePhone: null },
      ],
      new Set(['CPU']),
    );
    expect(text).toContain('المعالج');
    expect(text).not.toContain('RTX');
  });
});
