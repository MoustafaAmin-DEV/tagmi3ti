import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Build, SavedBuildRow } from '../models/build.model';
import { Part, PartType } from '../models/part.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  async getParts(type?: PartType): Promise<Part[]> {
    let query = this.client.from('parts').select('*, stores(name, phone)').order('name');
    if (type) {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return this.mapPartsWithStore(data ?? []);
  }

  private mapPartsWithStore(rows: unknown[]): Part[] {
    return rows.map((row) => {
      const r = row as Part & { stores?: { name: string; phone?: string | null } | null };
      const storeName = r.stores?.name;
      const storePhone = r.stores?.phone ?? undefined;
      const { stores: _stores, ...part } = r;
      return {
        ...part,
        store_name: storeName,
        store_phone: storePhone ?? undefined,
        displayName: storeName ? `[${storeName}] ${part.name}` : part.name,
      };
    });
  }

  async saveBuild(build: Build, userId: string): Promise<SavedBuildRow> {
    const row = {
      user_id: userId,
      name: build.name,
      parts: build.parts,
      total_price: build.total_price ?? 0,
      is_compatible: build.is_compatible ?? false,
      use_case: build.use_case ?? null,
      notes: build.notes ?? null,
    };
    const { data, error } = await this.client.from('saved_builds').insert(row).select().single();
    if (error) {
      throw error;
    }
    return data as SavedBuildRow;
  }

  async getBuilds(userId: string): Promise<SavedBuildRow[]> {
    const { data, error } = await this.client
      .from('saved_builds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? []) as SavedBuildRow[];
  }

  async deleteBuild(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('saved_builds')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
  }

  async getBuildByShareSlug(slug: string): Promise<SavedBuildRow | null> {
    const { data, error } = await this.client
      .from('saved_builds')
      .select('*')
      .eq('share_slug', slug)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return (data as SavedBuildRow | null) ?? null;
  }

  async enableBuildShare(buildId: string, userId: string, slug: string): Promise<string> {
    const { data, error } = await this.client
      .from('saved_builds')
      .update({ share_slug: slug })
      .eq('id', buildId)
      .eq('user_id', userId)
      .select('share_slug')
      .single();
    if (error) {
      throw error;
    }
    return (data as { share_slug: string }).share_slug;
  }

  async disableBuildShare(buildId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('saved_builds')
      .update({ share_slug: null })
      .eq('id', buildId)
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
  }
}
