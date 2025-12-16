import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export interface Friend {
  id: string;
  name: string;
  lastMessage?: string;
  lastSeen?: string; // e.g. '11:53', 'Yesterday'
  unread?: number;
  avatarUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FriendsStore {
  private _friends$ = new BehaviorSubject<Friend[]>([]);
  readonly friends$ = this._friends$.asObservable();

  constructor(private supabase: SupabaseService) { }

  get snapshot() {
    return this._friends$.getValue();
  }

  async loadFriends() {
    const profiles = await this.supabase.getFriends();
    const friends: Friend[] = profiles.map((p: any) => ({
      id: p.id,
      name: p.full_name || p.username,
      lastMessage: '',
      lastSeen: '',
      unread: 0,
      avatarUrl: p.avatar_url
    }));
    this._friends$.next(friends);
  }

  add(friend: Friend) {
    const next = [friend, ...this.snapshot];
    this._friends$.next(next);
  }

  remove(id: string) {
    const next = this.snapshot.filter((f) => f.id !== id);
    this._friends$.next(next);
  }

  update(id: string, patch: Partial<Friend>) {
    const next = this.snapshot.map((f) => (f.id === id ? { ...f, ...patch } : f));
    this._friends$.next(next);
  }
}
