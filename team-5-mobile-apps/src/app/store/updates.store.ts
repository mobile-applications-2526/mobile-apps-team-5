import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from '../services/supabase.service';

export interface UpdateItem {
  id: string;
  type: 'FRIEND_REQUEST' | 'MESSAGE' | 'EVENT_REMINDER' | 'EVENT_POPULAR' | 'ACTIVITY_CONFIRMATION';
  title: string;
  description: string;
  timestamp: string;
  data: any;
  icon?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpdatesStore {
  private _updates = new BehaviorSubject<UpdateItem[]>([]);
  readonly updates$ = this._updates.asObservable();

  private _loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading.asObservable();

  constructor(private supabase: SupabaseService) { }

  async loadUpdates() {
    this._loading.next(true);

    try {
      const [
        friendRequests,
        unreadChats,
        upcomingEvents,
        popularEvents,
        confirmations
      ] = await Promise.all([
        this.supabase.getFriendRequests(),
        this.supabase.getUnreadChats(),
        this.supabase.getUpcomingLikedActivities(),
        this.supabase.getPopularLikedActivities(),
        this.supabase.getActivitiesForConfirmation()
      ]);

      const items: UpdateItem[] = [];

      friendRequests.forEach((req: any) => {
        items.push({
          id: `req_${req.id}`,
          type: 'FRIEND_REQUEST',
          title: 'New Friend Request',
          description: `${req.sender?.full_name || 'Someone'} wants to be friends.`,
          timestamp: req.created_at || new Date().toISOString(),
          data: { requestId: req.id, userId: req.sender?.id },
          icon: 'person-add',
          color: 'primary'
        });
      });

      unreadChats.forEach((chat: any) => {
        items.push({
          id: `msg_${chat.roomId}`,
          type: 'MESSAGE',
          title: chat.roomName || 'New Messages',
          description: `You have ${chat.count} unread messages.`,
          timestamp: new Date().toISOString(),
          data: { roomId: chat.roomId },
          icon: 'chatbubbles',
          color: 'success'
        });
      });

      upcomingEvents.forEach((act: any) => {
        items.push({
          id: `event_up_${act.id}`,
          type: 'EVENT_REMINDER',
          title: 'Event Reminder',
          description: `"${act.name}" is happening soon!`,
          timestamp: act.activity_date,
          data: { activityId: act.id },
          icon: 'time',
          color: 'warning'
        });
      });

      popularEvents.forEach((act: any) => {
        items.push({
          id: `event_pop_${act.id}`,
          type: 'EVENT_POPULAR',
          title: 'Event Trending',
          description: `"${act.name}" has reached ${act.current_likes} interested people!`,
          timestamp: new Date().toISOString(),
          data: { activityId: act.id },
          icon: 'flame',
          color: 'danger'
        });
      });

      confirmations.forEach((act: any) => {
        items.push({
          id: `confirm_${act.id}`,
          type: 'ACTIVITY_CONFIRMATION',
          title: 'Confirm Participation',
          description: `"${act.name}" is ready! Confirm to join the group chat.`,
          timestamp: new Date().toISOString(),
          data: { activityId: act.id },
          icon: 'checkmark-circle',
          color: 'secondary'
        });
      });

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this._updates.next(items);

    } catch (e) {
      console.error('Error loading updates:', e);
    } finally {
      this._loading.next(false);
    }
  }
}
