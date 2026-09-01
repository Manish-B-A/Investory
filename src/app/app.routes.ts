import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'monthly',
    loadComponent: () =>
      import('./features/monthly-tracker/monthly-tracker.component').then(
        (m) => m.MonthlyTrackerComponent
      ),
  },
  {
    path: 'investments',
    loadComponent: () =>
      import('./features/investments/investments.component').then(
        (m) => m.InvestmentsComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
