import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ActivityService {
    constructor(private supabase: SupabaseService) { }

    async uploadActivityImage(file: File): Promise<string> {
        if (!file) return '';

        const filePath = `public/${Date.now()}-${file.name}`;
        const bucket = 'activity_images';

        const { error: uploadError } = await this.supabase.client.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            throw new Error('Image upload failed: ' + uploadError.message);
        }

        const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(filePath);

        return data.publicUrl;
    }

    async createActivity(formValues: any) {
        const user = await this.supabase.getCurrentUser();
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

        const { error } = await this.supabase.client
            .from('activities')
            .insert(newActivity);

        if (error) {
            console.error('Supabase Create Error:', error);
            throw error;
        }
    }

    async unrecordSwipe(activityId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) return;

        const { error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: mySwipes, error: swipeError } = await this.supabase.client
            .from('activity_swipes')
            .select('swipe')
            .eq('user_id', user.id);

        if (swipeError) {
            console.error('Error fetching history:', swipeError);
            return [];
        }

        const swipedIds = mySwipes.map((row: any) => row.swipe);

        let query = this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: swipes, error: swipeError } = await this.supabase.client
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

        const { data: activities, error: actError } = await this.supabase.client
            .from('activities')
            .select('*, interest (name)')
            .in('id', likedIds);

        if (actError) {
            console.error('Error fetching activities:', actError);
            return [];
        }

        return activities || [];
    }

    async recordSwipe(activityId: string, liked: boolean) {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await this.supabase.client
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

    async getUpcomingLikedActivities() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: swipes } = await this.supabase.client
            .from('activity_swipes')
            .select('swipe')
            .eq('user_id', user.id)
            .eq('liked', true);

        if (!swipes || swipes.length === 0) return [];
        const ids = swipes.map((s: any) => s.swipe);

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: activities } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: swipes } = await this.supabase.client
            .from('activity_swipes')
            .select('swipe')
            .eq('user_id', user.id)
            .eq('liked', true);

        if (!swipes || swipes.length === 0) return [];
        const ids = swipes.map((s: any) => s.swipe);

        const { data: activities } = await this.supabase.client
            .from('activities')
            .select('*')
            .in('id', ids);

        if (!activities) return [];

        const popular = [];

        for (const act of activities) {
            const { count } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await this.supabase.client
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
        const { data, error } = await this.supabase.client.rpc('get_total_participant_count', {
            activity_uuid: activityId
        });

        if (error) {
            console.error('Error fetching participant count:', error);
            return 0;
        }

        return data || 0;
    }

    async removeSavedActivity(activityId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) return;

        const { error } = await this.supabase.client
            .from('activity_swipes')
            .delete()
            .eq('user_id', user.id)
            .eq('swipe', activityId);

        if (error) {
            console.error('Error removing saved activity:', error);
            throw error;
        }
    }

    async getActivitiesForConfirmation() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: swipes, error: swipeError } = await this.supabase.client
            .from('activity_swipes')
            .select('swipe')
            .eq('user_id', user.id)
            .eq('liked', true)
            .or('confirmed.is.null,confirmed.eq.false');

        if (swipeError) {
            console.error('Error fetching unconfirmed swipes:', swipeError);
            return [];
        }

        if (!swipes || swipes.length === 0) return [];
        const activityIds = swipes.map((s: any) => s.swipe);

        const { data: activities, error: actError } = await this.supabase.client
            .from('activities')
            .select('*')
            .in('id', activityIds);

        if (actError) {
            console.error('Error fetching activities for confirmation:', actError);
            return [];
        }

        if (!activities || activities.length === 0) return [];

        const readyToConfirm = [];

        for (const act of activities) {
            const count = await this.getParticipantCount(act.id);
            if (count >= (act.min_participants || 2)) {
                readyToConfirm.push(act);
            }
        }

        return readyToConfirm;
    }

    async confirmActivityParticipation(activityId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error: updateError } = await this.supabase.client
            .from('activity_swipes')
            .update({ confirmed: true })
            .eq('user_id', user.id)
            .eq('swipe', activityId);

        if (updateError) throw updateError;

        const { count: confirmedCount, error: countError } = await this.supabase.client
            .from('activity_swipes')
            .select('*', { count: 'exact', head: true })
            .eq('swipe', activityId)
            .eq('confirmed', true);

        if (countError) {
            console.error('Error counting confirmed participants:', countError);
            return;
        }

        const { data: activity } = await this.supabase.client
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();

        if (!activity) return;

        if ((confirmedCount || 0) >= (activity.min_participants || 2)) {

            const { data: existingRoom } = await this.supabase.client
                .from('chat_rooms')
                .select('*')
                .eq('activity_id', activityId)
                .single();

            if (existingRoom) {
                const { error: joinError } = await this.supabase.client
                    .from('chat_room_participants')
                    .insert({
                        room_id: existingRoom.id,
                        participant: user.id
                    });
                if (joinError && joinError.code !== '23505') {
                    console.error('Error joining activity chat:', joinError);
                }

            } else {
                const { data: confirmedSwipes } = await this.supabase.client
                    .from('activity_swipes')
                    .select('user_id')
                    .eq('swipe', activityId)
                    .eq('confirmed', true);

                if (confirmedSwipes && confirmedSwipes.length > 0) {
                    const participantIds = confirmedSwipes.map((s: any) => s.user_id);

                    const { data: newRoom, error: createError } = await this.supabase.client
                        .from('chat_rooms')
                        .insert({
                            name: `${activity.name} chat`,
                            creator: user.id,
                            activity_id: activityId
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating activity chat:', createError);
                        return;
                    }

                    const participantsData = participantIds.map((uid: string) => ({
                        room_id: newRoom.id,
                        participant: uid
                    }));

                    const { error: partError } = await this.supabase.client
                        .from('chat_room_participants')
                        .insert(participantsData);

                    if (partError) console.error('Error adding participants to activity chat:', partError);
                }
            }
        }
    }
}
