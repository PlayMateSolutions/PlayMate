import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'members',
        loadComponent: () =>
          import('../features/members/members.page').then((m) => m.MembersPage),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('../features/attendance/attendance.page').then((m) => m.AttendancePage),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('../features/payments/payments.page').then((m) => m.PaymentsPage),
      },
      {
        path: 'sports',
        loadComponent: () =>
          import('../features/sports/sports.page').then((m) => m.SportsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full'
      }
    ]
  }
];
