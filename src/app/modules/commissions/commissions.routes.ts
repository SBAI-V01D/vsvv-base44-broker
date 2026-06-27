import { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../../core/guards/is-authenticated.guard';

export const COMMISSION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    canActivate: [IsAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/commission-list.page').then((m) => m.CommissionListPage),
  },
];