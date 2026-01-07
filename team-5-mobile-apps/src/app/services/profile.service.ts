import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    constructor(private supabase: SupabaseService) { }

    async getProfile() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return null;

        const { data, error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();

        if (!user) {
            throw new Error('User not logged in');
        }

        const fullName = `${firstName} ${lastName}`.trim();
        const randomUsername = firstName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 10000);
        const { error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await this.supabase.client
            .from('profiles')
            .update(profileData)
            .eq('id', user.id);

        if (error) throw error;
    }

    async getAllProfiles() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: rel1 } = await this.supabase.client
            .from('friendships')
            .select('user_id_2')
            .eq('user_id_1', user.id);

        const { data: rel2 } = await this.supabase.client
            .from('friendships')
            .select('user_id_1')
            .eq('user_id_2', user.id);

        const excludedIds = new Set<string>();
        excludedIds.add(user.id);

        rel1?.forEach((r: any) => excludedIds.add(r.user_id_2));
        rel2?.forEach((r: any) => excludedIds.add(r.user_id_1));

        const { data, error } = await this.supabase.client
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
}
