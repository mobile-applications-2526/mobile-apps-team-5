import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/Header/header.componet';
import { FriendsListComponent } from '../../components/friends-list/friends-list.component';
import { ChatsListComponent } from '../../components/chats-list/chats-list.component';
import { SuggestionsListComponent } from '../../components/suggestions-list/suggestions-list.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  templateUrl: 'friends.page.html',
  styleUrls: ['friends.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonIcon, FormsModule, HeaderComponent, FriendsListComponent, ChatsListComponent, SuggestionsListComponent],
})
export class FriendsPage {
  segment: 'friends' | 'chats' | 'add' = 'friends';

  constructor() {}
}
