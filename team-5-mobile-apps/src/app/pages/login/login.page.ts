import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonLabel, ReactiveFormsModule],
  templateUrl: './login.page.html'
})
export class LoginPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private router: Router) {}

  async login() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.value as { email: string; password: string };
    const { error } = await this.supabase.signIn(email, password);
    this.loading = false;
    if (error) {
      this.error = error.message;
      return;
    }
    this.router.navigateByUrl('/tabs/explore');
  }

  async register() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.value as { email: string; password: string };
    const { error } = await this.supabase.signUp(email, password);
    this.loading = false;
    if (error) {
      this.error = error.message;
      return;
    }
    // After sign up, Supabase may require email confirmation
    this.router.navigateByUrl('/tabs/explore');
  }
}
