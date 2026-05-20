import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { showControlError } from '../../../core/i18n/form-control.util';
import { optionalPhoneValidator } from '../../../core/i18n/rxweb-validators.util';
import {
  authDisplayNameValidator,
  authPasswordValidator,
  normalizeAuthEmail,
  realEmailValidator,
} from '../../../core/utils/email-policy.util';
import { formatEgyptPhoneForStorage } from '../../../core/utils/phone-policy.util';
import { FieldErrorComponent } from '../field-error/field-error.component';

type AuthMode = 'login' | 'register';

type AuthField = 'email' | 'password' | 'displayName' | 'phone' | 'city';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    Dialog,
    InputText,
    Password,
    Button,
    SelectButton,
    FieldErrorComponent,
  ],
  templateUrl: './auth-dialog.component.html',
})
export class AuthDialogComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);
  private readonly messageService = inject(MessageService);

  mode: AuthMode = 'login';

  readonly modeOptions = computed(() => {
    this.locale.lang();
    return [
      { label: this.translate.instant('auth.login'), value: 'login' as AuthMode },
      { label: this.translate.instant('auth.register'), value: 'register' as AuthMode },
    ];
  });

  readonly authForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, realEmailValidator()]],
    password: ['', [Validators.required]],
    displayName: [''],
    phone: [''],
    city: ['', [Validators.maxLength(80)]],
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.showLoginDialog()) {
        this.submitted.set(false);
        this.authForm.reset({
          email: '',
          password: '',
          displayName: '',
          phone: '',
          city: '',
        });
        this.updateModeValidators();
      }
    });
  }

  controlInvalid(name: AuthField): boolean {
    return showControlError(this.authForm.get(name), this.submitted());
  }

  onModeChange(): void {
    this.submitted.set(false);
    this.updateModeValidators();
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.auth.closeLoginDialog();
    }
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.updateModeValidators();
    this.authForm.markAllAsTouched();

    if (this.authForm.invalid) {
      return;
    }

    const raw = this.authForm.getRawValue();
    this.loading.set(true);
    try {
      if (this.mode === 'login') {
        const returnUrl = await this.auth.signIn(normalizeAuthEmail(raw.email), raw.password);
        this.toastSuccess(this.translate.instant('auth.successLogin'));
        if (returnUrl) {
          await this.router.navigateByUrl(returnUrl);
        }
      } else {
        const needsConfirmation = await this.auth.signUp({
          email: normalizeAuthEmail(raw.email),
          password: raw.password,
          profile: {
            display_name: raw.displayName.trim(),
            phone: formatEgyptPhoneForStorage(raw.phone),
            city: raw.city.trim() || null,
          },
        });
        this.toastSuccess(
          this.translate.instant(
            needsConfirmation ? 'auth.successRegisterConfirm' : 'auth.successRegister',
          ),
        );
        this.mode = 'login';
        this.onModeChange();
      }
    } catch (e) {
      this.toastError(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private updateModeValidators(): void {
    const password = this.authForm.get('password');
    const displayName = this.authForm.get('displayName');
    const phone = this.authForm.get('phone');

    if (this.mode === 'register') {
      password?.setValidators([Validators.required, authPasswordValidator()]);
      displayName?.setValidators([authDisplayNameValidator()]);
      phone?.setValidators([optionalPhoneValidator()]);
    } else {
      password?.setValidators([Validators.required]);
      displayName?.clearValidators();
      phone?.clearValidators();
    }

    password?.updateValueAndValidity({ emitEvent: false });
    displayName?.updateValueAndValidity({ emitEvent: false });
    phone?.updateValueAndValidity({ emitEvent: false });
  }

  private formatError(e: unknown): string {
    const message =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : '';

    if (/email not confirmed/i.test(message)) {
      return this.translate.instant('auth.emailNotConfirmed');
    }
    if (/invalid login credentials/i.test(message)) {
      return this.translate.instant('auth.invalidCredentials');
    }
    if (/user already registered/i.test(message)) {
      return this.translate.instant('auth.emailAlreadyUsed');
    }
    if (/rate limit|too many requests/i.test(message)) {
      return this.translate.instant('auth.rateLimited');
    }

    if (message) {
      return message;
    }
    return this.translate.instant('auth.errorGeneric');
  }

  private toastSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('toast.success'),
      detail,
      life: 6000,
    });
  }

  private toastError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('toast.error'),
      detail,
      life: 6000,
    });
  }
}
