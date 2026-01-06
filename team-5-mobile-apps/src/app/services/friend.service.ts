import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class FriendService {
    constructor(private supabase: SupabaseService) { }

    async sendFriendRequest(targetUserId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase.client
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
        const { data: profiles, error: profileError } = await this.supabase.client
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
        const { error } = await this.supabase.client
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);

        if (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    async getFriends() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: f1, error: e1 } = await this.supabase.client
            .from('friendships')
            .select('user_id_2')
            .eq('user_id_1', user.id)
            .eq('status', 'accepted');

        if (e1) console.error('Error fetching friendships (1):', e1);

        const { data: f2, error: e2 } = await this.supabase.client
            .from('friendships')
            .select('user_id_1')
            .eq('user_id_2', user.id)
            .eq('status', 'accepted');

        if (e2) console.error('Error fetching friendships (2):', e2);

        const friendIds = new Set<string>();
        f1?.forEach((f: any) => friendIds.add(f.user_id_2));
        f2?.forEach((f: any) => friendIds.add(f.user_id_1));

        if (friendIds.size === 0) return [];

        const { data: profiles, error } = await this.supabase.client
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
        const { count, error } = await this.supabase.client
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

    async getMutualFriendsCount(activityId: string): Promise<number> {
        const user = await this.supabase.getCurrentUser();
        if (!user) return 0;

        const { data, error } = await this.supabase.client.rpc('get_mutual_friends_count', {
            activity_uuid: activityId,
            current_user_uuid: user.id
        });

        if (error) {
            console.error('Error fetching mutual friends:', error);
            return 0;
        }
        return data || 0;
    }
}
