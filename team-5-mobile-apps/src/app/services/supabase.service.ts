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
  async getCurrentUser() {
    const { data } = await this._client.auth.getUser();
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

    if (error) throw error;
  }


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

  async createActivity(formValues: any) {
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
  // Suggestions
  async getAllProfiles() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // 1. Get IDs of everyone I have a relationship with (friends, pending, requested)
    // Case A: I am user_id_1
    const { data: rel1 } = await this._client
      .from('friendships')
      .select('user_id_2')
      .eq('user_id_1', user.id);

    // Case B: I am user_id_2
    const { data: rel2 } = await this._client
      .from('friendships')
      .select('user_id_1')
      .eq('user_id_2', user.id);

    const excludedIds = new Set<string>();
    excludedIds.add(user.id); // Exclude self

    rel1?.forEach((r: any) => excludedIds.add(r.user_id_2));
    rel2?.forEach((r: any) => excludedIds.add(r.user_id_1));

    // 2. Fetch profiles NOT in the excluded list
    const { data, error } = await this._client
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
      .limit(50);

    if (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
    return data || [];
  }

  async sendFriendRequest(targetUserId: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    // Insert new friendship with status 'pending'
    const { error } = await this._client
      .from('friendships')
      .insert({
        user_id_1: user.id, // Current user is initiator
        user_id_2: targetUserId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async getFriendRequests() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // Fetch pending requests where I am the target (user_id_2)
    const { data, error } = await this._client
      .from('friendships')
      .select('id, user_id_1, status, created_at') // select the friendship ID and the sender's ID
      .eq('user_id_2', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Get sender profiles
    const senderIds = data.map((r: any) => r.user_id_1);
    const { data: profiles, error: profileError } = await this._client
      .from('profiles')
      .select('*')
      .in('id', senderIds);

    if (profileError) {
      console.error('Error fetching sender profiles:', profileError);
      return [];
    }

    // Map profiles back to requests
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

    return data.map((r: any) => ({
      ...r,
      sender: profileMap.get(r.user_id_1)
    }));
  }

  async acceptFriendRequest(friendshipId: string) {
    const { error } = await this._client
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  rpc(fn: string, args?: Record<string, unknown>) {
    return this._client.rpc(fn, args);
  }

  // Friendships
  async getFriends() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // Fetch friendships where status is 'accepted'
    // Direction 1: I am user_id_1, friend is user_id_2
    const { data: f1, error: e1 } = await this._client
      .from('friendships')
      .select('user_id_2')
      .eq('user_id_1', user.id)
      .eq('status', 'accepted');

    if (e1) console.error('Error fetching friendships (1):', e1);

    // Direction 2: I am user_id_2, friend is user_id_1
    const { data: f2, error: e2 } = await this._client
      .from('friendships')
      .select('user_id_1')
      .eq('user_id_2', user.id)
      .eq('status', 'accepted');

    if (e2) console.error('Error fetching friendships (2):', e2);

    // Collect all friend IDs
    const friendIds = new Set<string>();
    f1?.forEach((f: any) => friendIds.add(f.user_id_2));
    f2?.forEach((f: any) => friendIds.add(f.user_id_1));

    if (friendIds.size === 0) return [];

    // Fetch profiles
    const { data: profiles, error } = await this._client
      .from('profiles')
      .select('*')
      .in('id', Array.from(friendIds));

    if (error) {
      console.error('Error fetching friends profiles:', error);
      return [];
    }
    return profiles || [];
  }

  // Chat
  async getChatRooms() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // 1. Get IDs of rooms I am in
    const { data: myParticipants, error: partError } = await this._client
      .from('chat_room_participants')
      .select('room_id')
      .eq('participant', user.id);

    if (partError) {
      console.error('getChatRooms: Error fetching participants', partError);
      return [];
    }

    // Explicitly cast to any array to avoid TS errors if types are loose
    const participants = myParticipants as any[] || [];
    console.log('getChatRooms: Found participant entries', participants);
    const roomIds = participants.map(p => p.room_id);

    if (roomIds.length === 0) {
      console.log('getChatRooms: No rooms found');
      return [];
    }

    // 2. Fetch the rooms, AND the *other* participants for those rooms
    const { data: roomsData, error } = await this._client
      .from('chat_rooms')
      .select(`
        *,
        chat_room_participants (
          participant
        )
      `)
      .in('id', roomIds);

    if (error) {
      console.error('getChatRooms: Error fetching rooms', error);
      return [];
    }

    console.log('getChatRooms: Fetched rooms data', roomsData);

    const rooms = roomsData as any[] || [];

    // 3. For each room, determine the "other" user and fetch details
    const allParticipantIds = new Set<string>();
    rooms.forEach((room) => {
      // room.chat_room_participants is an array of objects
      if (Array.isArray(room.chat_room_participants)) {
        room.chat_room_participants.forEach((p: any) => allParticipantIds.add(p.participant));
      }
    });

    // fetch profiles
    const { data: profiles } = await this._client
      .from('profiles')
      .select('*')
      .in('id', Array.from(allParticipantIds));

    const profileMap = new Map((profiles as any[])?.map(p => [p.id, p]));

    // Check last messages for each room
    const enrichedRooms = await Promise.all(rooms.map(async (room) => {
      let name = 'Unknown Chat';
      let avatarUrl = undefined;

      // Logic for 1-on-1: find the participant that isn't me
      const participants = room.chat_room_participants as any[];
      const otherPart = participants.find((p) => p.participant !== user.id);

      if (otherPart) {
        const profile = profileMap.get(otherPart.participant);
        if (profile) {
          name = profile.full_name || profile.username || 'Unknown';
          avatarUrl = profile.avatar_url;
        }
      }

      // Get last message
      const { data: lastMsg } = await this._client
        .from('chat_messages')
        .select('*')
        .eq('room', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: room.id,
        name: name,
        avatarUrl: avatarUrl,
        lastMessage: lastMsg?.content || 'No messages yet',
        time: lastMsg?.created_at,
        unread: 0
      };
    }));

    return enrichedRooms;
  }

  async getMessages(roomId: string) {
    const { data, error } = await this._client
      .from('chat_messages')
      .select('*, sender:sender(id, username, full_name, avatar_url)')
      .eq('room', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  }

  async sendMessage(roomId: string, content: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await this._client
      .from('chat_messages')
      .insert({
        room: roomId,
        sender: user.id,
        content: content
      });

    if (error) throw error;
  }

  async startDirectChat(friendId: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    // 1. Check if a direct chat already exists
    // Get all rooms I am in
    const { data: myRooms } = await this._client
      .from('chat_room_participants')
      .select('room_id')
      .eq('participant', user.id);

    const myRoomIds = myRooms?.map((r: any) => r.room_id) || [];

    if (myRoomIds.length > 0) {
      // Check which of these rooms the friend is also in
      const { data: commonRooms } = await this._client
        .from('chat_room_participants')
        .select('room_id')
        .in('room_id', myRoomIds)
        .eq('participant', friendId);

      // If we find a common room, we need to check if it's a direct chat (only 2 people)
      if (commonRooms && commonRooms.length > 0) {
        for (const room of commonRooms) {
          const { count } = await this._client
            .from('chat_room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.room_id);

          if (count === 2) {
            return room.room_id; // Found existing direct chat
          }
        }
      }
    }

    // 2. No existing room found, create a new one
    const { data: newRoom, error: roomError } = await this._client
      .from('chat_rooms')
      .insert({
        name: 'Direct Chat',
        creator: user.id
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // 3. Add participants
    const { error: partError } = await this._client
      .from('chat_room_participants')
      .insert([
        { room_id: newRoom.id, participant: user.id },
        { room_id: newRoom.id, participant: friendId }
      ]);

    if (partError) throw partError;

    return newRoom.id;
  }

  async createGroupChat(name: string, participantIds: string[]) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    // 1. Create Room
    const { data: newRoom, error: roomError } = await this._client
      .from('chat_rooms')
      .insert({
        name: name,
        creator: user.id
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // 2. Add all participants (including self)
    const allParticipants = [user.id, ...participantIds];
    const participantsData = allParticipants.map(uid => ({
      room_id: newRoom.id,
      participant: uid
    }));

    const { error: partError } = await this._client
      .from('chat_room_participants')
      .insert(participantsData);

    if (partError) throw partError;

    return newRoom.id;
  }
}
