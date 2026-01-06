import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class InterestService {
    constructor(private supabase: SupabaseService) { }

    async getAllInterests() {
        const { data, error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const uniqueIds = Array.from(new Set(interestIds)).filter(id => !!id);

        const { error: deleteError } = await this.supabase.client
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

            const { error: insertError } = await this.supabase.client
                .from('user_interests')
                .insert(inserts);

            if (insertError) {
                console.error('Error inserting user interests:', insertError);
                throw insertError;
            }
        }
    }
}
