import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { SavedStore } from '../../store/saved.store';
import { Subscription } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { SavedEventComponent } from '../../components/saved-event/saved-event.component';

@Component({
  selector: 'app-saved',
  standalone: true,
  templateUrl: 'saved.page.html',
  styleUrls: ['saved.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, SavedEventComponent, IonSegment, IonSegmentButton, IonLabel],
  providers: [DatePipe],
})
export class SavedPage implements OnInit, OnDestroy {
  allSaved: any[] = [];
  saved: any[] = [];
  sub?: Subscription;
  filterType: 'all' | 'upcoming' | 'past' = 'all';

  constructor(public store: SavedStore) { }

  ngOnInit() {
    this.sub = this.store.saved$.subscribe((s) => {
      this.allSaved = s;
      this.applyFilter();
    });
  }

  ionViewWillEnter() {
    this.store.refresh();
  }

  segmentChanged(ev: any) {
    this.filterType = ev.detail.value;
    this.applyFilter();
  }

  applyFilter() {
    const now = new Date();
    let result = [...this.allSaved];

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    if (this.filterType === 'upcoming') {
      result = result.filter(a => new Date(a.date).getTime() >= now.getTime());
    } else if (this.filterType === 'past') {
      result = result.filter(a => new Date(a.date).getTime() < now.getTime());
    }

    this.saved = result;
  }

  onItemRemoved(deletedId: string) {
    this.allSaved = this.allSaved.filter(activity => activity.id !== deletedId);
    this.applyFilter();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
