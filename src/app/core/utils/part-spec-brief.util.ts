import { TranslateService } from '@ngx-translate/core';
import { Part } from '../models/part.model';

export interface PartSpecRow {
  label: string;
  value: string;
}

function pushStr(rows: PartSpecRow[], label: string, raw?: string | null): void {
  const v = raw?.trim();
  if (v) {
    rows.push({ label, value: v });
  }
}

function pushNum(rows: PartSpecRow[], label: string, n?: number | null, suffix = ''): void {
  if (n === undefined || n === null || Number.isNaN(n)) {
    return;
  }
  rows.push({ label, value: `${n}${suffix}` });
}

export function getPartSpecBriefRows(part: Part, translate: TranslateService): PartSpecRow[] {
  const rows: PartSpecRow[] = [];
  const t = (key: string) => translate.instant(`spec.${key}`);

  pushStr(rows, t('brand'), part.brand);
  pushStr(rows, t('socket'), part.socket);
  pushStr(rows, t('chipset'), part.chipset);
  pushStr(rows, t('ramType'), part.ram_type);
  pushNum(rows, t('ramSlots'), part.ram_slots);
  pushNum(rows, t('maxRam'), part.max_ram_gb, ' GB');
  pushNum(rows, t('tdp'), part.tdp_watts, t('tdpUnit'));
  pushNum(rows, t('gpuLength'), part.gpu_length_mm, t('mmUnit'));
  pushNum(rows, t('maxGpuLength'), part.max_gpu_length_mm, t('mmUnit'));
  pushNum(rows, t('psuWattage'), part.psu_wattage, t('tdpUnit'));
  pushStr(rows, t('formFactor'), part.form_factor);

  if (part.store_name?.trim()) {
    rows.push({ label: t('store'), value: part.store_name.trim() });
  }

  return rows;
}
