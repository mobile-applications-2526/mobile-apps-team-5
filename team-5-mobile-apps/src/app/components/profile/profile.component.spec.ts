
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { SimpleChange } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { SupabaseService } from '../../services/supabase.service';
import { ProfileService } from '../../services/profile.service';
import { ActivityService } from '../../services/activity.service';
import { InterestService } from '../../services/interest.service';
import { FriendService } from '../../services/friend.service';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;

  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;
  let interestServiceSpy: jasmine.SpyObj<InterestService>;
  let friendServiceSpy: jasmine.SpyObj<FriendService>;

  let router: Router;

  beforeEach(async () => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['signOut', 'notifyProfileUpdated']);
    profileServiceSpy = jasmine.createSpyObj('ProfileService', ['updateProfileData']);
    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['getUpcomingSavedActivities', 'getPastSavedActivities']);
    interestServiceSpy = jasmine.createSpyObj('InterestService', ['getAllInterests', 'getUserInterests', 'updateUserInterests']);
    friendServiceSpy = jasmine.createSpyObj('FriendService', ['getFriendsCount']);

    supabaseSpy.signOut.and.returnValue(Promise.resolve({ error: null } as any));
    supabaseSpy.notifyProfileUpdated.and.stub();

    profileServiceSpy.updateProfileData.and.returnValue(Promise.resolve());

    activityServiceSpy.getUpcomingSavedActivities.and.returnValue(Promise.resolve([]));
    activityServiceSpy.getPastSavedActivities.and.returnValue(Promise.resolve([]));

    interestServiceSpy.getAllInterests.and.returnValue(Promise.resolve([]));
    interestServiceSpy.getUserInterests.and.returnValue(Promise.resolve([]));
    interestServiceSpy.updateUserInterests.and.returnValue(Promise.resolve());

    friendServiceSpy.getFriendsCount.and.returnValue(Promise.resolve(3));

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        ProfileComponent,
      ],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: InterestService, useValue: interestServiceSpy },
        { provide: FriendService, useValue: friendServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');
  });

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

    expect(friendServiceSpy.getFriendsCount).toHaveBeenCalledWith('user-1');
    expect(activityServiceSpy.getUpcomingSavedActivities).toHaveBeenCalled();
    expect(activityServiceSpy.getPastSavedActivities).toHaveBeenCalled();
    expect(interestServiceSpy.getAllInterests).toHaveBeenCalled();
    expect(interestServiceSpy.getUserInterests).toHaveBeenCalled();
  });

  it('toggleEdit should flip edit flag and reset form when turning off', () => {
    const user = {
      id: 'user-1',
      full_name: 'Old Name',
      bio: 'Old bio',
      interests: ['Food'],
    };

    component.user = user;

    component.edit = false;

    component.toggleEdit();
    expect(component.edit).toBeTrue();

    component.form.patchValue({ name: 'Changed', bio: 'Changed bio', interests: ['Party'] });

    component.toggleEdit();
    expect(component.edit).toBeFalse();
    expect(component.form.value.name).toBe('Old Name');
    expect(component.form.value.bio).toBe('Old bio');
    expect(component.form.value.interests).toEqual(['Food']);
  });

  it('save should do nothing when form is invalid', async () => {
    component.form.patchValue({
      name: '',
      bio: 'Some bio',
      interests: [],
    });

    await component.save();

    expect(profileServiceSpy.updateProfileData).not.toHaveBeenCalled();
    expect(interestServiceSpy.updateUserInterests).not.toHaveBeenCalled();
  });

  it('save should update profile + interests and update local user', async () => {
    const user = {
      id: 'user-1',
      full_name: 'Old Name',
      bio: 'Old bio',
      interests: [],
    };
    component.user = user;

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

    expect(profileServiceSpy.updateProfileData).toHaveBeenCalledWith({
      full_name: 'New Name',
      bio: 'New bio',
    });

    expect(interestServiceSpy.updateUserInterests).toHaveBeenCalledWith(['i1', 'i2']);

    expect(supabaseSpy.notifyProfileUpdated).toHaveBeenCalled();

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
    interestServiceSpy.getAllInterests.and.returnValue(Promise.resolve(interests));

    await component.loadAllInterests();

    expect(component.loadingInterests).toBeFalse();
    expect(component.allInterests).toEqual(interests);
  });

  it('loadUserInterests should update user.interests and form', async () => {
    component.user = { id: 'user-1', full_name: 'Tom S' };

    interestServiceSpy.getUserInterests.and.returnValue(
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

    component.onInterestToggle('Party', true);
    expect(component.form.value.interests).toEqual(['Food', 'Party']);

    component.onInterestToggle('Food', false);
    expect(component.form.value.interests).toEqual(['Party']);
  });

  it('loadActivities should fill upcoming and past events and clear loading flag', async () => {
    const upcoming = [{ id: 'a1' }];
    const past = [{ id: 'a2' }];

    activityServiceSpy.getUpcomingSavedActivities.and.returnValue(Promise.resolve(upcoming));
    activityServiceSpy.getPastSavedActivities.and.returnValue(Promise.resolve(past));

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
