import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UpdatesStore, UpdateItem } from '../../store/updates.store';
import { addIcons } from 'ionicons';
import { personAdd, chatbubbles, time, flame, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-updates-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './updates-list.component.html',
  styleUrls: ['./updates-list.component.scss'],
})
export class UpdatesListComponent implements OnInit, OnDestroy {
  items: UpdateItem[] = [];
  sub?: Subscription;

  constructor(
    private store: UpdatesStore,
    private router: Router
  ) {
    addIcons({ personAdd, chatbubbles, time, flame, closeCircle });
  }

  ngOnInit() {
    this.sub = this.store.updates$.subscribe((s) => (this.items = s));
    this.store.loadUpdates();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  handleItemClick(item: UpdateItem) {
    if (item.type === 'MESSAGE') {
      this.router.navigate(['/chats', item.data.roomId]);
    } else if (item.type === 'FRIEND_REQUEST') {
      this.router.navigate(['/tabs/friends'], { queryParams: { segment: 'add' } });
    } else if (item.type === 'EVENT_REMINDER' || item.type === 'EVENT_POPULAR') {
      this.router.navigate(['/tabs/saved']);
    }
  }

  trackById(_: number, item: UpdateItem) {
    return item.id;
  }
}
