import { ComponentFixture, TestBed, fakeAsync, waitForAsync, tick } from '@angular/core/testing';
import { CreateEventFormComponent } from './create-event-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ActivityService } from '../../services/activity.service';
import { InterestService } from '../../services/interest.service';
import { Router } from '@angular/router';

describe('CreateEventFormComponent', () => {
  let component: CreateEventFormComponent;
  let fixture: ComponentFixture<CreateEventFormComponent>;

  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;
  let interestServiceSpy: jasmine.SpyObj<InterestService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['getCurrentUser']);
    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['createActivity']);
    interestServiceSpy = jasmine.createSpyObj('InterestService', ['getAllInterests']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    interestServiceSpy.getAllInterests.and.returnValue(Promise.resolve([
      { id: '1', name: 'Sports' },
      { id: '2', name: 'Music' }
    ]));
    activityServiceSpy.createActivity.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [CreateEventFormComponent, ReactiveFormsModule],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: InterestService, useValue: interestServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEventFormComponent);
    component = fixture.componentInstance;
  });


  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(interestServiceSpy.getAllInterests).toHaveBeenCalled();
    expect(component.categories.length).toBeGreaterThan(0);
    expect(component.categories[0].name).toBe('Sports');
  }));

  it('should mark all fields as touched if form is invalid on submit', () => {
    fixture.detectChanges();
    spyOn(component.form, 'markAllAsTouched');
    component.form.patchValue({ name: '' });
    component.submit();
    expect(component.form.markAllAsTouched).toHaveBeenCalled();
  });

  it('should call createActivity and navigate on valid submit', fakeAsync(async () => {
    fixture.detectChanges();
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

    expect(activityServiceSpy.createActivity).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tabs/explore']);
  }));

  it('should show alert and not navigate on createActivity error', fakeAsync(async () => {
    fixture.detectChanges();
    activityServiceSpy.createActivity.and.returnValue(Promise.reject(new Error('Failed')));
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
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('should validate minParticipants <= maxParticipants', () => {
    fixture.detectChanges();
    component.form.patchValue({ minParticipants: 10, maxParticipants: 2 });
    expect(component.form.errors).toEqual({ minGreaterThanMax: true });
  });

  it('should update date on onDateChange', () => {
    fixture.detectChanges();
    const date = new Date().toISOString();
    component.onDateChange({ detail: { value: date } });
    expect(component.form.value.date).toBe(date);
  });

  it('should set image to null if no file selected', () => {
    fixture.detectChanges();
    const event = { target: { files: [] } } as any;
    component.onFileChange(event);
    expect(component.form.value.image).toBeNull();
  });

  it('should set image to file if file selected', () => {
    fixture.detectChanges();
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as any;
    component.onFileChange(event);
    expect(component.form.value.image).toBe(file);
  });
});
