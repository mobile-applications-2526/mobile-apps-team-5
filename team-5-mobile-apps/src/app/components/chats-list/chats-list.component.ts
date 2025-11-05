import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { chatsStore, ChatItem } from '../../store/chats.store';

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './chats-list.component.html',
  styleUrls: ['./chats-list.component.scss'],
})
export class ChatsListComponent {
  @Input() activeSegment: string = 'chats';
  chats$: Observable<ChatItem[]> = chatsStore.chats$;

  trackById(_: number, item: ChatItem) {
    return item.id;
  }

  initials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }

  markRead(id: string) {
    chatsStore.markRead(id);
  }
}
