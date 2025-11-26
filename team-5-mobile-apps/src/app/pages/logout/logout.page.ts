import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [IonContent],
  template: `<ion-content class="ion-padding"><p>Signing out...</p></ion-content>`
})
export class LogoutPage implements OnInit {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.supabase.signOut();
    this.router.navigateByUrl('/login');
  }
}
