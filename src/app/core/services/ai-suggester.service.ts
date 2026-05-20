import { Injectable, inject } from '@angular/core';
import { Build } from '../models/build.model';
import { Part, PartType } from '../models/part.model';
import { CompatibilityService } from './compatibility.service';

export type UseCase = 'Gaming' | 'Editing' | 'Programming';
export type BuildLevel = 'Entry' | 'Mid' | 'High End';

const USE_CASE_LABELS: Record<UseCase, string> = {
  Gaming: 'ألعاب',
  Editing: 'مونتاج',
  Programming: 'برمجة',
};

const LEVEL_LABELS: Record<BuildLevel, string> = {
  Entry: 'مبتدئ',
  Mid: 'متوسط',
  'High End': 'عالي',
};

@Injectable({ providedIn: 'root' })
export class AiSuggesterService {
  private readonly compatibility = inject(CompatibilityService);

  /** مجاني — يختار قطعًا متوافقة من القائمة بدون API مدفوع */
  async suggestBuild(useCase: UseCase, level: BuildLevel, availableParts: Part[]): Promise<Build> {
    const build = this.suggestLocally(useCase, level, availableParts);
    const issues = this.compatibility.checkCompatibility(build.parts);
    build.compatibility_issues = issues;
    build.is_compatible = !issues.some((i) => i.type === 'error');
    return build;
  }

  private suggestLocally(useCase: UseCase, level: BuildLevel, availableParts: Part[]): Build {
    const cpus = this.byType(availableParts, 'CPU');
    if (cpus.length === 0) {
      throw new Error('لا توجد معالجات في قاعدة البيانات. شغّل supabase/seed.sql');
    }

    const cpuOrder = this.sortByPerformanceTier(cpus, level, useCase === 'Programming' ? -1 : 0);

    for (const cpu of cpuOrder) {
      const parts = this.assembleAroundCpu(cpu, useCase, level, availableParts);
      if (parts) {
        const issues = this.compatibility.checkCompatibility(parts);
        if (!issues.some((i) => i.type === 'error')) {
          return {
            name: `تجميعة ${USE_CASE_LABELS[useCase]} — ${LEVEL_LABELS[level]}`,
            parts,
            use_case: useCase,
            notes: this.buildNotes(useCase, level, issues),
          };
        }
      }
    }

    throw new Error('لم نجد تجميعة متوافقة من القطع المتاحة. أضف المزيد من القطع أو شغّل seed.sql');
  }

  private assembleAroundCpu(
    cpu: Part,
    useCase: UseCase,
    level: BuildLevel,
    all: Part[],
  ): Partial<Record<PartType, Part>> | null {
    const motherboard = this.pickBest(
      this.byType(all, 'Motherboard').filter((m) => m.socket === cpu.socket),
      level,
      (m) => (m.max_ram_gb ?? 0) + (m.ram_slots ?? 0) * 10,
    );
    if (!motherboard) {
      return null;
    }

    const ramCandidates = this.byType(all, 'RAM').filter(
      (r) =>
        motherboard.ram_type &&
        r.ram_type &&
        motherboard.ram_type.toLowerCase().includes(r.ram_type.toLowerCase()),
    );
    const ram = this.pickBest(ramCandidates, level, () => 1);
    if (!ram) {
      return null;
    }

    const gpuTierOffset = useCase === 'Programming' ? -1 : useCase === 'Gaming' ? 1 : 0;
    const gpu = this.pickBest(
      this.byType(all, 'GPU'),
      level,
      (g) => g.tdp_watts ?? 0,
      gpuTierOffset,
    );
    if (!gpu) {
      return null;
    }

    const cases = this.byType(all, 'Case').filter(
      (c) =>
        gpu.gpu_length_mm == null ||
        c.max_gpu_length_mm == null ||
        c.max_gpu_length_mm >= gpu.gpu_length_mm,
    );
    const pcCase = this.pickBest(
      cases,
      level,
      (c) => c.max_gpu_length_mm ?? 0,
      level === 'High End' ? 1 : -1,
    );
    if (!pcCase) {
      return null;
    }

    const coolerCandidates = this.byType(all, 'Cooler').filter(
      (c) =>
        this.coolerSupportsSocket(c, cpu.socket) &&
        (c.tdp_watts == null || cpu.tdp_watts == null || c.tdp_watts >= cpu.tdp_watts),
    );
    const cooler = this.pickBest(coolerCandidates, level, (c) => c.tdp_watts ?? 0);
    if (!cooler) {
      return null;
    }

    const draft: Partial<Record<PartType, Part>> = {
      CPU: cpu,
      Motherboard: motherboard,
      RAM: ram,
      GPU: gpu,
      Case: pcCase,
      Cooler: cooler,
    };

    const requiredWatts = this.compatibility.calculateRequiredPsuWatts(draft);
    const psuCandidates = this.byType(all, 'PSU').filter(
      (p) => p.psu_wattage != null && p.psu_wattage >= requiredWatts,
    );
    const psu = this.pickBest(
      psuCandidates.length > 0 ? psuCandidates : this.byType(all, 'PSU'),
      level,
      (p) => p.psu_wattage ?? 0,
      -1,
    );
    if (!psu || (psu.psu_wattage != null && psu.psu_wattage < requiredWatts)) {
      return null;
    }

    draft.PSU = psu;
    return draft;
  }

