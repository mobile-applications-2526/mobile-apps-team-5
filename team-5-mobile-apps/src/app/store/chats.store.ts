import { BehaviorSubject } from 'rxjs';

export interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string; // '11:53', 'Yesterday', etc.
  unread?: number;
}

const MOCK_CHATS: ChatItem[] = [
  { id: '1', name: 'Anna Kowalska', lastMessage: 'See you on friday!', time: '11:53', unread: 0 },
  { id: '2', name: 'Viktor Petrov', lastMessage: 'Supporting line text lorem ipsum…', time: '10:27', unread: 0 },
  { id: '3', name: 'Samuel Otieno', lastMessage: 'Supporting line text lorem ipsum…', time: 'Yesterday', unread: 0 },
  { id: '4', name: 'Alice Morgan', lastMessage: 'Supporting line text lorem ipsum…', time: 'Wednesday', unread: 0 },
  { id: '5', name: 'List item', lastMessage: 'Supporting line text lorem ipsum…', time: '11/10/25', unread: 0 },
  { id: '6', name: 'List item', lastMessage: 'Supporting line text lorem ipsum…', time: '09/10/25', unread: 0 },
];

export class ChatsStore {
  private _chats$ = new BehaviorSubject<ChatItem[]>(MOCK_CHATS);
  readonly chats$ = this._chats$.asObservable();

  get snapshot() {
    return this._chats$.getValue();
  }

  add(chat: ChatItem) {
    this._chats$.next([chat, ...this.snapshot]);
  }

  remove(id: string) {
    this._chats$.next(this.snapshot.filter((c) => c.id !== id));
  }

  markRead(id: string) {
    this._chats$.next(this.snapshot.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }
}

export const chatsStore = new ChatsStore();
