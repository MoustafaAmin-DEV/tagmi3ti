import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Message } from 'primeng/message';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { SavedBuildRow } from '../../core/models/build.model';
import { Part, PartType } from '../../core/models/part.model';
import { PART_TYPES } from '../../core/constants/part-types';
import { CompatibilityBadgeComponent } from '../../shared/components/compatibility-badge/compatibility-badge.component';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { getStorePrice, sumStorePrices, buildHasStorePrices } from '../../core/utils/part-price.util';
import { LocaleService } from '../../core/i18n/locale.service';
interface CompareRow {
  type: PartType;
  label: string;
  cellA: PartCell;
  cellB: PartCell;
  diff: boolean;
  priceWinner: 'A' | 'B' | 'tie' | null;
}

interface PartCell {
  name: string | null;
  price: number | null;
  specs: string;
  missing: boolean;
}

interface CompareVerdict {
  priceWinner: 'A' | 'B' | 'tie';
  priceDiff: number;
  compatWinner: 'A' | 'B' | 'both' | 'neither';
  diffPartsCount: number;
  samePartsCount: number;
  recommendations: string[];
}

@Component({
  selector: 'app-compare-builds',
  standalone: true,
  imports: [
    FormsModule,
    Select,
    TableModule,
    Card,
    Tag,
    Message,
    DecimalPipe,
    DatePipe,
    NgClass,
    CompatibilityBadgeComponent,
    PageHeaderComponent,
    TranslateModule,
  ],
  templateUrl: './compare-builds.component.html',
  styleUrl: './compare-builds.component.scss',
})
export class CompareBuildsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly compatibility = inject(CompatibilityService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);

  readonly builds = signal<SavedBuildRow[]>([]);
  readonly buildA = signal<SavedBuildRow | null>(null);
  readonly buildB = signal<SavedBuildRow | null>(null);

  readonly comparisonRows = computed((): CompareRow[] => {
    this.locale.lang();
    const a = this.buildA();
    const b = this.buildB();
    if (!a || !b) {
      return [];
    }

    return PART_TYPES.map((type) => {
      const cellA = this.toPartCell(a.parts[type]);
      const cellB = this.toPartCell(b.parts[type]);
      const diff = this.partsDiffer(a.parts[type], b.parts[type]);

      let priceWinner: CompareRow['priceWinner'] = null;
      const priceA = getStorePrice(a.parts[type]);
      const priceB = getStorePrice(b.parts[type]);
      if (priceA != null && priceB != null && priceA !== priceB) {
        priceWinner = priceA < priceB ? 'A' : 'B';
      } else if (priceA != null && priceB != null) {
        priceWinner = 'tie';
      }

      return {
        type,
        label: this.translate.instant(`partType.${type}`),
        cellA,
        cellB,
        diff,
        priceWinner: cellA.missing || cellB.missing ? null : priceWinner,
      };
    });
  });

  readonly verdict = computed((): CompareVerdict | null => {
    this.locale.lang();
    const a = this.buildA();
    const b = this.buildB();
    if (!a || !b) {
      return null;
    }

    const priceA = sumStorePrices(a.parts);
    const priceB = sumStorePrices(b.parts);
    const priceDiff = Math.abs(priceA - priceB);
    let priceWinner: CompareVerdict['priceWinner'] = 'tie';
    if (priceA > 0 && priceB > 0 && priceA !== priceB) {
      priceWinner = priceA < priceB ? 'A' : 'B';
    }

    let compatWinner: CompareVerdict['compatWinner'] = 'neither';
    if (a.is_compatible && b.is_compatible) {
      compatWinner = 'both';
    } else if (a.is_compatible) {
      compatWinner = 'A';
    } else if (b.is_compatible) {
      compatWinner = 'B';
    }

    let diffPartsCount = 0;
    let samePartsCount = 0;
    for (const type of PART_TYPES) {
      if (this.partsDiffer(a.parts[type], b.parts[type])) {
        diffPartsCount++;
      } else if (a.parts[type] && b.parts[type]) {
        samePartsCount++;
      }
    }

    const recommendations: string[] = [];
    const currency = this.translate.instant('common.currency');
    const localeId = this.locale.lang() === 'ar' ? 'ar-EG' : 'en-US';
    const fmt = (n: number) => n.toLocaleString(localeId);

    if (priceWinner === 'A') {
      recommendations.push(
        this.translate.instant('compare.recPriceA', {
          name: a.name,
          diff: fmt(priceDiff),
          currency,
          totalA: fmt(priceA),
          totalB: fmt(priceB),
        }),
      );
    } else if (priceWinner === 'B') {
      recommendations.push(
        this.translate.instant('compare.recPriceB', {
          name: b.name,
          diff: fmt(priceDiff),
          currency,
          totalA: fmt(priceA),
          totalB: fmt(priceB),
        }),
      );
    } else if (priceA > 0 && priceB > 0) {
      recommendations.push(this.translate.instant('compare.recPriceClose'));
    } else if (priceA === 0 && priceB === 0) {
      recommendations.push(this.translate.instant('compare.recNoPrices'));
    }

    if (compatWinner === 'A') {
      recommendations.push(this.translate.instant('compare.recCompatA', { a: a.name, b: b.name }));
    } else if (compatWinner === 'B') {
      recommendations.push(this.translate.instant('compare.recCompatB', { a: a.name, b: b.name }));
    } else if (compatWinner === 'both') {
      recommendations.push(this.translate.instant('compare.recCompatBoth'));
    } else {
      recommendations.push(this.translate.instant('compare.recCompatNeither'));
    }

    if (diffPartsCount === 0) {
      recommendations.push(this.translate.instant('compare.recSameParts'));
    } else {
      recommendations.push(
        this.translate.instant('compare.recDiffParts', {
          diff: diffPartsCount,
          same: samePartsCount,
        }),
      );
    }

    const gpuA = a.parts.GPU?.tdp_watts ?? 0;
    const gpuB = b.parts.GPU?.tdp_watts ?? 0;
    const cpuA = a.parts.CPU?.tdp_watts ?? 0;
    const cpuB = b.parts.CPU?.tdp_watts ?? 0;
    if (gpuA && gpuB && Math.abs(gpuA - gpuB) > 50) {
      const stronger = gpuA > gpuB ? a.name : b.name;
      recommendations.push(this.translate.instant('compare.recGpu', { name: stronger }));
    }
    if (cpuA && cpuB && Math.abs(cpuA - cpuB) > 30 && gpuA <= gpuB) {
      const strongerCpu = cpuA > cpuB ? a.name : b.name;
      recommendations.push(this.translate.instant('compare.recCpu', { name: strongerCpu }));
    }

    return {
      priceWinner,
      priceDiff,
      compatWinner,
      diffPartsCount,
      samePartsCount,
      recommendations,
    };
  });

  ngOnInit(): void {
    void this.loadBuilds();
  }

  partsCount(build: SavedBuildRow): number {
    return Object.keys(build.parts).length;
  }

  buildScore(build: SavedBuildRow): number {
    return this.compatibility.calculateCompatibilityScore(build.parts);
  }

  buildStoreTotal(build: SavedBuildRow): number {
    return sumStorePrices(build.parts);
  }

  showPriceCompare(): boolean {
    const a = this.buildA();
    const b = this.buildB();
    if (!a || !b) {
      return false;
    }
    return buildHasStorePrices(a.parts) || buildHasStorePrices(b.parts);
  }

  cellClass(row: CompareRow, side: 'A' | 'B'): Record<string, boolean> {
    const cell = side === 'A' ? row.cellA : row.cellB;
    return {
      'diff-cell': row.diff && !cell.missing,
      'winner-cell': row.priceWinner === side,
      'missing-cell': cell.missing,
    };
  }

  async loadBuilds(): Promise<void> {
    this.builds.set(await this.supabase.getBuilds(this.auth.requireUserId()));
  }

  private toPartCell(part?: Part): PartCell {
    if (!part) {
      return { name: null, price: null, specs: '', missing: true };
    }
    return {
      name: part.name,
      price: getStorePrice(part),
      specs: this.formatSpecs(part),
      missing: false,
    };
  }

  private formatSpecs(part: Part): string {
    const bits: string[] = [];
    if (part.brand) {
      bits.push(part.brand);
    }
    if (part.socket) {
      bits.push(this.translate.instant('parts.socketSpec', { socket: part.socket }));
    }
    if (part.ram_type) {
      bits.push(part.ram_type);
    }
    if (part.tdp_watts) {
      bits.push(`${part.tdp_watts}W`);
    }
    if (part.psu_wattage) {
      bits.push(`${part.psu_wattage}W PSU`);
    }
    if (part.gpu_length_mm) {
      bits.push(`${part.gpu_length_mm}mm`);
    }
    if (part.form_factor) {
      bits.push(part.form_factor);
    }
    return bits.join(' · ');
  }

  private partsDiffer(a?: Part, b?: Part): boolean {
    if (!a && !b) {
      return false;
    }
    if (!a || !b) {
      return true;
    }
    return a.id !== b.id || a.name !== b.name;
  }
}
