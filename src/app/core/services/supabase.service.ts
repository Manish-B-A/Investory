import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient | null = null;

  get isConfigured(): boolean {
    return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  }

  getClient(): SupabaseClient {
    if (!this.isConfigured) {
      throw new Error(
        'Supabase is not configured. Set supabaseUrl and supabaseAnonKey in environments.'
      );
    }
    if (!this.client) {
      this.client = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      );
    }
    return this.client;
  }
}
