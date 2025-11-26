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
  IonSpinner
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
    IonSpinner
  ]
})
export class ProfileSetupPage implements OnInit {

  firstName: string = '';
  lastName: string = '';
  bio: string = '';
  
  loading: boolean = false;

  constructor(
    private supabase: SupabaseService, 
    private router: Router
  ) { }

  ngOnInit() {
  }

  async onComplete() {
    
    if (!this.firstName || !this.lastName) {
      alert('Please enter your First Name and Surname.');
      return;
    }

    this.loading = true;

    try {
      // Save data to Supabase
      
      await this.supabase.completeProfile(
        this.firstName, 
        this.lastName, 
        this.bio
      );

      //  Go to the main app after completion.
      this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });

    } catch (error: any) {
      alert('Error saving profile: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}