import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';

import { ProfileSetupPage } from './profile-setup.page';
import { SupabaseService } from '../../services/supabase.service';
import { ProfileService } from '../../services/profile.service';
import { InterestService } from '../../services/interest.service';


describe('ProfileSetupPage', () => {
  let fixture: ComponentFixture<ProfileSetupPage>;
  let component: ProfileSetupPage;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let interestServiceSpy: jasmine.SpyObj<InterestService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['signIn']);
    profileServiceSpy = jasmine.createSpyObj('ProfileService', ['completeProfile']);
    interestServiceSpy = jasmine.createSpyObj('InterestService', ['getAllInterests', 'updateUserInterests']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    interestServiceSpy.getAllInterests.and.returnValue(Promise.resolve([]));
    interestServiceSpy.updateUserInterests.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ProfileSetupPage],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: InterestService, useValue: interestServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows alert if firstName or lastName missing', async () => {
    spyOn(window, 'alert');
    component.firstName = '';
    component.lastName = '';
    await component.onComplete();
    expect(window.alert).toHaveBeenCalledWith('Please enter your First Name and Surname.');
    expect(profileServiceSpy.completeProfile).not.toHaveBeenCalled();
  });

  it('calls completeProfile, updates interests and navigates on success', async () => {
    component.firstName = 'John';
    component.lastName = 'Doe';
    component.bio = 'Hello!';

    profileServiceSpy.completeProfile.and.returnValue(Promise.resolve());

    await component.onComplete();

    expect(profileServiceSpy.completeProfile)
      .toHaveBeenCalledWith('John', 'Doe', 'Hello!');

    expect(interestServiceSpy.updateUserInterests).toHaveBeenCalled();

    expect(routerSpy.navigateByUrl)
      .toHaveBeenCalledWith('/tabs/explore', { replaceUrl: true });
  });

  it('shows alert on error from completeProfile', async () => {
    component.firstName = 'Jane';
    component.lastName = 'Doe';
    component.bio = 'Bio';
    profileServiceSpy.completeProfile.and.returnValue(Promise.reject(new Error('fail')));
    spyOn(window, 'alert');
    await component.onComplete();
    expect(window.alert).toHaveBeenCalledWith('Error saving profile: fail');
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});