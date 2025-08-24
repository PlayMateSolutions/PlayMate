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
        path: 'attendance-details',
        loadComponent: () =>
          import('../features/attendance/attendance-details/attendance-details.page').then((m) => m.AttendanceDetailsPage),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('../features/payments/payments.page').then((m) => m.PaymentsPage),
      },
      {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full'
      }
    ]
  }
];
