import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { UpdatesStore, UpdateItem } from '../../store/updates.store';

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

  constructor(private store: UpdatesStore) {}

  ngOnInit() {
    this.sub = this.store.items$.subscribe((s) => (this.items = s));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  markRead(item: UpdateItem) {
    if (!item.read) this.store.markRead(item.id);
  }

  remove(item: UpdateItem) {
    this.store.remove(item.id);
  }

  trackById(_: number, item: UpdateItem) {
    return item.id;
  }
}
