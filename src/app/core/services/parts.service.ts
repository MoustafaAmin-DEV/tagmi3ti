import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Part, PartType } from '../models/part.model';
import { CompatibilityIssue } from '../models/build.model';
import { PART_TYPES } from '../constants/part-types';
import { CompatibilityService } from './compatibility.service';
import { SupabaseService } from './supabase.service';
import { sumStorePrices } from '../utils/part-price.util';
import { LocaleService } from '../i18n/locale.service';

/** Cache catalog in memory to avoid refetching on every route */
const CATALOG_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PartsService {
  private readonly supabase = inject(SupabaseService);
  private readonly compatibility = inject(CompatibilityService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);

  private catalogLoadedAt = 0;

  readonly parts = signal<Part[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly catalogEmpty = computed(
    () => !this.loading() && !this.loadError() && this.parts().length === 0,
  );
  readonly selectedParts = signal<Partial<Record<PartType, Part>>>({});
  /** null = الكل، 'platform' = قطع المنصة فقط، uuid = متجر محدد */
  readonly storeFilter = signal<string | null>(null);
  readonly totalPrice = computed(() => sumStorePrices(this.selectedParts()));

  readonly compatibilityIssues = computed((): CompatibilityIssue[] => {
    this.locale.lang();
    return this.compatibility.checkCompatibility(this.selectedParts());
  });

  readonly isCompatible = computed(() => {
    const issues = this.compatibilityIssues();
    return !issues.some((i) => i.type === 'error') && Object.keys(this.selectedParts()).length > 0;
  });

  readonly compatibilityScore = computed(() =>
    this.compatibility.calculateCompatibilityScore(this.selectedParts()),
  );

  readonly requiredPsuWatts = computed(() =>
    this.compatibility.calculateRequiredPsuWatts(this.selectedParts()),
  );

  readonly bottleneckWarning = computed(() => {
    this.locale.lang();
    return this.compatibility.getBottleneckWarning(this.selectedParts());
  });

  readonly selectionCount = computed(() => Object.keys(this.selectedParts()).length);

  readonly selectionProgress = computed(() => {
    const count = this.selectionCount();
    return {
      count,
      total: PART_TYPES.length,
      percent: Math.round((count / PART_TYPES.length) * 100),
    };
  });

  readonly storeFilterOptions = computed(() => {
    this.locale.lang();
    const stores = new Map<string, string>();
    for (const p of this.parts()) {
      if (p.store_id && p.store_name) {
        stores.set(p.store_id, p.store_name);
      }
    }
    return [
      { label: this.translate.instant('compat.filterAll'), value: null as string | null },
      { label: this.translate.instant('compat.filterPlatform'), value: 'platform' },
      ...[...stores.entries()].map(([id, name]) => ({ label: name, value: id })),
    ];
  });

  partsByType(type: PartType): Part[] {
    const filter = this.storeFilter();
    return this.parts().filter((p) => {
      if (p.type !== type) {
        return false;
      }
      if (filter === 'platform') {
        if (p.store_id) {
          return false;
        }
      } else if (filter !== null && p.store_id !== filter) {
        return false;
      }
      return true;
    });
  }

  /** Same object reference as in options — required for p-select to show the label */
  selectedOption(type: PartType): Part | null {
    const selected = this.selectedParts()[type];
    if (!selected) {
      return null;
    }
    const match = this.parts().find((p) => p.id === selected.id);
    return match ?? null;
  }

  /** @param force bypass TTL cache and refetch from Supabase */
  async loadParts(force = false): Promise<void> {
    const cached =
      !force &&
      this.parts().length > 0 &&
      !this.loadError() &&
      Date.now() - this.catalogLoadedAt < CATALOG_TTL_MS;

    if (cached) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);
    try {
      const data = await this.supabase.getParts();
      this.parts.set(data);
      this.catalogLoadedAt = Date.now();
      if (data.length === 0) {
        this.loadError.set(this.translate.instant('parts.emptyCatalog'));
      }
    } catch (e) {
      this.parts.set([]);
      this.catalogLoadedAt = 0;
      this.loadError.set(
        e instanceof Error
          ? this.translate.instant('parts.loadFailed', { message: e.message })
          : this.translate.instant('parts.connectionFailed'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  invalidateCatalog(): void {
    this.catalogLoadedAt = 0;
  }

  selectPart(type: PartType, part: Part | null): void {
    this.selectedParts.update((current) => {
      const next = { ...current };
      if (part) {
        const canonical = this.parts().find((p) => p.id === part.id) ?? part;
        next[type] = { ...canonical };
      } else {
        delete next[type];
      }
      return next;
    });
  }

  setSelectedParts(parts: Partial<Record<PartType, Part>>): void {
    this.selectedParts.set(parts);
  }

  clearSelection(): void {
    this.selectedParts.set({});
  }

  /** تحميل تجميعة محفوظة في المحرّر (بعد تحميل قائمة القطع) */
  loadFromSavedParts(parts: Partial<Record<PartType, Part>>): void {
    const mapped: Partial<Record<PartType, Part>> = {};
    for (const type of PART_TYPES) {
      const saved = parts[type];
      if (!saved) {
        continue;
      }
      const canonical = this.parts().find((p) => p.id === saved.id) ?? saved;
      mapped[type] = { ...canonical, ...saved, id: canonical.id, type: canonical.type };
    }
    this.setSelectedParts(mapped);
  }
}
