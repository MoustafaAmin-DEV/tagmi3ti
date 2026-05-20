import { PartType } from '../models/part.model';

export const PART_TYPES: PartType[] = ['CPU', 'Motherboard', 'GPU', 'RAM', 'Case', 'PSU', 'Cooler'];

export const PART_TYPE_LABELS: Record<PartType, string> = {
  CPU: 'المعالج',
  Motherboard: 'اللوحة الأم',
  GPU: 'كارت الشاشة',
  RAM: 'الرام',
  Case: 'الكيس',
  PSU: 'مزود الطاقة',
  Cooler: 'المبرد',
};
