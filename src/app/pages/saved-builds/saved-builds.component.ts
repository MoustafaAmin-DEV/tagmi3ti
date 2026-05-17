import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { BuildLoadService } from '../../core/services/build-load.service';
import { SavedBuildRow } from '../../core/models/build.model';
import { PART_TYPES } from '../../core/constants/part-types';
import { PartTypeLabelPipe } from '../../shared/pipes/part-type-label.pipe';
import { CompatibilityBadgeComponent } from '../../shared/components/compatibility-badge/compatibility-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  buildShoppingList,
  formatShoppingListText,
  ShoppingListItem,
} from '../../core/utils/shopping-list.util';
import { buildWhatsAppUrl, partInquiryMessage } from '../../core/utils/whatsapp.util';
import { buildShareUrl, generateShareSlug } from '../../core/utils/share-slug.util';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { sumStorePrices } from '../../core/utils/part-price.util';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-saved-builds',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    Button,
    Dialog,
    Checkbox,
    DatePipe,
    DecimalPipe,
    ConfirmDialog,
    CompatibilityBadgeComponent,
    PageHeaderComponent,
    Card,
    InputText,
    TranslateModule,
    PartTypeLabelPipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './saved-builds.component.html',
})
export class SavedBuildsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly compatibility = inject(CompatibilityService);
  private readonly auth = inject(AuthService);
  private readonly buildLoad = inject(BuildLoadService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly partTypes = PART_TYPES;

  readonly builds = signal<SavedBuildRow[]>([]);
  readonly loading = signal(false);
  readonly expandedId = signal<string | null>(null);

  shoppingDialogVisible = false;
  shareDialogVisible = false;
  readonly shareBuild = signal<SavedBuildRow | null>(null);
  readonly shareUrl = signal<string | null>(null);
  readonly shareLoading = signal(false);

  readonly shoppingBuild = signal<SavedBuildRow | null>(null);
  readonly shoppingItems = signal<ShoppingListItem[]>([]);
  readonly shoppingChecked = signal<Set<string>>(new Set());

  readonly shoppingSelectedTotal = computed(() => {
    const checked = this.shoppingChecked();
    return this.shoppingItems()
      .filter((i) => checked.has(i.type))
      .reduce((sum, i) => sum + (i.price ?? 0), 0);
  });

  ngOnInit(): void {
    void this.loadBuilds();
  }

  toggleExpand(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  buildScore(build: SavedBuildRow): number {
    return this.compatibility.calculateCompatibilityScore(build.parts);
  }

  buildStoreTotal(build: SavedBuildRow): number {
    return sumStorePrices(build.parts);
  }

  openShareDialog(build: SavedBuildRow): void {
    this.shareBuild.set(build);
    this.shareUrl.set(build.share_slug ? buildShareUrl(build.share_slug) : null);
    this.shareDialogVisible = true;
  }

  async createShareLink(): Promise<void> {
    const build = this.shareBuild();
    if (!build) {
      return;
    }
    this.shareLoading.set(true);
    try {
      const slug = build.share_slug ?? generateShareSlug();
      const saved = await this.supabase.enableBuildShare(build.id, this.auth.requireUserId(), slug);
      const url = buildShareUrl(saved);
      this.shareUrl.set(url);
      this.patchBuildShareSlug(build.id, saved);
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('saved.shareCreated'),
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: this.translate.instant('saved.shareFailed'),
      });
    } finally {
      this.shareLoading.set(false);
    }
  }

  copyShareLink(): void {
    const url = this.shareUrl();
    if (!url) {
      return;
    }
    void navigator.clipboard.writeText(url).then(
      () =>
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('saved.copied'),
          detail: this.translate.instant('saved.linkCopied'),
        }),
      () =>
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('toast.error'),
          detail: this.translate.instant('saved.copyFailed'),
        }),
    );
  }

  openShareLink(): void {
    const url = this.shareUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  async revokeShare(): Promise<void> {
    const build = this.shareBuild();
    if (!build) {
      return;
    }
    this.shareLoading.set(true);
    try {
      await this.supabase.disableBuildShare(build.id, this.auth.requireUserId());
      this.shareUrl.set(null);
      this.patchBuildShareSlug(build.id, null);
      this.messageService.add({
        severity: 'info',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('saved.shareRevoked'),
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: this.translate.instant('saved.shareRevokeFailed'),
      });
    } finally {
      this.shareLoading.set(false);
    }
  }

  private patchBuildShareSlug(id: string, slug: string | null): void {
    this.builds.update((list) =>
      list.map((b) => (b.id === id ? { ...b, share_slug: slug } : b)),
    );
    const current = this.shareBuild();
    if (current?.id === id) {
      this.shareBuild.set({ ...current, share_slug: slug });
    }
  }

  copyToEditor(build: SavedBuildRow): void {
    this.buildLoad.queueBuild(build);
    void this.router.navigate(['/checker']);
  }

  whatsappItem(item: ShoppingListItem): void {
    if (!item.storePhone) {
      return;
    }
    const url = buildWhatsAppUrl(
      item.storePhone,
      partInquiryMessage(item.name, item.storeName ?? undefined),
    );
    window.open(url, '_blank');
  }

  openShoppingList(build: SavedBuildRow): void {
    const items = buildShoppingList(build);
    if (items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('toast.warn'),
        detail: this.translate.instant('saved.noParts'),
      });
      return;
    }
    this.shoppingBuild.set(build);
    this.shoppingItems.set(items);
    this.shoppingChecked.set(new Set(items.map((i) => i.type)));
    this.shoppingDialogVisible = true;
  }

  toggleShoppingItem(type: string, checked: boolean): void {
    this.shoppingChecked.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(type);
      } else {
        next.delete(type);
      }
      return next;
    });
  }

  selectAllShopping(all: boolean): void {
    if (all) {
      this.shoppingChecked.set(new Set(this.shoppingItems().map((i) => i.type)));
    } else {
      this.shoppingChecked.set(new Set());
    }
  }

  copyShoppingList(): void {
    const build = this.shoppingBuild();
    if (!build) {
      return;
    }
    const text = formatShoppingListText(build.name, this.shoppingItems(), this.shoppingChecked());
    void navigator.clipboard.writeText(text).then(
      () =>
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('saved.copied'),
          detail: this.translate.instant('saved.shoppingCopied'),
        }),
      () =>
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('toast.error'),
          detail: this.translate.instant('saved.shoppingCopyFailed'),
        }),
    );
  }

  printShoppingList(): void {
    const build = this.shoppingBuild();
    if (!build) {
      return;
    }
    const text = formatShoppingListText(build.name, this.shoppingItems(), this.shoppingChecked());
    const w = window.open('', '_blank');
    if (!w) {
      return;
    }
    w.document.write(`<pre dir="rtl" style="font-family:Cairo,sans-serif;padding:1.5rem">${text.replace(/</g, '&lt;')}</pre>`);
    w.document.close();
    w.print();
  }

  async loadBuilds(): Promise<void> {
    this.loading.set(true);
    try {
      this.builds.set(await this.supabase.getBuilds(this.auth.requireUserId()));
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: this.translate.instant('saved.loadFailed'),
      });
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(build: SavedBuildRow, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: this.translate.instant('saved.deleteConfirm', { name: build.name }),
      header: this.translate.instant('saved.confirmHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('saved.reject'),
      accept: () => void this.deleteBuild(build.id),
    });
  }

  async deleteBuild(id: string): Promise<void> {
    try {
      await this.supabase.deleteBuild(id, this.auth.requireUserId());
      this.builds.update((list) => list.filter((b) => b.id !== id));
      if (this.expandedId() === id) {
        this.expandedId.set(null);
      }
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('store.deleted'),
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: this.translate.instant('saved.deleteFailed'),
      });
    }
  }
}
