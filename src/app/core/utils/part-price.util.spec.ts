import { describe, it, expect } from 'vitest';
import { getStorePrice, sumStorePrices } from './part-price.util';
import { Part } from '../models/part.model';

describe('part-price.util', () => {
  it('returns price only for store-listed parts', () => {
    const storePart: Part = {
      id: '1',
      name: 'GPU',
      type: 'GPU',
      store_id: 's1',
      market_price_egp: 12000,
    };
    const catalogPart: Part = {
      id: '2',
      name: 'CPU',
      type: 'CPU',
      market_price_egp: 8000,
    };
    expect(getStorePrice(storePart)).toBe(12000);
    expect(getStorePrice(catalogPart)).toBeNull();
  });

  it('sums store prices only', () => {
    const total = sumStorePrices({
      CPU: { id: 'a', name: 'A', type: 'CPU', store_id: 's', market_price_egp: 1000 },
      GPU: { id: 'b', name: 'B', type: 'GPU', market_price_egp: 5000 },
    });
    expect(total).toBe(1000);
  });
});
