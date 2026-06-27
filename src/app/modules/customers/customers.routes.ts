import { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../../core/guards/is-authenticated.guard';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/customer-list.page').then((m) => m.CustomerListPage),
  },
  {
    path: 'new',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/customer-form.page').then((m) => m.CustomerFormPage),
  },
  {
    path: ':id',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/customer-detail.page').then((m) => m.CustomerDetailPage),
  },
];