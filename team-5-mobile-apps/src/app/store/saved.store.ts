import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class SavedStore {
  private _saved = new BehaviorSubject<any[]>([]);
  readonly saved$: Observable<any[]> = this._saved.asObservable();

  constructor(private supabase: SupabaseService) {
    this.load();
  }

  async load() {
    try {
      const activities = await this.supabase.getSavedActivities();
      const saved = activities.map((a: any) => ({
        id: a.id,
        name: a.name,
        category: a.interest?.name || 'other',
        description: a.description,
        minParticipants: a.min_participants,
        maxParticipants: a.max_participants,
        date: a.activity_date,
        image: a.image_url || 'https://picsum.photos/seed/default/400/300',
        location: a.location,
        friendsInterested: 0,
        starred: true,
      }));
      this._saved.next(saved);
    } catch (e) {
      console.error('Failed to load saved activities', e);
    }
  }

  refresh() {
    this.load();
  }

  async remove(id: string) {
    try {
      await this.supabase.unrecordSwipe(id);
      this._saved.next(this._saved.value.filter(e => e.id !== id));
    } catch (e) {
      console.error('Failed to remove saved item', e);
    }
  }
}
