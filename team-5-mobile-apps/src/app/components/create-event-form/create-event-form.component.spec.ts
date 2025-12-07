import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { CreateEventFormComponent } from './create-event-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

// Mock SupabaseService
class MockSupabaseService {
  getAllInterests = jasmine.createSpy().and.returnValue(Promise.resolve([
    { id: 1, name: 'Sports' },
    { id: 2, name: 'Music' }
  ]));
  createActivity = jasmine.createSpy().and.returnValue(Promise.resolve());
}

// Mock Router
class MockRouter {
  navigate = jasmine.createSpy();
}

describe('CreateEventFormComponent', () => {
  let component: CreateEventFormComponent;
  let fixture: ComponentFixture<CreateEventFormComponent>;
  let supabase: MockSupabaseService;
  let router: MockRouter;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CreateEventFormComponent, ReactiveFormsModule],
      providers: [
        { provide: SupabaseService, useClass: MockSupabaseService },
        { provide: Router, useClass: MockRouter }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEventFormComponent);
    component = fixture.componentInstance;
    supabase = TestBed.inject(SupabaseService) as any;
    router = TestBed.inject(Router) as any;
    fixture.detectChanges();
  });

  //test that the component actually gets created
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  //
  it('should load categories on init', async () => {
    await component.ngOnInit();
    expect(supabase.getAllInterests).toHaveBeenCalled();
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('should mark all fields as touched if form is invalid on submit', () => {
    spyOn(component.form, 'markAllAsTouched');
    component.form.patchValue({ name: '' });
    component.submit();
    expect(component.form.markAllAsTouched).toHaveBeenCalled();
  });

  it('should call createActivity and navigate on valid submit', fakeAsync(async () => {
    component.form.patchValue({
      name: 'Test Event',
      category: '1',
      description: 'A valid description for the event',
      minParticipants: 2,
      maxParticipants: 10,
      date: new Date().toISOString(),
      location: 'Test Location',
      image: null
    });
    await component.submit();
    expect(supabase.createActivity).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/explore']);
  }));

  it('should show alert and not navigate on createActivity error', fakeAsync(async () => {
    supabase.createActivity.and.returnValue(Promise.reject(new Error('Failed')));
    spyOn(window, 'alert');
    component.form.patchValue({
      name: 'Test Event',
      category: '1',
      description: 'A valid description for the event',
      minParticipants: 2,
      maxParticipants: 10,
      date: new Date().toISOString(),
      location: 'Test Location',
      image: null
    });
    await component.submit();
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching('Error creating event'));
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should validate minParticipants <= maxParticipants', () => {
    component.form.patchValue({ minParticipants: 10, maxParticipants: 2 });
    expect(component.form.errors).toEqual({ minGreaterThanMax: true });
  });

  it('should update date on onDateChange', () => {
    const date = new Date().toISOString();
    component.onDateChange({ detail: { value: date } });
    expect(component.form.value.date).toBe(date);
  });

  it('should set image to null if no file selected', () => {
    const event = { target: { files: [] } } as any;
    component.onFileChange(event);
    expect(component.form.value.image).toBeNull();
  });

  it('should set image to file if file selected', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as any;
    component.onFileChange(event);
    expect(component.form.value.image).toBe(file);
  });
});
