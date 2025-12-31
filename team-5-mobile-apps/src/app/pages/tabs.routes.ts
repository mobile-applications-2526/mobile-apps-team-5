import { Routes } from '@angular/router';
import { AuthGuardService } from '../guards/auth.guard';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'explore',
        loadComponent: () => import('./explore/explore.page').then((m) => m.ExplorePage),
      },
      {
        path: 'saved',
        loadComponent: () => import('./saved/saved.page').then((m) => m.SavedPage),
      },
      {
        path: 'create',
        loadComponent: () => import('./create/create.page').then((m) => m.CreatePage),
      },
      {
        path: 'updates',
        loadComponent: () => import('./updates/updates.page').then((m) => m.UpdatesPage),
      },
      {
        path: 'friends',
        loadComponent: () => import('./friends/friends.page').then((m) => m.FriendsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/explore',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/explore',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    canActivate: [AuthGuardService],
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
  },
];
  