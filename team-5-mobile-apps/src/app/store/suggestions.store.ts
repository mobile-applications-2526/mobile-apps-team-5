import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { FriendService } from '../services/friend.service';

export interface Suggestion {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: 's1', name: 'Olivia Johnson' },
  { id: 's2', name: 'Liam Davis' },
  { id: 's3', name: 'Matteo Bianchi' },
  { id: 's4', name: 'Aiko Suzuki' },
  { id: 's5', name: 'Jihoon Park' },
  { id: 's6', name: 'Dilan Baran' },
  { id: 's7', name: 'Amina Abd' },
];

@Injectable({ providedIn: 'root' })
export class SuggestionsStore {
  private _suggestions$ = new BehaviorSubject<Suggestion[]>([]);
  readonly suggestions$ = this._suggestions$.asObservable();

  constructor(
    private profileService: ProfileService,
    private friendService: FriendService
  ) { }

  get snapshot() {
    return this._suggestions$.getValue();
  }

  async loadSuggestions() {
    const profiles = await this.profileService.getAllProfiles();
    const suggestions: Suggestion[] = profiles.map((p: any) => ({
      id: p.id,
      name: p.full_name || p.username,
      avatarUrl: p.avatar_url
    }));
    this._suggestions$.next(suggestions);
  }

  async sendRequest(userId: string) {
    await this.friendService.sendFriendRequest(userId);
    this.remove(userId);
  }

  remove(id: string) {
    this._suggestions$.next(this.snapshot.filter((s) => s.id !== id));
  }

  addSuggestion(s: Suggestion) {
    this._suggestions$.next([s, ...this.snapshot]);
  }
}
