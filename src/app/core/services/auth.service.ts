import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { ProfileInput } from '../models/profile.model';
import { SupabaseService } from './supabase.service';
import { ProfileService } from './profile.service';

export interface SignUpPayload {
  email: string;
  password: string;
  profile: ProfileInput;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly profileService = inject(ProfileService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly showLoginDialog = signal(false);
  private readonly pendingReturnUrl = signal<string | null>(null);

  private readyResolve!: () => void;
  readonly whenReady = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  constructor() {
    void this.init();
  }

  get userId(): string | null {
    return this.user()?.id ?? null;
  }

  get isLoggedIn(): boolean {
    return this.user() !== null;
  }

  requestLogin(returnUrl?: string): void {
    if (returnUrl && returnUrl !== '/' && !returnUrl.startsWith('/b/')) {
      this.pendingReturnUrl.set(returnUrl);
    }
    this.showLoginDialog.set(true);
  }

  closeLoginDialog(): void {
    this.showLoginDialog.set(false);
    this.pendingReturnUrl.set(null);
  }

  consumeReturnUrl(): string | null {
    const url = this.pendingReturnUrl();
    this.pendingReturnUrl.set(null);
    return url;
  }

  /** @returns true if email confirmation is required before sign-in */
  async signUp({ email, password, profile }: SignUpPayload): Promise<boolean> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: profile.display_name.trim(),
          phone: profile.phone?.trim() ?? '',
          city: profile.city?.trim() ?? '',
        },
      },
    });
    if (error) {
      throw error;
    }
    if (data.session?.user) {
      await this.profileService.upsertForUser(data.session.user.id, profile);
      return false;
    }
    return true;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    const returnUrl = this.consumeReturnUrl();
    this.closeLoginDialog();
    return returnUrl;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
      throw error;
    }
    this.profileService.clear();
  }

  requireUserId(): string {
    const id = this.userId;
    if (!id) {
      throw new Error('يجب تسجيل الدخول لحفظ التجميعات');
    }
    return id;
  }

  private async init(): Promise<void> {
    try {
      const { data } = await this.supabase.client.auth.getSession();
      this.user.set(data.session?.user ?? null);

      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        this.user.set(session?.user ?? null);
        if (session?.user) {
          void this.profileService.loadForUser(session.user.id);
        } else {
          this.profileService.clear();
        }
      });

      if (data.session?.user) {
        void this.profileService.loadForUser(data.session.user.id);
      }
    } finally {
      this.loading.set(false);
      this.readyResolve();
    }
  }
}
