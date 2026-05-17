import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LocaleService } from '../../core/i18n/locale.service';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { SelectButton } from 'primeng/selectbutton';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Message } from 'primeng/message';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import {
  AiSuggesterService,
  BuildLevel,
  UseCase,
} from '../../core/services/ai-suggester.service';
import { PartsService } from '../../core/services/parts.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { Build } from '../../core/models/build.model';
import { PART_TYPES } from '../../core/constants/part-types';
import { PartTypeLabelPipe } from '../../shared/pipes/part-type-label.pipe';
import { CompatibilityBadgeComponent } from '../../shared/components/compatibility-badge/compatibility-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { showControlError } from '../../core/i18n/form-control.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-ai-suggester',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    SelectButton,
    Button,
    ProgressSpinner,
    Message,
    Card,
    Dialog,
    InputText,
    CompatibilityBadgeComponent,
    PageHeaderComponent,
    FieldErrorComponent,
    PartTypeLabelPipe,
  ],
  templateUrl: './ai-suggester.component.html',
  styleUrl: './ai-suggester.component.scss',
})
export class AiSuggesterComponent implements OnInit {
  private readonly aiService = inject(AiSuggesterService);
  readonly partsService = inject(PartsService);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly compatibility = inject(CompatibilityService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);

  readonly partTypes = PART_TYPES;

  useCase: UseCase = 'Gaming';
  level: BuildLevel = 'Mid';

  readonly useCaseOptions = computed(() => {
    this.locale.lang();
    return [
      { label: this.translate.instant('ai.useCaseGaming'), value: 'Gaming' as UseCase },
      { label: this.translate.instant('ai.useCaseEditing'), value: 'Editing' as UseCase },
      { label: this.translate.instant('ai.useCaseProgramming'), value: 'Programming' as UseCase },
    ];
  });

  readonly levelOptions = computed(() => {
    this.locale.lang();
    return [
      { label: this.translate.instant('ai.levelEntry'), value: 'Entry' as BuildLevel },
      { label: this.translate.instant('ai.levelMid'), value: 'Mid' as BuildLevel },
      { label: this.translate.instant('ai.levelHigh'), value: 'High End' as BuildLevel },
    ];
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly suggestedBuild = signal<Build | null>(null);
  readonly saving = signal(false);

  saveDialogVisible = false;
  readonly saveFormSubmitted = signal(false);

  readonly saveForm = this.fb.nonNullable.group({
    name: ['', [RxwebValidators.required(), RxwebValidators.minLength({ value: 2 })]],
  });

  readonly buildCompatible = computed(() => {
    const build = this.suggestedBuild();
    if (!build?.compatibility_issues) {
      return true;
    }
    return !build.compatibility_issues.some((i) => i.type === 'error');
  });

  ngOnInit(): void {
    void this.partsService.loadParts();
  }

  reloadParts(): void {
    void this.partsService.loadParts();
  }

  useCaseLabel(): string {
    return this.useCaseOptions().find((o) => o.value === this.useCase)?.label ?? '';
  }

  levelLabel(): string {
    return this.levelOptions().find((o) => o.value === this.level)?.label ?? '';
  }

  useCaseIcon(): string {
    switch (this.useCase) {
      case 'Gaming':
        return 'pi pi-play';
      case 'Editing':
        return 'pi pi-video';
      case 'Programming':
        return 'pi pi-code';
    }
  }

  resultScore(): number {
    const build = this.suggestedBuild();
    if (!build) {
      return 0;
    }
    return this.compatibility.calculateCompatibilityScore(build.parts);
  }

  async suggest(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.suggestedBuild.set(null);
    try {
      const build = await this.aiService.suggestBuild(
        this.useCase,
        this.level,
        this.partsService.parts(),
      );
      this.suggestedBuild.set(build);
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : this.translate.instant('auth.errorGeneric'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  openSaveDialog(): void {
    if (!this.auth.isLoggedIn) {
      this.auth.requestLogin();
      return;
    }
    const build = this.suggestedBuild();
    this.saveForm.reset({ name: build?.name ?? '' });
    this.saveFormSubmitted.set(false);
    this.saveDialogVisible = true;
  }

  saveNameInvalid(): boolean {
    return showControlError(this.saveForm.get('name'), this.saveFormSubmitted());
  }

  async saveSuggested(): Promise<void> {
    const build = this.suggestedBuild();
    if (!build) {
      return;
    }
    this.saveFormSubmitted.set(true);
    this.saveForm.markAllAsTouched();
    if (this.saveForm.invalid) {
      return;
    }
    const name = this.saveForm.getRawValue().name.trim();
    if (!this.auth.isLoggedIn) {
      this.auth.requestLogin();
      return;
    }
    this.saving.set(true);
    try {
      await this.supabase.saveBuild(
        {
          ...build,
          name,
          is_compatible: this.buildCompatible(),
        },
        this.auth.requireUserId(),
      );
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.success'),
        detail: this.translate.instant('build.savedSuccess'),
      });
      this.saveDialogVisible = false;
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
