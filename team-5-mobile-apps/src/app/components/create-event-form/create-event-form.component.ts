import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

function minLessOrEqualMax(group: AbstractControl): ValidationErrors | null {
  const min = group.get('minParticipants')?.value;
  const max = group.get('maxParticipants')?.value;
  if (min != null && max != null && +min > +max) return { minGreaterThanMax: true };
  return null;
}

@Component({
  selector: 'app-create-event-form',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './create-event-form.component.html',
  styleUrls: ['./create-event-form.component.scss'],
})
export class CreateEventFormComponent {
  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      minParticipants: [null, [Validators.required, Validators.min(1)]],
      maxParticipants: [null, [Validators.required, Validators.min(1)]],
      date: ['', Validators.required],
  image: [null as any],
    },
    { validators: [minLessOrEqualMax] }
  );

  submittedMessage = '';
  imageName: string | null = null;

  categories = [
    { val: 'sports', label: 'Sports' },
    { val: 'culture', label: 'Culture' },
    { val: 'entertainment', label: 'Entertainment' },
    { val: 'party', label: 'Party' },
    { val: 'other', label: 'Other' },
  ];

  constructor(private fb: FormBuilder) {}

  get f() {
    return this.form.controls;
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || !input.files.length) {
      this.imageName = null;
      this.form.patchValue({ image: null });
      return;
    }
    const file = input.files[0];
    this.imageName = file.name;
    this.form.patchValue({ image: file });
  }

  submit() {
    this.submittedMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // simulated submission
    this.submittedMessage = 'Event created';
    // keep message visible briefly and reset form fields (except maybe image)
    setTimeout(() => {
      this.submittedMessage = '';
    }, 3000);
    this.form.reset();
    this.imageName = null;
  }
}
