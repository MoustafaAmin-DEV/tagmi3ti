import { Injectable, inject } from '@angular/core';
import { Part } from '../models/part.model';
import { PartInput, Store, StoreInput } from '../models/store.model';
import { cleanStoreInput } from '../utils/store-input.util';
import { storeLogoExtension } from '../utils/store-logo.util';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  async getMyStores(): Promise<Store[]> {
    const userId = this.auth.requireUserId();
    const { data, error } = await this.supabase.client
      .from('stores')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? []) as Store[];
  }

  async createStore(input: StoreInput): Promise<Store> {
    const userId = this.auth.requireUserId();
    const { data, error } = await this.supabase.client
      .from('stores')
      .insert({ owner_id: userId, ...cleanStoreInput(input) })
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as Store;
  }

  async uploadStoreLogo(storeId: string, file: File): Promise<string> {
    const userId = this.auth.requireUserId();
    const ext = storeLogoExtension(file);
    const path = `${userId}/${storeId}/logo.${ext}`;
    const { error } = await this.supabase.client.storage
      .from('store-logos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      throw error;
    }
    const { data } = this.supabase.client.storage.from('store-logos').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async updateStore(storeId: string, input: StoreInput): Promise<Store> {
    const { data, error } = await this.supabase.client
      .from('stores')
      .update(cleanStoreInput(input))
      .eq('id', storeId)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as Store;
  }

  async deleteStore(storeId: string): Promise<void> {
    const { error } = await this.supabase.client.from('stores').delete().eq('id', storeId);
    if (error) {
      throw error;
    }
  }

  async getStoreParts(storeId: string): Promise<Part[]> {
    const { data, error } = await this.supabase.client
      .from('parts')
      .select('*')
      .eq('store_id', storeId)
      .order('name');
    if (error) {
      throw error;
    }
    return (data ?? []) as Part[];
  }

  async addPart(storeId: string, input: PartInput): Promise<Part> {
    const row = { ...this.cleanPartInput(input), store_id: storeId };
    const { data, error } = await this.supabase.client.from('parts').insert(row).select().single();
    if (error) {
      throw error;
    }
    return data as Part;
  }

  async updatePart(partId: string, input: PartInput): Promise<Part> {
    const row = this.cleanPartInput(input);
    const { data, error } = await this.supabase.client
      .from('parts')
      .update(row)
      .eq('id', partId)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as Part;
  }

  async deletePart(partId: string): Promise<void> {
    const { error } = await this.supabase.client.from('parts').delete().eq('id', partId);
    if (error) {
      throw error;
    }
  }

  async addPartsBulk(
    storeId: string,
    inputs: PartInput[],
  ): Promise<{ inserted: number }> {
    if (inputs.length === 0) {
      return { inserted: 0 };
    }

    const rows = inputs.map((input) => ({
      ...this.cleanPartInput(input),
      store_id: storeId,
    }));

    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await this.supabase.client.from('parts').insert(batch);
      if (error) {
        throw new Error(
          `فشل الاستيراد عند السطر ${i + 1}: ${error.message}`,
        );
      }
      inserted += batch.length;
    }

    return { inserted };
  }

  private cleanPartInput(input: PartInput): Record<string, unknown> {
    const row: Record<string, unknown> = {
      name: input.name.trim(),
      type: input.type,
    };
    const optionalKeys: (keyof PartInput)[] = [
      'brand',
      'socket',
      'chipset',
      'ram_type',
      'ram_slots',
      'max_ram_gb',
      'tdp_watts',
      'max_gpu_length_mm',
      'psu_wattage',
      'gpu_length_mm',
      'form_factor',
      'market_price_egp',
    ];
    for (const key of optionalKeys) {
      const val = input[key];
      if (val !== undefined && val !== null && val !== '') {
        row[key] = val;
      }
    }
    return row;
  }
}
