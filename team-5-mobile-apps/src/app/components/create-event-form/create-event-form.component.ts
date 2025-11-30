import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router'; 


import { 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonText, IonSelect, IonSelectOption,
  IonTextarea, IonGrid, IonRow, IonCol, IonButton, IonSpinner,
  IonDatetime, IonDatetimeButton, IonModal
} from '@ionic/angular/standalone';

function minLessOrEqualMax(group: AbstractControl): ValidationErrors | null {
  const min = group.get('minParticipants')?.value;
  const max = group.get('maxParticipants')?.value;
  if (min != null && max != null && +min > +max) return { minGreaterThanMax: true };
  return null;
}

@Component({
  selector: 'app-create-event-form',
  standalone: true,
  templateUrl: './create-event-form.component.html',
  styleUrls: ['./create-event-form.component.scss'],
 
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonText, IonSelect, IonSelectOption,
    IonTextarea, IonGrid, IonRow, IonCol, IonButton, IonSpinner,
    IonDatetime, IonDatetimeButton, IonModal
  ]
})
export class CreateEventFormComponent implements OnInit {
  
  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      minParticipants: [2, [Validators.required, Validators.min(1)]],
      maxParticipants: [10, [Validators.required, Validators.min(1)]],
      date: ['', Validators.required],
      location: ['', Validators.required],
      // image: [null] 
    },
    { validators: [minLessOrEqualMax] }
  );

  loading = false;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router 
  ) {}

  async ngOnInit() {
    this.categories = await this.supabase.getAllInterests();
    
    
    const now = new Date().toISOString();
    this.form.patchValue({ date: now });
  }

  
  onDateChange(event: any) {
    const selectedDate = event.detail.value;
    this.form.patchValue({ date: selectedDate });
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    try {
      const formVal = this.form.value;
      const activityData = {
        title: formVal.name,
        description: formVal.description,
        location: formVal.location,
        date: formVal.date,
        category: formVal.category,
        min_participants: formVal.minParticipants,
        max_participants: formVal.maxParticipants
      };

      await this.supabase.createActivity(activityData);

      alert('Event created successfully!');
      this.form.reset();
      
      
      this.router.navigate(['/tabs/explore']);

    } catch (error: any) {
      alert('Error creating event: ' + error.message);
    } finally {
      this.loading = false;
    }
  }


  get f() { return this.form.controls; }
}