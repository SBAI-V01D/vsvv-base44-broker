/**
 * `mainRoutes`
 *
 * Top-level Angular Router config (standalone route array).
 * - `/`         → redirect to `/app/dashboard`
 * - `/login`    → unauthenticated login page
 * - `/app`      → authenticated shell redirect (actual layout is per-module)
 * - `/crm/*`    → CRM workspace (sidebar + outlet)
 * - `/settings` → admin / settings area (admin-only)
 */

import { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from './core/guards/is-authenticated.guard';
import { HasRoleGuard } from './core/guards/has-role.guard';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: '/app/dashboard',
    pathMatch: 'full',
  },

  // ──────────────── UNAUTHENTICATED ────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/pages/login.page').then(m => m.LoginPage),
  },

  // ──────────────── AUTHENTICATED SHELL ────────────────
  //
  // /app/dashboard  – landing dashboard
  // /app/customers  – customer management (crm workspace)
  {
    path: 'app',
    canActivate: [IsAuthenticatedGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/pages/dashboard.page').then(
            m => m.DashboardPage
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./modules/customers/customers.routes').then(
            m => m.CUSTOMER_ROUTES
          ),
      },
      {
        path: 'contracts',
        loadChildren: () =>
          import('./modules/contracts/contracts.routes').then(
            m => m.CONTRACT_ROUTES
          ),
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./modules/applications/applications.routes').then(
            m => m.APPLICATION_ROUTES
          ),
      },
      {
        path: 'commissions',
        loadChildren: () =>
          import('./modules/commissions/commissions.routes').then(
            m => m.COMMISSION_ROUTES
          ),
      },
      {
        path: 'documents',
        loadChildren: () =>
          import('./modules/documents/documents.routes').then(
            m => m.DOCUMENT_ROUTES
          ),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./modules/tasks/tasks.routes').then(
            m => m.TASK_ROUTES
          ),
      },
      {
        path: 'leads',
        loadChildren: () =>
          import('./modules/leads/leads.routes').then(
            m => m.LEAD_ROUTES
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./modules/reports/reports.routes').then(
            m => m.REPORT_ROUTES
          ),
      },
      {
        path: 'migration',
        loadChildren: () =>
          import('./modules/migration/migration.routes').then(
            m => m.MIGRATION_ROUTES
          ),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },

  // ──────────────── CRM WORKSPACE (sidebar layout) ────────────────
  //
  // These URLs mirror the original React routes.  They render
  // through the CRM shell which provides the sidebar navigation.
  {
    path: 'crm',
    canActivate: [IsAuthenticatedGuard],
    children: [
      {
        path: 'customers',
        loadChildren: () =>
          import('./modules/customers/customers.routes').then(
            m => m.CUSTOMER_ROUTES
          ),
      },
      {
        path: 'contracts',
        loadChildren: () =>
          import('./modules/contracts/contracts.routes').then(
            m => m.CONTRACT_ROUTES
          ),
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./modules/applications/applications.routes').then(
            m => m.APPLICATION_ROUTES
          ),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./modules/tasks/tasks.routes').then(
            m => m.TASK_ROUTES
          ),
      },
      {
        path: 'leads',
        loadChildren: () =>
          import('./modules/leads/leads.routes').then(
            m => m.LEAD_ROUTES
          ),
      },
      {
        path: 'documents',
        loadChildren: () =>
          import('./modules/documents/documents.routes').then(
            m => m.DOCUMENT_ROUTES
          ),
      },
      {
        path: 'commissions',
        loadChildren: () =>
          import('./modules/commissions/commissions.routes').then(
            m => m.COMMISSION_ROUTES
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./modules/reports/reports.routes').then(
            m => m.REPORT_ROUTES
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/pages/dashboard.page').then(
            m => m.DashboardPage
          ),
      },
      {
        path: 'migration',
        loadChildren: () =>
          import('./modules/migration/migration.routes').then(
            m => m.MIGRATION_ROUTES
          ),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },

  // ──────────────── SETTINGS (admin-only) ────────────────
  {
    path: 'settings',
    canActivate: [IsAuthenticatedGuard, HasRoleGuard(['admin'])],
    loadChildren: () =>
      import('./modules/settings/settings.routes').then(
        m => m.SETTINGS_ROUTES
      ),
  },

  // catch-all – re-auth redirect
  {
    path: '**',
    redirectTo: 'app/dashboard',
  },
];