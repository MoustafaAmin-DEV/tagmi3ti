import { describe, it, expect, beforeEach } from 'vitest';
import { CompatibilityService } from './compatibility.service';
import { Part, PartType } from '../models/part.model';

function part(type: PartType, overrides: Partial<Part> = {}): Part {
  return {
    id: `${type}-1`,
    name: `Test ${type}`,
    type,
    ...overrides,
  } as Part;
}

describe('CompatibilityService', () => {
  let service: CompatibilityService;

  beforeEach(() => {
    service = new CompatibilityService();
  });

  it('returns no issues when parts are compatible', () => {
    const parts = {
      CPU: part('CPU', { socket: 'AM5', tdp_watts: 65 }),
      Motherboard: part('Motherboard', { socket: 'AM5', ram_type: 'DDR5' }),
      RAM: part('RAM', { ram_type: 'DDR5' }),
      GPU: part('GPU', { gpu_length_mm: 240, tdp_watts: 115 }),
      Case: part('Case', { max_gpu_length_mm: 320 }),
      PSU: part('PSU', { psu_wattage: 650 }),
      Cooler: part('Cooler', { socket: 'AM5', tdp_watts: 150 }),
    };

    const issues = service.checkCompatibility(parts);
    expect(issues.filter((i) => i.type === 'error')).toHaveLength(0);
  });

  it('detects CPU/Motherboard socket mismatch', () => {
    const issues = service.checkCompatibility({
      CPU: part('CPU', { socket: 'AM5' }),
      Motherboard: part('Motherboard', { socket: 'LGA1700' }),
    });
    expect(issues.some((i) => i.message.includes('السوكت'))).toBe(true);
  });

  it('detects RAM type mismatch', () => {
    const issues = service.checkCompatibility({
      Motherboard: part('Motherboard', { ram_type: 'DDR5' }),
      RAM: part('RAM', { ram_type: 'DDR4' }),
    });
    expect(issues.some((i) => i.message.includes('الرام'))).toBe(true);
  });

  it('detects GPU longer than case allows', () => {
    const issues = service.checkCompatibility({
      GPU: part('GPU', { gpu_length_mm: 350 }),
      Case: part('Case', { max_gpu_length_mm: 300 }),
    });
    expect(issues.some((i) => i.message.includes('طول كارت'))).toBe(true);
  });

  it('detects insufficient PSU wattage', () => {
    const issues = service.checkCompatibility({
      CPU: part('CPU', { tdp_watts: 105 }),
      GPU: part('GPU', { tdp_watts: 200 }),
      PSU: part('PSU', { psu_wattage: 300 }),
    });
    expect(issues.some((i) => i.message.includes('مزود الطاقة'))).toBe(true);
  });

  it('calculates required PSU with 20% headroom', () => {
    const required = service.calculateRequiredPsuWatts({
      CPU: part('CPU', { tdp_watts: 100 }),
      GPU: part('GPU', { tdp_watts: 200 }),
    });
    expect(required).toBe(360);
  });

  it('returns 0 score when no parts selected', () => {
    expect(service.calculateCompatibilityScore({})).toBe(0);
  });

  it('returns high score for full compatible build', () => {
    const parts = {
      CPU: part('CPU', { socket: 'AM5', tdp_watts: 65 }),
      Motherboard: part('Motherboard', { socket: 'AM5', ram_type: 'DDR5' }),
      RAM: part('RAM', { ram_type: 'DDR5' }),
      GPU: part('GPU', { gpu_length_mm: 240, tdp_watts: 115 }),
      Case: part('Case', { max_gpu_length_mm: 320 }),
      PSU: part('PSU', { psu_wattage: 650 }),
      Cooler: part('Cooler', { socket: 'AM5', tdp_watts: 150 }),
    };
    expect(service.calculateCompatibilityScore(parts)).toBeGreaterThanOrEqual(80);
  });

  it('returns low score when socket mismatch', () => {
    const score = service.calculateCompatibilityScore({
      CPU: part('CPU', { socket: 'AM5' }),
      Motherboard: part('Motherboard', { socket: 'LGA1700' }),
    });
    expect(score).toBeLessThan(50);
  });

  it('warns when GPU is much stronger than CPU', () => {
    const warning = service.getBottleneckWarning({
      CPU: part('CPU', { tdp_watts: 65 }),
      GPU: part('GPU', { tdp_watts: 250 }),
    });
    expect(warning).toContain('Bottleneck');
  });
});
