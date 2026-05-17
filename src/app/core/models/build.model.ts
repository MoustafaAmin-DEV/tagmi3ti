import { Part } from './part.model';

export interface Build {
  id?: string;
  name: string;
  parts: Partial<Record<Part['type'], Part>>;
  total_price?: number;
  is_compatible?: boolean;
  compatibility_issues?: CompatibilityIssue[];
  use_case?: string;
  notes?: string;
  created_at?: string;
}

export interface CompatibilityIssue {
  type: 'error' | 'warning';
  message: string;
  parts_involved: string[];
}

export interface SavedBuildRow {
  id: string;
  user_id: string | null;
  name: string;
  parts: Partial<Record<Part['type'], Part>>;
  total_price: number;
  is_compatible: boolean;
  use_case: string | null;
  notes: string | null;
  created_at: string;
  share_slug?: string | null;
}
