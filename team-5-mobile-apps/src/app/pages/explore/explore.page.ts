import { Component , OnInit} from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { EventSwipeComponent } from '../../components/event-swipe/event-swipe.component';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  templateUrl: 'explore.page.html',
  styleUrls: ['explore.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, EventSwipeComponent],
})
export class ExplorePage implements OnInit{
  activities: any[] = [];
  loading: boolean = true;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      // 1. Get activities (uses 'activities' table)
      this.activities = await this.supabase.getActivities();
      console.log('Real DB Data:', this.activities);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async handleSwipe(event: { id: string; liked: boolean }) {
    console.log(`Saving swipe for activity ${event.id}: ${event.liked}`);
    
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return;

      const { error } = await this.supabase.from('activity_swipes').insert({
        user_id: user.id,
        swipe: event.id,  
        liked: event.liked
      });

      if (error) console.error('Supabase error:', error);
      
    } catch (err) {
      console.error('Swipe save failed', err);
    }
  }

}
