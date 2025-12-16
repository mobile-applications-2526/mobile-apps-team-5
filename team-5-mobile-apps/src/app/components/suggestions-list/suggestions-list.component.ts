import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { SuggestionsStore, Suggestion } from '../../store/suggestions.store';
import { RequestsStore, FriendRequest } from '../../store/requests.store';

@Component({
  selector: 'app-suggestions-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './suggestions-list.component.html',
  styleUrls: ['./suggestions-list.component.scss'],
})
export class SuggestionsListComponent {
  @Input() activeSegment: string = 'add';
  suggestions$: Observable<Suggestion[]>;
  requests$: Observable<FriendRequest[]>;

  constructor(
    public suggestionsStore: SuggestionsStore,
    public requestsStore: RequestsStore
  ) {
    this.suggestions$ = this.suggestionsStore.suggestions$;
    this.requests$ = this.requestsStore.requests$;
  }

  add(id: string, name: string) {
    this.suggestionsStore.sendRequest(id);
  }

  accept(id: string) {
    this.requestsStore.acceptRequest(id);
  }

  initials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
}
