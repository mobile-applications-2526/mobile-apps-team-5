import { BehaviorSubject } from 'rxjs';

export interface Friend {
  id: string;
  name: string;
  lastMessage?: string;
  lastSeen?: string; // e.g. '11:53', 'Yesterday'
  unread?: number;
  avatarUrl?: string | null;
}

const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Anna Kowalska', lastMessage: 'See you on friday!', lastSeen: '11:53', unread: 0 },
  { id: '2', name: 'Viktor Petrov', lastMessage: 'Supporting line text lorem ipsum…', lastSeen: '10:27', unread: 0 },
  { id: '3', name: 'Samuel Otieno', lastMessage: 'Supporting line text lorem ipsum…', lastSeen: 'Yesterday', unread: 0 },
  { id: '4', name: 'Alice Morgan', lastMessage: 'Supporting line text lorem ipsum…', lastSeen: 'Wednesday', unread: 0 },
  { id: '5', name: 'List item', lastMessage: 'Supporting line text lorem ipsum…', lastSeen: '11/10/25', unread: 0 },
  { id: '6', name: 'List item', lastMessage: 'Supporting line text lorem ipsum…', lastSeen: '09/10/25', unread: 0 },
];

export class FriendsStore {
  private _friends$ = new BehaviorSubject<Friend[]>(MOCK_FRIENDS);
  readonly friends$ = this._friends$.asObservable();

  get snapshot() {
    return this._friends$.getValue();
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

export const friendsStore = new FriendsStore();
