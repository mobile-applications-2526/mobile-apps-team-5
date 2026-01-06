import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthChangeEvent, Session, type SupportedStorage } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private _client: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);
  readonly session$ = this._session$.asObservable();

  private profileUpdatedSubject = new Subject<void>();
  profileUpdated$ = this.profileUpdatedSubject.asObservable();

  notifyProfileUpdated() {
    this.profileUpdatedSubject.next();
  }

  constructor() {
    if (!environment.SUPABASE_URL || !environment.SUPABASE_ANON_KEY) {
      console.warn('Supabase env not set: please add SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    let storage: SupportedStorage | undefined;
    try {
      const { SecureStorage } = require('@aparajita/capacitor-secure-storage');
      storage = {
        async getItem(key: string) {
          return SecureStorage.getItem(key);
        },
        async setItem(key: string, value: string) {
          await SecureStorage.setItem(key, value);
        },
        async removeItem(key: string) {
          await SecureStorage.removeItem(key);
        },
      } as SupportedStorage;
    } catch {
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

  signIn(email: string, password: string) {
    return this._client.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    const response = await this._client.auth.signUp({ email, password });
    if (response.error) throw response.error;

    if (response.data.user) {
      const tempUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);
      await this._client.from('profiles').insert({
        id: response.data.user.id,
        username: tempUsername,
        full_name: '',
        bio: ''
      });
    }
    return response;
  }

  signOut() {
    return this._client.auth.signOut();
  }

  async getCurrentUser() {
    const { data } = await this._client.auth.getUser();
    return data.user;
  }
}
