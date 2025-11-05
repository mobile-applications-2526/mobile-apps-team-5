import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { suggestionsStore } from '../../store/suggestions.store';
import { friendsStore } from '../../store/friends.store';

@Component({
  selector: 'app-suggestions-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './suggestions-list.component.html',
  styleUrls: ['./suggestions-list.component.scss'],
})
export class SuggestionsListComponent {
  @Input() activeSegment: string = 'add';
  suggestions$: Observable<any[]> = suggestionsStore.suggestions$;

  add(id: string, name: string) {
    // add to friends store
    friendsStore.add({ id, name } as any);
    suggestionsStore.remove(id);
  }

  initials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
}
