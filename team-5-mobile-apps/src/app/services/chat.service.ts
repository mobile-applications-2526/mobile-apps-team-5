import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
    constructor(private supabase: SupabaseService) { }

    async getChatRooms() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: myParticipants, error: partError } = await this.supabase.client
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

        const { data: roomsData, error } = await this.supabase.client
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

        const { data: profiles } = await this.supabase.client
            .from('profiles')
            .select('*')
            .in('id', Array.from(allParticipantIds));

        const profileMap = new Map((profiles as any[])?.map(p => [p.id, p]));

        const enrichedRooms = await Promise.all(rooms.map(async (room) => {
            let name = 'Unknown Chat';
            let avatarUrl = undefined;

            if (room.name && room.name !== 'Direct Chat') {
                name = room.name;
            } else {
                const participants = room.chat_room_participants as any[];
                const otherPart = participants.find((p) => p.participant !== user.id);

                if (otherPart) {
                    const profile = profileMap.get(otherPart.participant);
                    if (profile) {
                        name = profile.full_name || profile.username || 'Unknown';
                        avatarUrl = profile.avatar_url;
                    }
                }
            }

            const { data: lastMsg } = await this.supabase.client
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
        const { data, error } = await this.supabase.client
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
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await this.supabase.client
            .from('chat_messages')
            .insert({
                room: roomId,
                sender: user.id,
                content: content
            });

        if (error) throw error;
    }

    async startDirectChat(friendId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { data: myRooms } = await this.supabase.client
            .from('chat_room_participants')
            .select('room_id')
            .eq('participant', user.id);

        const myRoomIds = myRooms?.map((r: any) => r.room_id) || [];

        if (myRoomIds.length > 0) {
            const { data: commonRooms } = await this.supabase.client
                .from('chat_room_participants')
                .select('room_id')
                .in('room_id', myRoomIds)
                .eq('participant', friendId);

            if (commonRooms && commonRooms.length > 0) {
                for (const room of commonRooms) {
                    const { count } = await this.supabase.client
                        .from('chat_room_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', room.room_id);

                    if (count === 2) {
                        return room.room_id;
                    }
                }
            }
        }

        const { data: newRoom, error: roomError } = await this.supabase.client
            .from('chat_rooms')
            .insert({
                name: 'Direct Chat',
                creator: user.id
            })
            .select()
            .single();

        if (roomError) throw roomError;

        const { error: partError } = await this.supabase.client
            .from('chat_room_participants')
            .insert([
                { room_id: newRoom.id, participant: user.id },
                { room_id: newRoom.id, participant: friendId }
            ]);

        if (partError) throw partError;

        return newRoom.id;
    }

    async createGroupChat(name: string, participantIds: string[]) {
        const user = await this.supabase.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const { data: newRoom, error: roomError } = await this.supabase.client
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

        const { error: partError } = await this.supabase.client
            .from('chat_room_participants')
            .insert(participantsData);

        if (partError) throw partError;

        return newRoom.id;
    }

    async markRoomRead(roomId: string) {
        const user = await this.supabase.getCurrentUser();
        if (!user) return;

        await this.supabase.client
            .from('chat_room_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('room_id', roomId)
            .eq('participant', user.id);
    }

    async getUnreadChats() {
        const user = await this.supabase.getCurrentUser();
        if (!user) return [];

        const { data: myPart } = await this.supabase.client
            .from('chat_room_participants')
            .select('room_id, last_read_at')
            .eq('participant', user.id);

        if (!myPart || myPart.length === 0) return [];

        const updates = [];

        for (const p of myPart) {
            const lastRead = p.last_read_at || '1970-01-01T00:00:00Z';

            const { count, error } = await this.supabase.client
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room', p.room_id)
                .gt('created_at', lastRead)
                .neq('sender', user.id);

            if (count && count > 0) {
                updates.push({ roomId: p.room_id, count });
            }
        }
        return updates;
    }
}
