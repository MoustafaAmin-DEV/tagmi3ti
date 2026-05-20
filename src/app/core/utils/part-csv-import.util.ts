import { PartType } from '../models/part.model';
import { PART_TYPES } from '../constants/part-types';
import { PartInput } from '../models/store.model';

export interface CsvImportRowError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  parts: PartInput[];
  errors: CsvImportRowError[];
}

const HEADER_MAP: Record<string, keyof PartInput> = {
  name: 'name',
  الاسم: 'name',
  type: 'type',
  النوع: 'type',
  brand: 'brand',
  العلامة: 'brand',
  socket: 'socket',
  السوكت: 'socket',
  chipset: 'chipset',
  الشيبست: 'chipset',
  ram_type: 'ram_type',
  ramtype: 'ram_type',
  نوع_الرام: 'ram_type',
  ram_slots: 'ram_slots',
  max_ram_gb: 'max_ram_gb',
  tdp_watts: 'tdp_watts',
  tdp: 'tdp_watts',
  max_gpu_length_mm: 'max_gpu_length_mm',
  psu_wattage: 'psu_wattage',
  psu: 'psu_wattage',
  gpu_length_mm: 'gpu_length_mm',
  form_factor: 'form_factor',
  market_price_egp: 'market_price_egp',
  price: 'market_price_egp',
  السعر: 'market_price_egp',
  سعر_السوق: 'market_price_egp',
};

const NUMERIC_FIELDS: (keyof PartInput)[] = [
  'ram_slots',
  'max_ram_gb',
  'tdp_watts',
  'max_gpu_length_mm',
  'psu_wattage',
  'gpu_length_mm',
  'market_price_egp',
];

const VALID_TYPES = new Set<string>(PART_TYPES);

/** Max upload size for CSV / Excel import (store dashboard) */
export const SPREADSHEET_MAX_BYTES = 2 * 1024 * 1024;

/** Max data rows per import (excluding header) */
export const SPREADSHEET_MAX_DATA_ROWS = 2000;

export const PARTS_CSV_TEMPLATE = `name,type,brand,socket,chipset,ram_type,ram_slots,max_ram_gb,tdp_watts,max_gpu_length_mm,psu_wattage,gpu_length_mm,form_factor,market_price_egp
AMD Ryzen 5 5600,CPU,AMD,AM4,,DDR4,,,65,,,,,5800
Gigabyte B550M DS3H,Motherboard,Gigabyte,AM4,B550,DDR4,4,128,,,,Micro-ATX,4200
Kingston Fury 16GB DDR4-3200,RAM,Kingston,,,DDR4,,,,,,,,2100
NVIDIA RTX 4060 8GB,GPU,NVIDIA,,,,,,115,,,240,,21000
Cooler Master MWE 650W,PSU,Cooler Master,,,,,,,,650,,,3500`;

export function downloadPartsCsvTemplate(): void {
  const blob = new Blob(['\ufeff', PARTS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tagmi3ti-parts-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function assertSpreadsheetSize(file: File): void {
  if (file.size > SPREADSHEET_MAX_BYTES) {
    const maxMb = SPREADSHEET_MAX_BYTES / (1024 * 1024);
    throw new Error(`حجم الملف كبير جدًا — الحد الأقصى ${maxMb} ميجابايت`);
  }
}

/** تحويل أول ورقة Excel إلى CSV ثم تحليلها */
export async function parsePartsSpreadsheet(file: File): Promise<CsvImportResult> {
  assertSpreadsheetSize(file);

  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
    const text = await file.text();
    return parsePartsCsv(text);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {
      type: 'array',
      sheetRows: SPREADSHEET_MAX_DATA_ROWS + 1,
    });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parsePartsCsv(csv);
  }
  throw new Error('صيغة غير مدعومة — استخدم CSV أو Excel (.xlsx)');
}

export function parsePartsCsv(text: string): CsvImportResult {
  const lines = text
    .replace(/^\ufeff/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim());
  const parts: PartInput[] = [];
  const errors: CsvImportRowError[] = [];

  if (lines.length < 2) {
    errors.push({
      row: 0,
      message: 'الملف فارغ أو لا يحتوي على بيانات (سطر عنوان + سطر واحد على الأقل)',
    });
    return { parts, errors };
  }

  const dataRowCount = lines.length - 1;
  if (dataRowCount > SPREADSHEET_MAX_DATA_ROWS) {
    errors.push({
      row: 0,
      message: `عدد الصفوف (${dataRowCount}) يتجاوز الحد الأقصى ${SPREADSHEET_MAX_DATA_ROWS}`,
    });
    return { parts, errors };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
  const columnKeys = headers.map((h) => HEADER_MAP[h] ?? null);

  if (!columnKeys.includes('name') || !columnKeys.includes('type')) {
    errors.push({
      row: 1,
      message: 'العناوين يجب أن تتضمن name و type (أو الاسم والنوع)',
    });
    return { parts, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) {
      continue;
    }

    const row: Partial<Record<keyof PartInput, string>> = {};
    columnKeys.forEach((key, idx) => {
      if (key && cells[idx] !== undefined) {
        row[key] = cells[idx].trim();
      }
    });

    const name = row.name?.trim();
    const typeRaw = row.type?.trim();
    if (!name) {
      errors.push({ row: rowNum, message: 'اسم القطعة مطلوب' });
      continue;
    }
    if (!typeRaw) {
      errors.push({ row: rowNum, message: 'نوع القطعة مطلوب' });
      continue;
    }

    const type = normalizePartType(typeRaw);
    if (!type) {
      errors.push({
        row: rowNum,
        message: `نوع غير صالح: ${typeRaw}. المسموح: ${PART_TYPES.join(', ')}`,
      });
      continue;
    }

    const part: PartInput = { name, type };
    let rowInvalid = false;

    for (const field of NUMERIC_FIELDS) {
      const raw = row[field];
      if (raw !== undefined && raw !== '') {
        const num = Number(raw.replace(/,/g, ''));
        if (Number.isNaN(num)) {
          errors.push({ row: rowNum, message: `قيمة رقمية غير صالحة في ${field}: ${raw}` });
          rowInvalid = true;
        } else {
          (part as unknown as Record<string, unknown>)[field] = num;
        }
      }
    }

    const stringFields: (keyof PartInput)[] = [
      'brand',
      'socket',
      'chipset',
      'ram_type',
      'form_factor',
    ];
    for (const field of stringFields) {
      const val = row[field];
      if (val) {
        (part as unknown as Record<string, unknown>)[field] = val;
      }
    }

    if (!rowInvalid) {
      parts.push(part);
    }
  }

  return { parts, errors };
}

function normalizePartType(raw: string): PartType | null {
  const t = raw.trim();
  if (VALID_TYPES.has(t)) {
    return t as PartType;
  }
  const aliases: Record<string, PartType> = {
    cpu: 'CPU',
    mb: 'Motherboard',
    motherboard: 'Motherboard',
    gpu: 'GPU',
    ram: 'RAM',
    case: 'Case',
    psu: 'PSU',
    cooler: 'Cooler',
    معالج: 'CPU',
    لوحة: 'Motherboard',
    'لوحة أم': 'Motherboard',
    كارت: 'GPU',
    'كارت شاشة': 'GPU',
    رام: 'RAM',
    كيس: 'Case',
    باور: 'PSU',
    مبرد: 'Cooler',
  };
  return aliases[t.toLowerCase()] ?? aliases[t] ?? null;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function detectDelimiter(headerLine: string): string {
  return headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
