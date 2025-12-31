import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventModel } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventStore {
  private _events = new BehaviorSubject<EventModel[]>([]);
  readonly events$: Observable<EventModel[]> = this._events.asObservable();

  constructor() {
  }

  remove(id: string) {
    const next = this._events.value.filter((e) => e.id !== id);
    this._events.next(next);
  }

  like(id: string) {
    this.remove(id);
  }

  dislike(id: string) {
    this.remove(id);
  }
}
