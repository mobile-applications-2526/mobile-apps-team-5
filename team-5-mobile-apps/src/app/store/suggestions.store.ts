import { BehaviorSubject } from 'rxjs';

export interface Suggestion {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: 's1', name: 'Olivia Johnson' },
  { id: 's2', name: 'Liam Davis' },
  { id: 's3', name: 'Matteo Bianchi' },
  { id: 's4', name: 'Aiko Suzuki' },
  { id: 's5', name: 'Jihoon Park' },
  { id: 's6', name: 'Dilan Baran' },
  { id: 's7', name: 'Amina Abd' },
];

export class SuggestionsStore {
  private _suggestions$ = new BehaviorSubject<Suggestion[]>(MOCK_SUGGESTIONS);
  readonly suggestions$ = this._suggestions$.asObservable();

  get snapshot() {
    return this._suggestions$.getValue();
  }

  remove(id: string) {
    this._suggestions$.next(this.snapshot.filter((s) => s.id !== id));
  }

  addSuggestion(s: Suggestion) {
    this._suggestions$.next([s, ...this.snapshot]);
  }
}

export const suggestionsStore = new SuggestionsStore();
