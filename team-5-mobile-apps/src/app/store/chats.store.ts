import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatService } from '../services/chat.service';

export interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatsStore {
  private _chats$ = new BehaviorSubject<ChatItem[]>([]);
  readonly chats$ = this._chats$.asObservable();

  constructor(private chatService: ChatService) { }

  get snapshot() {
    return this._chats$.getValue();
  }

  async loadChats() {
    const rooms = await this.chatService.getChatRooms();
    const chats: ChatItem[] = rooms.map((r: any) => ({
      id: r.id,
      name: r.name,
      lastMessage: r.lastMessage,
      time: r.time,
      unread: r.unread,
      avatarUrl: r.avatarUrl
    }));
    this._chats$.next(chats);
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
