import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnChanges {
  
  // 1. Receive data from the Parent Page
  @Input() user: any = null;

  edit = false;
  loading = false;

  // 2. Setup Form (Note: DB uses 'full_name', but we can keep 'name' in form if we map it)
  form = this.fb.group({
    name: ['', Validators.required],
    location: [''], // NOTE: Ensure your DB 'profiles' table has a 'location' column if you want to save this!
    bio: ['']
  });

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  // 3. Listen for changes: When Supabase data arrives, fill the form
  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.form.patchValue({
        name: this.user.full_name || '', // Map DB 'full_name' to Form 'name'
        // location: this.user.location || '', // Uncomment if you added location to DB
        bio: this.user.bio || ''
      });
      this.loadFriendsCount();
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    // Reset form to current user data if cancelling
    if (!this.edit && this.user) {
      this.form.patchValue({
        name: this.user.full_name,
        bio: this.user.bio
      });
    }
  }

  async save() {
    if (!this.form.valid) return;
    this.loading = true;

    try {
      const fv = this.form.value;

      // 4. Send updates to Supabase
      await this.supabase.updateProfileData({
        full_name: fv.name || '',      // Map Form 'name' back to DB 'full_name'
        bio: fv.bio || '',
        // location: fv.location || '' // Uncomment if added to DB
      });

      // 5. Update local view immediately so user sees change without refresh
      this.user = { 
        ...this.user, 
        full_name: fv.name, 
        bio: fv.bio 
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
      
      const count = await this.supabase.getFriendsCount(this.user.id);
      this.user.friendsCount = count;
    } catch (e) {
      console.error('Error loading friends count', e);
    }
  }

  // Helper to get initials from the Real Data
  getInitials() {
    const name = this.user?.full_name || ''; // Use full_name from DB
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    
    // Get first letter of first name + first letter of last name
    const letters = parts.map((s: string) => s[0]).join('');
    return letters.slice(0, 2).toUpperCase();
  }

  async logout() {
    try {
      await this.supabase.signOut();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Logout failed', e);
    }
    this.router.navigateByUrl('/login');
  }

  
}