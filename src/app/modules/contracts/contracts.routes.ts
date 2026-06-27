import { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../../core/guards/is-authenticated.guard';

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/contract-list.page').then((m) => m.ContractListPage),
  },
  {
    path: 'new',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/contract-form.page').then((m) => m.ContractFormPage),
  },
  {
    path: ':id',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/contract-detail.page').then((m) => m.ContractDetailPage),
  },
];