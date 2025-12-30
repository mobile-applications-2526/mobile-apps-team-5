import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import {Router} from '@angular/router'
import { SupabaseService } from '../../services/supabase.service';
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
//   styleUrls: ['./profile-setup.page.scss'],
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

  // interests state
  allInterests: { id: string; name: string }[] = [];
  loadingInterests: boolean = false;
  selectedInterests: string[] = []; // we store interest NAMES here, like in the profile page

  constructor(
    private supabase: SupabaseService, 
    private router: Router
  ) { }

  ngOnInit() {
    this.loadAllInterests();

    //no need to load specific user interests here, because this page is profile-setup so the user shouldn't have any interests yet
    //if it ever changes then those needa be fetched here
  }

  //load all available interests from DB
  async loadAllInterests() {
    this.loadingInterests = true;
    try {
      this.allInterests = await this.supabase.getAllInterests();
    } catch (e) {
      console.error('Error loading interests in setup page', e);
      this.allInterests = [];
    } finally {
      this.loadingInterests = false;
    }
  }

  //handle interest checkbox toggle (similar as in profile component)
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
      // Save data to Supabase
      
      // 1) Save basic profile data (name + bio)
      await this.supabase.completeProfile(
        this.firstName, 
        this.lastName, 
        this.bio
      );

      // 2) Save interests for this user
      //    We currently have selectedInterests = array of NAMES,
      //    so we map them to IDs using allInterests.
      const selectedIds = this.allInterests
        .filter(i => this.selectedInterests.includes(i.name))
        .map(i => i.id);

      if (selectedIds.length > 0) {
        await this.supabase.updateUserInterests(selectedIds);
      } else {
        // If nothing selected, we still rely on updateUserInterests
        // behavior of "delete existing links". Here there are none yet, so it's fine.
        await this.supabase.updateUserInterests([]);
      }

      // 3) Go to the main app after completion.
      this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });

    } catch (error: any) {
      alert('Error saving profile: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}