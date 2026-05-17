import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PART_TYPES } from '../../core/constants/part-types';
import { Part, PartType } from '../../core/models/part.model';
import { PartInput, Store } from '../../core/models/store.model';
import { StoreService } from '../../core/services/store.service';
import { PartsService } from '../../core/services/parts.service';
import {
  CsvImportRowError,
  downloadPartsCsvTemplate,
  parsePartsSpreadsheet,
} from '../../core/utils/part-csv-import.util';
import { Message } from 'primeng/message';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LocaleService } from '../../core/i18n/locale.service';
import { showControlError } from '../../core/i18n/form-control.util';
import {
  optionalEmailValidator,
  optionalLatitudeValidator,
  optionalLongitudeValidator,
  optionalMinZeroValidator,
  optionalPhoneValidator,
  optionalUrlValidator,
} from '../../core/i18n/rxweb-validators.util';
import { validateStoreLogoFile } from '../../core/utils/store-logo.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { StoreFormFieldsComponent } from '../../shared/components/store-form-fields/store-form-fields.component';
import { StoreInput } from '../../core/models/store.model';
import {
  hiddenPartFormPatch,
  isPartFormFieldVisible,
  normalizePartInputForType,
  PartFormSpecField,
} from '../../core/utils/part-form-fields.util';

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    Card,
    Button,
    TableModule,
    Dialog,
    InputText,
    InputNumber,
    Select,
    ConfirmDialog,
    Message,
    PageHeaderComponent,
    FieldErrorComponent,
    StoreFormFieldsComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './store-dashboard.component.html',
  styleUrl: './store-dashboard.component.scss',
})
export class StoreDashboardComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly partsService = inject(PartsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedPartType = signal<PartType>('CPU');
  private patchingPartForm = false;

  readonly stores = signal<Store[]>([]);
  readonly storeParts = signal<Part[]>([]);
  readonly activeStoreId = signal<string | null>(null);
  readonly loadingStores = signal(false);
  readonly loadingParts = signal(false);
  readonly savingPart = signal(false);
  readonly editingPart = signal<Part | null>(null);

  showStoreDialog = false;
  readonly editingStore = signal<Store | null>(null);
  partDialogVisible = false;
  importDialogVisible = false;

  readonly importPreviewParts = signal<PartInput[]>([]);
  readonly importPreviewErrors = signal<CsvImportRowError[]>([]);
  readonly importing = signal(false);
  readonly storeFormSubmitted = signal(false);
  readonly partFormSubmitted = signal(false);
  readonly pendingLogoFile = signal<File | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  private readonly removeLogoOnSave = signal(false);
  private logoBlobUrl: string | null = null;

  readonly storeForm = this.fb.nonNullable.group({
    name: ['', [RxwebValidators.required(), RxwebValidators.minLength({ value: 2 })]],
    phone: ['', [optionalPhoneValidator()]],
    city: [''],
    area: [''],
    address: [''],
    description: [''],
    email: ['', [optionalEmailValidator()]],
    facebook_url: ['', [optionalUrlValidator()]],
    maps_url: ['', [optionalUrlValidator()]],
    latitude: [null as number | null, [optionalLatitudeValidator()]],
    longitude: [null as number | null, [optionalLongitudeValidator()]],
    hours_sat_thu: [''],
    hours_fri: [''],
    hours_notes: [''],
  });

  readonly partFormGroup = this.fb.group({
    name: ['', [RxwebValidators.required(), RxwebValidators.minLength({ value: 2 })]],
    type: ['CPU', [RxwebValidators.required()]],
    brand: [''],
    socket: [''],
    ram_type: [''],
    tdp_watts: [null as number | null, [optionalMinZeroValidator()]],
    market_price_egp: [null as number | null, [optionalMinZeroValidator()]],
    gpu_length_mm: [null as number | null, [optionalMinZeroValidator()]],
    max_gpu_length_mm: [null as number | null, [optionalMinZeroValidator()]],
    psu_wattage: [null as number | null, [optionalMinZeroValidator()]],
  });

  readonly partTypeOptions = computed(() => {
    this.locale.lang();
    return PART_TYPES.map((t) => ({
      label: this.translate.instant(`partType.${t}`),
      value: t,
    }));
  });

  activeStore = () => this.stores().find((s) => s.id === this.activeStoreId()) ?? null;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.revokeLogoBlob());
    void this.loadStores();
    this.partFormGroup
      .get('type')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        if (type) {
          this.applyPartTypeChange(type as PartType);
        }
      });
  }

  showPartField(field: PartFormSpecField): boolean {
    return isPartFormFieldVisible(this.selectedPartType(), field);
  }

  private applyPartTypeChange(type: PartType): void {
    if (this.patchingPartForm) {
      this.selectedPartType.set(type);
      return;
    }
    if (this.selectedPartType() !== type) {
      this.partFormGroup.patchValue(hiddenPartFormPatch(type));
    }
    this.selectedPartType.set(type);
  }

  typeLabel(type: PartType): string {
    return this.translate.instant(`partType.${type}`);
  }

  readonly isEditingStore = () => this.editingStore() !== null;

  partControlInvalid(name: string): boolean {
    return showControlError(this.partFormGroup.get(name), this.partFormSubmitted());
  }

  downloadTemplate(): void {
    downloadPartsCsvTemplate();
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    void parsePartsSpreadsheet(file)
      .then((result) => {
        this.importPreviewParts.set(result.parts);
        this.importPreviewErrors.set(result.errors);
        this.importDialogVisible = true;

        if (result.parts.length === 0 && result.errors.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: this.translate.instant('toast.emptyFile'),
            detail: this.translate.instant('toast.emptyFileDetail'),
          });
        }
      })
      .catch((e) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('toast.fileError'),
          detail:
            e instanceof Error
              ? e.message
              : this.translate.instant('toast.fileReadFailed'),
        });
      });
  }

  async confirmImport(): Promise<void> {
    const storeId = this.activeStoreId();
    const parts = this.importPreviewParts();
    if (!storeId || parts.length === 0) {
      return;
    }

    this.importing.set(true);
    try {
      const { inserted } = await this.storeService.addPartsBulk(storeId, parts);
      this.importDialogVisible = false;
      this.importPreviewParts.set([]);
      this.importPreviewErrors.set([]);
      await this.selectStore(storeId);
      await this.partsService.loadParts();
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('toast.imported'),
        detail: this.translate.instant('toast.importedDetail', { count: inserted }),
      });
    } catch (e) {
      this.toastError(e);
    } finally {
      this.importing.set(false);
    }
  }

  async loadStores(): Promise<void> {
    this.loadingStores.set(true);
    try {
      const list = await this.storeService.getMyStores();
      this.stores.set(list);
      if (list.length > 0 && !this.activeStoreId()) {
        this.selectStore(list[0].id);
      }
    } catch (e) {
      this.toastError(e);
    } finally {
      this.loadingStores.set(false);
    }
  }

  async selectStore(id: string): Promise<void> {
    this.activeStoreId.set(id);
    this.loadingParts.set(true);
    try {
      this.storeParts.set(await this.storeService.getStoreParts(id));
    } catch (e) {
      this.toastError(e);
    } finally {
      this.loadingParts.set(false);
    }
  }

  private storeInputFromForm(): StoreInput {
    return this.storeForm.getRawValue() as StoreInput;
  }

  private patchStoreForm(store?: Store | null): void {
    this.resetLogoState(store?.logo_url ?? null);
    this.storeForm.reset({
      name: store?.name ?? '',
      phone: store?.phone ?? '',
      city: store?.city ?? '',
      area: store?.area ?? '',
      address: store?.address ?? '',
      description: store?.description ?? '',
      email: store?.email ?? '',
      facebook_url: store?.facebook_url ?? '',
      maps_url: store?.maps_url ?? '',
      latitude: store?.latitude ?? null,
      longitude: store?.longitude ?? null,
      hours_sat_thu: store?.hours_sat_thu ?? '',
      hours_fri: store?.hours_fri ?? '',
      hours_notes: store?.hours_notes ?? '',
    });
  }

  onStoreLogoSelected(file: File): void {
    const errorKey = validateStoreLogoFile(file);
    if (errorKey) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('toast.checkData'),
        detail: this.translate.instant(errorKey),
      });
      return;
    }
    this.revokeLogoBlob();
    this.pendingLogoFile.set(file);
    this.removeLogoOnSave.set(false);
    this.logoBlobUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.logoBlobUrl);
  }

  onStoreLogoRemove(): void {
    this.revokeLogoBlob();
    this.pendingLogoFile.set(null);
    this.removeLogoOnSave.set(true);
    this.logoPreviewUrl.set(null);
  }

  private resetLogoState(logoUrl: string | null = null): void {
    this.revokeLogoBlob();
    this.pendingLogoFile.set(null);
    this.removeLogoOnSave.set(false);
    this.logoPreviewUrl.set(logoUrl);
  }

  private revokeLogoBlob(): void {
    if (this.logoBlobUrl) {
      URL.revokeObjectURL(this.logoBlobUrl);
      this.logoBlobUrl = null;
    }
  }

  private buildStorePayload(base: StoreInput): StoreInput {
    let input: StoreInput = { ...base };
    if (this.removeLogoOnSave()) {
      input = { ...input, logo_url: null };
    }
    return input;
  }

  private async applyLogoAfterSave(storeId: string, input: StoreInput): Promise<void> {
    const file = this.pendingLogoFile();
    if (!file) {
      return;
    }
    const logo_url = await this.storeService.uploadStoreLogo(storeId, file);
    await this.storeService.updateStore(storeId, { ...input, logo_url });
  }

  async saveStore(): Promise<void> {
    this.storeFormSubmitted.set(true);
    this.storeForm.markAllAsTouched();
    if (this.storeForm.invalid) {
      this.toastCheckFields();
      return;
    }
    const base = this.storeInputFromForm();
    const editing = this.editingStore();
    try {
      const input = this.buildStorePayload(base);
      if (editing) {
        await this.storeService.updateStore(editing.id, input);
        await this.applyLogoAfterSave(editing.id, input);
        this.showStoreDialog = false;
        this.editingStore.set(null);
        this.storeFormSubmitted.set(false);
        this.patchStoreForm();
        await this.loadStores();
        await this.selectStore(editing.id);
        this.toastSuccess('store.storeUpdated');
      } else {
        const store = await this.storeService.createStore(input);
        await this.applyLogoAfterSave(store.id, input);
        this.showStoreDialog = false;
        this.storeFormSubmitted.set(false);
        this.patchStoreForm();
        await this.loadStores();
        await this.selectStore(store.id);
        this.toastSuccess('store.storeCreated');
      }
    } catch (e) {
      this.toastError(e);
    }
  }

  async createStore(): Promise<void> {
    await this.saveStore();
  }

  openNewStoreDialog(): void {
    this.editingStore.set(null);
    this.storeFormSubmitted.set(false);
    this.patchStoreForm();
    this.showStoreDialog = true;
  }

  openEditStoreDialog(store: Store): void {
    this.editingStore.set(store);
    this.storeFormSubmitted.set(false);
    this.patchStoreForm(store);
    this.showStoreDialog = true;
  }

  onStoreDialogHide(): void {
    this.editingStore.set(null);
    this.storeFormSubmitted.set(false);
    const store = this.activeStore();
    this.resetLogoState(store?.logo_url ?? null);
  }

  openPartDialog(part?: Part): void {
    this.partFormSubmitted.set(false);
    this.editingPart.set(part ?? null);
    const type = (part?.type ?? 'CPU') as PartType;
    this.patchingPartForm = true;
    this.selectedPartType.set(type);
    if (part) {
      this.partFormGroup.patchValue({
        name: part.name,
        type: part.type,
        brand: part.brand ?? '',
        socket: part.socket ?? '',
        ram_type: part.ram_type ?? '',
        tdp_watts: part.tdp_watts ?? null,
        max_gpu_length_mm: part.max_gpu_length_mm ?? null,
        psu_wattage: part.psu_wattage ?? null,
        gpu_length_mm: part.gpu_length_mm ?? null,
        market_price_egp: part.market_price_egp ?? null,
      });
    } else {
      this.partFormGroup.reset({
        name: '',
        type: 'CPU',
        brand: '',
        socket: '',
        ram_type: '',
        tdp_watts: null,
        market_price_egp: null,
        gpu_length_mm: null,
        max_gpu_length_mm: null,
        psu_wattage: null,
      });
    }
    this.patchingPartForm = false;
    this.partDialogVisible = true;
  }

  async savePart(): Promise<void> {
    const storeId = this.activeStoreId();
    if (!storeId) {
      return;
    }
    this.partFormSubmitted.set(true);
    this.partFormGroup.markAllAsTouched();
    if (this.partFormGroup.invalid) {
      this.toastCheckFields();
      return;
    }
    const raw = this.partFormGroup.getRawValue() as PartInput;
    const input = normalizePartInputForType(raw.type as PartType, raw);
    this.savingPart.set(true);
    try {
      const editing = this.editingPart();
      if (editing) {
        await this.storeService.updatePart(editing.id, input);
      } else {
        await this.storeService.addPart(storeId, input);
      }
      this.partDialogVisible = false;
      await this.selectStore(storeId);
      await this.partsService.loadParts();
      this.toastSuccess('store.partSaved');
    } catch (e) {
      this.toastError(e);
    } finally {
      this.savingPart.set(false);
    }
  }

  confirmDeletePart(part: Part): void {
    this.confirmationService.confirm({
      message: this.translate.instant('store.deletePartConfirm', { name: part.name }),
      header: this.translate.instant('common.confirm'),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('saved.reject'),
      accept: () => void this.deletePart(part.id),
    });
  }

  async deletePart(id: string): Promise<void> {
    const storeId = this.activeStoreId();
    if (!storeId) {
      return;
    }
    try {
      await this.storeService.deletePart(id);
      await this.selectStore(storeId);
      await this.partsService.loadParts();
      this.toastSuccess('store.deleted');
    } catch (e) {
      this.toastError(e);
    }
  }

  confirmDeleteStore(store: Store): void {
    this.confirmationService.confirm({
      message: this.translate.instant('store.deleteStoreConfirm', { name: store.name }),
      header: this.translate.instant('common.confirm'),
      acceptLabel: this.translate.instant('store.deleteStore'),
      rejectLabel: this.translate.instant('saved.reject'),
      accept: () => void this.deleteStore(store.id),
    });
  }

  async deleteStore(id: string): Promise<void> {
    try {
      await this.storeService.deleteStore(id);
      this.activeStoreId.set(null);
      await this.loadStores();
      await this.partsService.loadParts();
      this.toastSuccess('store.deleted');
    } catch (e) {
      this.toastError(e);
    }
  }

  private toastCheckFields(): void {
    this.messageService.add({
      severity: 'warn',
      summary: this.translate.instant('toast.checkData'),
      detail: this.translate.instant('validation.checkFields'),
    });
  }

  private toastSuccess(detailKey: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('toast.success'),
      detail: this.translate.instant(detailKey),
    });
  }

  private toastError(e: unknown): void {
    this.messageService.add({
      severity: 'error',
      summary: this.translate.instant('toast.error'),
      detail: e instanceof Error ? e.message : this.translate.instant('auth.errorGeneric'),
    });
  }
}
