import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { showControlError } from '../../core/i18n/form-control.util';
import { optionalPhoneValidator } from '../../core/i18n/rxweb-validators.util';
import { formatEgyptPhoneForStorage } from '../../core/utils/phone-policy.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    Card,
    Button,
    InputText,
    PageHeaderComponent,
    FieldErrorComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    displayName: ['', [RxwebValidators.required(), RxwebValidators.minLength({ value: 2 })]],
    phone: ['', [optionalPhoneValidator()]],
    city: [''],
  });

  ngOnInit(): void {
    void this.load();
  }

  controlInvalid(name: 'displayName' | 'phone'): boolean {
    return showControlError(this.profileForm.get(name), this.submitted());
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const userId = this.auth.requireUserId();
      const profile = await this.profileService.loadForUser(userId);
      this.profileForm.patchValue({
        email: this.auth.user()?.email ?? '',
        displayName: profile?.display_name ?? '',
        phone: profile?.phone ?? '',
        city: profile?.city ?? '',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: this.translate.instant('profile.loadFailed'),
      });
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      return;
    }

    const raw = this.profileForm.getRawValue();
    this.saving.set(true);
    try {
      await this.profileService.upsertForUser(this.auth.requireUserId(), {
        display_name: raw.displayName.trim(),
        phone: formatEgyptPhoneForStorage(raw.phone),
        city: raw.city.trim() || null,
      });
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('profile.saved'),
      });
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('toast.error'),
        detail: e instanceof Error ? e.message : this.translate.instant('profile.saveFailed'),
      });
    } finally {
      this.saving.set(false);
    }
  }
}
