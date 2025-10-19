import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage)
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'attendance/details',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/attendance/attendance-details/attendance-details.page').then(m => m.AttendanceDetailsPage)
  },
  {
    path: 'tabs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes)
  }
];