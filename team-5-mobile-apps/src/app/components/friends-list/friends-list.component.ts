import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { friendsStore, Friend } from '../../store/friends.store';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './friends-list.component.html',
  styleUrls: ['./friends-list.component.scss'],
})
export class FriendsListComponent {
  @Input() activeSegment: string = 'friends';

  friends$: Observable<Friend[]> = friendsStore.friends$;

  trackById(_: number, item: Friend) {
    return item.id;
  }

  initials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
}
