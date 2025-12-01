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

  // signUp(email: string, password: string) {
  //   return this._client.auth.signUp({ email, password });
  // }

  // UPDATED: Creates the Auth user AND the initial Database Profile
  async signUp(email: string, password: string) {
    const response = await this._client.auth.signUp({ email, password });
    if (response.error) throw response.error;

    // Try to create initial profile, but don't fail if it doesn't work (we fix it in Setup)
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

  

  //-------helper get current logged-in user
  async getCurrentUser(){
    const {data} = await this._client.auth.getUser();
    return data.user;
  }

  // Helper to check if profile exists and is complete
  async getProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await this._client
      .from('profiles')
      .select('*') 
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  //to confirm the profile details
  async completeProfile(firstName: string, lastName: string, bio: string) {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new Error('User not logged in');
    }

    // Combine inputs because your DB uses 'full_name'
    const fullName = `${firstName} ${lastName}`.trim();
    const randomUsername = firstName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 10000);
    const { error } = await this._client
      .from('profiles')
      .upsert({
        id: user.id, // This links it to the user
        full_name: fullName,
        bio: bio,
        username: randomUsername
      }, { onConflict: 'id' }); // If ID exists, update it. If not, insert.

    if (error) throw error; }

  
    // Update existing profile
    async updateProfileData(profileData: { full_name?: string; bio?: string; location?: string }) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Not logged in');
  
      const { error } = await this._client
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
  
      if (error) throw error;
    }


    async getAllInterests() {
      const { data, error } = await this._client
        .from('interests')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching interests:', error);
        return [];
      }
      return data || [];
    }

    async uploadActivityImage(file: File): Promise<string> {
      if (!file) return ''; 
  
      const filePath = `public/${Date.now()}-${file.name}`;
      const bucket = 'activity_images'; //bucket name in storage is the same 
  
      // Upload the file
      const { error: uploadError } = await this._client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
  
      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error('Image upload failed: ' + uploadError.message);
      }
  
      // Get the public URL to save to the database
      const { data } = this._client.storage.from(bucket).getPublicUrl(filePath);
      
      return data.publicUrl;
  }

    async createActivity(formValues: any){
      const user = await this.getCurrentUser();
      if (!user) throw new Error('You must be logged in to create an activity');
      
      let imageUrl = '';

      if (formValues.image instanceof File) { // is image a fileObject?
        imageUrl = await this.uploadActivityImage(formValues.image);
      }
      const newActivity = {
        name: formValues.title,            
        description: formValues.description,
        location: formValues.location,
        activity_date: formValues.date,    
        min_participants: formValues.min_participants || 2,
        max_participants: formValues.max_participants || 10,
        status: 'active',                  
        creator_id: user.id,               
        interest: formValues.category,
        image_url: imageUrl   
      };

      const { error } = await this._client
      .from('activities')
      .insert(newActivity);
  
      if (error) {
        console.error('Supabase Create Error:', error);
        throw error;
      }
     
    }
    

    async getActivities() {
      
      const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: mySwipes, error: swipeError } = await this._client
      .from('activity_swipes')
      .select('swipe') // This column holds the Activity ID
      .eq('user_id', user.id);

    if (swipeError) {
      console.error('Error fetching history:', swipeError);
      return [];
    }

    const swipedIds = mySwipes.map((row: any) => row.swipe);

   
    let query = this._client
      .from('activities')
      .select('id, name, description, location, activity_date, min_participants, max_participants, image_url, interest (name)')
      .eq('status', 'active');

    
    if (swipedIds.length > 0) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error loading cards:', error);
      return [];
    }
    return data || [];
  }

  async recordSwipe(activityId: string, liked: boolean) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    //Insert the swipe with the User ID
    const { error } = await this._client
      .from('activity_swipes')
      .insert({
        user_id: user.id,     
        swipe: activityId,   
        liked: liked
      });

    if (error) {
      if (error.code !== '23505') {
        console.error('Swipe error:', error);
        throw error;
      }
    }
  }
  
      // Data helpers
  from(table: string) {
    return this._client.from(table);
  }
  rpc(fn: string, args?: Record<string, unknown>) {
    return this._client.rpc(fn, args);
  }
 
}
