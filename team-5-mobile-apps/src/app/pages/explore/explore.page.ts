import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { EventSwipeComponent } from '../../components/event-swipe/event-swipe.component';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { ActivityService } from '../../services/activity.service';
import { InterestService } from '../../services/interest.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  templateUrl: 'explore.page.html',
  styleUrls: ['explore.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, HeaderComponent, EventSwipeComponent],
})
export class ExplorePage implements OnInit, OnDestroy {
  private profileUpdatedSub?: Subscription;

  activities: any[] = [];
  visibleActivities: any[] = [];
  loading: boolean = true;

  filterByInterests: boolean = false;
  userInterestNames: string[] = [];

  constructor(
    private supabase: SupabaseService,
    private activityService: ActivityService,
    private interestService: InterestService
  ) { }

  async ngOnInit() {
    this.profileUpdatedSub = this.supabase.profileUpdated$.subscribe(() => {
      this.loadData();
    });

    await this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [activities, userInterests] = await Promise.all([
        this.activityService.getActivities(),
        this.interestService.getUserInterests()
      ]);

      this.activities = activities || [];
      this.userInterestNames = (userInterests || []).map(i => i.name);

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
      await this.activityService.recordSwipe(event.id, event.liked);

      this.activities = this.activities.filter(a => a.id !== event.id);

      this.applyInterestFilter();
    } catch (err) {
      console.error('Swipe save failed', err);
    }
  }

  private applyInterestFilter() {
    if (!this.filterByInterests) {
      this.visibleActivities = [...this.activities];
      return;
    }

    if (!this.userInterestNames.length) {
      this.visibleActivities = [];
      return;
    }

    this.visibleActivities = this.activities.filter(act => {
      const interestName = act.interest?.name;
      return interestName && this.userInterestNames.includes(interestName);
    });
  }

  toggleInterestFilter() {
    this.filterByInterests = !this.filterByInterests;
    this.applyInterestFilter();
  }

  ngOnDestroy() {
    this.profileUpdatedSub?.unsubscribe();
  }

}
