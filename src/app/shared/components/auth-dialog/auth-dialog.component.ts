import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { showControlError } from '../../../core/i18n/form-control.util';
import { optionalPhoneValidator } from '../../../core/i18n/rxweb-validators.util';
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
    Message,
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

  mode: AuthMode = 'login';

  readonly modeOptions = computed(() => {
    this.locale.lang();
    return [
      { label: this.translate.instant('auth.login'), value: 'login' as AuthMode },
      { label: this.translate.instant('auth.register'), value: 'register' as AuthMode },
    ];
  });

  readonly authForm = this.fb.nonNullable.group({
    email: ['', [RxwebValidators.required(), RxwebValidators.email()]],
    password: ['', [RxwebValidators.required()]],
    displayName: [''],
    phone: [''],
    city: [''],
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly submitted = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.showLoginDialog()) {
        this.error.set(null);
        this.success.set(null);
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
    this.error.set(null);
    this.success.set(null);
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
        const returnUrl = await this.auth.signIn(raw.email.trim(), raw.password);
        if (returnUrl) {
          await this.router.navigateByUrl(returnUrl);
        }
      } else {
        await this.auth.signUp({
          email: raw.email.trim(),
          password: raw.password,
          profile: {
            display_name: raw.displayName.trim(),
            phone: raw.phone.trim() || null,
            city: raw.city.trim() || null,
          },
        });
        this.success.set(this.translate.instant('auth.successRegister'));
        this.mode = 'login';
        this.onModeChange();
      }
    } catch (e) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private updateModeValidators(): void {
    const password = this.authForm.get('password');
    const displayName = this.authForm.get('displayName');
    const phone = this.authForm.get('phone');

    if (this.mode === 'register') {
      password?.setValidators([
        RxwebValidators.required(),
        RxwebValidators.minLength({ value: 6 }),
      ]);
      displayName?.setValidators([
        RxwebValidators.required(),
        RxwebValidators.minLength({ value: 2 }),
      ]);
      phone?.setValidators([optionalPhoneValidator()]);
    } else {
      password?.setValidators([RxwebValidators.required()]);
      displayName?.clearValidators();
      phone?.clearValidators();
    }

    password?.updateValueAndValidity({ emitEvent: false });
    displayName?.updateValueAndValidity({ emitEvent: false });
    phone?.updateValueAndValidity({ emitEvent: false });
  }

  private formatError(e: unknown): string {
    if (e && typeof e === 'object' && 'message' in e) {
      return String((e as { message: string }).message);
    }
    return this.translate.instant('auth.errorGeneric');
  }
}
