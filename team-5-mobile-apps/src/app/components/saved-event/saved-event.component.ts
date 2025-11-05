import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EventModel } from '../../models/event.model';
import { SavedStore } from '../../store/saved.store';

@Component({
  selector: 'app-saved-event',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './saved-event.component.html',
  styleUrls: ['./saved-event.component.scss'],
})
export class SavedEventComponent {
  @Input() event!: EventModel;

  constructor(private store: SavedStore) {}

  remove() {
    if (!this.event?.id) return;
    this.store.remove(this.event.id);
  }

  toggleStar() {
    if (!this.event) return;
    // locally toggle starred flag — for mock/demo only
    this.event.starred = !this.event.starred;
  }

  get participantsLabel() {
    return `${this.event.minParticipants}/${this.event.maxParticipants}`;
  }
}
