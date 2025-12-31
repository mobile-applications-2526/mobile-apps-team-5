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

  async completeProfile(firstName: string, lastName: string, bio: string) {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error('User not logged in');
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const randomUsername = firstName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 10000);
    const { error } = await this._client
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        bio: bio,
        username: randomUsername
      }, { onConflict: 'id' });

    if (error) throw error;
  }


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

  async getUserInterests(): Promise<{ id: string; name: string }[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await this._client
      .from('user_interests')
      .select(`
        interest_id,
        interests (
          id,
          name
        )
      `)
      .eq('profile_id', user.id);

    if (error) {
      console.error('Error fetching user interests:', error);
      return [];
    }

    const rows = (data || []) as any[];

    return rows
      .map(row => {
        const interest = row.interests;
        if (!interest) return null;
        return {
          id: interest.id,
          name: interest.name
        };
      })
      .filter((x): x is { id: string; name: string } => !!x);
  }

  async updateUserInterests(interestIds: string[]): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    const uniqueIds = Array.from(new Set(interestIds)).filter(id => !!id);

    const { error: deleteError } = await this._client
      .from('user_interests')
      .delete()
      .eq('profile_id', user.id);

    if (deleteError) {
      console.error('Error clearing user interests:', deleteError);
      throw deleteError;
    }

    if (uniqueIds.length > 0) {
      const inserts = uniqueIds.map(id => ({
        profile_id: user.id,
        interest_id: id
      }));

      const { error: insertError } = await this._client
        .from('user_interests')
        .insert(inserts);

      if (insertError) {
        console.error('Error inserting user interests:', insertError);
        throw insertError;
      }
    }
  }



  async uploadActivityImage(file: File): Promise<string> {
    if (!file) return '';

    const filePath = `public/${Date.now()}-${file.name}`;
    const bucket = 'activity_images'; //bucket name in storage is the same 

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

    const { data } = this._client.storage.from(bucket).getPublicUrl(filePath);

    return data.publicUrl;
  }

  async createActivity(formValues: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('You must be logged in to create an activity');

    let imageUrl = '';

    if (formValues.image instanceof File) {
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

  async unrecordSwipe(activityId: string) {
    const user = await this.getCurrentUser();
    if (!user) return;

    const { error } = await this._client
      .from('activity_swipes')
      .delete()
      .eq('user_id', user.id)
      .eq('swipe', activityId);

    if (error) {
      console.error('Error removing swipe:', error);
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
      const filterString = `(${swipedIds.join(',')})`;
      query = query.not('id', 'in', filterString);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading cards:', error);
      return [];
    }
    return data || [];
  }

  async getSavedActivities() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: swipes, error: swipeError } = await this._client
      .from('activity_swipes')
      .select('swipe')
      .eq('user_id', user.id)
      .eq('liked', true);

    if (swipeError) {
      console.error('Error fetching saved:', swipeError);
      return [];
    }

    if (!swipes || swipes.length === 0) return [];
    const likedIds = swipes.map((s: any) => s.swipe);

    const { data: activities, error: actError } = await this._client
      .from('activities')
      .select('*, interest (name)')
      .in('id', likedIds);

    if (actError) {
      console.error('Error fetching activities:', actError);
      return [];
    }

    return activities || [];
  }

  async getMutualFriendsCount(activityId: string): Promise<number> {
    const user = await this.getCurrentUser();
    if (!user) return 0;

    const { data, error } = await this._client.rpc('get_mutual_friends_count', {
      activity_uuid: activityId,
      current_user_uuid: user.id
    });

    if (error) {
      console.error('Error fetching mutual friends:', error);
      return 0;
    }
    return data || 0;
  }

  async recordSwipe(activityId: string, liked: boolean) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

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

  from(table: string) {
    return this._client.from(table);
  }
  async getAllProfiles() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: rel1 } = await this._client
      .from('friendships')
      .select('user_id_2')
      .eq('user_id_1', user.id);

    const { data: rel2 } = await this._client
      .from('friendships')
      .select('user_id_1')
      .eq('user_id_2', user.id);

    const excludedIds = new Set<string>();
    excludedIds.add(user.id);

    rel1?.forEach((r: any) => excludedIds.add(r.user_id_2));
    rel2?.forEach((r: any) => excludedIds.add(r.user_id_1));

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

    const { error } = await this._client
      .from('friendships')
      .insert({
        user_id_1: user.id,
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

    const { data, error } = await this._client
      .from('friendships')
      .select('id, user_id_1, status, created_at')
      .eq('user_id_2', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const senderIds = data.map((r: any) => r.user_id_1);
    const { data: profiles, error: profileError } = await this._client
      .from('profiles')
      .select('*')
      .in('id', senderIds);

    if (profileError) {
      console.error('Error fetching sender profiles:', profileError);
      return [];
    }

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

  async getFriends() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: f1, error: e1 } = await this._client
      .from('friendships')
      .select('user_id_2')
      .eq('user_id_1', user.id)
      .eq('status', 'accepted');

    if (e1) console.error('Error fetching friendships (1):', e1);

    const { data: f2, error: e2 } = await this._client
      .from('friendships')
      .select('user_id_1')
      .eq('user_id_2', user.id)
      .eq('status', 'accepted');

    if (e2) console.error('Error fetching friendships (2):', e2);

    const friendIds = new Set<string>();
    f1?.forEach((f: any) => friendIds.add(f.user_id_2));
    f2?.forEach((f: any) => friendIds.add(f.user_id_1));

    if (friendIds.size === 0) return [];

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

  async getFriendsCount(userId: string): Promise<number> {
    const { count, error } = await this._client
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted');
  
    if (error) {
      console.error('Error counting friends:', error);
      return 0;
    }
    return count || 0;
  }

  async getChatRooms() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: myParticipants, error: partError } = await this._client
      .from('chat_room_participants')
      .select('room_id')
      .eq('participant', user.id);

    if (partError) {
      console.error('getChatRooms: Error fetching participants', partError);
      return [];
    }

    const participants = myParticipants as any[] || [];
    const roomIds = participants.map(p => p.room_id);

    if (roomIds.length === 0) {
      return [];
    }

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

    const rooms = roomsData as any[] || [];

    const allParticipantIds = new Set<string>();
    rooms.forEach((room) => {
      if (Array.isArray(room.chat_room_participants)) {
        room.chat_room_participants.forEach((p: any) => allParticipantIds.add(p.participant));
      }
    });

    const { data: profiles } = await this._client
      .from('profiles')
      .select('*')
      .in('id', Array.from(allParticipantIds));

    const profileMap = new Map((profiles as any[])?.map(p => [p.id, p]));

    const enrichedRooms = await Promise.all(rooms.map(async (room) => {
      let name = 'Unknown Chat';
      let avatarUrl = undefined;

      const participants = room.chat_room_participants as any[];
      const otherPart = participants.find((p) => p.participant !== user.id);

      if (otherPart) {
        const profile = profileMap.get(otherPart.participant);
        if (profile) {
          name = profile.full_name || profile.username || 'Unknown';
          avatarUrl = profile.avatar_url;
        }
      }

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

    const { data: myRooms } = await this._client
      .from('chat_room_participants')
      .select('room_id')
      .eq('participant', user.id);

    const myRoomIds = myRooms?.map((r: any) => r.room_id) || [];

    if (myRoomIds.length > 0) {
      const { data: commonRooms } = await this._client
        .from('chat_room_participants')
        .select('room_id')
        .in('room_id', myRoomIds)
        .eq('participant', friendId);

      if (commonRooms && commonRooms.length > 0) {
        for (const room of commonRooms) {
          const { count } = await this._client
            .from('chat_room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.room_id);

          if (count === 2) {
            return room.room_id;
          }
        }
      }
    }

    const { data: newRoom, error: roomError } = await this._client
      .from('chat_rooms')
      .insert({
        name: 'Direct Chat',
        creator: user.id
      })
      .select()
      .single();

    if (roomError) throw roomError;

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

    const { data: newRoom, error: roomError } = await this._client
      .from('chat_rooms')
      .insert({
        name: name,
        creator: user.id
      })
      .select()
      .single();

    if (roomError) throw roomError;

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

  async markRoomRead(roomId: string) {
    const user = await this.getCurrentUser();
    if (!user) return;

    await this._client
      .from('chat_room_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('participant', user.id);
  }

  async getUnreadChats() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: myPart } = await this._client
      .from('chat_room_participants')
      .select('room_id, last_read_at')
      .eq('participant', user.id);

    if (!myPart || myPart.length === 0) return [];

    const updates = [];

    for (const p of myPart) {
      const lastRead = p.last_read_at || '1970-01-01T00:00:00Z';

      const { count, error } = await this._client
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room', p.room_id)
        .gt('created_at', lastRead)
        .neq('sender', user.id);

      if (error) console.error('Error counting messages', error);

      if (count && count > 0) {
        const { data: room } = await this._client
          .from('chat_rooms')
          .select('name')
          .eq('id', p.room_id)
          .single();

        updates.push({
          type: 'MESSAGE',
          roomId: p.room_id,
          count: count,
          roomName: room?.name || 'Chat'
        });
      }
    }
    return updates;
  }

  async getUpcomingLikedActivities() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: swipes } = await this._client
      .from('activity_swipes')
      .select('swipe')
      .eq('user_id', user.id)
      .eq('liked', true);

    if (!swipes || swipes.length === 0) return [];
    const ids = swipes.map((s: any) => s.swipe);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: activities } = await this._client
      .from('activities')
      .select('*')
      .in('id', ids)
      .gt('activity_date', now.toISOString())
      .lt('activity_date', tomorrow.toISOString());

    return activities || [];
  }

  async getUpcomingSavedActivities() {
    const all = await this.getSavedActivities();
    const now = new Date();
    return all.filter((e: any) => new Date(e.activity_date || e.date) > now);
  }

  async getPastSavedActivities() {
    const all = await this.getSavedActivities();
    const now = new Date();
    return all.filter((e: any) => new Date(e.activity_date || e.date) < now);
  }

  async getPopularLikedActivities() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: swipes } = await this._client
      .from('activity_swipes')
      .select('swipe')
      .eq('user_id', user.id)
      .eq('liked', true);

    if (!swipes || swipes.length === 0) return [];
    const ids = swipes.map((s: any) => s.swipe);

    const { data: activities } = await this._client
      .from('activities')
      .select('*')
      .in('id', ids);

    if (!activities) return [];

    const popular = [];

    for (const act of activities) {
      const { count } = await this._client
        .from('activity_swipes')
        .select('*', { count: 'exact', head: true })
        .eq('swipe', act.id)
        .eq('liked', true);

      if (count && count >= (act.min_participants || 2)) {
        popular.push({ ...act, current_likes: count });
      }
    }

    return popular;
  }

  async toggleActivityStar(activityId: string, isStarred: boolean) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await this._client
      .from('activity_swipes')
      .update({ starred: isStarred }) 
      .eq('user_id', user.id)
      .eq('swipe', activityId);

    if (error) {
      console.error('Error updating star status:', error);
      throw error;
    }
  }

  async getParticipantCount(activityId: string): Promise<number> {
    const { data, error } = await this._client.rpc('get_total_participant_count', {
      activity_uuid: activityId
    });

    if (error) {
      console.error('Error fetching participant count:', error);
      return 0;
    }
    
    return data || 0;
  }

  async removeSavedActivity(activityId: string) {
    const user = await this.getCurrentUser();
    if (!user) return;

    const { error } = await this._client
      .from('activity_swipes')
      .delete()
      .eq('user_id', user.id)
      .eq('swipe', activityId);

    if (error) {
      console.error('Error removing saved activity:', error);
      throw error;
    }
  }
}