  private buildNotes(
    useCase: UseCase,
    level: BuildLevel,
    issues: ReturnType<CompatibilityService['checkCompatibility']>,
  ): string {
    const base =
      useCase === 'Gaming'
        ? 'تجميعة مركّزة على كارت الشاشة للألعاب.'
        : useCase === 'Editing'
          ? 'تجميعة متوازنة للمونتاج والتحرير.'
          : 'تجميعة مناسبة للبرمجة مع تركيز على المعالج والرام.';

    const warnings = issues.filter((i) => i.type === 'warning');
    if (warnings.length > 0) {
      return `${base} (${warnings.length} تحذير)`;
    }
    return `${base} — اقتراح تلقائي مجاني حسب القطع المتاحة.`;
  }

  private byType(parts: Part[], type: PartType): Part[] {
    return parts.filter((p) => p.type === type);
  }

  private sortByPerformanceTier(items: Part[], level: BuildLevel, tierOffset: number): Part[] {
    const sorted = [...items].sort(
      (a, b) => (this.performanceScore(a) ?? 0) - (this.performanceScore(b) ?? 0),
    );
    const anchor = this.tierIndex(sorted.length, level) + tierOffset;
    const start = Math.max(0, Math.min(sorted.length - 1, anchor));
    return [...sorted.slice(start), ...sorted.slice(0, start)];
  }

  private pickBest(
    items: Part[],
    level: BuildLevel,
    score: (p: Part) => number,
    tierOffset = 0,
  ): Part | null {
    if (items.length === 0) {
      return null;
    }
    const sorted = [...items].sort((a, b) => score(a) - score(b));
    const idx = Math.max(
      0,
      Math.min(sorted.length - 1, this.tierIndex(sorted.length, level) + tierOffset),
    );
    return sorted[idx];
  }

  private tierIndex(count: number, level: BuildLevel): number {
    if (count <= 1) {
      return 0;
    }
    switch (level) {
      case 'Entry':
        return Math.floor(count * 0.2);
      case 'Mid':
        return Math.floor(count * 0.5);
      case 'High End':
        return Math.min(count - 1, Math.floor(count * 0.85));
    }
  }

  private performanceScore(part: Part): number {
    return part.tdp_watts ?? part.psu_wattage ?? part.gpu_length_mm ?? part.max_gpu_length_mm ?? 0;
  }

  private coolerSupportsSocket(cooler: Part, cpuSocket?: string): boolean {
    if (!cpuSocket || !cooler.socket) {
      return true;
    }
    return cooler.socket
      .split(/[,/|]/)
      .map((s) => s.trim().toLowerCase())
      .some((s) => s === cpuSocket.toLowerCase() || cpuSocket.toLowerCase().includes(s));
  }
}
