import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UpdateType = 'friend_request' | 'friend_accept' | 'joined_activity' | 'activity_on';

export interface UpdateItem {
  id: string;
  type: UpdateType;
  actorName: string;
  actorInitials?: string;
  message: string;
  date: string; // ISO
  read?: boolean;
  avatar?: string; // optional image url
}

@Injectable({ providedIn: 'root' })
export class UpdatesStore {
  private _items = new BehaviorSubject<UpdateItem[]>([]);
  readonly items$: Observable<UpdateItem[]> = this._items.asObservable();

  constructor() {
    const now = Date.now();
    const mock: UpdateItem[] = [
      {
        id: 'u1',
        type: 'friend_request',
        actorName: 'Anna Kowalska',
        actorInitials: 'AK',
        message: 'sent a friend request',
        date: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        read: false,
      },
      {
        id: 'u2',
        type: 'joined_activity',
        actorName: 'Wei Zhang',
        actorInitials: 'WZ',
        message: "just joined your activity Hiking in Ardenne",
        date: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        read: false,
      },
      {
        id: 'u3',
        type: 'activity_on',
        actorName: 'System',
        message: "Your activity is on! Enough people have joined — get ready for Dinner at Sarah's.",
        date: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
        read: false,
        avatar: 'https://picsum.photos/seed/dinner/80/80',
      },
      {
        id: 'u4',
        type: 'friend_accept',
        actorName: 'Elias Andersson',
        actorInitials: 'EA',
        message: 'accepted your friend request',
        date: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
        read: true,
      },
    ];
    this._items.next(mock);
  }

  markRead(id: string) {
    this._items.next(this._items.value.map((it) => (it.id === id ? { ...it, read: true } : it)));
  }

  remove(id: string) {
    this._items.next(this._items.value.filter((it) => it.id !== id));
  }

  markAllRead() {
    this._items.next(this._items.value.map((it) => ({ ...it, read: true })));
  }
}
