import { Injectable, inject, signal, computed } from '@angular/core';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  private _user = signal<User | null>(null);
  private _session = signal<Session | null>(null);
  private _loading = signal(true);
  private _initialized = signal(false);

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  async init(): Promise<void> {
    if (!this.supabase.isConfigured) {
      this._loading.set(false);
      this._initialized.set(true);
      return;
    }

    try {
      const client = this.supabase.getClient();
      const { data } = await client.auth.getSession();
      this._session.set(data.session);
      this._user.set(data.session?.user ?? null);

      client.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        this._session.set(session);
        this._user.set(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
          this._user.set(null);
          this._session.set(null);
        }
      });
    } catch (e) {
      console.error('Auth init failed', e);
    } finally {
      this._loading.set(false);
      this._initialized.set(true);
    }
  }

  async signUp(email: string, password: string): Promise<{ error: string | null }> {
    if (!this.supabase.isConfigured) {
      return { error: 'Cloud sync is not configured yet.' };
    }
    const { error } = await this.supabase.getClient().auth.signUp({
      email: email.trim(),
      password,
    });
    return { error: error?.message ?? null };
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!this.supabase.isConfigured) {
      return { error: 'Cloud sync is not configured yet.' };
    }
    const { error } = await this.supabase.getClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<{ error: string | null }> {
    if (!this.supabase.isConfigured) {
      this._user.set(null);
      this._session.set(null);
      return { error: null };
    }
    const { error } = await this.supabase.getClient().auth.signOut();
    this._user.set(null);
    this._session.set(null);
    return { error: error?.message ?? null };
  }
}
