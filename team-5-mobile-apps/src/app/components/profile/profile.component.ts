import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { profileStore, Profile } from '../../store/profile.store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  profile$ = profileStore.profile$;
  edit = false;
  form = this.fb.group({ name: [''], location: [''], bio: [''] });

  constructor(private fb: FormBuilder) {
    this.profile$.subscribe((p) => this.form.patchValue({ name: p.name, location: p.location, bio: p.bio }));
  }

  toggleEdit() {
    this.edit = !this.edit;
  }

  save() {
    if (this.form.valid) {
      // sanitize nulls coming from the form and only pass string|undefined values
      const fv = this.form.value as { name?: string | null; location?: string | null; bio?: string | null };
      const patch: Partial<Profile> = {
        ...(fv.name != null ? { name: fv.name } : {}),
        ...(fv.location != null ? { location: fv.location } : {}),
        ...(fv.bio != null ? { bio: fv.bio } : {}),
      };
      profileStore.update(patch);
      this.edit = false;
    }
  }

  // compute initials safely in TypeScript so the template stays within Angular's expression limits
  getInitials(profile: Profile | null | undefined) {
    const name = profile?.name || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.map((s) => (s && s.length ? s[0] : '')).join('');
    return letters.slice(0, 2).toUpperCase();
  }
}
