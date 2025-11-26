import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner,IonButtons, IonButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { ProfileComponent } from '../../components/profile/profile.component';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, CommonModule, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSpinner,ProfileComponent],
})
export class ProfilePage {
  profile: any = null; 
  loading: boolean = true;

  constructor(
    private nav: NavController,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    await this.loadProfile();
  }
  async loadProfile() {
    this.loading = true;
    try {
      this.profile = await this.supabase.getProfile();
      console.log('Profile loaded:', this.profile);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    
    try {
      if (window.history.length > 1) {
        this.nav.back();
      } else {
        this.nav.navigateBack('/tabs/explore');
      }
    } catch (e) {
      this.nav.navigateBack('/tabs/explore');
    }
  }
}
