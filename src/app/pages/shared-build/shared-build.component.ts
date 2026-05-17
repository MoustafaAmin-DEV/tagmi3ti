import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { SupabaseService } from '../../core/services/supabase.service';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { SavedBuildRow } from '../../core/models/build.model';
import { Part } from '../../core/models/part.model';
import { PART_TYPES } from '../../core/constants/part-types';
import { CompatibilityBadgeComponent } from '../../shared/components/compatibility-badge/compatibility-badge.component';
import { PartTypeLabelPipe } from '../../shared/pipes/part-type-label.pipe';
import { getStorePrice, sumStorePrices } from '../../core/utils/part-price.util';

@Component({
  selector: 'app-shared-build',
  standalone: true,
  imports: [
    Card,
    Button,
    Message,
    RouterLink,
    DatePipe,
    DecimalPipe,
    CompatibilityBadgeComponent,
    TranslateModule,
    PartTypeLabelPipe,
  ],
  templateUrl: './shared-build.component.html',
})
export class SharedBuildComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseService);
  private readonly compatibility = inject(CompatibilityService);
  private readonly translate = inject(TranslateService);

  readonly partTypes = PART_TYPES;

  readonly build = signal<SavedBuildRow | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly compatScore = computed(() => {
    const b = this.build();
    if (!b) {
      return 0;
    }
    return this.compatibility.calculateCompatibilityScore(b.parts);
  });

  readonly storeTotal = computed(() => {
    const b = this.build();
    return b ? sumStorePrices(b.parts) : 0;
  });

  partPrice(part: Part): number | null {
    return getStorePrice(part);
  }

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set(this.translate.instant('shared.invalidLink'));
      this.loading.set(false);
      return;
    }

    try {
      const row = await this.supabase.getBuildByShareSlug(slug);
      if (!row) {
        this.error.set(this.translate.instant('shared.notFound'));
      } else {
        this.build.set(row);
      }
    } catch {
      this.error.set(this.translate.instant('shared.loadFailed'));
    } finally {
      this.loading.set(false);
    }
  }
}
