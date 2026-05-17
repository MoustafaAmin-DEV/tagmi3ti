import { Part, PartType } from '../models/part.model';

/** سعر يُعرض فقط لقطع أضافها تاجر (لها متجر وسعر مسجّل). */
export function getStorePrice(part: Part | null | undefined): number | null {
  if (!part?.store_id) {
    return null;
  }
  const price = part.market_price_egp ?? part.user_price;
  return price != null && price > 0 ? price : null;
}

export function sumStorePrices(parts: Partial<Record<PartType, Part>>): number {
  return Object.values(parts).reduce((sum, part) => sum + (getStorePrice(part) ?? 0), 0);
}

export function buildHasStorePrices(parts: Partial<Record<PartType, Part>>): boolean {
  return Object.values(parts).some((p) => getStorePrice(p) != null);
}
