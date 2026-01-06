import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ProfileService } from '../../services/profile.service';
import { ActivityService } from '../../services/activity.service';
import { InterestService } from '../../services/interest.service';
import { FriendService } from '../../services/friend.service';
import { SavedEventComponent } from '../saved-event/saved-event.component';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, SavedEventComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnChanges {

  @Input() user: any = null;

  upcomingEvents: any[] = [];
  pastEvents: any[] = [];
  loadingActivities = true;
  allInterests: { id: string; name: string }[] = [];
  loadingInterests = false;

  edit = false;

  loading = false;

  form = this.fb.group({
    name: ['', Validators.required],
    location: [''],
    bio: [''],
    interests: [[] as string[]]
  });

  constructor(
    private fb: FormBuilder,

    private supabase: SupabaseService,
    private profileService: ProfileService,
    private activityService: ActivityService,
    private interestService: InterestService,
    private friendService: FriendService,
    private router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.form.patchValue({
        name: this.user.full_name || '',
        bio: this.user.bio || '',
        interests: this.user.interests || []
      });
      this.loadFriendsCount();
      this.loadActivities();
      this.loadAllInterests();
      this.loadUserInterests();
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    if (!this.edit && this.user) {
      this.form.patchValue({
        name: this.user.full_name,
        bio: this.user.bio,
        interests: this.user.interests || []
      });
    }
  }

  async save() {
    if (!this.form.valid) return;
    this.loading = true;

    try {
      const fv = this.form.value;

      const selectedNames: string[] = fv.interests || [];

      const selectedIds = this.allInterests
        .filter(i => selectedNames.includes(i.name))
        .map(i => i.id);

      await Promise.all([
        this.profileService.updateProfileData({
          full_name: fv.name || '',
          bio: fv.bio || '',
        }),
        this.interestService.updateUserInterests(selectedIds)
      ]);

      this.supabase.notifyProfileUpdated();


      this.user = {
        ...this.user,
        full_name: fv.name,
        bio: fv.bio,
        interests: selectedNames
      };

      this.edit = false;

    } catch (error) {
      console.error('Update failed', error);
      alert('Could not save profile.');
    } finally {
      this.loading = false;
    }
  }

  async loadFriendsCount() {
    if (!this.user?.id) return;
    try {

      const count = await this.friendService.getFriendsCount(this.user.id);
      this.user.friendsCount = count;
    } catch (e) {
      console.error('Error loading friends count', e);
    }
  }



  getInitials() {
    const name = this.user?.full_name || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';

    const letters = parts.map((s: string) => s[0]).join('');
    return letters.slice(0, 2).toUpperCase();
  }

  goToFriendsPage() {
    this.router.navigate(['/tabs/friends'], { queryParams: { segment: 'friends' } });
  }

  async loadAllInterests() {
    this.loadingInterests = true;
    try {
      this.allInterests = await this.interestService.getAllInterests();
    } catch (e) {
      console.error('Error loading interests', e);
      this.allInterests = [];
    } finally {
      this.loadingInterests = false;
    }
  }

  async loadUserInterests() {
    try {
      const list = await this.interestService.getUserInterests();
      const names = list.map(i => i.name);

      this.user = {
        ...this.user,
        interests: names
      };

      this.form.patchValue({
        interests: names
      });
    } catch (e) {
      console.error('Error loading user interests', e);
    }
  }

  onInterestToggle(name: string, checked: boolean) {
    const current = (this.form.value.interests || []) as string[];

    if (checked && !current.includes(name)) {
      this.form.patchValue({
        interests: [...current, name]
      });
    } else if (!checked && current.includes(name)) {
      this.form.patchValue({
        interests: current.filter(i => i !== name)
      });
    }
  }

  async loadActivities() {
    this.loadingActivities = true;
    try {
      const [upcoming, past] = await Promise.all([
        this.activityService.getUpcomingSavedActivities(),
        this.activityService.getPastSavedActivities()
      ]);
      this.upcomingEvents = upcoming;
      this.pastEvents = past;
    } finally {
      this.loadingActivities = false;
    }
  }

  onItemRemoved(id: string) {
    this.upcomingEvents = this.upcomingEvents.filter(e => e.id !== id);
    this.pastEvents = this.pastEvents.filter(e => e.id !== id);
  }



  async logout() {
    try {
      await this.supabase.signOut();
    } catch (e) {
      console.error('Logout failed', e);
    }
    this.router.navigateByUrl('/login');
  }


}