import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';

import { ProfileSetupPage } from './profile-setup.page';
import { SupabaseService } from '../../services/supabase.service';



describe('ProfileSetupPage', () => {
  let fixture: ComponentFixture<ProfileSetupPage>;
  let component: ProfileSetupPage;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['completeProfile']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ProfileSetupPage],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  //test to check that the profile setup component gets created
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //test to check if firstname or lastname are missing gives an error
  it('shows alert if firstName or lastName missing', async () => {
    spyOn(window, 'alert');
    component.firstName = '';
    component.lastName = '';
    await component.onComplete();
    expect(window.alert).toHaveBeenCalledWith('Please enter your First Name and Surname.');
    expect(supabaseSpy.completeProfile).not.toHaveBeenCalled();
  });

  //test succesful case
  it('calls completeProfile and navigates on success', async () => {
    component.firstName = 'John';
    component.lastName = 'Doe';
    component.bio = 'Hello!';
    supabaseSpy.completeProfile.and.returnValue(Promise.resolve());
    await component.onComplete();
    expect(supabaseSpy.completeProfile).toHaveBeenCalledWith('John', 'Doe', 'Hello!');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tabs/explore', { replaceUrl: true });
  });

  //test error case
  it('shows alert on error from completeProfile', async () => {
    component.firstName = 'Jane';
    component.lastName = 'Doe';
    component.bio = 'Bio';
    supabaseSpy.completeProfile.and.returnValue(Promise.reject(new Error('fail')));
    spyOn(window, 'alert');
    await component.onComplete();
    expect(window.alert).toHaveBeenCalledWith('Error saving profile: fail');
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});