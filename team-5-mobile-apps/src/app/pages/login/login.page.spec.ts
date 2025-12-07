import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login.page';
import { SupabaseService } from '../../services/supabase.service';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let router: Router;

  beforeEach(async () => {
    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['signIn', 'getProfile', 'signUp']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ReactiveFormsModule, LoginPage],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // grab the injected Router and spy on navigateByUrl for assertions
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call signIn when form invalid', async () => {
    component.form.setValue({ email: '', password: '' });
    await component.login();
    expect(supabaseSpy.signIn).not.toHaveBeenCalled();
  });

  it('navigates to /tabs/explore when profile has full_name', async () => {
    component.form.setValue({ email: 'a@b.com', password: '123456' });
  supabaseSpy.signIn.and.returnValue(Promise.resolve({ error: null } as any));
  supabaseSpy.getProfile.and.returnValue(Promise.resolve({ full_name: 'John Doe' } as any));

    await component.login();

    expect(supabaseSpy.signIn).toHaveBeenCalledWith('a@b.com', '123456');
  expect((router.navigateByUrl as jasmine.Spy)).toHaveBeenCalledWith('/tabs/explore');
    expect(component.loading).toBeFalse();
  });

  it('navigates to /profile-setup when profile missing', async () => {
    component.form.setValue({ email: 'a@b.com', password: '123456' });
  supabaseSpy.signIn.and.returnValue(Promise.resolve({ error: null } as any));
  supabaseSpy.getProfile.and.returnValue(Promise.resolve(null as any));

    await component.login();

  expect((router.navigateByUrl as jasmine.Spy)).toHaveBeenCalledWith('/profile-setup');
  });

  it('sets error when signIn returns error', async () => {
    component.form.setValue({ email: 'a@b.com', password: '123456' });
  supabaseSpy.signIn.and.returnValue(Promise.resolve({ error: { message: 'Bad creds' } } as any));

    await component.login();

    expect(component.error).toBe('Bad creds');
    expect(component.loading).toBeFalse();
  });

  it('register calls signUp and shows alert on success', async () => {
    component.form.setValue({ email: 'n@b.com', password: 'abcdef' });
  supabaseSpy.signUp.and.returnValue(Promise.resolve({ error: null } as any));

    // Spy on window.alert to prevent real popup
    const alertSpy = spyOn(window, 'alert');

    await component.register();

    expect(supabaseSpy.signUp).toHaveBeenCalledWith('n@b.com', 'abcdef');
    expect(alertSpy).toHaveBeenCalled();
  });
});
