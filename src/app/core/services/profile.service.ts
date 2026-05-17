import { Injectable, inject, signal } from '@angular/core';
import { ProfileInput, UserProfile } from '../models/profile.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);

  async loadForUser(userId: string): Promise<UserProfile | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('id, display_name, phone, city, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const profile = (data as UserProfile | null) ?? null;
      this.profile.set(profile);
      return profile;
    } finally {
      this.loading.set(false);
    }
  }

  async upsertForUser(userId: string, input: ProfileInput): Promise<UserProfile> {
    const row = {
      id: userId,
      display_name: input.display_name.trim(),
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
    };

    const { data, error } = await this.supabase.client
      .from('profiles')
      .upsert(row)
      .select('id, display_name, phone, city, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    const profile = data as UserProfile;
    this.profile.set(profile);
    return profile;
  }

  clear(): void {
    this.profile.set(null);
  }
}
