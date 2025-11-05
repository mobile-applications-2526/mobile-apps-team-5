import { BehaviorSubject } from 'rxjs';

export interface Profile {
  id: string;
  name: string;
  location?: string;
  bio?: string;
  interests?: string[];
  languages?: string[];
  upcomingActivities?: { id: string; title: string; date: string; place: string }[];
  pastActivities?: { id: string; title: string; date: string; place: string }[];
  avatarUrl?: string | null;
  following?: number;
  followers?: number;
}

const MOCK_PROFILE: Profile = {
  id: 'me',
  name: 'Maria Steegmans',
  location: 'Leuven, Belgium',
  bio: '',
  interests: ['Music', 'Culture', 'Art'],
  languages: ['Dutch', 'English', 'French'],
  upcomingActivities: [
    { id: 'a1', title: 'Game night', date: 'Nov 15', place: 'Heverlee' },
  ],
  pastActivities: [
    { id: 'a2', title: 'Karaoke Night', date: 'May 12', place: 'Gent' },
  ],
  avatarUrl: null,
  following: 3,
  followers: 3,
};

export class ProfileStore {
  private _profile$ = new BehaviorSubject<Profile>(MOCK_PROFILE);
  readonly profile$ = this._profile$.asObservable();

  get snapshot() {
    return this._profile$.getValue();
  }

  update(patch: Partial<Profile>) {
    this._profile$.next({ ...this.snapshot, ...patch });
  }
}

export const profileStore = new ProfileStore();
