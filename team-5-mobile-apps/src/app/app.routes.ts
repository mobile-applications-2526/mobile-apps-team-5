import { Routes } from '@angular/router';
import { AuthGuardService } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'profile-setup',
    loadComponent: () => import('./pages/profile-setup/profile-setup.page').then( m => m.ProfileSetupPage)
  },
  {
    path: '**',
    redirectTo: '/tabs/explore',
  },
 
];
