import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { EventSwipeComponent } from '../../components/event-swipe/event-swipe.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explore',
  standalone: true,
  templateUrl: 'explore.page.html',
  styleUrls: ['explore.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, EventSwipeComponent],
})
export class ExplorePage {
  constructor() {}
}
