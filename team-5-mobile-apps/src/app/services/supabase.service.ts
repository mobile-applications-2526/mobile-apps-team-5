import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthChangeEvent, Session, type SupportedStorage } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private _client: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);
  readonly session$ = this._session$.asObservable();

  constructor() {
    if (!environment.SUPABASE_URL || !environment.SUPABASE_ANON_KEY) {
      console.warn('Supabase env not set: please add SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    // Try to use Capacitor Preferences for mobile (if available), else fall back to localStorage
    let storage: SupportedStorage | undefined;
    try {
      // Dynamic import so web works without Capacitor
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const prefs = require('@capacitor/preferences');
      const Preferences = prefs.Preferences;
      storage = {
        async getItem(key: string) {
          const { value } = await Preferences.get({ key });
          return value ?? null;
        },
        async setItem(key: string, value: string) {
          await Preferences.set({ key, value });
        },
        async removeItem(key: string) {
          await Preferences.remove({ key });
        },
      } as SupportedStorage;
    } catch {
      // Fallback: browser localStorage
      storage = typeof window !== 'undefined' ? window.localStorage : undefined;
    }

    this._client = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage,
        storageKey: 'sb-' + new URL(environment.SUPABASE_URL).host + '-auth-token',
      },
    });

    // Initialize current session and listen for changes
    this._client.auth.getSession().then(({ data }) => {
      this._session$.next(data.session ?? null);
    });
    this._client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this._session$.next(session);
    });
  }

  get client() {
    return this._client;
  }

  // Auth helpers
  signIn(email: string, password: string) {
    return this._client.auth.signInWithPassword({ email, password });
  }
  signUp(email: string, password: string) {
    return this._client.auth.signUp({ email, password });
  }
  signOut() {
    return this._client.auth.signOut();
  }

  // Data helpers
  from(table: string) {
    return this._client.from(table);
  }
  rpc(fn: string, args?: Record<string, unknown>) {
    return this._client.rpc(fn, args);
  }
}
