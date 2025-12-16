import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
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
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, SavedEventComponent],
  providers: [DatePipe],
})
export class SavedPage implements OnInit, OnDestroy {
  saved: any[] = [];
  sub?: Subscription;

  constructor(public store: SavedStore) { }

  ngOnInit() {
    this.sub = this.store.saved$.subscribe((s) => (this.saved = s));
  }

  ionViewWillEnter() {
    this.store.refresh();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
