export type PartType =
  | 'CPU'
  | 'Motherboard'
  | 'GPU'
  | 'RAM'
  | 'Case'
  | 'PSU'
  | 'Cooler';

export interface Part {
  id: string;
  name: string;
  type: PartType;
  brand?: string;
  socket?: string;
  chipset?: string;
  ram_type?: string;
  ram_slots?: number;
  max_ram_gb?: number;
  tdp_watts?: number;
  max_gpu_length_mm?: number;
  psu_wattage?: number;
  gpu_length_mm?: number;
  form_factor?: string;
  store_id?: string | null;
  store_name?: string;
  store_phone?: string;
  /** للعرض في القوائم: [اسم المتجر] اسم القطعة */
  displayName?: string;
  /** سعر المتجر (يُعرض للمستخدم فقط عند وجود store_id) */
  market_price_egp?: number;
  /** سعر محفوظ مع التجميعة (قديم/اختياري) */
  user_price?: number;
}
