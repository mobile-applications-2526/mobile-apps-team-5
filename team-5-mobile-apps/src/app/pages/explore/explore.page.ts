import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { EventSwipeComponent } from '../../components/event-swipe/event-swipe.component';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  templateUrl: 'explore.page.html',
  styleUrls: ['explore.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, HeaderComponent, EventSwipeComponent],
})
export class ExplorePage implements OnInit, OnDestroy {
  private profileUpdatedSub?: Subscription;

  activities: any[] = [];          // all activities from Supabase
  visibleActivities: any[] = [];   // activities actually shown in the swiper
  loading: boolean = true;

  //now also able to filter by interests
  filterByInterests: boolean = false;
  userInterestNames: string[] = [];

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    // Listen for profile updates (interests changed etc.)
    this.profileUpdatedSub = this.supabase.profileUpdated$.subscribe(() => {
      // Don't await here; just fire-and-forget reload
      this.loadData();
    });

    await this.loadData();
  }

   // Central method that (re)loads activities + user interests
   // needed because when interests get changed in profile, this page needs to fetch interests again
  private async loadData() {
    this.loading = true;
    try {
      // Load activities and user interests in parallel
      const [activities, userInterests] = await Promise.all([
        this.supabase.getActivities(),
        this.supabase.getUserInterests()
      ]);

      this.activities = activities || [];
      this.userInterestNames = (userInterests || []).map(i => i.name);

      // By default, show all activities (filter OFF)
      this.applyInterestFilter();

      console.log('Real DB Data:', this.activities);
      console.log('User interests:', this.userInterestNames);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async handleSwipe(event: { id: string; liked: boolean }) {
    console.log(`Saving swipe for activity ${event.id}: ${event.liked}`);

    try {
      await this.supabase.recordSwipe(event.id, event.liked);

      // Remove swiped activity from the base list so it doesn't reappear
      this.activities = this.activities.filter(a => a.id !== event.id);

      // Re-apply filter to update visibleActivities
      this.applyInterestFilter();
    } catch (err) {
      console.error('Swipe save failed', err);
    }
  }

  private applyInterestFilter() {
    if (!this.filterByInterests) {
      // Filter OFF → show all activities
      this.visibleActivities = [...this.activities];
      return;
    }

    // Filter ON but user has no interests → show nothing
    if (!this.userInterestNames.length) {
      this.visibleActivities = [];
      return;
    }

    // Filter ON → only show activities whose interest name is in user's interests
    this.visibleActivities = this.activities.filter(act => {
      const interestName = act.interest?.name;
      return interestName && this.userInterestNames.includes(interestName);
    });
  }

  //function to toggle interest filter
  toggleInterestFilter() {
    this.filterByInterests = !this.filterByInterests;
    this.applyInterestFilter();
  }

  //cleanup
  ngOnDestroy() {
    this.profileUpdatedSub?.unsubscribe();
  }

}
