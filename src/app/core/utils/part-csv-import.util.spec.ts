import { describe, it, expect } from 'vitest';
import {
  parsePartsCsv,
  parsePartsSpreadsheet,
  SPREADSHEET_MAX_BYTES,
  SPREADSHEET_MAX_DATA_ROWS,
} from './part-csv-import.util';

describe('part-csv-import.util', () => {
  it('rejects files larger than SPREADSHEET_MAX_BYTES', async () => {
    const big = new File([new Uint8Array(SPREADSHEET_MAX_BYTES + 1)], 'parts.csv', {
      type: 'text/csv',
    });
    await expect(parsePartsSpreadsheet(big)).rejects.toThrow(/حجم الملف/);
  });

  it('rejects CSV with too many data rows', () => {
    const header = 'name,type\n';
    const rows = Array.from(
      { length: SPREADSHEET_MAX_DATA_ROWS + 1 },
      (_, i) => `Part ${i},CPU`,
    ).join('\n');
    const result = parsePartsCsv(header + rows);
    expect(result.parts).toHaveLength(0);
    expect(result.errors.some((e) => e.message.includes(String(SPREADSHEET_MAX_DATA_ROWS)))).toBe(
      true,
    );
  });
});
