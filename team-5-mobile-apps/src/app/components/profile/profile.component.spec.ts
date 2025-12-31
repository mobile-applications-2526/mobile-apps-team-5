// src/app/components/profile/profile.component.spec.ts

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { SimpleChange } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { SupabaseService } from '../../services/supabase.service';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let router: Router;

  beforeEach(async () => {
    // create mock / spy of the service with the methods this component uses
    supabaseSpy = jasmine.createSpyObj('SupabaseService', [
      'updateProfileData',
      'updateUserInterests',
      'getFriendsCount',
      'getUpcomingSavedActivities',
      'getPastSavedActivities',
      'getAllInterests',
      'getUserInterests',
      'signOut',
      'notifyProfileUpdated',
    ]);

    // default spy behaviour so we don't get unhandled Promise rejections
    supabaseSpy.getFriendsCount.and.returnValue(Promise.resolve(3));
    supabaseSpy.getUpcomingSavedActivities.and.returnValue(Promise.resolve([]));
    supabaseSpy.getPastSavedActivities.and.returnValue(Promise.resolve([]));
    supabaseSpy.getAllInterests.and.returnValue(Promise.resolve([]));
    supabaseSpy.getUserInterests.and.returnValue(Promise.resolve([]));
    supabaseSpy.updateProfileData.and.returnValue(Promise.resolve());
    supabaseSpy.updateUserInterests.and.returnValue(Promise.resolve());
    supabaseSpy.signOut.and.returnValue(Promise.resolve({ error: null } as any));
    supabaseSpy.notifyProfileUpdated.and.stub();

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        ProfileComponent,      // standalone component
      ],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');
  });

  /** helper to simulate @Input() user arriving */
  function setUserAndTriggerChanges(user: any) {
    component.user = user;
    component.ngOnChanges({
      user: new SimpleChange(null, user, true),
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should patch form and call loaders', () => {
    const user = {
      id: 'user-1',
      full_name: 'Tom S',
      bio: 'Hi there',
      interests: ['Food', 'Party'],
    };

    setUserAndTriggerChanges(user);

    expect(component.form.value.name).toBe('Tom S');
    expect(component.form.value.bio).toBe('Hi there');
    expect(component.form.value.interests).toEqual(['Food', 'Party']);

    expect(supabaseSpy.getFriendsCount).toHaveBeenCalledWith('user-1');
    expect(supabaseSpy.getUpcomingSavedActivities).toHaveBeenCalled();
    expect(supabaseSpy.getPastSavedActivities).toHaveBeenCalled();
    expect(supabaseSpy.getAllInterests).toHaveBeenCalled();
    expect(supabaseSpy.getUserInterests).toHaveBeenCalled();
  });

  it('toggleEdit should flip edit flag and reset form when turning off', () => {
    const user = {
      id: 'user-1',
      full_name: 'Old Name',
      bio: 'Old bio',
      interests: ['Food'],
    };

    component.user = user;

    // start not editing
    component.edit = false;

    component.toggleEdit();
    expect(component.edit).toBeTrue();

    // simulate user changed data in form
    component.form.patchValue({ name: 'Changed', bio: 'Changed bio', interests: ['Party'] });

    // toggling again should reset to user values
    component.toggleEdit();
    expect(component.edit).toBeFalse();
    expect(component.form.value.name).toBe('Old Name');
    expect(component.form.value.bio).toBe('Old bio');
    expect(component.form.value.interests).toEqual(['Food']);
  });

  it('save should do nothing when form is invalid', async () => {
    // name is required, leave it empty
    component.form.patchValue({
      name: '',
      bio: 'Some bio',
      interests: [],
    });

    await component.save();

    expect(supabaseSpy.updateProfileData).not.toHaveBeenCalled();
    expect(supabaseSpy.updateUserInterests).not.toHaveBeenCalled();
  });

  it('save should update profile + interests and update local user', async () => {
    const user = {
      id: 'user-1',
      full_name: 'Old Name',
      bio: 'Old bio',
      interests: [],
    };
    component.user = user;

    // pretend these are all possible interests
    component.allInterests = [
      { id: 'i1', name: 'Food' },
      { id: 'i2', name: 'Party' },
    ];

    component.form.patchValue({
      name: 'New Name',
      bio: 'New bio',
      interests: ['Food', 'Party'],
    });

    await component.save();

    expect(supabaseSpy.updateProfileData).toHaveBeenCalledWith({
      full_name: 'New Name',
      bio: 'New bio',
    });

    // should map names -> ids using allInterests
    expect(supabaseSpy.updateUserInterests).toHaveBeenCalledWith(['i1', 'i2']);

    expect(supabaseSpy.notifyProfileUpdated).toHaveBeenCalled();

    // local user object should be updated
    expect(component.user.full_name).toBe('New Name');
    expect(component.user.bio).toBe('New bio');
    expect(component.user.interests).toEqual(['Food', 'Party']);

    expect(component.edit).toBeFalse();
    expect(component.loading).toBeFalse();
  });

  it('getInitials should return correct initials', () => {
    component.user = { full_name: 'Tom S' };
    expect(component.getInitials()).toBe('TS');

    component.user = { full_name: 'Single' };
    expect(component.getInitials()).toBe('S');

    component.user = { full_name: ' ' };
    expect(component.getInitials()).toBe('?');
  });

  it('goToFriendsPage navigates to friends tab with correct query param', () => {
    component.goToFriendsPage();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/tabs/friends'],
      { queryParams: { segment: 'friends' } }
    );
  });

  it('loadAllInterests should set loading flags and assign data', async () => {
    const interests = [
      { id: 'i1', name: 'Food' },
      { id: 'i2', name: 'Party' },
    ];
    supabaseSpy.getAllInterests.and.returnValue(Promise.resolve(interests));

    await component.loadAllInterests();

    expect(component.loadingInterests).toBeFalse();
    expect(component.allInterests).toEqual(interests);
  });

  it('loadUserInterests should update user.interests and form', async () => {
    component.user = { id: 'user-1', full_name: 'Tom S' };

    supabaseSpy.getUserInterests.and.returnValue(
      Promise.resolve([
        { id: 'i1', name: 'Food' },
        { id: 'i2', name: 'Party' },
      ])
    );

    await component.loadUserInterests();

    expect(component.user.interests).toEqual(['Food', 'Party']);
    expect(component.form.value.interests).toEqual(['Food', 'Party']);
  });

  it('onInterestToggle should add and remove interests in the form', () => {
    component.form.patchValue({ interests: ['Food'] });

    // check a new one
    component.onInterestToggle('Party', true);
    expect(component.form.value.interests).toEqual(['Food', 'Party']);

    // uncheck one
    component.onInterestToggle('Food', false);
    expect(component.form.value.interests).toEqual(['Party']);
  });

  it('loadActivities should fill upcoming and past events and clear loading flag', async () => {
    const upcoming = [{ id: 'a1' }];
    const past = [{ id: 'a2' }];

    supabaseSpy.getUpcomingSavedActivities.and.returnValue(Promise.resolve(upcoming));
    supabaseSpy.getPastSavedActivities.and.returnValue(Promise.resolve(past));

    await component.loadActivities();

    expect(component.upcomingEvents).toEqual(upcoming);
    expect(component.pastEvents).toEqual(past);
    expect(component.loadingActivities).toBeFalse();
  });

  it('onItemRemoved should remove event from both arrays', () => {
    component.upcomingEvents = [{ id: '1' }, { id: '2' }];
    component.pastEvents = [{ id: '1' }, { id: '3' }];

    component.onItemRemoved('1');

    expect(component.upcomingEvents).toEqual([{ id: '2' }]);
    expect(component.pastEvents).toEqual([{ id: '3' }]);
  });

  it('logout should call signOut and navigate to /login', async () => {
    await component.logout();

    expect(supabaseSpy.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
