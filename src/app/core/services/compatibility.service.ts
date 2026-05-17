import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CompatibilityIssue } from '../models/build.model';
import { Part, PartType } from '../models/part.model';
import { PART_TYPES } from '../constants/part-types';

@Injectable({ providedIn: 'root' })
export class CompatibilityService {
  private readonly translate = inject(TranslateService);

  checkCompatibility(parts: Partial<Record<PartType, Part>>): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];
    const cpu = parts.CPU;
    const motherboard = parts.Motherboard;
    const ram = parts.RAM;
    const gpu = parts.GPU;
    const pcCase = parts.Case;
    const psu = parts.PSU;
    const cooler = parts.Cooler;

    if (cpu && motherboard) {
      if (cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.socketMismatch', {
            cpu: cpu.socket,
            mb: motherboard.socket,
          }),
          parts_involved: ['CPU', 'Motherboard'],
        });
      }
    }

    if (motherboard && ram) {
      if (
        motherboard.ram_type &&
        ram.ram_type &&
        !motherboard.ram_type.toLowerCase().includes(ram.ram_type.toLowerCase())
      ) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.ramMismatch', {
            mbRam: motherboard.ram_type,
            ram: ram.ram_type,
          }),
          parts_involved: ['Motherboard', 'RAM'],
        });
      }
    }

    if (gpu && pcCase) {
      if (
        gpu.gpu_length_mm != null &&
        pcCase.max_gpu_length_mm != null &&
        gpu.gpu_length_mm > pcCase.max_gpu_length_mm
      ) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.gpuTooLong', {
            gpu: gpu.gpu_length_mm,
            case: pcCase.max_gpu_length_mm,
          }),
          parts_involved: ['GPU', 'Case'],
        });
      }
    }

    if (cpu && cooler) {
      if (
        cpu.tdp_watts != null &&
        cooler.tdp_watts != null &&
        cooler.tdp_watts < cpu.tdp_watts
      ) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.coolerTdp', {
            cooler: cooler.tdp_watts,
            cpu: cpu.tdp_watts,
          }),
          parts_involved: ['CPU', 'Cooler'],
        });
      }
      if (cpu.socket && cooler.socket && !this.socketMatches(cooler.socket, cpu.socket)) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.coolerSocket', { socket: cpu.socket }),
          parts_involved: ['CPU', 'Cooler'],
        });
      }
    }

    if (psu) {
      const requiredWatts = this.calculateRequiredPsuWatts(parts);
      if (requiredWatts > 0 && psu.psu_wattage != null && requiredWatts > psu.psu_wattage) {
        issues.push({
          type: 'error',
          message: this.translate.instant('compat.psuInsufficient', {
            psu: psu.psu_wattage,
            required: Math.ceil(requiredWatts),
          }),
          parts_involved: ['PSU'],
        });
      }
    }

    return issues;
  }

  calculateRequiredPsuWatts(parts: Partial<Record<PartType, Part>>): number {
    const tdpParts = [parts.CPU, parts.GPU, parts.Cooler].filter(Boolean) as Part[];
    const totalTdp = tdpParts.reduce((sum, p) => sum + (p.tdp_watts ?? 0), 0);
    return totalTdp * 1.2;
  }

  calculateCompatibilityScore(parts: Partial<Record<PartType, Part>>): number {
    const selectedCount = PART_TYPES.filter((t) => parts[t]).length;
    if (selectedCount === 0) {
      return 0;
    }

    const issues = this.checkCompatibility(parts);
    const errors = issues.filter((i) => i.type === 'error').length;
    const warnings = issues.filter((i) => i.type === 'warning').length;
    const missing = PART_TYPES.length - selectedCount;

    let score = (selectedCount / PART_TYPES.length) * 40 + 60;
    score -= errors * 28;
    score -= warnings * 7;
    score -= missing * 4;

    if (errors > 0) {
      score = Math.min(score, 42);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getBottleneckWarning(parts: Partial<Record<PartType, Part>>): string | null {
    const cpu = parts.CPU;
    const gpu = parts.GPU;
    if (!cpu?.tdp_watts || !gpu?.tdp_watts) {
      return null;
    }
    const ratio = gpu.tdp_watts / cpu.tdp_watts;
    if (ratio > 3) {
      return this.translate.instant('compat.bottleneckGpu');
    }
    if (ratio < 0.5) {
      return this.translate.instant('compat.bottleneckCpu');
    }
    return null;
  }

  private socketMatches(coolerSocket: string, cpuSocket: string): boolean {
    return coolerSocket
      .split(/[,/|]/)
      .map((s) => s.trim().toLowerCase())
      .some((s) => s === cpuSocket.trim().toLowerCase() || cpuSocket.toLowerCase().includes(s));
  }
}
