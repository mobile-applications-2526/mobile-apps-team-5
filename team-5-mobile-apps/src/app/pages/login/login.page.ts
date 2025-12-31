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
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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

    if (error) {
      this.loading = false;
      this.error = error.message;
      return;
    }
    const profile = await this.supabase.getProfile();
    this.loading = false;

    if (profile && profile.full_name) {
      this.router.navigateByUrl('/tabs/explore');
    } else {
      this.router.navigateByUrl('/profile-setup');
    }
  }

  async register() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.value as { email: string; password: string };
    const { error } = await this.supabase.signUp(email, password) as { error: { message: string } | null };
    this.loading = false;
    if (error) {
      this.error = error.message;
      return;
    }
    alert('Registration successful! Please check your email to verify your account.');
    this.form.reset();
  }
}

