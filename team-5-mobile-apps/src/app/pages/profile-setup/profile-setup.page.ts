import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'
import { SupabaseService } from '../../services/supabase.service';
import { ProfileService } from '../../services/profile.service';
import { InterestService } from '../../services/interest.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonCheckbox,
  IonSkeletonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-setup',
  templateUrl: './profile-setup.page.html',
  styleUrls: ['profile-setup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonCheckbox,
    IonSkeletonText
  ]
})
export class ProfileSetupPage implements OnInit {

  firstName: string = '';
  lastName: string = '';
  bio: string = '';

  loading: boolean = false;

  allInterests: { id: string; name: string }[] = [];
  loadingInterests: boolean = false;
  selectedInterests: string[] = [];

  constructor(
    private supabase: SupabaseService,
    private profileService: ProfileService,
    private interestService: InterestService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadAllInterests();
  }

  async loadAllInterests() {
    this.loadingInterests = true;
    try {
      this.allInterests = await this.interestService.getAllInterests();
    } catch (e) {
      console.error('Error loading interests in setup page', e);
      this.allInterests = [];
    } finally {
      this.loadingInterests = false;
    }
  }

  onInterestToggle(name: string, checked: boolean) {
    const current = this.selectedInterests;

    if (checked && !current.includes(name)) {
      this.selectedInterests = [...current, name];
    } else if (!checked && current.includes(name)) {
      this.selectedInterests = current.filter(i => i !== name);
    }
  }

  async onComplete() {

    if (!this.firstName || !this.lastName) {
      alert('Please enter your First Name and Surname.');
      return;
    }

    this.loading = true;

    try {
      await this.profileService.completeProfile(
        this.firstName,
        this.lastName,
        this.bio
      );

      const selectedIds = this.allInterests
        .filter(i => this.selectedInterests.includes(i.name))
        .map(i => i.id);

      if (selectedIds.length > 0) {
        await this.interestService.updateUserInterests(selectedIds);
      } else {
        await this.interestService.updateUserInterests([]);
      }

      this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });

    } catch (error: any) {
      alert('Error saving profile: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}