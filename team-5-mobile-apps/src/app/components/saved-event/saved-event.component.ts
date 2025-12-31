import { Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase.service';

@Component({
  selector: 'app-saved-event',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './saved-event.component.html',
  styleUrls: ['./saved-event.component.scss'],
})
export class SavedEventComponent implements OnInit{
  @Input() event!: any;
  actualParticipants: number = 0;

  @Output() removeClicked = new EventEmitter<string>();

  friendsCount: number = 0;
  loadingFriends = true;
  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    if (this.event?.id) {
      const [fCount, pCount] = await Promise.all([
        this.supabase.getMutualFriendsCount(this.event.id),
        this.supabase.getParticipantCount(this.event.id) 
      ]);
      
      this.friendsCount = fCount;
      this.actualParticipants = pCount;
      this.loadingFriends = false;
    }
  }

  async remove(ev?: Event) {
    if (ev) ev.stopPropagation(); 
    if (!this.event?.id) return;

    try {
      await this.supabase.removeSavedActivity(this.event.id);
      this.removeClicked.emit(this.event.id);
    } catch (error) {
      console.error('Could not remove activity', error);
    }}

  async toggleStar(ev?: Event) {
      if (ev) ev.stopPropagation();
      if (!this.event) return;
  
      const newStatus = !this.event.starred;
      
      this.event.starred = newStatus;
  
      try {
        await this.supabase.toggleActivityStar(this.event.id, newStatus);
      } catch (error) {
        console.error('Failed to star item', error);
        this.event.starred = !newStatus; 
      }
    }
  
  get participantsLabel() {
    const max = this.event.max_participants || this.event.maxParticipants || 0;
    return `${this.actualParticipants}/${max}`;
  }
  }
