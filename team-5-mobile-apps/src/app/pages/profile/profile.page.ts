import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { ProfileComponent } from '../../components/profile/profile.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, ProfileComponent],
})
export class ProfilePage {
  constructor(private nav: NavController) {}

  goBack() {
    // Prefer navigating back in history when possible, otherwise go to /tabs/explore
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
