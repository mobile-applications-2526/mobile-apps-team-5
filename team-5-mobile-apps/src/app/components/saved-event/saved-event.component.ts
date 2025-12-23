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

  @Output() removeClicked = new EventEmitter<string>();

  friendsCount: number = 0;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    if (this.event?.id) {
      // Fetch the real count of friends who also liked this specific activity
      try {
        this.friendsCount = await this.supabase.getMutualFriendsCount(this.event.id);
      } catch (error) {
        console.error('Error loading friends count:', error);
      }
    }
  }

  async remove(ev?: Event) {
    if (ev) ev.stopPropagation(); // Prevents clicking the heart from opening card details
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
    return `${this.event.minParticipants}/${this.event.maxParticipants}`;
  }
  }
