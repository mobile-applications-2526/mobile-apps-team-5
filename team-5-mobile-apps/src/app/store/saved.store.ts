import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventModel } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class SavedStore {
  private _saved = new BehaviorSubject<EventModel[]>([]);
  readonly saved$: Observable<EventModel[]> = this._saved.asObservable();

  constructor() {
    // seed with mock saved/liked events for the Saved tab
    const mock: EventModel[] = [
      {
        id: 's1',
        name: "Dinner at Sarah's",
        category: 'other',
        description: 'Casual dinner meetup. Bring a plate to share and meet new people.',
        minParticipants: 9,
        maxParticipants: 15,
        date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/dinner/400/300',
        location: 'Leuven',
        friendsInterested: 2,
        starred: false,
      },
      {
        id: 's2',
        name: 'Game night',
        category: 'entertainment',
        description: 'Board and video games at a cosy spot. Snacks provided.',
        minParticipants: 4,
        maxParticipants: 5,
        date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/game/400/300',
        location: 'Heverlee',
        friendsInterested: 0,
        starred: true,
      },
    ];
    this._saved.next(mock);
  }

  add(ev: EventModel) {
    const current = this._saved.value;
    if (!current.find((e) => e.id === ev.id)) {
      this._saved.next([ev, ...current]);
    }
  }

  remove(id: string) {
    this._saved.next(this._saved.value.filter((e) => e.id !== id));
  }

  toggle(ev: EventModel) {
    const exists = this._saved.value.find((e) => e.id === ev.id);
    if (exists) this.remove(ev.id);
    else this.add(ev);
  }
}
