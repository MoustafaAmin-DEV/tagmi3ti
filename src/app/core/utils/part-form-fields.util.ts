import { PartInput } from '../models/store.model';
import { PartType } from '../models/part.model';

/** حقول المواصفات الاختيارية في نموذج المتجر (غير الاسم/النوع/العلامة/السعر) */
export type PartFormSpecField =
  | 'socket'
  | 'ram_type'
  | 'tdp_watts'
  | 'gpu_length_mm'
  | 'max_gpu_length_mm'
  | 'psu_wattage';

const FIELDS_BY_TYPE: Record<PartType, readonly PartFormSpecField[]> = {
  CPU: ['socket', 'tdp_watts'],
  Motherboard: ['socket', 'ram_type'],
  GPU: ['gpu_length_mm', 'tdp_watts'],
  RAM: ['ram_type'],
  Case: ['max_gpu_length_mm'],
  PSU: ['psu_wattage'],
  Cooler: ['socket', 'tdp_watts'],
};

export function isPartFormFieldVisible(type: PartType, field: PartFormSpecField): boolean {
  return FIELDS_BY_TYPE[type].includes(field);
}

/** يُفرَّغ الحقول المخفية عند تغيير النوع */
export function hiddenPartFormPatch(type: PartType): Partial<{
  socket: string;
  ram_type: string;
  tdp_watts: number | null;
  gpu_length_mm: number | null;
  max_gpu_length_mm: number | null;
  psu_wattage: number | null;
}> {
  const patch: ReturnType<typeof hiddenPartFormPatch> = {};
  if (!isPartFormFieldVisible(type, 'socket')) {
    patch.socket = '';
  }
  if (!isPartFormFieldVisible(type, 'ram_type')) {
    patch.ram_type = '';
  }
  if (!isPartFormFieldVisible(type, 'tdp_watts')) {
    patch.tdp_watts = null;
  }
  if (!isPartFormFieldVisible(type, 'gpu_length_mm')) {
    patch.gpu_length_mm = null;
  }
  if (!isPartFormFieldVisible(type, 'max_gpu_length_mm')) {
    patch.max_gpu_length_mm = null;
  }
  if (!isPartFormFieldVisible(type, 'psu_wattage')) {
    patch.psu_wattage = null;
  }
  return patch;
}

/** يزيل مواصفات غير المرتبطة بالنوع قبل الحفظ */
export function normalizePartInputForType(type: PartType, input: PartInput): PartInput {
  const normalized: PartInput = { ...input, type };
  if (!isPartFormFieldVisible(type, 'socket')) {
    delete normalized.socket;
  }
  if (!isPartFormFieldVisible(type, 'ram_type')) {
    delete normalized.ram_type;
  }
  if (!isPartFormFieldVisible(type, 'tdp_watts')) {
    delete normalized.tdp_watts;
  }
  if (!isPartFormFieldVisible(type, 'gpu_length_mm')) {
    delete normalized.gpu_length_mm;
  }
  if (!isPartFormFieldVisible(type, 'max_gpu_length_mm')) {
    delete normalized.max_gpu_length_mm;
  }
  if (!isPartFormFieldVisible(type, 'psu_wattage')) {
    delete normalized.psu_wattage;
  }
  return normalized;
}
