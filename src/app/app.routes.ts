import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    title: 'Dashboard — Investory',
  },
  {
    path: 'monthly',
    loadComponent: () =>
      import('./features/monthly-tracker/monthly-tracker.component').then(
        (m) => m.MonthlyTrackerComponent
      ),
    title: 'Monthly Tracker — Investory',
  },
  {
    path: 'investments',
    loadComponent: () =>
      import('./features/investments/investments.component').then(
        (m) => m.InvestmentsComponent
      ),
    title: 'Investments — Investory',
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
    title: 'Reports — Investory',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
    title: 'Settings — Investory',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
