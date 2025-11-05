import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventModel } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventStore {
  private _events = new BehaviorSubject<EventModel[]>([]);
  readonly events$: Observable<EventModel[]> = this._events.asObservable();

  constructor() {
    // seed mock data
    const mock: EventModel[] = [
      {
        id: 'e1',
        name: 'City Football Meetup',
        category: 'sports',
        description: 'Friendly 5v5 football in the city park. All skill levels welcome.',
        minParticipants: 8,
        maxParticipants: 20,
        date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/football/800/600',
      },
      {
        id: 'e2',
        name: 'Indie Film Night',
        category: 'culture',
        description: 'Screening of local indie films followed by a Q&A with directors.',
        minParticipants: 10,
        maxParticipants: 60,
        date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/film/800/600',
      },
      {
        id: 'e3',
        name: 'Open-Air Concert',
        category: 'entertainment',
        description: 'Live bands and food trucks. Bring your friends and blankets.',
        minParticipants: 1,
        maxParticipants: 500,
        date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/concert/800/600',
      },
      {
        id: 'e4',
        name: 'House Party Saturday',
        category: 'party',
        description: 'Casual house party with music and games. BYOB.',
        minParticipants: 5,
        maxParticipants: 40,
        date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/party/800/600',
      },
      {
        id: 'e5',
        name: 'Board Games Afternoon',
        category: 'other',
        description: 'Bring your favourite board game and meet fellow game lovers.',
        minParticipants: 2,
        maxParticipants: 12,
        date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        image: 'https://picsum.photos/seed/games/800/600',
      },
    ];
    this._events.next(mock);
  }

  remove(id: string) {
    const next = this._events.value.filter((e) => e.id !== id);
    this._events.next(next);
  }

  like(id: string) {
    // For now, liking simply removes it from the queue. Hook up saved lists later.
    this.remove(id);
  }

  dislike(id: string) {
    this.remove(id);
  }
}
