import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ChatsStore, ChatItem } from '../../store/chats.store';
import { NewChatComponent } from '../new-chat/new-chat.component';

import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule, IonicModule, NewChatComponent],
  templateUrl: './chats-list.component.html',
  styleUrls: ['./chats-list.component.scss'],
})
export class ChatsListComponent {
  @Input() activeSegment: string = 'chats';
  chats$: Observable<ChatItem[]>;

  constructor(
    public chatsStore: ChatsStore,
    private router: Router,
    private modalCtrl: ModalController
  ) {
    addIcons({ add });
    this.chats$ = this.chatsStore.chats$;
  }

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
    this.chatsStore.markRead(id);
  }

  openChat(id: string) {
    this.markRead(id);
    this.router.navigate(['/chats', id]);
  }

  async openNewChat() {
    const modal = await this.modalCtrl.create({
      component: NewChatComponent
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.roomId) {
      this.router.navigate(['/chats', data.roomId]);
    }
  }
}
