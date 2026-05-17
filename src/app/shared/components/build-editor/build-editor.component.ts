import { DecimalPipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Card } from 'primeng/card';
import { ProgressBar } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { PART_TYPES } from '../../../core/constants/part-types';
import { showControlError } from '../../../core/i18n/form-control.util';
import { FieldErrorComponent } from '../field-error/field-error.component';
import { PartTypeLabelPipe } from '../../pipes/part-type-label.pipe';
import { Part, PartType } from '../../../core/models/part.model';
import { PartsService } from '../../../core/services/parts.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompatibilityBadgeComponent } from '../compatibility-badge/compatibility-badge.component';
import { PartTypeIconPipe } from '../../pipes/part-type-icon.pipe';
import { BuildProgressBannerComponent } from '../build-progress-banner/build-progress-banner.component';
import { buildWhatsAppUrl, partInquiryMessage } from '../../../core/utils/whatsapp.util';
import { getStorePrice } from '../../../core/utils/part-price.util';
import { getPartSpecBriefRows, PartSpecRow } from '../../../core/utils/part-spec-brief.util';

@Component({
  selector: 'app-build-editor',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    Select,
    Button,
    Message,
    Dialog,
    InputText,
    Card,
    ProgressBar,
    DecimalPipe,
    CompatibilityBadgeComponent,
    PartTypeIconPipe,
    BuildProgressBannerComponent,
    FieldErrorComponent,
    PartTypeLabelPipe,
  ],
  templateUrl: './build-editor.component.html',
  styleUrl: './build-editor.component.scss',
})
export class BuildEditorComponent {
  readonly partsService = inject(PartsService);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  readonly showSummary = input(false);
  readonly hideProgressPanel = input(false);
  readonly saved = output<void>();

  readonly partTypes = PART_TYPES;

  readonly saveForm = this.fb.nonNullable.group({
    name: ['', [RxwebValidators.required(), RxwebValidators.minLength({ value: 2 })]],
  });

  saveDialogVisible = false;
  readonly saving = signal(false);
  readonly saveFormSubmitted = signal(false);

  hasAnySelection(): boolean {
    return Object.keys(this.partsService.selectedParts()).length > 0;
  }

  hasErrors(): boolean {
    return this.partsService.compatibilityIssues().some((i) => i.type === 'error');
  }

  psuAdequate(): boolean {
    const psu = this.partsService.selectedParts().PSU;
    if (!psu?.psu_wattage) {
      return true;
    }
    return this.partsService.requiredPsuWatts() <= psu.psu_wattage;
  }

  psuMessage(): string {
    const required = Math.ceil(this.partsService.requiredPsuWatts());
    const key = this.psuAdequate() ? 'compat.psuOk' : 'compat.psuLow';
    return this.translate.instant(key, { required });
  }

  compatScoreHint(): string {
    return this.translate.instant('compat.scoreHint', {
      score: this.partsService.compatibilityScore(),
    });
  }

  onPartChange(type: PartType, part: Part | null): void {
    this.partsService.selectPart(type, part);
  }

  retryLoadParts(): void {
    void this.partsService.loadParts();
  }

  storePrice(type: PartType): number | null {
    return getStorePrice(this.partsService.selectedParts()[type]);
  }

  specRows(part: Part): PartSpecRow[] {
    return getPartSpecBriefRows(part, this.translate);
  }

  searchPart(type: PartType): void {
    const part = this.partsService.selectedParts()[type];
    if (part) {
      const q = encodeURIComponent(`${part.brand ?? ''} ${part.name} سعر مصر`);
      window.open(`https://www.google.com/search?q=${q}`, '_blank');
    }
  }

  contactStore(type: PartType): void {
    const part = this.partsService.selectedParts()[type];
    if (!part?.store_phone) {
      return;
    }
    const url = buildWhatsAppUrl(
      part.store_phone,
      partInquiryMessage(part.name, part.store_name),
    );
    window.open(url, '_blank');
  }

  openSaveDialog(): void {
    if (!this.auth.isLoggedIn) {
      this.auth.requestLogin();
      return;
    }
    this.saveForm.reset({ name: '' });
    this.saveFormSubmitted.set(false);
    this.saveDialogVisible = true;
  }

  saveNameInvalid(): boolean {
    return showControlError(this.saveForm.get('name'), this.saveFormSubmitted());
  }

  async saveBuild(): Promise<void> {
    if (!this.auth.isLoggedIn) {
      this.auth.requestLogin();
      return;
    }
    this.saveFormSubmitted.set(true);
    this.saveForm.markAllAsTouched();
    if (this.saveForm.invalid) {
      return;
    }
    const name = this.saveForm.getRawValue().name.trim();
    this.saving.set(true);
    try {
      const issues = this.partsService.compatibilityIssues();
      await this.supabase.saveBuild(
        {
          name,
          parts: this.partsService.selectedParts(),
          total_price: this.partsService.totalPrice(),
          is_compatible: issues.filter((i) => i.type === 'error').length === 0,
        },
        this.auth.requireUserId(),
      );
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('build.savedSuccess'),
      });
      this.saveDialogVisible = false;
      this.saved.emit();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: e instanceof Error ? e.message : this.translate.instant('build.saveFailed'),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
