import { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../../core/guards/is-authenticated.guard';

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/application-list.page').then((m) => m.ApplicationListPage),
  },
  {
    path: 'new',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/application-form.page').then((m) => m.ApplicationFormPage),
  },
  {
    path: ':id',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/application-detail.page').then((m) => m.ApplicationDetailPage),
  },
];